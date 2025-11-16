-- Migration: Create Performance Optimization Indexes
-- Description: Creates composite, partial, and GIN indexes for frequently queried columns
-- Requirements: Performance optimization for all features
-- Task: 9. Create database indexes for performance optimization

-- ============================================================================
-- COMPOSITE INDEXES FOR FREQUENTLY QUERIED COLUMNS
-- ============================================================================

-- Real Users: Composite indexes for common query patterns
-- Query pattern: Find active users by tier and location
CREATE INDEX IF NOT EXISTS idx_real_users_tier_location 
  ON real_users(user_tier, location) 
  WHERE deleted_at IS NULL AND is_active = true;

-- Query pattern: Find users by gender preference and location
CREATE INDEX IF NOT EXISTS idx_real_users_gender_location 
  ON real_users(gender, location, looking_for) 
  WHERE deleted_at IS NULL;

-- Query pattern: Find users by activity and tier (for analytics)
CREATE INDEX IF NOT EXISTS idx_real_users_active_tier_spent 
  ON real_users(is_active, user_tier, total_spent DESC) 
  WHERE deleted_at IS NULL;

-- Query pattern: Find users with low credits (for notifications)
CREATE INDEX IF NOT EXISTS idx_real_users_low_credits 
  ON real_users(credits, last_active_at DESC) 
  WHERE is_active = true AND credits < 10 AND deleted_at IS NULL;

-- Fictional Users: Composite indexes for discovery and filtering
-- Query pattern: Find active featured profiles by gender
CREATE INDEX IF NOT EXISTS idx_fictional_gender_featured_active 
  ON fictional_users(gender, is_featured, popularity_score DESC) 
  WHERE is_active = true AND deleted_at IS NULL;

-- Query pattern: Find profiles by location and gender
CREATE INDEX IF NOT EXISTS idx_fictional_location_gender 
  ON fictional_users(location, gender, is_active) 
  WHERE deleted_at IS NULL;

-- Query pattern: Find profiles by category and rating
CREATE INDEX IF NOT EXISTS idx_fictional_category_rating 
  ON fictional_users(category, average_rating DESC, total_chats DESC) 
  WHERE is_active = true AND deleted_at IS NULL;

-- Query pattern: Find profiles by response style and availability
CREATE INDEX IF NOT EXISTS idx_fictional_style_concurrent 
  ON fictional_users(response_style, total_chats, max_concurrent_chats) 
  WHERE is_active = true AND deleted_at IS NULL;

-- Chats: Composite indexes for operator assignment and monitoring
-- Query pattern: Find active chats by operator with recent activity
CREATE INDEX IF NOT EXISTS idx_chats_operator_status_activity 
  ON chats(assigned_operator_id, status, last_message_at DESC) 
  WHERE status IN ('active', 'idle');

-- Query pattern: Find chats by user and status
CREATE INDEX IF NOT EXISTS idx_chats_user_status_created 
  ON chats(real_user_id, status, created_at DESC);

-- Query pattern: Find idle chats for timeout detection
CREATE INDEX IF NOT EXISTS idx_chats_idle_timeout 
  ON chats(status, last_message_at) 
  WHERE status = 'active' OR status = 'idle';

-- Query pattern: Find chats by fictional user and status
CREATE INDEX IF NOT EXISTS idx_chats_fictional_status_activity 
  ON chats(fictional_user_id, status, last_message_at DESC);

-- Query pattern: Find chats needing assignment
CREATE INDEX IF NOT EXISTS idx_chats_unassigned 
  ON chats(status, created_at) 
  WHERE assigned_operator_id IS NULL AND status = 'active';

-- Query pattern: Find chats by assignment count (for escalation)
CREATE INDEX IF NOT EXISTS idx_chats_assignment_count_status 
  ON chats(assignment_count, status, created_at) 
  WHERE status IN ('active', 'escalated');

-- Messages: Composite indexes for chat history and analytics
-- Query pattern: Find messages by chat and sender type
CREATE INDEX IF NOT EXISTS idx_messages_chat_sender_created 
  ON messages(chat_id, sender_type, created_at DESC);

-- Query pattern: Find free vs paid messages
CREATE INDEX IF NOT EXISTS idx_messages_chat_free_created 
  ON messages(chat_id, is_free_message, created_at DESC);

-- Query pattern: Find messages by operator and date
CREATE INDEX IF NOT EXISTS idx_messages_operator_date 
  ON messages(handled_by_operator_id, created_at DESC) 
  WHERE handled_by_operator_id IS NOT NULL;

-- Query pattern: Find messages by content type and chat
CREATE INDEX IF NOT EXISTS idx_messages_content_type_chat 
  ON messages(content_type, chat_id, created_at DESC);

-- Operators: Composite indexes for assignment and performance
-- Query pattern: Find available operators by specialization and quality
CREATE INDEX IF NOT EXISTS idx_operators_available_quality_chats 
  ON operators(is_available, quality_score DESC, current_chat_count ASC) 
  WHERE is_active = true AND is_suspended = false AND deleted_at IS NULL;

-- Query pattern: Find operators by skill level and availability
CREATE INDEX IF NOT EXISTS idx_operators_skill_available 
  ON operators(skill_level, is_available, quality_score DESC) 
  WHERE is_active = true AND deleted_at IS NULL;

-- Query pattern: Find operators needing performance review
CREATE INDEX IF NOT EXISTS idx_operators_low_quality 
  ON operators(quality_score, is_suspended, last_activity DESC) 
  WHERE quality_score < 70 AND is_active = true;

-- Query pattern: Find operators by workload
CREATE INDEX IF NOT EXISTS idx_operators_workload 
  ON operators(current_chat_count, max_concurrent_chats, is_available) 
  WHERE is_active = true AND deleted_at IS NULL;

-- Transactions: Composite indexes for payment processing
-- Query pattern: Find transactions by user and status
CREATE INDEX IF NOT EXISTS idx_transactions_user_status_created 
  ON transactions(real_user_id, status, created_at DESC);

-- Query pattern: Find pending transactions for reconciliation
CREATE INDEX IF NOT EXISTS idx_transactions_pending_provider 
  ON transactions(status, payment_provider, created_at) 
  WHERE status IN ('pending', 'processing');

-- Query pattern: Find successful transactions by date range
CREATE INDEX IF NOT EXISTS idx_transactions_success_date_amount 
  ON transactions(status, created_at DESC, amount) 
  WHERE status = 'success';

-- Query pattern: Find transactions by package
CREATE INDEX IF NOT EXISTS idx_transactions_package_status 
  ON transactions(package_id, status, created_at DESC);

-- Chat Queue: Composite indexes for assignment algorithm
-- Query pattern: Find queue entries by priority and specialization
CREATE INDEX IF NOT EXISTS idx_queue_priority_tier_wait 
  ON chat_queue(priority_score DESC, user_tier, entered_queue_at ASC);

-- Query pattern: Find queue entries by user tier
CREATE INDEX IF NOT EXISTS idx_queue_tier_priority_entered 
  ON chat_queue(user_tier, priority_score DESC, entered_queue_at ASC);

-- Query pattern: Find queue entries with multiple attempts
CREATE INDEX IF NOT EXISTS idx_queue_attempts_entered 
  ON chat_queue(attempts, entered_queue_at ASC) 
  WHERE attempts > 0;

-- ============================================================================
-- PARTIAL INDEXES FOR SPECIFIC CONDITIONS
-- ============================================================================

-- Real Users: Partial indexes for specific states
-- Find banned users with active bans
CREATE INDEX IF NOT EXISTS idx_real_users_currently_banned 
  ON real_users(is_banned, banned_until, id) 
  WHERE is_banned = true AND (banned_until IS NULL OR banned_until > NOW());

-- Find verified users
CREATE INDEX IF NOT EXISTS idx_real_users_verified 
  ON real_users(is_verified, user_tier, created_at DESC) 
  WHERE is_verified = true AND deleted_at IS NULL;

-- Find users with high loyalty points
CREATE INDEX IF NOT EXISTS idx_real_users_high_loyalty 
  ON real_users(loyalty_points DESC, user_tier) 
  WHERE loyalty_points > 100 AND is_active = true;

-- Fictional Users: Partial indexes for active featured profiles
-- Find currently featured profiles
CREATE INDEX IF NOT EXISTS idx_fictional_currently_featured 
  ON fictional_users(featured_until, popularity_score DESC) 
  WHERE is_featured = true AND (featured_until IS NULL OR featured_until > NOW());

-- Find profiles with high conversion rates
CREATE INDEX IF NOT EXISTS idx_fictional_high_conversion 
  ON fictional_users(conversion_rate DESC, total_revenue DESC) 
  WHERE conversion_rate > 10 AND is_active = true;

-- Chats: Partial indexes for specific chat states
-- Find recently closed chats
CREATE INDEX IF NOT EXISTS idx_chats_recently_closed 
  ON chats(closed_at DESC, close_reason) 
  WHERE status = 'closed' AND closed_at > NOW() - INTERVAL '30 days';

-- Find chats with high credit spend
CREATE INDEX IF NOT EXISTS idx_chats_high_spend 
  ON chats(total_credits_spent DESC, real_user_id) 
  WHERE total_credits_spent > 100;

-- Find chats with low satisfaction ratings
CREATE INDEX IF NOT EXISTS idx_chats_low_satisfaction 
  ON chats(user_satisfaction_rating, assigned_operator_id, closed_at DESC) 
  WHERE user_satisfaction_rating IS NOT NULL AND user_satisfaction_rating <= 2;

-- Messages: Partial indexes for edited and flagged messages
-- Find edited messages
CREATE INDEX IF NOT EXISTS idx_messages_edited 
  ON messages(is_edited, edited_at DESC, chat_id) 
  WHERE is_edited = true;

-- Find messages with high toxicity
CREATE INDEX IF NOT EXISTS idx_messages_toxic 
  ON messages(toxicity_score DESC, created_at DESC) 
  WHERE toxicity_score > 0.7;

-- Find failed messages
CREATE INDEX IF NOT EXISTS idx_messages_failed 
  ON messages(status, created_at DESC, chat_id) 
  WHERE status = 'failed';

-- Operators: Partial indexes for suspended and inactive operators
-- Find currently suspended operators
CREATE INDEX IF NOT EXISTS idx_operators_currently_suspended 
  ON operators(suspended_until, suspension_reason) 
  WHERE is_suspended = true AND (suspended_until IS NULL OR suspended_until > NOW());

-- Find operators with high complaint rates
CREATE INDEX IF NOT EXISTS idx_operators_high_complaints 
  ON operators(user_complaints DESC, quality_score) 
  WHERE user_complaints > 5 AND is_active = true;

-- Transactions: Partial indexes for failed and review-needed transactions
-- Find failed transactions needing review
CREATE INDEX IF NOT EXISTS idx_transactions_failed_recent 
  ON transactions(created_at DESC, failure_reason) 
  WHERE status = 'failed' AND created_at > NOW() - INTERVAL '7 days';

-- Find transactions with high webhook counts (potential duplicates)
CREATE INDEX IF NOT EXISTS idx_transactions_high_webhook_count 
  ON transactions(webhook_received_count DESC, provider_reference) 
  WHERE webhook_received_count > 1;

-- Credit Refunds: Partial indexes for pending refunds
-- Find pending refunds
CREATE INDEX IF NOT EXISTS idx_refunds_pending 
  ON credit_refunds(created_at DESC, user_id) 
  WHERE status = 'pending';

-- Admin Notifications: Partial indexes for critical unread notifications
-- Find critical unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_critical_unread 
  ON admin_notifications(created_at DESC, type) 
  WHERE is_read = false AND priority = 'critical';

-- Banned Users Tracking: Partial indexes for active bans
-- Find permanent bans
CREATE INDEX IF NOT EXISTS idx_banned_permanent 
  ON banned_users_tracking(created_at DESC, user_id) 
  WHERE is_permanent = true;

-- Find temporary bans still active
CREATE INDEX IF NOT EXISTS idx_banned_temporary_active 
  ON banned_users_tracking(banned_until, user_id) 
  WHERE is_permanent = false AND banned_until > NOW();

-- Find users with circumvention attempts
CREATE INDEX IF NOT EXISTS idx_banned_circumvention 
  ON banned_users_tracking(circumvention_attempts DESC, last_attempt_at DESC) 
  WHERE circumvention_attempts > 0;

-- ============================================================================
-- GIN INDEXES FOR ARRAY COLUMNS
-- ============================================================================

-- Real Users: GIN indexes for array columns
-- Index for profile pictures array
CREATE INDEX IF NOT EXISTS idx_real_users_profile_pictures_gin 
  ON real_users USING GIN(profile_pictures);

-- Fictional Users: GIN indexes for array columns (some already exist)
-- Index for personality traits array
CREATE INDEX IF NOT EXISTS idx_fictional_personality_traits_gin 
  ON fictional_users USING GIN(personality_traits);

-- Index for interests array
CREATE INDEX IF NOT EXISTS idx_fictional_interests_gin 
  ON fictional_users USING GIN(interests);

-- Operators: GIN indexes for array columns (specializations already exists)
-- Index for languages array
CREATE INDEX IF NOT EXISTS idx_operators_languages_gin 
  ON operators USING GIN(languages);

-- Chats: GIN indexes for array columns
-- Index for flags array
CREATE INDEX IF NOT EXISTS idx_chats_flags_gin 
  ON chats USING GIN(flags);

-- Chat Queue: GIN indexes for array columns (required_specializations already exists)
-- Index for excluded operator IDs array
CREATE INDEX IF NOT EXISTS idx_queue_excluded_operators_gin 
  ON chat_queue USING GIN(excluded_operator_ids);

-- ============================================================================
-- INDEXES ON FOREIGN KEYS (NOT ALREADY INDEXED)
-- ============================================================================

-- Credit Refunds: Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_refunds_chat_id 
  ON credit_refunds(chat_id);

-- Message Edit History: Foreign key indexes
-- Note: message_id is not a foreign key but needs index for lookups
CREATE INDEX IF NOT EXISTS idx_edit_history_message_id 
  ON message_edit_history(message_id);

-- Banned Users Tracking: Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_banned_tracking_banned_by 
  ON banned_users_tracking(banned_by);

-- Admin Notifications: Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_notifications_read_by 
  ON admin_notifications(read_by);

-- ============================================================================
-- JSONB INDEXES FOR METADATA COLUMNS
-- ============================================================================

-- Transactions: GIN index for provider_response JSONB
CREATE INDEX IF NOT EXISTS idx_transactions_provider_response_gin 
  ON transactions USING GIN(provider_response);

-- Transactions: GIN index for package_snapshot JSONB
CREATE INDEX IF NOT EXISTS idx_transactions_package_snapshot_gin 
  ON transactions USING GIN(package_snapshot);

-- Fictional Users: GIN index for response_templates JSONB
CREATE INDEX IF NOT EXISTS idx_fictional_response_templates_gin 
  ON fictional_users USING GIN(response_templates);

-- Admins: GIN index for permissions JSONB
CREATE INDEX IF NOT EXISTS idx_admins_permissions_gin 
  ON admins USING GIN(permissions);

-- Real Users: GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_real_users_notification_prefs_gin 
  ON real_users USING GIN(notification_preferences);

CREATE INDEX IF NOT EXISTS idx_real_users_privacy_settings_gin 
  ON real_users USING GIN(privacy_settings);

-- Admin Notifications: GIN index for metadata JSONB
CREATE INDEX IF NOT EXISTS idx_notifications_metadata_gin 
  ON admin_notifications USING GIN(metadata);

-- User Activity Log: GIN index for metadata JSONB
CREATE INDEX IF NOT EXISTS idx_activity_metadata_gin 
  ON user_activity_log USING GIN(metadata);

-- Chat Queue: GIN index for user_lifetime_value queries
CREATE INDEX IF NOT EXISTS idx_queue_lifetime_value 
  ON chat_queue(user_lifetime_value DESC) 
  WHERE user_lifetime_value IS NOT NULL;

-- ============================================================================
-- COVERING INDEXES FOR COMMON QUERIES
-- ============================================================================

-- Real Users: Covering index for user list queries
CREATE INDEX IF NOT EXISTS idx_real_users_list_covering 
  ON real_users(created_at DESC, id, username, display_name, user_tier, credits) 
  WHERE deleted_at IS NULL;

-- Fictional Users: Covering index for profile discovery
CREATE INDEX IF NOT EXISTS idx_fictional_discovery_covering 
  ON fictional_users(popularity_score DESC, id, name, age, gender, location, is_featured) 
  WHERE is_active = true AND deleted_at IS NULL;

-- Chats: Covering index for chat list queries
CREATE INDEX IF NOT EXISTS idx_chats_list_covering 
  ON chats(last_message_at DESC, id, status, message_count, total_credits_spent) 
  WHERE status IN ('active', 'idle');

-- Operators: Covering index for operator dashboard
CREATE INDEX IF NOT EXISTS idx_operators_dashboard_covering 
  ON operators(quality_score DESC, id, name, current_chat_count, is_available, average_user_rating) 
  WHERE is_active = true AND deleted_at IS NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON INDEX idx_real_users_tier_location IS 'Composite index for finding active users by tier and location';
COMMENT ON INDEX idx_fictional_gender_featured_active IS 'Composite index for profile discovery by gender and featured status';
COMMENT ON INDEX idx_chats_operator_status_activity IS 'Composite index for operator chat monitoring';
COMMENT ON INDEX idx_messages_chat_sender_created IS 'Composite index for chat message history queries';
COMMENT ON INDEX idx_operators_available_quality_chats IS 'Composite index for operator assignment algorithm';
COMMENT ON INDEX idx_transactions_user_status_created IS 'Composite index for user transaction history';
COMMENT ON INDEX idx_queue_priority_tier_wait IS 'Composite index for chat queue priority sorting';
COMMENT ON INDEX idx_chats_idle_timeout IS 'Partial index for detecting idle chats needing auto-closure';
COMMENT ON INDEX idx_transactions_pending_provider IS 'Partial index for payment reconciliation queries';
COMMENT ON INDEX idx_fictional_personality_traits_gin IS 'GIN index for searching fictional profiles by personality traits';
COMMENT ON INDEX idx_operators_languages_gin IS 'GIN index for finding operators by language support';
COMMENT ON INDEX idx_chats_flags_gin IS 'GIN index for searching chats by flags';

-- ============================================================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ============================================================================

-- Update statistics for query planner optimization
ANALYZE real_users;
ANALYZE fictional_users;
ANALYZE chats;
ANALYZE messages;
ANALYZE operators;
ANALYZE admins;
ANALYZE transactions;
ANALYZE credit_packages;
ANALYZE chat_queue;
ANALYZE credit_refunds;
ANALYZE message_edit_history;
ANALYZE deleted_users;
ANALYZE banned_users_tracking;
ANALYZE user_activity_log;
ANALYZE admin_notifications;

