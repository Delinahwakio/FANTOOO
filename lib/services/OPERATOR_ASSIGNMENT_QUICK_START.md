# Operator Assignment - Quick Start Guide

Get started with the operator assignment service in 5 minutes.

## Installation

The service is already included in the project. No additional installation needed.

## Basic Usage

### 1. Add a Chat to the Queue

```typescript
import { addToQueue } from '@/lib/services/operator-assignment'

const result = await addToQueue({
  chatId: 'your-chat-uuid',
  userTier: 'gold',
  priority: 'normal'
})

if (result.success) {
  console.log('Chat added to queue')
}
```

### 2. Assign an Operator

```typescript
import { assignOperator } from '@/lib/services/operator-assignment'

const result = await assignOperator('your-chat-uuid')

if (result.success) {
  console.log('Assigned to:', result.operatorName)
}
```

### 3. Reassign a Chat

```typescript
import { reassignChat } from '@/lib/services/operator-assignment'

const result = await reassignChat('your-chat-uuid', {
  reason: 'Operator idle for 3 minutes'
})

if (result.escalated) {
  console.log('Chat escalated to admin')
}
```

## Common Scenarios

### New Chat Flow

```typescript
// 1. User starts chat
const chat = await createChat(userId, fictionalProfileId)

// 2. Add to queue
await addToQueue({
  chatId: chat.id,
  userTier: user.user_tier,
  requiredSpecializations: ['romantic']
})

// 3. Try immediate assignment
const result = await assignOperator(chat.id)

if (result.success) {
  // Notify operator
  notifyOperator(result.operatorId, chat.id)
}
```

### Operator Idle Detection

```typescript
// Check if operator hasn't responded in 3 minutes
const lastActivity = chat.last_operator_activity
const idleTime = Date.now() - new Date(lastActivity).getTime()

if (idleTime > 3 * 60 * 1000) {
  // Reassign
  await reassignChat(chat.id, {
    reason: 'Operator idle for 3 minutes'
  })
}
```

### Background Queue Processing

```typescript
// Run every 30 seconds
setInterval(async () => {
  const result = await processQueue(10)
  console.log('Processed:', result.assigned, 'chats')
}, 30000)
```

## Priority Levels

- **Urgent** (score >= 150): Platinum users, VIP status
- **High** (score >= 100): Gold users, reassigned chats
- **Normal** (score >= 50): Silver/Bronze users
- **Low** (score < 50): Free users

## Key Features

✅ **Automatic Priority Calculation** - Based on user tier, wait time, and lifetime value  
✅ **Skill Matching** - Matches operators with required specializations  
✅ **Workload Balancing** - Distributes chats evenly across operators  
✅ **Loop Prevention** - Max 3 reassignments before escalation  
✅ **Quality Scoring** - Considers operator performance in matching  

## Configuration

### Max Concurrent Chats

Set in the `operators` table:
```sql
UPDATE operators 
SET max_concurrent_chats = 5 
WHERE id = 'operator-uuid';
```

### Operator Specializations

```sql
UPDATE operators 
SET specializations = ARRAY['romantic', 'flirty', 'playful']
WHERE id = 'operator-uuid';
```

## Monitoring

### Check Queue Status

```typescript
import { getQueueStats } from '@/lib/services/operator-assignment'

const stats = await getQueueStats()
console.log('Chats waiting:', stats.total)
console.log('Average wait:', stats.averageWaitTime, 'minutes')
```

### Check Operator Availability

```typescript
import { checkOperatorAvailability } from '@/lib/services/operator-assignment'

const { available, reason } = await checkOperatorAvailability('operator-uuid')
```

## Troubleshooting

### Chat Not Being Assigned

**Possible causes:**
1. No operators available
2. All operators at max capacity
3. No operators with required specializations
4. All operators are suspended

**Solution:**
```typescript
// Check queue stats
const stats = await getQueueStats()

// Check if operators are available
const { data: operators } = await supabase
  .from('operators')
  .select('*')
  .eq('is_available', true)
  .eq('is_active', true)
```

### Chat Escalated After Reassignments

**Cause:** Chat was reassigned 3 times without successful assignment

**Solution:**
- Review admin notifications
- Manually assign operator
- Check operator availability
- Review chat requirements

### High Wait Times

**Cause:** Not enough operators for demand

**Solution:**
- Add more operators
- Increase max_concurrent_chats for existing operators
- Review operator availability schedules

## API Routes

### POST /api/operator/assign

```typescript
// Assign operator to chat
const response = await fetch('/api/operator/assign', {
  method: 'POST',
  body: JSON.stringify({ chatId: 'chat-uuid' })
})
```

### POST /api/operator/reassign

```typescript
// Reassign chat
const response = await fetch('/api/operator/reassign', {
  method: 'POST',
  body: JSON.stringify({ 
    chatId: 'chat-uuid',
    reason: 'Operator idle'
  })
})
```

### GET /api/operator/queue

```typescript
// Get queue statistics
const response = await fetch('/api/operator/queue')
const stats = await response.json()
```

## Next Steps

1. ✅ Read the full [README](./OPERATOR_ASSIGNMENT_README.md)
2. ✅ Review [examples](./operator-assignment.example.ts)
3. ✅ Set up background queue processor
4. ✅ Configure monitoring and alerts
5. ✅ Test with real operators

## Support

For issues or questions:
- Check the [README](./OPERATOR_ASSIGNMENT_README.md)
- Review [examples](./operator-assignment.example.ts)
- Check database function: `assign_chat_to_operator`
- Review requirements: 8.1-8.5, 9.1-9.5

## Related Services

- `chat-service.ts` - Chat creation and management
- `message-service.ts` - Message sending
- Database function: `assign_chat_to_operator`
