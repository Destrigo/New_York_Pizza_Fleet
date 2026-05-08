-- ============================================================
-- Migration: 009 — fault_events audit log + fault_stats view
-- ============================================================
-- fault_events records every status transition on a fault so supervisors
-- have a full audit trail (who changed what, when). The trigger fires
-- AFTER UPDATE OF status so it only runs on real status changes.
-- fault_stats is a convenience view that pre-aggregates per-location KPIs
-- used by the supervisor dashboard (total, active, avg resolution hours).

-- ── Audit table ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fault_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fault_id     UUID NOT NULL REFERENCES faults(id) ON DELETE CASCADE,
  from_status  TEXT,
  to_status    TEXT NOT NULL,
  changed_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fault_events_fault_id ON fault_events (fault_id);
CREATE INDEX idx_fault_events_created  ON fault_events (created_at DESC);

-- Trigger: log every status change
CREATE OR REPLACE FUNCTION log_fault_status_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO fault_events (fault_id, from_status, to_status)
    VALUES (NEW.id, OLD.status::TEXT, NEW.status::TEXT);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER faults_log_status
  AFTER UPDATE OF status ON faults
  FOR EACH ROW EXECUTE FUNCTION log_fault_status_change();

-- ── RLS for fault_events ────────────────────────────────────

ALTER TABLE fault_events ENABLE ROW LEVEL SECURITY;

-- Hub staff and supervisors can read all events
CREATE POLICY "fault_events_read" ON fault_events FOR SELECT
  TO authenticated USING (is_hub());

-- Managers can read events for faults they reported
CREATE POLICY "fault_events_manager_read" ON fault_events FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM faults f
      WHERE f.id = fault_id
        AND f.reported_by = auth.uid()
    )
  );

-- No direct inserts from client — only via trigger
CREATE POLICY "fault_events_deny_insert" ON fault_events FOR INSERT
  TO authenticated WITH CHECK (false);

-- ── Statistics view ─────────────────────────────────────────

CREATE OR REPLACE VIEW fault_stats AS
SELECT
  f.location_id,
  l.name                                             AS location_name,
  COUNT(*)                                           AS total_faults,
  COUNT(*) FILTER (WHERE f.status != 'closed')       AS active_faults,
  COUNT(*) FILTER (WHERE f.status = 'closed')        AS closed_faults,
  ROUND(AVG(f.quality_score)::NUMERIC, 2)            AS avg_quality,
  ROUND(
    AVG(
      EXTRACT(EPOCH FROM (f.closed_at - f.created_at)) / 3600
    ) FILTER (WHERE f.closed_at IS NOT NULL)::NUMERIC,
    1
  )                                                  AS avg_resolution_hours
FROM faults f
JOIN locations l ON l.id = f.location_id
GROUP BY f.location_id, l.name;

COMMENT ON VIEW fault_stats IS
  'Per-location fault KPIs: totals, active count, quality average, avg resolution time in hours.';
