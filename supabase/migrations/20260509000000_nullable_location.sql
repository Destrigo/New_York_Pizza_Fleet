-- Allow supervisor and mechanic users to have no location
-- (hub roles are not tied to a specific delivery location)
ALTER TABLE users ALTER COLUMN location_id DROP NOT NULL;
