-- ============================================
-- Webhook Database Triggers using pg_net
-- ============================================
-- This migration enables automatic webhook triggering at the database level,
-- independent of the application runtime (Vercel/Next.js).
--
-- PREREQUISITE: Enable pg_net extension in Supabase Dashboard:
-- 1. Go to Database > Extensions
-- 2. Search for "pg_net" and enable it
-- ============================================

-- Enable pg_net extension (for HTTP requests from PostgreSQL)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ============================================
-- Function to send webhook notifications
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
  FOR webhook_record IN
    SELECT id, url, secret
    FROM webhooks
    WHERE workspace_id = COALESCE(NEW.workspace_id, OLD.workspace_id)
      AND is_active = true
      AND events @> jsonb_build_array(event_type)
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
-- Special function for deal stage changes
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
  FOR webhook_record IN
    SELECT id, url, secret
    FROM webhooks
    WHERE workspace_id = NEW.workspace_id
      AND is_active = true
      AND (
        events @> jsonb_build_array(event_type)
        OR (event_type IN ('deal.won', 'deal.lost') AND events @> jsonb_build_array('deal.stage_changed'))
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
-- Special function for task completion
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
  FOR webhook_record IN
    SELECT id, url, secret
    FROM webhooks
    WHERE workspace_id = NEW.workspace_id
      AND is_active = true
      AND events @> jsonb_build_array('task.completed')
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

-- ============================================
-- Create triggers on tables
-- ============================================

-- Contacts triggers
DROP TRIGGER IF EXISTS webhook_contacts_trigger ON contacts;
CREATE TRIGGER webhook_contacts_trigger
  AFTER INSERT OR UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION send_webhook_notification();

-- Companies triggers
DROP TRIGGER IF EXISTS webhook_companies_trigger ON companies;
CREATE TRIGGER webhook_companies_trigger
  AFTER INSERT OR UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION send_webhook_notification();

-- Deals triggers (general)
DROP TRIGGER IF EXISTS webhook_deals_trigger ON deals;
CREATE TRIGGER webhook_deals_trigger
  AFTER INSERT OR UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION send_webhook_notification();

-- Deals stage change trigger
DROP TRIGGER IF EXISTS webhook_deal_stage_trigger ON deals;
CREATE TRIGGER webhook_deal_stage_trigger
  AFTER UPDATE OF stage_id ON deals
  FOR EACH ROW
  EXECUTE FUNCTION send_deal_stage_webhook();

-- Activities triggers (for activity.created and task.created)
DROP TRIGGER IF EXISTS webhook_activities_trigger ON activities;
CREATE TRIGGER webhook_activities_trigger
  AFTER INSERT OR UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION send_webhook_notification();

-- Task completion trigger
DROP TRIGGER IF EXISTS webhook_task_completed_trigger ON activities;
CREATE TRIGGER webhook_task_completed_trigger
  AFTER UPDATE OF is_completed ON activities
  FOR EACH ROW
  EXECUTE FUNCTION send_task_completed_webhook();

-- ============================================
-- Grant permissions
-- ============================================
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION send_webhook_notification() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION send_deal_stage_webhook() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION send_task_completed_webhook() TO postgres, service_role;
