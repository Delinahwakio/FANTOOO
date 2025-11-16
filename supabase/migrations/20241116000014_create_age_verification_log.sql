-- Create age_verification_log table for compliance
-- Requirement 23.1-23.5: Age Verification Logging

CREATE TABLE IF NOT EXISTS age_verification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  stated_age INTEGER NOT NULL CHECK (stated_age >= 18 AND stated_age <= 100),
  verification_method TEXT NOT NULL DEFAULT 'self_declared',
  verified_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for querying by user
CREATE INDEX idx_age_verification_user ON age_verification_log(user_id);

-- Create index for querying by verification date
CREATE INDEX idx_age_verification_date ON age_verification_log(verified_at DESC);

-- Add comment
COMMENT ON TABLE age_verification_log IS 'Logs age verification for compliance purposes (Requirement 23.1-23.5)';
