-- ============================================================
-- Migration: 011 — webhook trigger for pickup_schedule UPDATE
-- ============================================================
-- The existing schedules_notify_insert trigger only fires on INSERT.
-- To send notifications when a schedule is completed or cancelled,
-- we need an AFTER UPDATE trigger that fires the same edge function.

CREATE TRIGGER schedules_notify_update
  AFTER UPDATE OF status ON pickup_schedules
  FOR EACH ROW EXECUTE FUNCTION _call_notification_edge_fn();
