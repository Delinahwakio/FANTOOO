# Database Triggers and Constraints Documentation

This document describes the database triggers and constraints implemented in migration `20241116000004_create_triggers_and_constraints.sql`.

## Overview

This migration implements critical business logic triggers and functions to ensure data integrity, prevent race conditions, and automate platform operations.

## Triggers Implemented

### 1. Prevent Last Super Admin Deletion

**Trigger Name:** `trigger_prevent_last_super_admin_deletion`  
**Function:** `prevent_last_super_admin_deletion()`  
**Requirements:** 1.1-1.5 (Admin Bootstrap System)

**Purpose:** Ensures the platform always has at least one super_admin account.

**Behavior:**
- Prevents deletion (soft delete via `deleted_at`) of the last super_admin
- Raises an exception if attempting to delete the last super_admin
- Allows deletion of super_admins when multiple exist

**Example:**
```sql
-- This will fail if it's the last super_admin
UPDATE admins 
SET deleted_at = NOW() 
WHERE id = 'last-super-admin-id';
-- Error: Cannot delete the last super_admin. At least one super_admin must exist.
```

---

### 2. Handle Fictional User Deletion

**Trigger Name:** `trigger_handle_fictional_user_deletion`  
**Function:** `handle_fictional_user_deletion()`  
**Requirements:** 3.1-3.5 (Fictional Profile Management)

**Purpose:** Automatically closes all active chats when a fictional user is deleted.

**Behavior:**
- Closes all active/idle chats associated with the deleted fictional user
- Sets `close_reason` to 'fictional_profile_deleted'
- Creates admin notification if chats were affected
- Logs the number of affected chats

**Example:**
```sql
-- Delete fictional user
UPDATE fictional_users 
SET deleted_at = NOW() 
WHERE id = 'fictional-user-id';
-- All active chats with this fictional user are automatically closed
```

---

### 3. Prevent Operator Going Offline With Active Chats

**Trigger Name:** `trigger_prevent_operator_offline_with_active_chats`  
**Function:** `prevent_operator_offline_with_active_chats()`  
**Requirements:** 11.1-11.5 (Operator Availability Management)

**Purpose:** Prevents operators from going offline when they have active chats.

**Behavior:**
- Checks for active chats when operator tries to set `is_available = false`
- Raises an exception if active chats exist
- Allows going offline only when all chats are closed or reassigned

**Example:**
```sql
-- This will fail if operator has active chats
UPDATE operators 
SET is_available = false 
WHERE id = 'operator-id';
-- Error: Cannot go offline with 3 active chat(s). Please close or reassign all active chats first.
```

---

### 4. Handle Operator Deletion

**Trigger Name:** `trigger_handle_operator_deletion`  
**Function:** `handle_operator_deletion()`  
**Requirements:** 15.1-15.5 (Operator Account Deletion)

**Purpose:** Validates operator deletion and ensures no active chats exist.

**Behavior:**
- Checks for active chats when operator is being deleted
- Prevents deletion if active chats exist
- Forces operator offline (`is_available = false`) on successful deletion
- Logs the deletion

**Example:**
```sql
-- This will fail if operator has active chats
UPDATE operators 
SET deleted_at = NOW() 
WHERE id = 'operator-id';
-- Error: Cannot delete operator with 2 active chat(s). Please reassign or close all active chats first.
```

---

### 5. Auto-Suspend Operators With Low Quality Scores

**Trigger Name:** `trigger_auto_suspend_low_quality_operators`  
**Function:** `auto_suspend_low_quality_operators()`  
**Requirements:** 12.1-12.5 (Operator Performance Monitoring)

**Purpose:** Automatically suspends operators when quality score drops below threshold.

**Behavior:**
- Monitors `quality_score` updates
- Auto-suspends when score drops below `quality_threshold` (default: 60)
- Sets suspension duration to 7 days
- Forces operator offline
- Creates high-priority admin notification
- Auto-reactivates when score improves and suspension period ends

**Example:**
```sql
-- Lower quality score below threshold
UPDATE operators 
SET quality_score = 50 
WHERE id = 'operator-id';
-- Operator is automatically suspended for 7 days
-- Admin notification created
```

---

### 6. Prevent Duplicate Transaction Processing

**Trigger Name:** `trigger_prevent_duplicate_transaction_processing`  
**Function:** `prevent_duplicate_transaction_processing()`  
**Requirements:** 16.1-16.5 (Payment Webhook Idempotency)

**Purpose:** Prevents duplicate payment processing via provider_reference.

**Behavior:**
- Checks for existing transactions with same `provider_reference` on INSERT
- Raises exception if duplicate with 'success' status exists
- Logs warning for pending/processing duplicates
- Ensures payment idempotency

**Example:**
```sql
-- First transaction succeeds
INSERT INTO transactions (real_user_id, type, amount, credits_amount, provider_reference, status)
VALUES ('user-id', 'purchase', 100.00, 10, 'PAYSTACK_REF_123', 'success');

-- Duplicate attempt fails
INSERT INTO transactions (real_user_id, type, amount, credits_amount, provider_reference, status)
VALUES ('user-id', 'purchase', 100.00, 10, 'PAYSTACK_REF_123', 'success');
-- Error: Duplicate transaction detected. Transaction with provider_reference "PAYSTACK_REF_123" already exists
```

---

## Functions Implemented

### 1. Check and Deduct Message Credits

**Function Name:** `check_and_deduct_message_credits(p_user_id, p_credits_required, p_chat_id, p_message_content)`  
**Requirements:** 7.1-7.5 (Race Condition Prevention)

**Purpose:** Atomically checks and deducts credits with row locking to prevent race conditions.

**Parameters:**
- `p_user_id` (UUID): User ID
- `p_credits_required` (INTEGER): Credits to deduct
- `p_chat_id` (UUID): Chat ID
- `p_message_content` (TEXT): Message content (for logging)

**Returns:** JSONB with result
```json
{
  "success": true,
  "credits_deducted": 10,
  "previous_balance": 100,
  "new_balance": 90,
  "message": "Credits deducted successfully"
}
```

**Behavior:**
- Uses `SELECT FOR UPDATE` to lock user row
- Checks if user has sufficient credits
- Deducts credits atomically within transaction
- Updates chat statistics
- Returns detailed result with error codes

**Example:**
```sql
-- Deduct 10 credits for a message
SELECT check_and_deduct_message_credits(
  'user-id'::UUID,
  10,
  'chat-id'::UUID,
  'Hello!'
);
```

**Error Codes:**
- `USER_NOT_FOUND`: User doesn't exist
- `INSUFFICIENT_CREDITS`: Not enough credits
- `TRANSACTION_FAILED`: Database error

---

### 2. Calculate Message Cost

**Function Name:** `calculate_message_cost(p_chat_id, p_fictional_user_id, p_message_number, p_timezone)`  
**Requirements:** 6.1-6.5 (Message Cost Calculation)

**Purpose:** Calculates message cost based on time of day, profile type, and message number.

**Parameters:**
- `p_chat_id` (UUID): Chat ID
- `p_fictional_user_id` (UUID): Fictional user ID
- `p_message_number` (INTEGER): Message number in chat
- `p_timezone` (TEXT): Timezone (default: 'Africa/Nairobi')

**Returns:** INTEGER (credits)

**Pricing Rules:**
1. **Free Messages:** First 3 messages are free (returns 0)
2. **Base Cost:** 1 credit per message (after free messages)
3. **Time Multipliers (EAT timezone):**
   - Peak hours (8pm-2am): 1.2x multiplier
   - Off-peak hours (2am-8am): 0.8x multiplier
   - Normal hours (8am-8pm): 1.0x multiplier
4. **Featured Multiplier:** Featured profiles have 1.5x multiplier
5. **Minimum:** Always at least 1 credit for paid messages

**Example:**
```sql
-- Calculate cost for 4th message to non-featured profile during normal hours
SELECT calculate_message_cost(
  'chat-id'::UUID,
  'fictional-user-id'::UUID,
  4,
  'Africa/Nairobi'
);
-- Returns: 1 (base cost)

-- Calculate cost for 4th message to featured profile during peak hours
SELECT calculate_message_cost(
  'chat-id'::UUID,
  'featured-fictional-user-id'::UUID,
  4,
  'Africa/Nairobi'
);
-- Returns: 2 (1 * 1.2 * 1.5 = 1.8, rounded up to 2)
```

---

## Testing

A comprehensive test suite is provided in `20241116000004_test_triggers.sql`.

### Running Tests

```bash
# Apply the main migration first
supabase migration up

# Run the test suite
psql -h localhost -U postgres -d postgres -f supabase/migrations/20241116000004_test_triggers.sql
```

### Test Coverage

The test suite covers:
1. ✓ Prevent last super_admin deletion
2. ✓ Handle fictional user deletion (close chats)
3. ✓ Prevent operator going offline with active chats
4. ✓ Handle operator deletion validation
5. ✓ Auto-suspend operators with low quality scores
6. ✓ Prevent duplicate transaction processing
7. ✓ Check and deduct message credits function
8. ✓ Calculate message cost function

---

## Usage Examples

### Sending a Message with Credit Deduction

```sql
-- 1. Calculate message cost
SELECT calculate_message_cost(
  chat_id,
  fictional_user_id,
  message_number,
  'Africa/Nairobi'
) AS cost;

-- 2. Check and deduct credits
SELECT check_and_deduct_message_credits(
  user_id,
  cost,
  chat_id,
  message_content
) AS result;

-- 3. Insert message if successful
INSERT INTO messages (chat_id, sender_type, content, credits_charged, is_free_message)
VALUES (chat_id, 'real', message_content, cost, cost = 0);
```

### Managing Operator Quality

```sql
-- Update operator quality score (auto-suspension will trigger if below threshold)
UPDATE operators
SET quality_score = 55
WHERE id = 'operator-id';
-- Operator is automatically suspended if score < quality_threshold
```

### Safe Operator Deletion

```sql
-- 1. Check for active chats
SELECT COUNT(*) FROM chats 
WHERE assigned_operator_id = 'operator-id' 
AND status = 'active';

-- 2. Close or reassign all active chats first
UPDATE chats 
SET status = 'closed', close_reason = 'operator_leaving'
WHERE assigned_operator_id = 'operator-id' 
AND status = 'active';

-- 3. Now delete operator (will succeed)
UPDATE operators 
SET deleted_at = NOW() 
WHERE id = 'operator-id';
```

---

## Performance Considerations

1. **Row Locking:** `check_and_deduct_message_credits` uses `SELECT FOR UPDATE` which locks rows. Keep transactions short.

2. **Trigger Overhead:** Triggers add minimal overhead but are executed on every relevant operation. Monitor performance in production.

3. **Admin Notifications:** Auto-suspension creates admin notifications. Consider archiving old notifications periodically.

4. **Indexes:** Ensure proper indexes exist on:
   - `chats.assigned_operator_id` and `chats.status`
   - `operators.quality_score`
   - `transactions.provider_reference`

---

## Troubleshooting

### Common Issues

**Issue:** "Cannot delete the last super_admin"  
**Solution:** Create another super_admin before deleting the current one.

**Issue:** "Cannot go offline with active chats"  
**Solution:** Close or reassign all active chats before going offline.

**Issue:** "Duplicate transaction detected"  
**Solution:** This is expected behavior for idempotency. Check if the original transaction succeeded.

**Issue:** Operator auto-suspended unexpectedly  
**Solution:** Check quality_score and quality_threshold. Review performance metrics.

---

## Migration Verification

After applying the migration, verify all triggers and functions are created:

```sql
-- Check triggers
SELECT tgname, tgrelid::regclass, tgenabled 
FROM pg_trigger 
WHERE tgname LIKE 'trigger_%'
ORDER BY tgname;

-- Check functions
SELECT proname, pronargs 
FROM pg_proc 
WHERE proname IN (
  'prevent_last_super_admin_deletion',
  'handle_fictional_user_deletion',
  'prevent_operator_offline_with_active_chats',
  'handle_operator_deletion',
  'auto_suspend_low_quality_operators',
  'prevent_duplicate_transaction_processing',
  'check_and_deduct_message_credits',
  'calculate_message_cost'
)
ORDER BY proname;
```

Expected output: 6 triggers and 8 functions.

---

## Next Steps

After applying this migration:

1. ✓ Test all triggers with the provided test suite
2. Apply RLS policies (next migration)
3. Create Edge Functions for complex operations
4. Set up monitoring for trigger performance
5. Document trigger behavior in API documentation

---

## Requirements Satisfied

This migration satisfies the following requirements:

- **1.1-1.5**: Admin Bootstrap System - Prevent last super_admin deletion
- **3.1-3.5**: Fictional Profiles - Handle fictional user deletion
- **6.1-6.5**: Message Cost Calculation - Calculate message cost function
- **7.1-7.5**: Race Condition Prevention - Credit deduction with row locking
- **11.1-11.5**: Operator Availability - Prevent offline with active chats
- **12.1-12.5**: Operator Performance - Auto-suspend low quality operators
- **15.1-15.5**: Operator Deletion - Validate deletion with active chat check
- **16.1-16.5**: Payment Idempotency - Prevent duplicate transactions

---

## Support

For issues or questions about these triggers:
1. Review the test suite for usage examples
2. Check the troubleshooting section
3. Verify trigger execution with `RAISE NOTICE` statements
4. Review PostgreSQL logs for detailed error messages
