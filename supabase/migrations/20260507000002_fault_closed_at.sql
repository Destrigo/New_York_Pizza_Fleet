-- ============================================================
-- Migration: 007 — auto-set closed_at when fault is closed
-- ============================================================
-- The faults table has a closed_at column that was never being
-- populated. This trigger sets it when status transitions to 'closed'
-- and clears it if the status is ever reverted (belt-and-suspenders).

CREATE OR REPLACE FUNCTION set_fault_closed_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'closed' AND (OLD.status IS DISTINCT FROM 'closed') THEN
    NEW.closed_at := NOW();
  ELSIF NEW.status != 'closed' AND OLD.status = 'closed' THEN
    NEW.closed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER faults_set_closed_at
  BEFORE UPDATE OF status ON faults
  FOR EACH ROW EXECUTE FUNCTION set_fault_closed_at();
