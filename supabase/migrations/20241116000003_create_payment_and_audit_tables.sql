-- Migration: Create Payment and Audit Tables
-- Description: Creates tables for transactions, credit packages, refunds, message edits, 
--              deleted users, banned users tracking, user activity log, and admin notifications
-- Requirements: 5.1-5.5 (Credit System), 13.1-13.5 (Message Editing), 
--               14.1-14.5 (User Deletion), 16.1-16.5 (Payment Idempotency)

-- =====================================================
-- CREDIT PACKAGES TABLE
-- =====================================================
-- Stores available credit packages for purchase
CREATE TABLE credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL CHECK (credits > 0),
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  currency TEXT DEFAULT 'KES' NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  badge_text TEXT,
  discount_percentage INTEGER CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  bonus_credits INTEGER DEFAULT 0 CHECK (bonus_credits >= 0),
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,
  variant TEXT,
  conversion_rate DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (valid_until IS NULL OR valid_until > valid_from)
);

CREATE INDEX idx_credit_packages_active ON credit_packages(is_active, valid_from, valid_until);
CREATE INDEX idx_credit_packages_featured ON credit_packages(is_featured) WHERE is_featured = true;

COMMENT ON TABLE credit_packages IS 'Available credit packages for purchase';

-- =====================================================
-- TRANSACTIONS TABLE
-- =====================================================
-- Stores all payment transactions with idempotency support
-- Requirement 16.1-16.5: Payment Idempotency
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  real_user_id UUID REFERENCES real_users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'refund', 'bonus', 'deduction')),
  amount DECIMAL(10, 2) NOT NULL,
  credits_amount INTEGER NOT NULL,
  payment_provider TEXT DEFAULT 'paystack',
  provider_reference TEXT UNIQUE NOT NULL,
  provider_response JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'refunded')),
  failure_reason TEXT,
  webhook_received_count INTEGER DEFAULT 0 CHECK (webhook_received_count >= 0),
  last_webhook_at TIMESTAMP,
  package_id UUID REFERENCES credit_packages(id),
  package_snapshot JSONB,
  promo_code TEXT,
  discount_amount DECIMAL(10, 2) DEFAULT 0 CHECK (discount_amount >= 0),
  needs_manual_review BOOLEAN DEFAULT false,
  review_reason TEXT,
  reviewed_by UUID REFERENCES admins(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  refunded_at TIMESTAMP,
  CONSTRAINT valid_review CHECK (
    (needs_manual_review = false) OR 
    (needs_manual_review = true AND review_reason IS NOT NULL)
  ),
  CONSTRAINT valid_refund CHECK (
    (status != 'refunded') OR 
    (status = 'refunded' AND refunded_at IS NOT NULL)
  )
);

CREATE INDEX idx_transactions_user ON transactions(real_user_id, created_at DESC);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_reference ON transactions(provider_reference);
CREATE INDEX idx_transactions_review ON transactions(needs_manual_review) WHERE needs_manual_review = true;
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);

COMMENT ON TABLE transactions IS 'Payment transactions with idempotency support via provider_reference';
COMMENT ON COLUMN transactions.provider_reference IS 'Unique reference from payment provider (e.g., Paystack) for idempotency';
COMMENT ON COLUMN transactions.webhook_received_count IS 'Number of times webhook was received for duplicate detection';

-- =====================================================
-- CREDIT REFUNDS TABLE
-- =====================================================
-- Stores credit refund records with audit trail
-- Requirement 18.1-18.5: Credit Refund Processing
CREATE TABLE credit_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES real_users(id) NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL CHECK (reason IN (
    'accidental_send',
    'inappropriate_content',
    'system_error',
    'admin_discretion',
    'account_deletion'
  )),
  message_id UUID,
  chat_id UUID REFERENCES chats(id),
  processed_by UUID REFERENCES admins(id) NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refunds_user ON credit_refunds(user_id, created_at DESC);
CREATE INDEX idx_refunds_processor ON credit_refunds(processed_by);
CREATE INDEX idx_refunds_status ON credit_refunds(status) WHERE status = 'pending';

COMMENT ON TABLE credit_refunds IS 'Credit refund records with audit trail';
COMMENT ON COLUMN credit_refunds.reason IS 'Predefined refund reason for compliance';

-- =====================================================
-- MESSAGE EDIT HISTORY TABLE
-- =====================================================
-- Stores audit trail for message edits
-- Requirement 13.1-13.5: Message Editing and Audit Trail
CREATE TABLE message_edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,
  original_content TEXT NOT NULL,
  new_content TEXT NOT NULL,
  edited_by UUID NOT NULL,
  editor_type TEXT NOT NULL CHECK (editor_type IN ('admin', 'operator')),
  edit_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_edit_history_message ON message_edit_history(message_id, created_at DESC);
CREATE INDEX idx_edit_history_editor ON message_edit_history(edited_by);
CREATE INDEX idx_edit_history_created ON message_edit_history(created_at DESC);

COMMENT ON TABLE message_edit_history IS 'Audit trail for all message edits';
COMMENT ON COLUMN message_edit_history.editor_type IS 'Type of user who edited: admin or operator';

-- =====================================================
-- DELETED USERS TABLE
-- =====================================================
-- Stores archived data for deleted user accounts (GDPR compliance)
-- Requirement 14.1-14.5: User Account Deletion
CREATE TABLE deleted_users (
  id UUID PRIMARY KEY,
  original_user_id UUID NOT NULL,
  username TEXT,
  email TEXT,
  deletion_reason TEXT,
  deletion_requested_at TIMESTAMP,
  deletion_completed_at TIMESTAMP DEFAULT NOW(),
  total_spent DECIMAL(10, 2),
  total_messages_sent INTEGER,
  account_age_days INTEGER,
  data_anonymized BOOLEAN DEFAULT true,
  messages_anonymized BOOLEAN DEFAULT true,
  unused_credits INTEGER,
  refund_amount DECIMAL(10, 2),
  refund_processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_deleted_users_original ON deleted_users(original_user_id);
CREATE INDEX idx_deleted_users_date ON deleted_users(deletion_completed_at DESC);
CREATE INDEX idx_deleted_users_refund ON deleted_users(refund_processed) WHERE refund_processed = false;

COMMENT ON TABLE deleted_users IS 'Archive of deleted user accounts for GDPR compliance';
COMMENT ON COLUMN deleted_users.data_anonymized IS 'Whether user data has been anonymized';
COMMENT ON COLUMN deleted_users.messages_anonymized IS 'Whether user messages have been anonymized';

-- =====================================================
-- BANNED USERS TRACKING TABLE
-- =====================================================
-- Tracks banned users and circumvention attempts
-- Requirement 21.1-21.5: Banned User Circumvention Detection
CREATE TABLE banned_users_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES real_users(id) NOT NULL,
  ban_reason TEXT NOT NULL,
  banned_by UUID REFERENCES admins(id) NOT NULL,
  banned_until TIMESTAMP,
  is_permanent BOOLEAN DEFAULT false,
  ip_addresses INET[],
  device_fingerprints TEXT[],
  email_pattern TEXT,
  circumvention_attempts INTEGER DEFAULT 0 CHECK (circumvention_attempts >= 0),
  last_attempt_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_ban_duration CHECK (
    (is_permanent = true AND banned_until IS NULL) OR
    (is_permanent = false AND banned_until IS NOT NULL) OR
    (is_permanent = false AND banned_until IS NULL)
  )
);

CREATE INDEX idx_banned_users ON banned_users_tracking(user_id);
CREATE INDEX idx_banned_ips ON banned_users_tracking USING GIN(ip_addresses);
CREATE INDEX idx_banned_devices ON banned_users_tracking USING GIN(device_fingerprints);
CREATE INDEX idx_banned_active ON banned_users_tracking(user_id) 
  WHERE is_permanent = true OR banned_until > NOW();

COMMENT ON TABLE banned_users_tracking IS 'Tracks banned users and circumvention attempts';
COMMENT ON COLUMN banned_users_tracking.ip_addresses IS 'IP addresses associated with banned user';
COMMENT ON COLUMN banned_users_tracking.device_fingerprints IS 'Device fingerprints for circumvention detection';

-- =====================================================
-- USER ACTIVITY LOG TABLE (PARTITIONED)
-- =====================================================
-- Stores user activity logs with monthly partitioning
-- Requirement 29.1-29.5: Database Partitioning
CREATE TABLE user_activity_log (
  id UUID DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES real_users(id) NOT NULL,
  activity_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create initial partitions for current and next 3 months
CREATE TABLE user_activity_log_2024_11 PARTITION OF user_activity_log
  FOR VALUES FROM ('2024-11-01') TO ('2024-12-01');

CREATE TABLE user_activity_log_2024_12 PARTITION OF user_activity_log
  FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

CREATE TABLE user_activity_log_2025_01 PARTITION OF user_activity_log
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE user_activity_log_2025_02 PARTITION OF user_activity_log
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Indexes on partitioned table
CREATE INDEX idx_activity_user ON user_activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_type ON user_activity_log(activity_type, created_at DESC);
CREATE INDEX idx_activity_ip ON user_activity_log(ip_address);
CREATE INDEX idx_activity_device ON user_activity_log(device_fingerprint);
CREATE INDEX idx_activity_session ON user_activity_log(session_id);

COMMENT ON TABLE user_activity_log IS 'User activity logs partitioned by month for performance';
COMMENT ON COLUMN user_activity_log.device_fingerprint IS 'Browser/device fingerprint for tracking';

-- =====================================================
-- ADMIN NOTIFICATIONS TABLE
-- =====================================================
-- Stores notifications for admin users
CREATE TABLE admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN (
    'operator_suspended',
    'chat_escalation',
    'payment_failed',
    'high_refund_rate',
    'system_error',
    'security_alert',
    'user_circumvention'
  )),
  message TEXT NOT NULL,
  metadata JSONB,
  is_read BOOLEAN DEFAULT false,
  read_by UUID REFERENCES admins(id),
  read_at TIMESTAMP,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_read_status CHECK (
    (is_read = false AND read_by IS NULL AND read_at IS NULL) OR
    (is_read = true AND read_by IS NOT NULL AND read_at IS NOT NULL)
  )
);

CREATE INDEX idx_admin_notifications_unread ON admin_notifications(is_read, created_at DESC) 
  WHERE is_read = false;
CREATE INDEX idx_admin_notifications_priority ON admin_notifications(priority, created_at DESC);
CREATE INDEX idx_admin_notifications_type ON admin_notifications(type, created_at DESC);

COMMENT ON TABLE admin_notifications IS 'Notifications for admin users about system events';
COMMENT ON COLUMN admin_notifications.priority IS 'Notification priority level';

-- =====================================================
-- UPDATE TRIGGERS FOR TIMESTAMPS
-- =====================================================

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to credit_packages
CREATE TRIGGER update_credit_packages_updated_at
  BEFORE UPDATE ON credit_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates updated_at timestamp on row update';
