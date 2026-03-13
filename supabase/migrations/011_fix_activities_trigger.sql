-- ============================================
-- Fix: Activities table doesn't have deleted_at column
-- The webhook trigger was failing because it assumed all tables have deleted_at
-- ============================================

-- Drop the problematic trigger on activities
DROP TRIGGER IF EXISTS webhook_activities_trigger ON activities;

-- Create a simpler function specifically for activities (no soft delete check)
CREATE OR REPLACE FUNCTION send_activity_webhook_notification()
RETURNS TRIGGER AS $$
DECLARE
  webhook_record RECORD;
  event_type TEXT;
  payload JSONB;
BEGIN
  -- Determine event type
  IF TG_OP = 'INSERT' THEN
    event_type := 'activity.created';
  ELSIF TG_OP = 'UPDATE' THEN
    event_type := 'activity.updated';
  ELSIF TG_OP = 'DELETE' THEN
    event_type := 'activity.deleted';
  END IF;

  -- Build payload
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
  END LOOP;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Webhook error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the new trigger for activities
CREATE TRIGGER webhook_activities_trigger
  AFTER INSERT OR UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION send_activity_webhook_notification();

-- Grant permission
GRANT EXECUTE ON FUNCTION send_activity_webhook_notification() TO postgres, service_role;
