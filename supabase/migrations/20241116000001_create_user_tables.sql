-- Migration: Create core user tables (real_users, fictional_users, admins, operators)
-- Requirements: 1.1-1.5 (Admin Bootstrap), 2.1-2.5 (User Registration), 3.1-3.5 (Fictional Profiles)

-- ============================================================================
-- REAL USERS TABLE
-- ============================================================================
-- Stores authenticated real users who chat with fictional profiles
-- Requirements: 2.1-2.5 (User Registration)

CREATE TABLE IF NOT EXISTS real_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 100),
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  looking_for TEXT NOT NULL CHECK (looking_for IN ('male', 'female', 'both')),
  location TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  bio TEXT,
  profile_picture TEXT,
  profile_pictures TEXT[],
  credits INTEGER DEFAULT 0 CHECK (credits >= 0),
  total_spent DECIMAL(10, 2) DEFAULT 0,
  user_tier TEXT DEFAULT 'free' CHECK (user_tier IN ('free', 'bronze', 'silver', 'gold', 'platinum')),
  loyalty_points INTEGER DEFAULT 0,
  total_messages_sent INTEGER DEFAULT 0,
  total_chats INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  ban_reason TEXT,
  banned_until TIMESTAMP WITH TIME ZONE,
  notification_preferences JSONB DEFAULT '{"email": true, "push": true}'::jsonb,
  privacy_settings JSONB DEFAULT '{"show_online": true, "show_location": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for real_users table
CREATE INDEX idx_real_users_auth_id ON real_users(auth_id);
CREATE INDEX idx_real_users_username ON real_users(username);
CREATE INDEX idx_real_users_location ON real_users(location);
CREATE INDEX idx_real_users_tier ON real_users(user_tier);
CREATE INDEX idx_real_users_last_active ON real_users(last_active_at DESC);
CREATE INDEX idx_real_users_active ON real_users(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_real_users_banned ON real_users(is_banned) WHERE is_banned = true;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_real_users_updated_at
  BEFORE UPDATE ON real_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FICTIONAL USERS TABLE
-- ============================================================================
-- Stores fictional profiles that real users can chat with
-- Requirements: 3.1-3.5 (Fictional Profiles)

CREATE TABLE IF NOT EXISTS fictional_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 100),
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  location TEXT NOT NULL,
  bio TEXT NOT NULL,
  personality_traits TEXT[],
  interests TEXT[],
  occupation TEXT,
  education TEXT,
  relationship_status TEXT,
  profile_pictures TEXT[] NOT NULL,
  cover_photo TEXT,
  response_style TEXT CHECK (response_style IN ('flirty', 'romantic', 'friendly', 'intellectual', 'playful')),
  response_templates JSONB,
  personality_guidelines TEXT,
  total_chats INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_revenue DECIMAL(10, 2) DEFAULT 0,
  conversion_rate DECIMAL(5, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  featured_until TIMESTAMP WITH TIME ZONE,
  max_concurrent_chats INTEGER DEFAULT 10,
  tags TEXT[],
  category TEXT,
  popularity_score INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  -- Profile picture validation: minimum 3, maximum 10
  CONSTRAINT valid_profile_pictures CHECK (
    array_length(profile_pictures, 1) >= 3 AND
    array_length(profile_pictures, 1) <= 10
  )
);

-- Indexes for fictional_users table
CREATE INDEX idx_fictional_gender ON fictional_users(gender);
CREATE INDEX idx_fictional_active ON fictional_users(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_fictional_featured ON fictional_users(is_featured, featured_until);
CREATE INDEX idx_fictional_popularity ON fictional_users(popularity_score DESC);
CREATE INDEX idx_fictional_tags ON fictional_users USING GIN(tags);
CREATE INDEX idx_fictional_location ON fictional_users(location);
CREATE INDEX idx_fictional_created_by ON fictional_users(created_by);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_fictional_users_updated_at
  BEFORE UPDATE ON fictional_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ADMINS TABLE
-- ============================================================================
-- Stores platform administrators with role-based permissions
-- Requirements: 1.1-1.5 (Admin Bootstrap)

CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
  permissions JSONB DEFAULT '{
    "manage_users": true,
    "manage_fictional_profiles": true,
    "manage_operators": true,
    "manage_chats": true,
    "view_analytics": true,
    "manage_payments": true,
    "manage_admins": false,
    "system_settings": false,
    "delete_data": false
  }'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for admins table
CREATE INDEX idx_admins_auth ON admins(auth_id);
CREATE INDEX idx_admins_role ON admins(role);
CREATE INDEX idx_admins_active ON admins(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_admins_email ON admins(email);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key constraint for created_by after table creation
ALTER TABLE admins
  ADD CONSTRAINT fk_admins_created_by
  FOREIGN KEY (created_by)
  REFERENCES admins(id)
  ON DELETE SET NULL;

-- ============================================================================
-- OPERATORS TABLE
-- ============================================================================
-- Stores operators who manage fictional profiles and respond to real users
-- Requirements: 8.1-8.5 (Operator Assignment), 11.1-11.5 (Operator Availability), 12.1-12.5 (Operator Performance)

CREATE TABLE IF NOT EXISTS operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  specializations TEXT[],
  languages TEXT[] DEFAULT ARRAY['en'],
  skill_level TEXT DEFAULT 'junior' CHECK (skill_level IN ('junior', 'mid', 'senior', 'expert')),
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT false,
  max_concurrent_chats INTEGER DEFAULT 5,
  current_chat_count INTEGER DEFAULT 0,
  total_messages_sent INTEGER DEFAULT 0,
  total_chats_handled INTEGER DEFAULT 0,
  average_response_time INTERVAL,
  average_user_rating DECIMAL(3, 2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  quality_score DECIMAL(5, 2) DEFAULT 100,
  idle_incidents INTEGER DEFAULT 0,
  reassignment_count INTEGER DEFAULT 0,
  user_complaints INTEGER DEFAULT 0,
  quality_threshold DECIMAL(5, 2) DEFAULT 60,
  is_suspended BOOLEAN DEFAULT false,
  suspension_reason TEXT,
  suspended_until TIMESTAMP WITH TIME ZONE,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  total_online_time INTERVAL DEFAULT '0',
  hourly_rate DECIMAL(10, 2),
  commission_rate DECIMAL(5, 2),
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for operators table
CREATE INDEX idx_operators_available ON operators(is_available, is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_operators_quality ON operators(quality_score DESC);
CREATE INDEX idx_operators_specializations ON operators USING GIN(specializations);
CREATE INDEX idx_operators_auth ON operators(auth_id);
CREATE INDEX idx_operators_email ON operators(email);
CREATE INDEX idx_operators_suspended ON operators(is_suspended) WHERE is_suspended = true;
CREATE INDEX idx_operators_created_by ON operators(created_by);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_operators_updated_at
  BEFORE UPDATE ON operators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key constraints after all tables are created
ALTER TABLE fictional_users
  ADD CONSTRAINT fk_fictional_users_created_by
  FOREIGN KEY (created_by)
  REFERENCES admins(id)
  ON DELETE SET NULL;

ALTER TABLE operators
  ADD CONSTRAINT fk_operators_created_by
  FOREIGN KEY (created_by)
  REFERENCES admins(id)
  ON DELETE SET NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE real_users IS 'Authenticated users who register to chat with fictional profiles';
COMMENT ON TABLE fictional_users IS 'Fictional profiles created and managed by operators';
COMMENT ON TABLE admins IS 'Platform administrators with role-based permissions';
COMMENT ON TABLE operators IS 'Staff members who manage fictional profiles and respond to users';

COMMENT ON COLUMN real_users.credits IS 'Virtual currency balance (1 credit = 10 KES)';
COMMENT ON COLUMN real_users.user_tier IS 'User tier based on spending: free, bronze, silver, gold, platinum';
COMMENT ON COLUMN fictional_users.profile_pictures IS 'Array of profile picture URLs (min 3, max 10)';
COMMENT ON COLUMN fictional_users.is_featured IS 'Featured profiles have 1.5x message cost multiplier';
COMMENT ON COLUMN admins.role IS 'Admin role: super_admin (full access), admin (standard), moderator (limited)';
COMMENT ON COLUMN operators.quality_score IS 'Performance score (0-100), auto-suspend below 60';
COMMENT ON COLUMN operators.is_available IS 'Whether operator is available for new chat assignments';
