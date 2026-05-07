-- ============================================================
-- Migration: 005 — nullable fault_id + DB webhook triggers
-- ============================================================

-- Not all pickup schedules are tied to a specific fault (regular
-- vehicle collections from locations also use the same table).
ALTER TABLE pickup_schedules ALTER COLUMN fault_id DROP NOT NULL;

-- ── DB WEBHOOKS via pg_net ─────────────────────────────────
-- Requires pg_net (available on Supabase hosted, use Dashboard
-- to set `app.supabase_functions_url` and `app.supabase_service_key`).
-- Alternatively, configure via Supabase Dashboard > Database > Webhooks.

CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

CREATE OR REPLACE FUNCTION _call_notification_edge_fn()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  fn_url  TEXT := current_setting('app.supabase_functions_url', TRUE);
  svc_key TEXT := current_setting('app.supabase_service_role_key', TRUE);
BEGIN
  IF fn_url IS NULL OR svc_key IS NULL THEN RETURN NEW; END IF;

  PERFORM extensions.net.http_post(
    url     := fn_url || '/send-notification',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || svc_key
    ),
    body    := (jsonb_build_object(
      'type',  TG_OP,
      'table', TG_TABLE_NAME,
      'record', to_jsonb(NEW)
    ))::text
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW; -- never fail the main transaction
END;
$$;

-- Fault inserts + status updates → notify hub staff / manager
CREATE TRIGGER faults_notify_insert
  AFTER INSERT ON faults
  FOR EACH ROW EXECUTE FUNCTION _call_notification_edge_fn();

CREATE TRIGGER faults_notify_status
  AFTER UPDATE OF status ON faults
  FOR EACH ROW EXECUTE FUNCTION _call_notification_edge_fn();

-- Chat messages → notify the other party
CREATE TRIGGER chat_notify_insert
  AFTER INSERT ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION _call_notification_edge_fn();

-- Pickup schedules → notify driver + location manager
CREATE TRIGGER schedules_notify_insert
  AFTER INSERT ON pickup_schedules
  FOR EACH ROW EXECUTE FUNCTION _call_notification_edge_fn();
