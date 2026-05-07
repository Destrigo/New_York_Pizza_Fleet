-- ============================================================
-- Migration: 006 — include OLD record in webhook payload
-- ============================================================
-- The original trigger only passed NEW to the edge function.
-- For status-change transitions (in_progress, ready) the edge
-- function checks old?.status to avoid sending duplicate notifications.
-- Without OLD the check was always truthy, sending a notification
-- on every UPDATE regardless of whether status actually changed.

CREATE OR REPLACE FUNCTION _call_notification_edge_fn()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  fn_url  TEXT := current_setting('app.supabase_functions_url', TRUE);
  svc_key TEXT := current_setting('app.supabase_service_role_key', TRUE);
  payload JSONB;
BEGIN
  IF fn_url IS NULL OR svc_key IS NULL THEN RETURN NEW; END IF;

  payload := jsonb_build_object(
    'type',   TG_OP,
    'table',  TG_TABLE_NAME,
    'record', to_jsonb(NEW)
  );

  -- Include old record on UPDATE so edge function can detect transitions
  IF TG_OP = 'UPDATE' THEN
    payload := payload || jsonb_build_object('old_record', to_jsonb(OLD));
  END IF;

  PERFORM extensions.net.http_post(
    url     := fn_url || '/send-notification',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || svc_key
    ),
    body    := payload::text
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;
