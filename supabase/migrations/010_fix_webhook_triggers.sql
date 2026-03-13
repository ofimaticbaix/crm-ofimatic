-- ============================================
-- Fix webhook triggers: text[] vs jsonb compatibility
-- ============================================
-- The events column is text[], not jsonb, so we need to use
-- the correct array containment operator

-- ============================================
-- Function to send webhook notifications (FIXED)
-- ============================================
CREATE OR REPLACE FUNCTION send_webhook_notification()
RETURNS TRIGGER AS $$
DECLARE
  webhook_record RECORD;
  event_type TEXT;
  payload JSONB;
  table_name TEXT;
BEGIN
  table_name := TG_TABLE_NAME;

  -- Determine event type based on operation and table
  IF TG_OP = 'INSERT' THEN
    event_type := table_name || '.created';
  ELSIF TG_OP = 'UPDATE' THEN
    -- Special handling for soft deletes
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      event_type := table_name || '.deleted';
    ELSE
      event_type := table_name || '.updated';
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    event_type := table_name || '.deleted';
  END IF;

  -- Handle singular event names (contact.created instead of contacts.created)
  event_type := REPLACE(event_type, 'contacts.', 'contact.');
  event_type := REPLACE(event_type, 'companies.', 'company.');
  event_type := REPLACE(event_type, 'deals.', 'deal.');
  event_type := REPLACE(event_type, 'activities.', 'activity.');

  -- Build payload based on table
  IF TG_OP = 'DELETE' THEN
    payload := jsonb_build_object(
      'event', event_type,
      'timestamp', NOW(),
      'data', to_jsonb(OLD)
    );
  ELSE
    payload := jsonb_build_object(
      'event', event_type,
      'timestamp', NOW(),
      'data', to_jsonb(NEW)
    );
  END IF;

  -- Find active webhooks for this workspace and event
  -- FIXED: Use text[] array containment instead of jsonb
  FOR webhook_record IN
    SELECT id, url, secret
    FROM webhooks
    WHERE workspace_id = COALESCE(NEW.workspace_id, OLD.workspace_id)
      AND is_active = true
      AND event_type = ANY(events)
  LOOP
    -- Send HTTP POST request using pg_net
    PERFORM net.http_post(
      url := webhook_record.url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Webhook-Event', event_type,
        'X-Webhook-Timestamp', NOW()::text,
        'X-Webhook-ID', webhook_record.id::text
      ),
      body := payload
    );

    -- Log the webhook delivery (fire and forget)
    INSERT INTO webhook_logs (webhook_id, event_type, payload, status_code, duration_ms)
    VALUES (webhook_record.id, event_type, payload, 0, 0);
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Special function for deal stage changes (FIXED)
-- ============================================
CREATE OR REPLACE FUNCTION send_deal_stage_webhook()
RETURNS TRIGGER AS $$
DECLARE
  webhook_record RECORD;
  event_type TEXT;
  payload JSONB;
  stage_info RECORD;
BEGIN
  -- Only trigger if stage_id changed
  IF OLD.stage_id = NEW.stage_id THEN
    RETURN NEW;
  END IF;

  -- Get new stage info
  SELECT name, is_closed_won, is_closed_lost INTO stage_info
  FROM stages WHERE id = NEW.stage_id;

  -- Determine event type
  IF stage_info.is_closed_won THEN
    event_type := 'deal.won';
  ELSIF stage_info.is_closed_lost THEN
    event_type := 'deal.lost';
  ELSE
    event_type := 'deal.stage_changed';
  END IF;

  -- Build payload
  payload := jsonb_build_object(
    'event', event_type,
    'timestamp', NOW(),
    'data', jsonb_build_object(
      'id', NEW.id,
      'name', NEW.name,
      'value', NEW.value,
      'old_stage_id', OLD.stage_id,
      'new_stage_id', NEW.stage_id,
      'new_stage_name', stage_info.name
    )
  );

  -- Find active webhooks for this workspace and event
  -- FIXED: Use text[] array containment instead of jsonb
  FOR webhook_record IN
    SELECT id, url, secret
    FROM webhooks
    WHERE workspace_id = NEW.workspace_id
      AND is_active = true
      AND (
        event_type = ANY(events)
        OR (event_type IN ('deal.won', 'deal.lost') AND 'deal.stage_changed' = ANY(events))
      )
  LOOP
    -- Send HTTP POST request
    PERFORM net.http_post(
      url := webhook_record.url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Webhook-Event', event_type,
        'X-Webhook-Timestamp', NOW()::text,
        'X-Webhook-ID', webhook_record.id::text
      ),
      body := payload
    );

    -- Log the webhook delivery
    INSERT INTO webhook_logs (webhook_id, event_type, payload, status_code, duration_ms)
    VALUES (webhook_record.id, event_type, payload, 0, 0);
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Special function for task completion (FIXED)
-- ============================================
CREATE OR REPLACE FUNCTION send_task_completed_webhook()
RETURNS TRIGGER AS $$
DECLARE
  webhook_record RECORD;
  payload JSONB;
BEGIN
  -- Only trigger when task is marked as completed
  IF NOT (OLD.is_completed = false AND NEW.is_completed = true) THEN
    RETURN NEW;
  END IF;

  -- Build payload
  payload := jsonb_build_object(
    'event', 'task.completed',
    'timestamp', NOW(),
    'data', jsonb_build_object(
      'id', NEW.id,
      'subject', NEW.subject,
      'type', NEW.type,
      'completed_at', NEW.completed_at
    )
  );

  -- Find active webhooks
  -- FIXED: Use text[] array containment instead of jsonb
  FOR webhook_record IN
    SELECT id, url, secret
    FROM webhooks
    WHERE workspace_id = NEW.workspace_id
      AND is_active = true
      AND 'task.completed' = ANY(events)
  LOOP
    PERFORM net.http_post(
      url := webhook_record.url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Webhook-Event', 'task.completed',
        'X-Webhook-Timestamp', NOW()::text,
        'X-Webhook-ID', webhook_record.id::text
      ),
      body := payload
    );

    INSERT INTO webhook_logs (webhook_id, event_type, payload, status_code, duration_ms)
    VALUES (webhook_record.id, 'task.completed', payload, 0, 0);
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
