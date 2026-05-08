-- ============================================================
-- Migration: 010 — auto-move vehicle when pickup is completed
-- ============================================================
-- When a pickup_schedule transitions to 'completed', this trigger
-- updates the vehicle's location_id to the schedule's to_location_id
-- and sets status to 'hub' (if the destination is a hub) or 'ok'.
-- This keeps vehicle locations in sync without requiring the client
-- to issue a separate UPDATE.

CREATE OR REPLACE FUNCTION sync_vehicle_on_schedule_complete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_is_hub BOOLEAN;
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
    SELECT is_hub INTO v_is_hub FROM locations WHERE id = NEW.to_location_id;

    UPDATE vehicles
    SET
      location_id = NEW.to_location_id,
      status      = CASE WHEN v_is_hub THEN 'hub'::vehicle_status ELSE 'ok'::vehicle_status END,
      updated_at  = NOW()
    WHERE id = NEW.vehicle_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER schedule_complete_moves_vehicle
  AFTER UPDATE OF status ON pickup_schedules
  FOR EACH ROW EXECUTE FUNCTION sync_vehicle_on_schedule_complete();
