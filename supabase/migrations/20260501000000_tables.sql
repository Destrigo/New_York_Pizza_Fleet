-- ============================================================
-- Hi Tom Fleet — Database Schema
-- Migration: 001 tables
-- ============================================================

-- Enums
CREATE TYPE vehicle_type    AS ENUM ('ebike', 'scooter', 'car', 'bus');
CREATE TYPE vehicle_status  AS ENUM ('ok', 'fault', 'hub', 'fix', 'ready');
CREATE TYPE fault_status    AS ENUM ('open', 'in_progress', 'ready', 'closed');
CREATE TYPE pickup_status   AS ENUM ('planned', 'completed', 'cancelled');
CREATE TYPE event_type      AS ENUM ('moved', 'fault', 'repaired', 'assigned');
CREATE TYPE user_role       AS ENUM ('supervisor', 'manager', 'mechanic', 'driver');

-- ── LOCATIONS ──────────────────────────────────────────────
CREATE TABLE locations (
  id          TEXT PRIMARY KEY,          -- e.g. 'bilderdijk'
  name        TEXT NOT NULL,
  city        TEXT NOT NULL,
  address     TEXT NOT NULL,
  is_hub      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── USERS ──────────────────────────────────────────────────
-- Extends Supabase auth.users
CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  role        user_role NOT NULL,
  location_id TEXT NOT NULL REFERENCES locations(id),
  avatar_url  TEXT,
  fcm_token   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── VEHICLES ───────────────────────────────────────────────
CREATE TABLE vehicles (
  id          TEXT PRIMARY KEY,           -- e.g. 'F-001'
  type        vehicle_type NOT NULL,
  location_id TEXT NOT NULL REFERENCES locations(id),
  status      vehicle_status NOT NULL DEFAULT 'ok',
  color       TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── FAULTS ─────────────────────────────────────────────────
CREATE TABLE faults (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id    TEXT NOT NULL REFERENCES vehicles(id),
  location_id   TEXT NOT NULL REFERENCES locations(id),
  reported_by   UUID NOT NULL REFERENCES users(id),
  fault_type    TEXT NOT NULL,
  notes         TEXT,
  status        fault_status NOT NULL DEFAULT 'open',
  photo_count   INT NOT NULL DEFAULT 0,
  quality_score FLOAT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at     TIMESTAMPTZ
);

-- ── FAULT PHOTOS ───────────────────────────────────────────
CREATE TABLE fault_photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fault_id      UUID NOT NULL REFERENCES faults(id) ON DELETE CASCADE,
  storage_path  TEXT NOT NULL,
  uploaded_by   UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CHAT MESSAGES ──────────────────────────────────────────
CREATE TABLE chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fault_id    UUID NOT NULL REFERENCES faults(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES users(id),
  body        TEXT NOT NULL CHECK (char_length(body) <= 1000),
  is_hub_side BOOLEAN NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PICKUP SCHEDULES ───────────────────────────────────────
CREATE TABLE pickup_schedules (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fault_id         UUID NOT NULL REFERENCES faults(id),
  driver_id        UUID NOT NULL REFERENCES users(id),
  assigned_by      UUID NOT NULL REFERENCES users(id),
  from_location_id TEXT NOT NULL REFERENCES locations(id),
  to_location_id   TEXT NOT NULL REFERENCES locations(id),
  scheduled_date   DATE NOT NULL,
  time_from        TIME NOT NULL,
  time_to          TIME NOT NULL,
  vehicle_id       TEXT NOT NULL REFERENCES vehicles(id),
  notes            TEXT,
  status           pickup_status NOT NULL DEFAULT 'planned',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── NOTIFICATIONS ──────────────────────────────────────────
CREATE TABLE notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id      UUID NOT NULL REFERENCES users(id),
  type              TEXT NOT NULL,
  title             TEXT NOT NULL,
  body              TEXT NOT NULL,
  related_fault_id  UUID REFERENCES faults(id),
  related_pickup_id UUID REFERENCES pickup_schedules(id),
  read_at           TIMESTAMPTZ,
  sent_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── RESERVES ───────────────────────────────────────────────
CREATE TABLE reserves (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id  TEXT NOT NULL REFERENCES locations(id),
  vehicle_type vehicle_type NOT NULL,
  target_count INT NOT NULL DEFAULT 0,
  updated_by   UUID NOT NULL REFERENCES users(id),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (location_id, vehicle_type)
);

-- ── VEHICLE LOG ────────────────────────────────────────────
CREATE TABLE vehicle_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id       TEXT NOT NULL REFERENCES vehicles(id),
  event_type       event_type NOT NULL,
  from_location_id TEXT REFERENCES locations(id),
  to_location_id   TEXT REFERENCES locations(id),
  fault_id         UUID REFERENCES faults(id),
  performed_by     UUID NOT NULL REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes            TEXT
);

-- ── TRIGGERS ───────────────────────────────────────────────

-- Auto-update updated_at on vehicles
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER vehicles_updated_at BEFORE UPDATE ON vehicles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER faults_updated_at BEFORE UPDATE ON faults
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Update fault photo_count when a photo is inserted/deleted
CREATE OR REPLACE FUNCTION sync_photo_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE faults SET photo_count = (
    SELECT COUNT(*) FROM fault_photos WHERE fault_id = COALESCE(NEW.fault_id, OLD.fault_id)
  ) WHERE id = COALESCE(NEW.fault_id, OLD.fault_id);
  RETURN NULL;
END;
$$;

CREATE TRIGGER photos_inserted AFTER INSERT OR DELETE ON fault_photos
FOR EACH ROW EXECUTE FUNCTION sync_photo_count();

-- Set vehicle status to 'fault' when a fault is opened
CREATE OR REPLACE FUNCTION sync_vehicle_status_on_fault()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE vehicles SET status = 'fault' WHERE id = NEW.vehicle_id;
  ELSIF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    UPDATE vehicles SET status = 'ok' WHERE id = NEW.vehicle_id;
  ELSIF NEW.status = 'in_progress' THEN
    UPDATE vehicles SET status = 'fix' WHERE id = NEW.vehicle_id;
  ELSIF NEW.status = 'ready' THEN
    UPDATE vehicles SET status = 'ready' WHERE id = NEW.vehicle_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER faults_sync_vehicle AFTER INSERT OR UPDATE OF status ON faults
FOR EACH ROW EXECUTE FUNCTION sync_vehicle_status_on_fault();

-- Quality score calculation on fault insert/update
CREATE OR REPLACE FUNCTION calc_quality_score()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE score FLOAT := 0;
BEGIN
  IF NEW.photo_count >= 2 THEN score := score + 2; END IF;
  score := score + LEAST(GREATEST(NEW.photo_count - 2, 0), 6) * 0.5;
  IF NEW.notes IS NOT NULL AND char_length(NEW.notes) > 0 THEN score := score + 2; END IF;
  IF NEW.notes IS NOT NULL AND char_length(NEW.notes) > 50 THEN score := score + 1; END IF;
  IF NEW.fault_type != 'Overig' THEN score := score + 1; END IF;
  IF NEW.created_at::date = NOW()::date THEN score := score + 1; END IF;
  NEW.quality_score := GREATEST(score, 0);
  RETURN NEW;
END;
$$;

CREATE TRIGGER faults_quality BEFORE INSERT OR UPDATE OF photo_count, notes, fault_type ON faults
FOR EACH ROW EXECUTE FUNCTION calc_quality_score();

-- Indexes for common queries
CREATE INDEX idx_faults_location    ON faults (location_id);
CREATE INDEX idx_faults_vehicle     ON faults (vehicle_id);
CREATE INDEX idx_faults_status      ON faults (status);
CREATE INDEX idx_vehicles_location  ON vehicles (location_id);
CREATE INDEX idx_vehicles_status    ON vehicles (status);
CREATE INDEX idx_messages_fault     ON chat_messages (fault_id, created_at);
CREATE INDEX idx_notifications_user ON notifications (recipient_id, created_at);
CREATE INDEX idx_log_vehicle        ON vehicle_log (vehicle_id, created_at);
CREATE INDEX idx_schedules_driver   ON pickup_schedules (driver_id, scheduled_date);
