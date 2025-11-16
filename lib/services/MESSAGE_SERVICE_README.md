# Message Service

## Overview

The message service handles sending messages with full transaction safety, implementing race condition prevention through row-level locking and atomic credit deduction.

## Requirements

- **7.1-7.5**: Race Condition Prevention
- **4.1-4.5**: Real-Time Chat

## Features

### Transaction Safety

The service implements a robust transaction model:

1. **Row-Level Locking**: Uses `SELECT FOR UPDATE` to lock user and chat rows, preventing concurrent modifications
2. **Atomic Operations**: All operations (credit check, deduction, message creation) happen within a single transaction
3. **Automatic Rollback**: Any error triggers a complete rollback, ensuring data consistency
4. **Failed Transaction Logging**: All failed attempts are logged for debugging and monitoring

### Credit Calculation

Messages are priced based on multiple factors:

- **Free Messages**: First 3 messages in each chat are free
- **Time-Based Multipliers**:
  - Peak hours (8pm-2am EAT): 1.2x multiplier
  - Off-peak hours (2am-8am EAT): 0.8x multiplier
  - Normal hours (8am-8pm EAT): 1.0x multiplier
- **Featured Profile**: 1.5x multiplier for featured fictional profiles
- **User Tier Discounts**:
  - Bronze: 5% discount
  - Silver: 10% discount
  - Gold: 15% discount
  - Platinum: 20% discount

### Error Handling

The service throws specific errors for different failure scenarios:

- `InsufficientCreditsError`: User doesn't have enough credits
- `ChatNotFoundError`: Chat doesn't exist or isn't active
- `UserNotFoundError`: User doesn't exist
- `TransactionError`: Generic transaction failure

## Usage

### Basic Usage

```typescript
import { sendMessage } from '@/lib/services/message-service'

try {
  const result = await sendMessage({
    chatId: 'chat-uuid',
    userId: 'user-uuid',
    content: 'Hello!',
    contentType: 'text'
  })
  
  console.log('Message sent:', result.message)
  console.log('Credits charged:', result.creditsCharged)
  console.log('Remaining credits:', result.remainingCredits)
  
} catch (error) {
  if (error instanceof InsufficientCreditsError) {
    // Show credit purchase modal
    showPurchaseModal(error.required, error.available)
  } else if (error instanceof ChatNotFoundError) {
    // Redirect to discover page
    router.push('/discover')
  } else {
    // Show generic error
    toast.error('Failed to send message')
  }
}
```

### With Media

```typescript
const result = await sendMessage({
  chatId: 'chat-uuid',
  userId: 'user-uuid',
  content: 'Check out this image!',
  contentType: 'image',
  mediaUrl: 'https://example.com/image.jpg'
})
```

## Database Function

The core logic is implemented in a PostgreSQL function `send_message_with_transaction` that:

1. Locks the user row with `SELECT FOR UPDATE`
2. Locks the chat row with `SELECT FOR UPDATE`
3. Calculates message cost based on current time, user tier, and profile features
4. Validates sufficient credits
5. Deducts credits atomically
6. Creates the message record
7. Updates chat metadata
8. Returns the complete result

This approach ensures:
- **Atomicity**: All operations succeed or all fail
- **Consistency**: Credits can never go negative
- **Isolation**: Concurrent requests are serialized through row locks
- **Durability**: Committed transactions are permanent

## Race Condition Prevention

The service prevents race conditions through:

1. **Row-Level Locking**: `SELECT FOR UPDATE` ensures only one transaction can modify a user's credits at a time
2. **Database Constraints**: `CHECK (credits >= 0)` prevents negative balances at the database level
3. **Transaction Isolation**: All operations within a single database transaction
4. **Optimistic Locking**: Failed transactions are logged and can be retried

### Example Race Condition Scenario

**Without Locking** (❌ Vulnerable):
```
Time | Transaction A          | Transaction B
-----|------------------------|------------------------
T1   | Read credits: 5        |
T2   |                        | Read credits: 5
T3   | Deduct 3 credits       |
T4   |                        | Deduct 3 credits
T5   | Write credits: 2       |
T6   |                        | Write credits: 2
Result: User has 2 credits but sent 6 credits worth of messages!
```

**With Locking** (✅ Safe):
```
Time | Transaction A          | Transaction B
-----|------------------------|------------------------
T1   | Lock & read credits: 5 |
T2   |                        | Wait for lock...
T3   | Deduct 3 credits       |
T4   | Write credits: 2       |
T5   | Release lock           |
T6   |                        | Lock & read credits: 2
T7   |                        | Try to deduct 3 credits
T8   |                        | Error: Insufficient credits!
Result: User has 2 credits, sent 3 credits worth, second message rejected ✓
```

## Failed Transaction Logging

All failed transactions are logged to the `failed_transaction_log` table:

```sql
CREATE TABLE failed_transaction_log (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  chat_id UUID NOT NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  attempted_at TIMESTAMP NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

This allows:
- Debugging transaction failures
- Monitoring system health
- Identifying patterns in failures
- Auditing user actions

## Testing

### Unit Tests

Test credit calculation logic:

```typescript
describe('calculateMessageCost', () => {
  it('should return 0 for first 3 messages', () => {
    expect(calculateMessageCost(1, 'free', false)).toBe(0)
    expect(calculateMessageCost(2, 'free', false)).toBe(0)
    expect(calculateMessageCost(3, 'free', false)).toBe(0)
  })
  
  it('should charge for message 4+', () => {
    expect(calculateMessageCost(4, 'free', false)).toBeGreaterThan(0)
  })
})
```

### Integration Tests

Test the full message sending flow:

```typescript
describe('sendMessage', () => {
  it('should send message and deduct credits', async () => {
    const result = await sendMessage({
      chatId: testChatId,
      userId: testUserId,
      content: 'Test message'
    })
    
    expect(result.message).toBeDefined()
    expect(result.creditsCharged).toBeGreaterThanOrEqual(0)
  })
  
  it('should throw InsufficientCreditsError', async () => {
    await expect(
      sendMessage({
        chatId: testChatId,
        userId: userWithNoCredits,
        content: 'Test message'
      })
    ).rejects.toThrow(InsufficientCreditsError)
  })
})
```

### Race Condition Tests

Test concurrent message sending:

```typescript
describe('Race Condition Prevention', () => {
  it('should prevent concurrent sends with insufficient credits', async () => {
    // User has 5 credits
    const promises = Array(10).fill(null).map(() =>
      sendMessage({
        chatId: testChatId,
        userId: testUserId,
        content: 'Test'
      })
    )
    
    const results = await Promise.allSettled(promises)
    
    // Only 5 should succeed
    const successful = results.filter(r => r.status === 'fulfilled')
    expect(successful.length).toBe(5)
    
    // User should have 0 credits
    const user = await getUser(testUserId)
    expect(user.credits).toBe(0)
  })
})
```

## Performance Considerations

- **Row Locking**: Locks are held for the duration of the transaction, so keep transactions short
- **Indexing**: Ensure proper indexes on `real_users(id)` and `chats(id)` for fast locking
- **Connection Pooling**: Use connection pooling to handle concurrent requests efficiently
- **Monitoring**: Monitor lock wait times and transaction durations

## Security

- **RLS Policies**: Ensure users can only send messages in their own chats
- **Input Validation**: Validate content length and type before processing
- **SQL Injection**: Use parameterized queries (handled by Supabase)
- **Rate Limiting**: Implement rate limiting at the API layer (60 messages/minute)

## Migration

To apply the database function:

```bash
supabase db push
```

Or manually run the migration:

```bash
psql -f supabase/migrations/20241116000011_create_send_message_function.sql
```

## Monitoring

Monitor these metrics:

- Failed transaction rate
- Average transaction duration
- Lock wait times
- Credit deduction accuracy
- Message delivery latency

## Future Enhancements

- [ ] Retry logic for transient failures
- [ ] Message queuing for high load
- [ ] Batch message sending
- [ ] Message scheduling
- [ ] Advanced cost calculation (loyalty bonuses, promotions)
