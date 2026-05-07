-- Add last_seen column for presence-based push suppression
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;

-- Allow users to update their own last_seen
CREATE POLICY "users_update_own_last_seen" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
