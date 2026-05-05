-- ============================================================
-- Hi Tom Fleet — Row Level Security Policies
-- Migration: 002 rls
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE locations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE faults           ENABLE ROW LEVEL SECURITY;
ALTER TABLE fault_photos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE reserves         ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_log      ENABLE ROW LEVEL SECURITY;

-- ── HELPERS ────────────────────────────────────────────────

-- Get current user's role
CREATE OR REPLACE FUNCTION auth_role() RETURNS user_role
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$;

-- Get current user's location_id
CREATE OR REPLACE FUNCTION auth_location() RETURNS TEXT
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT location_id FROM users WHERE id = auth.uid()
$$;

-- Is current user a supervisor?
CREATE OR REPLACE FUNCTION is_supervisor() RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role = 'supervisor' FROM users WHERE id = auth.uid()
$$;

-- Is current user hub staff (mechanic or supervisor)?
CREATE OR REPLACE FUNCTION is_hub() RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role IN ('supervisor', 'mechanic') FROM users WHERE id = auth.uid()
$$;

-- ── LOCATIONS ──────────────────────────────────────────────
-- Everyone authenticated can read locations
CREATE POLICY "locations_read" ON locations FOR SELECT
  TO authenticated USING (TRUE);

-- Only supervisors can write
CREATE POLICY "locations_write" ON locations FOR ALL
  TO authenticated USING (is_supervisor());

-- ── USERS ──────────────────────────────────────────────────
-- Users see their own row; supervisors see all
CREATE POLICY "users_read" ON users FOR SELECT
  TO authenticated USING (
    id = auth.uid() OR is_supervisor()
  );

-- Users can update their own row (name, avatar, fcm_token)
CREATE POLICY "users_update_own" ON users FOR UPDATE
  TO authenticated USING (id = auth.uid());

-- Supervisors can insert/delete (user management)
CREATE POLICY "users_supervisor_write" ON users FOR ALL
  TO authenticated USING (is_supervisor());

-- ── VEHICLES ───────────────────────────────────────────────
-- Managers see vehicles at their own location; hub/supervisors see all
CREATE POLICY "vehicles_read" ON vehicles FOR SELECT
  TO authenticated USING (
    is_hub() OR location_id = auth_location()
  );

-- Only hub staff and supervisors can update location_id (reassignment)
-- Supervisors/hub can update any field; managers cannot update vehicles
CREATE POLICY "vehicles_write" ON vehicles FOR ALL
  TO authenticated USING (is_hub());

-- ── FAULTS ─────────────────────────────────────────────────
-- Managers see own location faults; hub/supervisors see all
CREATE POLICY "faults_read" ON faults FOR SELECT
  TO authenticated USING (
    is_hub() OR location_id = auth_location()
  );

-- Managers can insert faults (reporting)
CREATE POLICY "faults_insert" ON faults FOR INSERT
  TO authenticated WITH CHECK (
    auth_role() = 'manager' AND location_id = auth_location()
  );

-- Hub staff and supervisors can update fault status
CREATE POLICY "faults_update" ON faults FOR UPDATE
  TO authenticated USING (is_hub());

-- ── FAULT PHOTOS ───────────────────────────────────────────
CREATE POLICY "photos_read" ON fault_photos FOR SELECT
  TO authenticated USING (
    is_hub()
    OR uploaded_by = auth.uid()
    OR fault_id IN (SELECT id FROM faults WHERE location_id = auth_location())
  );

CREATE POLICY "photos_insert" ON fault_photos FOR INSERT
  TO authenticated WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "photos_delete" ON fault_photos FOR DELETE
  TO authenticated USING (uploaded_by = auth.uid() OR is_hub());

-- ── CHAT MESSAGES ──────────────────────────────────────────
-- Managers see messages for their location faults; hub/supervisors see all
CREATE POLICY "messages_read" ON chat_messages FOR SELECT
  TO authenticated USING (
    is_hub()
    OR fault_id IN (SELECT id FROM faults WHERE location_id = auth_location())
  );

-- Managers can insert (not_hub_side); hub staff can insert (hub_side)
-- Supervisors are read-only
CREATE POLICY "messages_insert" ON chat_messages FOR INSERT
  TO authenticated WITH CHECK (
    (auth_role() = 'manager' AND NOT is_hub_side)
    OR (auth_role() = 'mechanic' AND is_hub_side)
  );

-- ── PICKUP SCHEDULES ───────────────────────────────────────
-- Drivers see only their own; hub/supervisors see all
CREATE POLICY "schedules_read" ON pickup_schedules FOR SELECT
  TO authenticated USING (
    is_hub() OR driver_id = auth.uid()
  );

-- Only hub staff and supervisors can create/edit/cancel
CREATE POLICY "schedules_write" ON pickup_schedules FOR ALL
  TO authenticated USING (is_hub());

-- Drivers can update status to 'completed'
CREATE POLICY "schedules_driver_complete" ON pickup_schedules FOR UPDATE
  TO authenticated USING (driver_id = auth.uid())
  WITH CHECK (status = 'completed');

-- ── NOTIFICATIONS ──────────────────────────────────────────
-- Users see only their own notifications
CREATE POLICY "notifications_read" ON notifications FOR SELECT
  TO authenticated USING (recipient_id = auth.uid());

-- System (service role) inserts; user can update read_at
CREATE POLICY "notifications_update" ON notifications FOR UPDATE
  TO authenticated USING (recipient_id = auth.uid())
  WITH CHECK (read_at IS NOT NULL);

-- ── RESERVES ───────────────────────────────────────────────
-- Managers see their own location; supervisors see all
CREATE POLICY "reserves_read" ON reserves FOR SELECT
  TO authenticated USING (
    is_supervisor() OR location_id = auth_location()
  );

-- Only supervisors can write reserves
CREATE POLICY "reserves_write" ON reserves FOR ALL
  TO authenticated USING (is_supervisor());

-- ── VEHICLE LOG ────────────────────────────────────────────
-- Managers see log for vehicles at their location; hub/supervisors see all
CREATE POLICY "log_read" ON vehicle_log FOR SELECT
  TO authenticated USING (
    is_hub()
    OR vehicle_id IN (SELECT id FROM vehicles WHERE location_id = auth_location())
  );

-- Only hub staff, supervisors, and system can write log entries
CREATE POLICY "log_write" ON vehicle_log FOR INSERT
  TO authenticated WITH CHECK (is_hub() OR performed_by = auth.uid());
