-- ============================================================
-- Migration: 012 — repair_notes column on faults
-- ============================================================
-- Allows hub mechanics to document what was repaired when
-- marking a fault as 'ready'. Visible to location managers.

ALTER TABLE faults ADD COLUMN IF NOT EXISTS repair_notes TEXT DEFAULT NULL;
