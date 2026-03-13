-- Migration: Webhooks for external integrations
-- Features: Outbound webhooks to n8n and other platforms

-- ============================================
-- 1. WEBHOOKS: Configuration table
-- ============================================

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Webhook configuration
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT, -- For HMAC signature validation

  -- Events to listen (stored as array)
  events TEXT[] NOT NULL DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  last_triggered_at TIMESTAMPTZ,
  last_status_code INTEGER,
  failure_count INTEGER DEFAULT 0,

  created_by_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_workspace ON webhooks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(workspace_id, is_active) WHERE is_active = true;

-- RLS
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view webhooks in their workspace" ON webhooks
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage webhooks" ON webhooks
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_webhooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS webhooks_updated_at ON webhooks;
CREATE TRIGGER webhooks_updated_at
  BEFORE UPDATE ON webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_webhooks_updated_at();

-- ============================================
-- 2. WEBHOOK_LOGS: Track webhook deliveries
-- ============================================

CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,

  -- Event data
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,

  -- Response
  status_code INTEGER,
  response_body TEXT,
  error_message TEXT,

  -- Timing
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  duration_ms INTEGER
);

-- Index for recent logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook ON webhook_logs(webhook_id, triggered_at DESC);

-- Auto-delete old logs (keep last 100 per webhook)
CREATE OR REPLACE FUNCTION cleanup_webhook_logs()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM webhook_logs
  WHERE webhook_id = NEW.webhook_id
  AND id NOT IN (
    SELECT id FROM webhook_logs
    WHERE webhook_id = NEW.webhook_id
    ORDER BY triggered_at DESC
    LIMIT 100
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS webhook_logs_cleanup ON webhook_logs;
CREATE TRIGGER webhook_logs_cleanup
  AFTER INSERT ON webhook_logs
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_webhook_logs();

-- RLS for logs (read-only for workspace members)
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view webhook logs in their workspace" ON webhook_logs
  FOR SELECT USING (
    webhook_id IN (
      SELECT id FROM webhooks WHERE workspace_id IN (
        SELECT workspace_id FROM memberships WHERE user_id = auth.uid()
      )
    )
  );

COMMENT ON TABLE webhooks IS 'Webhook configurations for outbound event notifications';
COMMENT ON TABLE webhook_logs IS 'Log of webhook delivery attempts';
