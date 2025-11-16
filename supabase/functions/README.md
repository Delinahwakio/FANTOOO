# Supabase Edge Functions

This directory contains Supabase Edge Functions for the Fantooo platform. These serverless functions handle critical backend operations that require elevated privileges or complex business logic.

## Functions Overview

### 1. bootstrap-first-admin
**Purpose**: One-time setup function to create the first super admin account.

**Endpoint**: `POST /functions/v1/bootstrap-first-admin`

**Request Body**:
```json
{
  "name": "Admin Name",
  "email": "admin@example.com",
  "password": "SecurePassword123!",
  "setupToken": "your-setup-token"
}
```

**Response**:
```json
{
  "success": true,
  "admin": {
    "id": "uuid",
    "name": "Admin Name",
    "email": "admin@example.com",
    "role": "super_admin"
  },
  "message": "Super admin account created successfully"
}
```

**Requirements**:
- Setup token must match `ADMIN_SETUP_TOKEN` environment variable
- Can only be run once (fails if any admin already exists)
- Creates auth user and admin record with full permissions
- Requirements: 1.1-1.5 (Admin Bootstrap System)

**Environment Variables**:
- `ADMIN_SETUP_TOKEN`: Secret token for initial setup

---

### 2. delete-user-account
**Purpose**: GDPR-compliant user account deletion with data anonymization and refund processing.

**Endpoint**: `POST /functions/v1/delete-user-account`

**Request Body**:
```json
{
  "userId": "uuid",
  "reason": "user_requested",
  "requestedBy": "admin-id or 'self'"
}
```

**Response**:
```json
{
  "success": true,
  "refundAmount": 500,
  "refundCredits": 50,
  "message": "Account deleted successfully",
  "details": {
    "messagesAnonymized": true,
    "chatsCount": 5,
    "refundPending": true
  }
}
```

**Operations**:
1. Archives user data in `deleted_users` table
2. Anonymizes all user messages to `[Message from deleted user]`
3. Closes all active chats with reason `user_deleted`
4. Soft deletes user record (sets `deleted_at`, anonymizes email/username)
5. Deletes auth user
6. Creates refund record for unused credits (10 KES per credit)

**Requirements**: 14.1-14.5 (User Deletion - GDPR Compliance)

---

### 3. delete-operator-account
**Purpose**: Safe operator account deletion with active chat validation.

**Endpoint**: `POST /functions/v1/delete-operator-account`

**Request Body**:
```json
{
  "operatorId": "uuid",
  "adminId": "uuid",
  "reason": "resignation"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Operator deleted successfully",
  "details": {
    "operatorId": "uuid",
    "operatorName": "Operator Name",
    "totalChatsHandled": 150,
    "qualityScore": 85.5,
    "performanceDataPreserved": true
  }
}
```

**Operations**:
1. Validates admin has permission to delete operators
2. Checks for active chats (fails if any exist)
3. Soft deletes operator record (preserves performance data)
4. Deletes auth user
5. Logs deletion in activity log

**Error Cases**:
- Returns 400 if operator has active chats with list of chat IDs
- Returns 403 if admin lacks permission

**Requirements**: 15.1-15.5 (Operator Deletion)

---

## Deployment

### Prerequisites
- Supabase CLI installed: `npm install -g supabase`
- Supabase project linked: `supabase link --project-ref your-project-ref`

### Deploy All Functions
```bash
supabase functions deploy bootstrap-first-admin
supabase functions deploy delete-user-account
supabase functions deploy delete-operator-account
```

### Deploy Single Function
```bash
supabase functions deploy bootstrap-first-admin
```

### Set Environment Variables
```bash
# Set setup token for bootstrap function
supabase secrets set ADMIN_SETUP_TOKEN=your-secret-token

# Verify secrets
supabase secrets list
```

---

## Testing

### Local Testing
```bash
# Start Supabase locally
supabase start

# Serve function locally
supabase functions serve bootstrap-first-admin

# Test with curl
curl -X POST http://localhost:54321/functions/v1/bootstrap-first-admin \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Admin",
    "email": "test@example.com",
    "password": "TestPass123!",
    "setupToken": "test-token"
  }'
```

### Production Testing
```bash
# Get function URL
FUNCTION_URL="https://your-project-ref.supabase.co/functions/v1/bootstrap-first-admin"

# Test bootstrap
curl -X POST $FUNCTION_URL \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "name": "Admin Name",
    "email": "admin@fantooo.com",
    "password": "SecurePass123!",
    "setupToken": "your-setup-token"
  }'
```

---

## Security Considerations

### bootstrap-first-admin
- Setup token must be kept secret and never committed to git
- Function should only be accessible during initial setup
- Consider disabling function after first admin is created

### delete-user-account
- Requires service role key (elevated privileges)
- Implements GDPR right to be forgotten
- Preserves audit trail in `deleted_users` table
- Anonymizes data rather than hard deleting for compliance

### delete-operator-account
- Validates admin permissions before deletion
- Prevents deletion if operator has active chats
- Preserves performance data for analytics
- Logs all deletions for audit trail

---

## Error Handling

All functions return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created (bootstrap-first-admin)
- `400`: Bad request (validation errors, business logic violations)
- `401`: Unauthorized (invalid signature)
- `403`: Forbidden (invalid token, insufficient permissions)
- `404`: Not found (user/operator not found)
- `500`: Internal server error

---

## Monitoring

### View Function Logs
```bash
# View logs for specific function
supabase functions logs bootstrap-first-admin

# Follow logs in real-time
supabase functions logs bootstrap-first-admin --follow
```

### Metrics to Monitor
- Invocation count
- Error rate
- Execution time
- Failed deletions requiring manual intervention

---

## Troubleshooting

### bootstrap-first-admin fails with "Admin already exists"
- This is expected behavior - function can only run once
- To reset, manually delete admin records from database (development only)

### delete-user-account fails to anonymize messages
- Check RLS policies on messages table
- Verify service role key has proper permissions
- Check database triggers aren't preventing updates

### delete-operator-account fails with "active chats"
- Reassign or close active chats first
- Use admin panel to view operator's active chats
- Consider implementing auto-reassignment before deletion

---

## Future Enhancements

- [ ] Add email notifications for account deletions
- [ ] Implement scheduled deletion (grace period)
- [ ] Add data export before deletion (GDPR compliance)
- [ ] Implement operator account suspension (temporary)
- [ ] Add bulk operator deletion with auto-reassignment
