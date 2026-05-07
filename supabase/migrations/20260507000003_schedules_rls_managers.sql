-- ============================================================
-- Migration: 008 — extend schedules RLS to include managers
-- ============================================================
-- The original schedules_read policy only allowed hub staff and
-- drivers to read pickup schedules. However managers need to read
-- schedules that involve their location (as pickup or drop-off)
-- so the ManagerDashboard 'Laatste Hub bezoek' card can work.

DROP POLICY IF EXISTS "schedules_read" ON pickup_schedules;

CREATE POLICY "schedules_read" ON pickup_schedules FOR SELECT
  TO authenticated USING (
    is_hub()
    OR driver_id = auth.uid()
    OR from_location_id = auth_location()
    OR to_location_id   = auth_location()
  );
