-- Create user_favorites table for tracking favorited fictional profiles
-- This table supports the favorite functionality in the discover page

CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  real_user_id UUID NOT NULL REFERENCES real_users(id) ON DELETE CASCADE,
  fictional_user_id UUID NOT NULL REFERENCES fictional_users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(real_user_id, fictional_user_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_favorites_real_user ON user_favorites(real_user_id);
CREATE INDEX idx_user_favorites_fictional_user ON user_favorites(fictional_user_id);
CREATE INDEX idx_user_favorites_created ON user_favorites(created_at DESC);

-- Add RLS policies
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Users can only see their own favorites
CREATE POLICY "Users can view own favorites"
  ON user_favorites
  FOR SELECT
  USING (
    real_user_id IN (
      SELECT id FROM real_users WHERE auth_id = auth.uid()
    )
  );

-- Users can add their own favorites
CREATE POLICY "Users can add own favorites"
  ON user_favorites
  FOR INSERT
  WITH CHECK (
    real_user_id IN (
      SELECT id FROM real_users WHERE auth_id = auth.uid()
    )
  );

-- Users can remove their own favorites
CREATE POLICY "Users can remove own favorites"
  ON user_favorites
  FOR DELETE
  USING (
    real_user_id IN (
      SELECT id FROM real_users WHERE auth_id = auth.uid()
    )
  );

-- Admins can view all favorites
CREATE POLICY "Admins can view all favorites"
  ON user_favorites
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE auth_id = auth.uid() AND is_active = true
    )
  );

-- Comment on table
COMMENT ON TABLE user_favorites IS 'Tracks which fictional profiles real users have favorited';
