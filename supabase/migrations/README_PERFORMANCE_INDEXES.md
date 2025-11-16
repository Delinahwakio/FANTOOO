# Performance Indexes Documentation

## Overview

This document describes the performance optimization indexes created in migration `20241116000009_create_performance_indexes.sql`. These indexes are designed to optimize query performance across all features of the Fantooo platform.

## Index Categories

### 1. Composite Indexes

Composite indexes combine multiple columns to optimize queries that filter or sort by multiple fields.

#### Real Users Table

- **idx_real_users_tier_location**: Optimizes queries finding active users by tier and location
- **idx_real_users_gender_location**: Optimizes profile matching queries by gender and location
- **idx_real_users_active_tier_spent**: Optimizes analytics queries for user segmentation
- **idx_real_users_low_credits**: Optimizes queries for users needing credit notifications

#### Fictional Users Table

- **idx_fictional_gender_featured_active**: Optimizes profile discovery by gender and featured status
- **idx_fictional_location_gender**: Optimizes location-based profile searches
- **idx_fictional_category_rating**: Optimizes queries for top-rated profiles by category
- **idx_fictional_style_concurrent**: Optimizes queries for profile availability by response style

#### Chats Table

- **idx_chats_operator_status_activity**: Optimizes operator dashboard queries for active chats
- **idx_chats_user_status_created**: Optimizes user chat history queries
- **idx_chats_idle_timeout**: Optimizes detection of idle chats for auto-closure
- **idx_chats_fictional_status_activity**: Optimizes queries for fictional profile chat activity
- **idx_chats_unassigned**: Optimizes queries for chats needing operator assignment
- **idx_chats_assignment_count_status**: Optimizes escalation detection queries

#### Messages Table

- **idx_messages_chat_sender_created**: Optimizes chat history queries by sender type
- **idx_messages_chat_free_created**: Optimizes queries distinguishing free vs paid messages
- **idx_messages_operator_date**: Optimizes operator performance tracking queries
- **idx_messages_content_type_chat**: Optimizes queries filtering by media type

#### Operators Table

- **idx_operators_available_quality_chats**: Optimizes operator assignment algorithm queries
- **idx_operators_skill_available**: Optimizes queries for finding operators by skill level
- **idx_operators_low_quality**: Optimizes queries for performance review identification
- **idx_operators_workload**: Optimizes workload balancing queries

#### Transactions Table

- **idx_transactions_user_status_created**: Optimizes user transaction history queries
- **idx_transactions_pending_provider**: Optimizes payment reconciliation queries
- **idx_transactions_success_date_amount**: Optimizes revenue reporting queries
- **idx_transactions_package_status**: Optimizes package performance analysis

#### Chat Queue Table

- **idx_queue_priority_tier_wait**: Optimizes priority-based queue sorting
- **idx_queue_tier_priority_entered**: Optimizes tier-based assignment queries
- **idx_queue_attempts_entered**: Optimizes queries for chats with multiple assignment attempts

### 2. Partial Indexes

Partial indexes include a WHERE clause to index only specific rows, reducing index size and improving performance for targeted queries.

#### Real Users Table

- **idx_real_users_currently_banned**: Indexes only currently banned users
- **idx_real_users_verified**: Indexes only verified users
- **idx_real_users_high_loyalty**: Indexes users with high loyalty points

#### Fictional Users Table

- **idx_fictional_currently_featured**: Indexes only currently featured profiles
- **idx_fictional_high_conversion**: Indexes profiles with high conversion rates

#### Chats Table

- **idx_chats_recently_closed**: Indexes chats closed in the last 30 days
- **idx_chats_high_spend**: Indexes chats with high credit expenditure
- **idx_chats_low_satisfaction**: Indexes chats with low user satisfaction ratings

#### Messages Table

- **idx_messages_edited**: Indexes only edited messages
- **idx_messages_toxic**: Indexes messages with high toxicity scores
- **idx_messages_failed**: Indexes failed message deliveries

#### Operators Table

- **idx_operators_currently_suspended**: Indexes currently suspended operators
- **idx_operators_high_complaints**: Indexes operators with high complaint counts

#### Transactions Table

- **idx_transactions_failed_recent**: Indexes recent failed transactions
- **idx_transactions_high_webhook_count**: Indexes transactions with duplicate webhook deliveries

#### Other Tables

- **idx_refunds_pending**: Indexes pending credit refunds
- **idx_notifications_critical_unread**: Indexes critical unread admin notifications
- **idx_banned_permanent**: Indexes permanent bans
- **idx_banned_temporary_active**: Indexes active temporary bans
- **idx_banned_circumvention**: Indexes users with circumvention attempts

### 3. GIN Indexes

GIN (Generalized Inverted Index) indexes are optimized for array and JSONB columns, enabling efficient searches within these data types.

#### Array Column Indexes

- **idx_real_users_profile_pictures_gin**: Enables searches within user profile pictures array
- **idx_fictional_personality_traits_gin**: Enables searches by personality traits
- **idx_fictional_interests_gin**: Enables searches by interests
- **idx_operators_languages_gin**: Enables finding operators by language support
- **idx_chats_flags_gin**: Enables searching chats by flags
- **idx_queue_excluded_operators_gin**: Enables checking excluded operators in queue

#### JSONB Column Indexes

- **idx_transactions_provider_response_gin**: Enables searching payment provider responses
- **idx_transactions_package_snapshot_gin**: Enables searching package details
- **idx_fictional_response_templates_gin**: Enables searching response templates
- **idx_admins_permissions_gin**: Enables searching admin permissions
- **idx_real_users_notification_prefs_gin**: Enables searching notification preferences
- **idx_real_users_privacy_settings_gin**: Enables searching privacy settings
- **idx_notifications_metadata_gin**: Enables searching notification metadata
- **idx_activity_metadata_gin**: Enables searching activity log metadata

### 4. Foreign Key Indexes

Indexes on foreign key columns to optimize JOIN operations and referential integrity checks.

- **idx_refunds_chat_id**: Optimizes refund lookups by chat
- **idx_edit_history_message_id**: Optimizes message edit history lookups
- **idx_banned_tracking_banned_by**: Optimizes queries for bans by admin
- **idx_notifications_read_by**: Optimizes queries for notifications read by admin

### 5. Covering Indexes

Covering indexes include additional columns beyond the search criteria to avoid table lookups.

- **idx_real_users_list_covering**: Covers common user list query columns
- **idx_fictional_discovery_covering**: Covers profile discovery query columns
- **idx_chats_list_covering**: Covers chat list query columns
- **idx_operators_dashboard_covering**: Covers operator dashboard query columns

## Performance Benefits

### Query Optimization

1. **Reduced Table Scans**: Indexes eliminate full table scans for filtered queries
2. **Faster Sorting**: Indexes on DESC columns enable efficient ORDER BY operations
3. **Efficient Joins**: Foreign key indexes speed up JOIN operations
4. **Array Searches**: GIN indexes enable fast containment searches in arrays
5. **JSONB Queries**: GIN indexes on JSONB columns enable efficient key-value searches

### Index Size Optimization

1. **Partial Indexes**: Reduce index size by indexing only relevant rows
2. **Selective Indexing**: WHERE clauses in partial indexes minimize storage overhead
3. **Targeted Coverage**: Covering indexes reduce the need for table lookups

### Specific Use Cases

#### Operator Assignment Algorithm
- Uses `idx_operators_available_quality_chats` for finding best available operator
- Uses `idx_queue_priority_tier_wait` for priority-based queue sorting
- Uses `idx_operators_specializations` (GIN) for skill matching

#### Chat Monitoring
- Uses `idx_chats_operator_status_activity` for operator dashboard
- Uses `idx_chats_idle_timeout` for auto-closure detection
- Uses `idx_chats_escalated` for admin escalation queue

#### Payment Processing
- Uses `idx_transactions_reference` for idempotency checks
- Uses `idx_transactions_pending_provider` for reconciliation
- Uses `idx_transactions_high_webhook_count` for duplicate detection

#### Profile Discovery
- Uses `idx_fictional_gender_featured_active` for filtered searches
- Uses `idx_fictional_discovery_covering` for list queries
- Uses `idx_fictional_tags` (GIN) for tag-based searches

#### Analytics and Reporting
- Uses `idx_real_users_active_tier_spent` for user segmentation
- Uses `idx_transactions_success_date_amount` for revenue reports
- Uses `idx_operators_dashboard_covering` for performance metrics

## Maintenance

### Statistics Updates

The migration includes `ANALYZE` commands to update table statistics for the query planner:

```sql
ANALYZE real_users;
ANALYZE fictional_users;
ANALYZE chats;
-- ... etc
```

### Recommended Maintenance Schedule

1. **Daily**: Auto-vacuum handles most maintenance automatically
2. **Weekly**: Run `ANALYZE` on high-traffic tables
3. **Monthly**: Review slow query logs and consider additional indexes
4. **Quarterly**: Review index usage statistics and remove unused indexes

### Monitoring Index Usage

Query to check index usage:

```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

Query to find unused indexes:

```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public'
  AND indexrelname NOT LIKE 'pg_toast%'
ORDER BY pg_relation_size(indexrelid) DESC;
```

## Index Naming Convention

All indexes follow a consistent naming pattern:

- **idx_[table]_[columns]**: Standard index
- **idx_[table]_[columns]_gin**: GIN index
- **idx_[table]_[purpose]**: Descriptive purpose-based name

## Requirements Coverage

This migration addresses the following requirements:

- **Performance Optimization**: All features benefit from optimized queries
- **Requirement 4.1-4.5**: Real-time chat performance
- **Requirement 8.1-8.5**: Operator assignment efficiency
- **Requirement 16.1-16.5**: Payment idempotency checks
- **Requirement 27.1-27.5**: Analytics query performance
- **Requirement 29.1-29.5**: Partitioned table performance

## Testing Recommendations

1. **Load Testing**: Test query performance under load with realistic data volumes
2. **Query Plans**: Use `EXPLAIN ANALYZE` to verify index usage
3. **Benchmark**: Compare query times before and after index creation
4. **Monitor**: Track index usage statistics in production

## Notes

- All indexes use `IF NOT EXISTS` to allow safe re-running of the migration
- Indexes are created with appropriate WHERE clauses for partial indexes
- GIN indexes are used for array and JSONB columns
- Covering indexes include frequently accessed columns to avoid table lookups
- The migration ends with ANALYZE commands to update query planner statistics

