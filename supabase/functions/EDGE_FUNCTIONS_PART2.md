# Edge Functions - Part 2: Payment and Automation

This document describes the Edge Functions created for payment processing and automated chat management.

## Overview

These Edge Functions handle:
1. **Payment Processing** - Webhook handling with idempotency
2. **Payment Reconciliation** - Manual payment verification and correction
3. **Auto-close Inactive Chats** - Scheduled cleanup of inactive chats
4. **Escalate Problematic Chats** - Automated escalation of problematic chats

## Functions

### 1. process-payment

**Purpose**: Process Paystack payment webhooks with idempotency

**Trigger**: Webhook from Paystack on payment events

**Key Features**:
- Webhook signature verification using HMAC SHA-512
- Idempotency checking by provider_reference
- Duplicate webhook handling (increments counter without reprocessing)
- Transaction safety with database transactions
- Automatic credit addition on successful payment
- Failed payment logging
- Manual review flagging on errors

**Environment Variables Required**:
- `PAYSTACK_SECRET_KEY` - For webhook signature verification
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database access

**Request Format**:
```json
{
  "event": "charge.success",
  "data": {
    "reference": "unique-transaction-ref",
    "status": "success",
    "amount": 40000,
    "currency": "KES",
    "metadata": {
      "userId": "uuid",
      "packageId": "uuid",
      "credits": 50
    }
  }
}
```

**Response Format**:
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "transaction": {
    "id": "uuid",
    "credits": 50
  }
}
```

**Error Handling**:
- Returns 401 for invalid signature
- Returns 400 for missing metadata
- Returns 200 even on errors to prevent Paystack retry
- Flags transactions for manual review on credit addition failure

**Deployment**:
```bash
supabase functions deploy process-payment
```

**Webhook URL**: `https://<project-ref>.supabase.co/functions/v1/process-payment`

---

### 2. reconcile-payments

**Purpose**: Manually reconcile failed or stuck payments by verifying with Paystack API

**Trigger**: Admin-initiated via API call

**Key Features**:
- Admin authentication and permission checking
- Paystack API verification
- Automatic credit addition if Paystack shows success
- Transaction status synchronization
- Audit trail with admin ID and timestamp

**Environment Variables Required**:
- `PAYSTACK_SECRET_KEY` - For Paystack API calls
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database access

**Request Format**:
```json
{
  "transactionId": "uuid"
}
```

**Headers Required**:
```
Authorization: Bearer <user-jwt-token>
```

**Response Format**:
```json
{
  "success": true,
  "message": "Transaction reconciled successfully",
  "transaction": {
    "id": "uuid",
    "reference": "paystack-ref",
    "credits": 50,
    "status": "success"
  }
}
```

**Permissions Required**:
- User must be an active admin
- Admin must have `manage_payments` permission

**Deployment**:
```bash
supabase functions deploy reconcile-payments
```

**API Endpoint**: `https://<project-ref>.supabase.co/functions/v1/reconcile-payments`

---

### 3. auto-close-inactive-chats

**Purpose**: Automatically close chats with no activity for 24 hours

**Trigger**: Scheduled cron job (hourly)

**Key Features**:
- Finds active chats with last_message_at > 24 hours ago
- Closes chats with reason "inactivity_timeout"
- Logs activity for each closed chat
- Creates admin notification if many chats closed (>10)
- Error notification on failure

**Environment Variables Required**:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database access
- `CRON_SECRET` (optional) - Secret for cron job authentication

**Request Format**:
No body required (GET or POST)

**Headers Required** (if CRON_SECRET is set):
```
Authorization: Bearer <cron-secret>
```

**Response Format**:
```json
{
  "success": true,
  "message": "Successfully closed 5 inactive chats",
  "closedCount": 5,
  "chatIds": ["uuid1", "uuid2", "uuid3", "uuid4", "uuid5"]
}
```

**Schedule**: Hourly (0 * * * *)

**Deployment**:
```bash
supabase functions deploy auto-close-inactive-chats
```

**Cron Configuration** (vercel.json):
```json
{
  "crons": [
    {
      "path": "/api/cron/auto-close-chats",
      "schedule": "0 * * * *"
    }
  ]
}
```

---

### 4. escalate-problematic-chats

**Purpose**: Automatically escalate chats that need admin attention

**Trigger**: Scheduled cron job (every 15 minutes)

**Key Features**:
- Escalates chats with max reassignments (≥3)
- Escalates chats with operator idle >10 minutes
- Escalates chats stuck in queue >30 minutes
- Creates high-priority admin notifications
- Increments operator idle incidents
- Logs all escalations

**Environment Variables Required**:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database access
- `CRON_SECRET` (optional) - Secret for cron job authentication

**Request Format**:
No body required (GET or POST)

**Headers Required** (if CRON_SECRET is set):
```
Authorization: Bearer <cron-secret>
```

**Response Format**:
```json
{
  "success": true,
  "message": "Escalated 3 problematic chats",
  "escalatedCount": 3,
  "chatIds": ["uuid1", "uuid2", "uuid3"],
  "breakdown": {
    "maxReassignments": 1,
    "operatorIdle": 1,
    "queueTimeout": 1
  }
}
```

**Escalation Criteria**:
1. **Max Reassignments**: assignment_count ≥ 3
2. **Operator Idle**: last_operator_activity > 10 minutes AND user sent recent message
3. **Queue Timeout**: In queue for >30 minutes with ≥3 attempts

**Schedule**: Every 15 minutes (*/15 * * * *)

**Deployment**:
```bash
supabase functions deploy escalate-problematic-chats
```

**Cron Configuration** (vercel.json):
```json
{
  "crons": [
    {
      "path": "/api/cron/escalate-chats",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

---

## Database Functions

These Edge Functions rely on the following database functions:

### add_credits_to_user
```sql
add_credits_to_user(
  p_user_id UUID,
  p_credits INTEGER,
  p_transaction_id UUID
)
```
Adds credits to user account and logs the activity.

### check_and_deduct_credits
```sql
check_and_deduct_credits(
  p_user_id UUID,
  p_credits_required INTEGER,
  p_chat_id UUID,
  p_message_id UUID
)
```
Checks if user has enough credits and deducts them with row locking.

### refund_credits_to_user
```sql
refund_credits_to_user(
  p_user_id UUID,
  p_credits INTEGER,
  p_reason TEXT,
  p_admin_id UUID,
  p_notes TEXT DEFAULT NULL
)
```
Refunds credits to user with audit trail.

### calculate_user_refund
```sql
calculate_user_refund(p_user_id UUID)
```
Calculates refund amount for user account deletion.

---

## Testing

### Test process-payment locally:
```bash
curl -X POST http://localhost:54321/functions/v1/process-payment \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: <test-signature>" \
  -d '{
    "event": "charge.success",
    "data": {
      "reference": "test-ref-123",
      "status": "success",
      "amount": 40000,
      "metadata": {
        "userId": "test-user-id",
        "credits": 50
      }
    }
  }'
```

### Test reconcile-payments locally:
```bash
curl -X POST http://localhost:54321/functions/v1/reconcile-payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-jwt-token>" \
  -d '{
    "transactionId": "test-transaction-id"
  }'
```

### Test auto-close-inactive-chats locally:
```bash
curl -X POST http://localhost:54321/functions/v1/auto-close-inactive-chats \
  -H "Authorization: Bearer <cron-secret>"
```

### Test escalate-problematic-chats locally:
```bash
curl -X POST http://localhost:54321/functions/v1/escalate-problematic-chats \
  -H "Authorization: Bearer <cron-secret>"
```

---

## Deployment Checklist

- [ ] Set environment variables in Supabase dashboard
- [ ] Deploy all Edge Functions
- [ ] Apply database migration for helper functions
- [ ] Configure Paystack webhook URL
- [ ] Set up cron jobs in Vercel
- [ ] Test webhook with Paystack test mode
- [ ] Test reconciliation with admin account
- [ ] Verify cron jobs execute on schedule
- [ ] Monitor admin notifications for escalations

---

## Monitoring

### Key Metrics to Monitor:
1. **Payment Processing**:
   - Webhook success rate
   - Duplicate webhook count
   - Failed payment count
   - Manual review queue size

2. **Auto-close**:
   - Chats closed per hour
   - Average chat duration before closure

3. **Escalation**:
   - Escalated chats per day
   - Escalation reasons breakdown
   - Operator idle incidents

### Admin Notifications:
- System errors create high/critical priority notifications
- Many auto-closed chats (>10) creates normal priority notification
- All escalations create high priority notifications

---

## Requirements Satisfied

### Requirement 5.1-5.5 (Credit System)
✅ Payment webhook processing with idempotency
✅ Credit addition after successful payment
✅ Transaction logging and audit trail

### Requirement 10.1-10.5 (Chat Timeout)
✅ Auto-close inactive chats after 24 hours
✅ Close reason tracking
✅ Activity logging

### Requirement 17.1-17.5 (Payment Reconciliation)
✅ Manual payment verification with Paystack API
✅ Automatic credit addition on reconciliation
✅ Admin audit trail
✅ Failed payment dashboard support

### Requirement 9.1-9.5 (Chat Reassignment)
✅ Escalation of chats with max reassignments
✅ Admin notification on escalation
✅ Reassignment loop prevention

### Requirement 16.1-16.5 (Payment Idempotency)
✅ Duplicate webhook detection
✅ Idempotency by provider_reference
✅ Webhook count tracking
