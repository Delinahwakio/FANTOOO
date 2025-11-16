# Row Level Security (RLS) Policies Documentation

## Overview

This document describes the Row Level Security (RLS) policies implemented for the Fantooo platform. RLS ensures that users can only access data they are authorized to see, enforcing security at the database level.

## Requirements

Based on Requirements 30.1-30.5 (Security and RLS Policies):

1. Real users can only access their own data, admins see all
2. Fictional profiles: public limited view, operators full view, admins manage
3. Chats: users see own, operators see assigned, admins see all
4. Messages: users see own chat messages, operators see assigned
5. Operators see own data, admins manage
6. Admins see own data, super_admins manage
7. Transactions: users see own, admins see all

## Helper Functions

The following helper functions are used throughout the RLS policies:

### `get_user_role()`
Returns the role of the current authenticated user: 'super_admin', 'admin', 'moderator', 'operator', 'real_user', or NULL.

### `is_admin()`
Returns `true` if the current user is an admin (any admin role).

### `is_super_admin()`
Returns `true` if the current user is a super admin.

### `is_operator()`
Returns `true` if the current user is an operator.

### `get_real_user_id()`
Returns the UUID of the current real user, or NULL if not a real user.

### `get_operator_id()`
Returns the UUID of the current operator, or NULL if not an operator.

### `get_admin_id()`
Returns the UUID of the current admin, or NULL if not an admin.

## Table-by-Table Policy Breakdown

### real_users

| Policy Name | Operation | Who | Description |
|------------|-----------|-----|-------------|
| `real_users_select_own` | SELECT | Real Users, Admins | Users can view their own profile, admins see all |
| `real_users_update_own` | UPDATE | Real Users | Users can update their own profile |
| `real_users_insert_own` | INSERT | Real Users | Users can create their own profile during registration |
| `real_users_update_admin` | UPDATE | Admins | Admins can update any user profile |
| `real_users_delete_admin` | DELETE | Admins | Only admins can delete user accounts |

### fictional_users

| Policy Name | Operation | Who | Description |
|------------|-----------|-----|-------------|
| `fictional_users_select_public` | SELECT | Everyone | Public can view active fictional profiles |
| `fictional_users_select_operator` | SELECT | Operators | Operators can view all fictional profiles |
| `fictional_users_select_admin` | SELECT | Admins | Admins can view all fictional profiles |
| `fictional_users_insert_admin` | INSERT | Admins | Only admins can create fictional profiles |
| `fictional_users_update_admin` | UPDATE | Admins | Only admins can update fictional profiles |
| `fictional_users_delete_admin` | DELETE | Admins | Only admins can delete fictional profiles |

### chats

| Policy Name | Operation | Who | Description |
|------------|-----------|-----|-------------|
| `chats_select_real_user` | SELECT | Real Users | Users can view their own chats |
| `chats_select_operator` | SELECT | Operators | Operators can view chats assigned to them |
| `chats_select_admin` | SELECT | Admins | Admins can view all chats |
| `chats_insert_real_user` | INSERT | Real Users | Users can create new chats |
| `chats_update_real_user` | UPDATE | Real Users | Users can update their own chats |
| `chats_update_operator` | UPDATE | Operators | Operators can update assigned chats |
| `chats_update_admin` | UPDATE | Admins | Admins can update any chat |
| `chats_delete_admin` | DELETE | Admins | Only admins can delete chats |

### messages

| Policy Name | Operation | Who | Description |
|------------|-----------|-----|-------------|
| `messages_select_real_user` | SELECT | Real Users | Users can view messages from their chats |
| `messages_select_operator` | SELECT | Operators | Operators can view messages from assigned chats |
| `messages_select_admin` | SELECT | Admins | Admins can view all messages |
| `messages_insert_real_user` | INSERT | Real Users | Users can send messages in their chats |
| `messages_insert_operator` | INSERT | Operators | Operators can send messages in assigned chats |
| `messages_update_operator` | UPDATE | Operators | Operators can update messages in assigned chats |
| `messages_update_admin` | UPDATE | Admins | Admins can update any message |
| `messages_delete_admin` | DELETE | Admins | Only admins can delete messages |

### operators

| Policy Name | Operation | Who | Description |
|------------|-----------|-----|-------------|
| `operators_select_own` | SELECT | Operators | Operators can view their own profile |
| `operators_select_admin` | SELECT | Admins | Admins can view all operators |
| `operators_update_own` | UPDATE | Operators | Operators can update their own profile |
| `operators_insert_admin` | INSERT | Admins | Only admins can create operator accounts |
| `operators_update_admin` | UPDATE | Admins | Admins can update any operator |
| `operators_delete_admin` | DELETE | Admins | Only admins can delete operators |

### admins

| Policy Name | Operation | Who | Description |
|------------|-----------|-----|-------------|
| `admins_select_own` | SELECT | Admins | Admins can view their own profile |
| `admins_select_super_admin` | SELECT | Super Admins | Super admins can view all admins |
| `admins_update_own` | UPDATE | Admins | Admins can update their own profile |
| `admins_insert_super_admin` | INSERT | Super Admins | Only super admins can create admin accounts |
| `admins_update_super_admin` | UPDATE | Super Admins | Super admins can update any admin |
| `admins_delete_super_admin` | DELETE | Super Admins | Only super admins can delete admins |

### transactions

| Policy Name | Operation | Who | Description |
|------------|-----------|-----|-------------|
| `transactions_select_real_user` | SELECT | Real Users | Users can view their own transactions |
| `transactions_select_admin` | SELECT | Admins | Admins can view all transactions |
| `transactions_insert_system` | INSERT | System | System can create transactions (via Edge Functions) |
| `transactions_update_admin` | UPDATE | Admins | Admins can update transactions for reconciliation |

### credit_packages

| Policy Name | Operation | Who | Description |
|------------|-----------|-----|-------------|
| `credit_packages_select_all` | SELECT | Everyone | Everyone can view active credit packages |
| `credit_packages_select_admin` | SELECT | Admins | Admins can view all credit packages |
| `credit_packages_insert_admin` | INSERT | Admins | Only admins can create credit packages |
| `credit_packages_update_admin` | UPDATE | Admins | Only admins can update credit packages |
| `credit_packages_delete_admin` | DELETE | Admins | Only admins can delete credit packages |

### credit_refunds

| Policy Name | Operation | Who | Description |
|------------|-----------|-----|-------------|
| `credit_refunds_select_real_user` | SELECT | Real Users | Users can view their own refunds |
| `credit_refunds_select_admin` | SELECT | Admins | Admins can view all refunds |
| `credit_refunds_insert_admin` | INSERT | Admins | Only admins can process refunds |
| `credit_refunds_update_admin` | UPDATE | Admins | Only admins can update refunds |

### message_edit_history

| Policy Name | Operation | Who | Description |
|------------|-----------|-----|-------------|
| `message_edit_history_select_admin` | SELECT | Admins | Admins can view all edit history |
| `message_edit_history_select_operator` | SELECT | Operators | Operators can view their own edit history |
| `message_edit_history_insert` | INSERT | Admins, Operators | Admins and operators can create edit history |

### deleted_users

| Policy Name | Operation | Who | Description |
|------------|-----------|-----|-------------|
| `deleted_users_select_admin` | SELECT | Admins | Only admins can view deleted users |
| `deleted_users_insert_system` | INSERT | System | System can archive deleted users |
| `deleted_users_update_admin` | UPDATE | Admins | Admins can update deleted user records |

### banned_users_tracking

| Policy Name | Operation | Who | Description |
|------------|-----------|-----|-------------|
| `banned_users_tracking_select_admin` | SELECT | Admins | Only admins can view banned users |
| `banned_users_tracking_insert_admin` | INSERT | Admins | Admins can create ban records |
| `banned_users_tracking_update_admin` | UPDATE | Admins | Admins can update ban records |
| `banned_users_tracking_update_system` | UPDATE | System | System can update circumvention attempts |

### user_activity_log

| Policy Name | Operation | Who | Description |
|------------|-----------|-----|-------------|
| `user_activity_log_select_real_user` | SELECT | Real Users | Users can view their own activity log |
| `user_activity_log_select_admin` | SELECT | Admins | Admins can view all activity logs |
| `user_activity_log_insert_system` | INSERT | System | System can log user activities |

### admin_notifications

| Policy Name | Operation | Who | Description |
|------------|-----------|-----|-------------|
| `admin_notifications_select_admin` | SELECT | Admins | Admins can view all notifications |
| `admin_notifications_insert_system` | INSERT | System | System can create notifications |
| `admin_notifications_update_admin` | UPDATE | Admins | Admins can update notifications |
| `admin_notifications_delete_admin` | DELETE | Admins | Admins can delete notifications |

### chat_queue

| Policy Name | Operation | Who | Description |
|------------|-----------|-----|-------------|
| `chat_queue_select_operator` | SELECT | Operators | Operators can view the chat queue |
| `chat_queue_select_admin` | SELECT | Admins | Admins can view the chat queue |
| `chat_queue_insert_system` | INSERT | System | System can add chats to queue |
| `chat_queue_update_system` | UPDATE | System | System can update queue entries |
| `chat_queue_delete_system` | DELETE | System | System can remove chats from queue |

## Security Considerations

### Authentication Required
All policies assume the user is authenticated via Supabase Auth. Unauthenticated users (anon role) can only:
- View active fictional profiles (public view)
- View active credit packages

### Service Role Bypass
The service role (used by Edge Functions) bypasses RLS policies. This is necessary for:
- Payment processing
- User deletion
- Automated tasks (chat timeout, escalation)
- System operations

### Performance
RLS policies are evaluated on every query. The helper functions use `SECURITY DEFINER` and `STABLE` to optimize performance by caching results within a transaction.

### Testing RLS Policies

To test RLS policies, you can use the following approach:

```sql
-- Test as a real user
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "user-auth-id"}';

-- Test as an operator
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "operator-auth-id"}';

-- Test as an admin
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "admin-auth-id"}';

-- Reset
RESET role;
```

## Maintenance

### Adding New Tables
When adding new tables:
1. Enable RLS: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. Create appropriate policies based on who should access the data
3. Test policies thoroughly
4. Update this documentation

### Modifying Policies
When modifying policies:
1. Test changes in development environment first
2. Verify no unintended access is granted or denied
3. Update this documentation
4. Deploy to production during low-traffic period

## Troubleshooting

### "permission denied for table X"
- Verify RLS is enabled on the table
- Check that appropriate policies exist for the user's role
- Verify the user is authenticated
- Check helper functions are working correctly

### "new row violates row-level security policy"
- Check INSERT/UPDATE policies have appropriate `WITH CHECK` clauses
- Verify the user has permission to perform the operation
- Check that foreign key references are accessible

### Performance Issues
- Review policy complexity
- Consider adding indexes on columns used in policy conditions
- Use `EXPLAIN ANALYZE` to identify slow queries
- Consider caching helper function results

## Migration File

The RLS policies are defined in:
- `supabase/migrations/20241116000005_create_rls_policies.sql`

## Related Requirements

- Requirement 30.1: Real users can only access their own data, admins see all
- Requirement 30.2: Fictional profiles: public limited view, operators full view, admins manage
- Requirement 30.3: Chats: users see own, operators see assigned, admins see all
- Requirement 30.4: Messages: users see own chat messages, operators see assigned
- Requirement 30.5: Operators see own data, admins manage
