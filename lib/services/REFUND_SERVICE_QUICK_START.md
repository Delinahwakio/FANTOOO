# Credit Refund Service - Quick Start Guide

## 🚀 Quick Setup

### 1. Apply Database Migration

```bash
# Apply the refund function migration
supabase db push
```

### 2. Import the Service

```typescript
import { processRefund } from '@/lib/services/refund-service'
```

## 📝 Common Use Cases

### Process a Simple Refund

```typescript
const result = await processRefund({
  userId: 'user-uuid',
  amount: 10,
  reason: 'system_error',
  processedBy: 'admin-uuid',
  notes: 'Duplicate charge'
})

console.log(`Refunded ${result.amount} credits. New balance: ${result.newBalance}`)
```

### Refund for Accidental Message

```typescript
await processRefund({
  userId: 'user-uuid',
  amount: 2,
  reason: 'accidental_send',
  processedBy: 'admin-uuid',
  messageId: 'message-uuid',
  chatId: 'chat-uuid',
  notes: 'User accidentally sent message'
})
```

### Account Deletion Refund

```typescript
// Calculate refund amount
const { credits, amountKES } = await calculateAccountDeletionRefund('user-uuid')

// Process refund
await processRefund({
  userId: 'user-uuid',
  amount: credits,
  reason: 'account_deletion',
  processedBy: 'admin-uuid',
  notes: `Account deletion refund: ${credits} credits (${amountKES} KES)`
})
```

### View User Refund History

```typescript
const refunds = await getUserRefundHistory('user-uuid')

refunds.forEach(r => {
  console.log(`${r.created_at}: ${r.amount} credits - ${r.reason}`)
})
```

## ✅ Valid Refund Reasons

```typescript
'accidental_send'        // User sent message by accident
'inappropriate_content'  // Content was inappropriate
'system_error'          // System error caused charge
'admin_discretion'      // Admin decision
'account_deletion'      // Account being deleted
```

## 🔒 Admin Permissions Required

```typescript
// Admin must have this permission
permissions: {
  manage_payments: true
}
```

## ⚠️ Error Handling

```typescript
try {
  await processRefund(request)
} catch (error) {
  if (error instanceof UserNotFoundError) {
    console.error('User not found')
  } else if (error instanceof UnauthorizedError) {
    console.error('Admin lacks permission')
  } else if (error instanceof TransactionError) {
    console.error('Transaction failed')
  }
}
```

## 📊 Get Refund Statistics

```typescript
const stats = await getRefundStatistics()

console.log(`Total refunds: ${stats.total}`)
console.log(`Total amount: ${stats.totalAmountKES} KES`)
console.log(`By reason:`, stats.byReason)
```

## 🎯 Complete API Route Example

```typescript
// app/api/admin/refunds/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { processRefund } from '@/lib/services/refund-service'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  // Get admin
  const { data: { user } } = await supabase.auth.getUser()
  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  // Parse body
  const { userId, amount, reason, notes } = await request.json()

  // Process refund
  const result = await processRefund({
    userId,
    amount,
    reason,
    processedBy: admin.id,
    notes
  })

  return NextResponse.json(result)
}
```

## 🧪 Testing

```typescript
// Test refund processing
const result = await processRefund({
  userId: testUserId,
  amount: 10,
  reason: 'system_error',
  processedBy: testAdminId
})

expect(result.success).toBe(true)
expect(result.amount).toBe(10)
```

## 📚 Full Documentation

See [REFUND_SERVICE_README.md](./REFUND_SERVICE_README.md) for complete documentation.
