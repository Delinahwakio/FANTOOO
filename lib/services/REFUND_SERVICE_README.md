# Credit Refund Service

## Overview

The Credit Refund Service handles all credit refund operations for the Fantooo platform. It provides a secure, auditable way to refund credits to users with full transaction safety and comprehensive audit trails.

## Requirements

Implements Requirements 18.1-18.5 (Credit Refund Processing):
- ✅ Refund reason validation from predefined list
- ✅ Credit addition with transaction safety
- ✅ Audit trail creation in credit_refunds table
- ✅ Admin ID and notes tracking
- ✅ User notification support

## Features

### 1. Refund Processing
- **Atomic transactions**: All refund operations are performed atomically
- **Validation**: Validates refund reasons, amounts, and admin permissions
- **Audit trail**: Creates comprehensive audit records
- **Transaction safety**: Uses database functions to prevent race conditions

### 2. Refund Reasons

Valid refund reasons (as per requirements):
- `accidental_send` - User accidentally sent a message
- `inappropriate_content` - Content was inappropriate
- `system_error` - System error caused incorrect charge
- `admin_discretion` - Admin decision to refund
- `account_deletion` - Refund for unused credits on account deletion

### 3. Admin Permissions

Only admins with `manage_payments` permission can process refunds.

## Usage

### Basic Refund Processing

```typescript
import { processRefund } from '@/lib/services/refund-service'

// Process a refund
const result = await processRefund({
  userId: 'user-uuid',
  amount: 10, // 10 credits
  reason: 'system_error',
  processedBy: 'admin-uuid',
  notes: 'Refund for duplicate charge',
  messageId: 'message-uuid', // Optional
  chatId: 'chat-uuid' // Optional
})

console.log(result)
// {
//   success: true,
//   refundId: 'refund-uuid',
//   userId: 'user-uuid',
//   amount: 10,
//   newBalance: 50, // User now has 50 credits
//   reason: 'system_error',
//   processedAt: Date
// }
```

### Get User Refund History

```typescript
import { getUserRefundHistory } from '@/lib/services/refund-service'

const refunds = await getUserRefundHistory('user-uuid', 50)

refunds.forEach(refund => {
  console.log(`${refund.amount} credits - ${refund.reason}`)
})
```

### Get Pending Refunds (Admin)

```typescript
import { getPendingRefunds } from '@/lib/services/refund-service'

const pendingRefunds = await getPendingRefunds(100)

pendingRefunds.forEach(refund => {
  console.log(`User: ${refund.real_users.username}`)
  console.log(`Amount: ${refund.amount} credits`)
  console.log(`Reason: ${refund.reason}`)
})
```

### Calculate Account Deletion Refund

```typescript
import { calculateAccountDeletionRefund } from '@/lib/services/refund-service'

const refundInfo = await calculateAccountDeletionRefund('user-uuid')

console.log(`Credits to refund: ${refundInfo.credits}`)
console.log(`Amount in KES: ${refundInfo.amountKES}`)
```

### Get Refund Statistics

```typescript
import { getRefundStatistics } from '@/lib/services/refund-service'

const stats = await getRefundStatistics(
  new Date('2024-01-01'),
  new Date('2024-12-31')
)

console.log(`Total refunds: ${stats.total}`)
console.log(`Total amount: ${stats.totalAmount} credits (${stats.totalAmountKES} KES)`)
console.log(`By reason:`, stats.byReason)
console.log(`By status:`, stats.byStatus)
```

### Validate Refund Reason

```typescript
import { isValidRefundReason, REFUND_REASONS } from '@/lib/services/refund-service'

if (isValidRefundReason(userInput)) {
  // Process refund
} else {
  console.error(`Invalid reason. Must be one of: ${REFUND_REASONS.join(', ')}`)
}
```

## API Route Example

```typescript
// app/api/admin/refunds/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { processRefund } from '@/lib/services/refund-service'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current admin user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get admin ID
    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { userId, amount, reason, notes, messageId, chatId } = body

    // Process refund
    const result = await processRefund({
      userId,
      amount,
      reason,
      processedBy: admin.id,
      notes,
      messageId,
      chatId
    })

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Refund processing error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process refund' },
      { status: 500 }
    )
  }
}
```

## Database Schema

### credit_refunds Table

```sql
CREATE TABLE credit_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES real_users(id) NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'accidental_send',
    'inappropriate_content',
    'system_error',
    'admin_discretion',
    'account_deletion'
  )),
  message_id UUID REFERENCES messages(id),
  chat_id UUID REFERENCES chats(id),
  processed_by UUID REFERENCES admins(id) NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Database Function

The service uses the `process_credit_refund` database function for atomic operations:

```sql
SELECT process_credit_refund(
  p_user_id := 'user-uuid',
  p_amount := 10,
  p_reason := 'system_error',
  p_processed_by := 'admin-uuid',
  p_notes := 'Refund notes'
);
```

## Error Handling

The service throws specific errors for different scenarios:

```typescript
import { 
  UserNotFoundError,
  UnauthorizedError,
  TransactionError,
  DatabaseError
} from '@/lib/errors'

try {
  await processRefund(request)
} catch (error) {
  if (error instanceof UserNotFoundError) {
    // User doesn't exist
  } else if (error instanceof UnauthorizedError) {
    // Admin doesn't have permission
  } else if (error instanceof TransactionError) {
    // Database transaction failed
  } else if (error instanceof DatabaseError) {
    // Other database error
  }
}
```

## Security

### Admin Verification
- Only active admins can process refunds
- Admins must have `manage_payments` permission
- All refunds are logged with admin ID

### Transaction Safety
- All operations use database transactions
- Credits are added atomically
- Audit records are created in the same transaction
- Rollback on any error

### Audit Trail
Every refund creates a record with:
- User ID
- Amount refunded
- Reason for refund
- Admin who processed it
- Timestamp
- Optional notes
- Related message/chat IDs

## Testing

### Unit Tests

```typescript
import { isValidRefundReason, calculateAccountDeletionRefund } from '@/lib/services/refund-service'

describe('Refund Service', () => {
  test('validates refund reasons', () => {
    expect(isValidRefundReason('system_error')).toBe(true)
    expect(isValidRefundReason('invalid_reason')).toBe(false)
  })

  test('calculates account deletion refund', async () => {
    const result = await calculateAccountDeletionRefund('user-id')
    expect(result.credits).toBeGreaterThanOrEqual(0)
    expect(result.amountKES).toBe(result.credits * 10)
  })
})
```

### Integration Tests

```typescript
describe('Refund Processing', () => {
  test('processes refund and updates balance', async () => {
    const initialBalance = 40
    const refundAmount = 10

    const result = await processRefund({
      userId: testUserId,
      amount: refundAmount,
      reason: 'system_error',
      processedBy: testAdminId,
      notes: 'Test refund'
    })

    expect(result.success).toBe(true)
    expect(result.newBalance).toBe(initialBalance + refundAmount)
  })

  test('creates audit trail', async () => {
    await processRefund({
      userId: testUserId,
      amount: 5,
      reason: 'accidental_send',
      processedBy: testAdminId
    })

    const history = await getUserRefundHistory(testUserId)
    expect(history.length).toBeGreaterThan(0)
    expect(history[0].reason).toBe('accidental_send')
  })
})
```

## Best Practices

1. **Always validate reasons**: Use `isValidRefundReason()` before processing
2. **Include notes**: Add context for audit purposes
3. **Link to messages/chats**: Include messageId or chatId when applicable
4. **Check permissions**: Verify admin has `manage_payments` permission
5. **Handle errors**: Catch and handle specific error types
6. **Notify users**: Send notification after successful refund
7. **Monitor statistics**: Track refund patterns for fraud detection

## Related Services

- **Credit Calculation**: `lib/utils/credits.ts`
- **User Service**: `lib/services/user-registration.ts`
- **Payment Service**: `lib/payment/paystack.ts`

## Migration

To apply the database function:

```bash
# Apply migration
supabase db push

# Or manually run the migration file
psql -f supabase/migrations/20241116000013_create_refund_function.sql
```

## Support

For issues or questions:
1. Check error messages for specific issues
2. Review audit trail in credit_refunds table
3. Check admin permissions
4. Verify user exists and is not deleted
5. Ensure database function is deployed
