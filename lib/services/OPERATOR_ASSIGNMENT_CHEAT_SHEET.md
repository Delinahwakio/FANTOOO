# Operator Assignment - Cheat Sheet

Quick reference for common operations.

## Import

```typescript
import {
  addToQueue,
  assignOperator,
  reassignChat,
  checkOperatorAvailability,
  getQueueStats,
  processQueue
} from '@/lib/services/operator-assignment'
```

## Add to Queue

```typescript
await addToQueue({
  chatId: 'uuid',
  userTier: 'gold',
  priority: 'normal',
  requiredSpecializations: ['romantic'],
  preferredOperatorId: 'uuid',
  excludedOperatorIds: ['uuid']
})
```

## Assign Operator

```typescript
const result = await assignOperator('chat-uuid')
// result.success, result.operatorId, result.operatorName, result.matchScore
```

## Reassign Chat

```typescript
const result = await reassignChat('chat-uuid', {
  reason: 'Operator idle for 3 minutes'
})
// result.success, result.escalated
```

## Check Availability

```typescript
const { available, reason } = await checkOperatorAvailability('operator-uuid')
```

## Queue Stats

```typescript
const stats = await getQueueStats()
// stats.total, stats.byPriority, stats.averageWaitTime, stats.oldestWaitTime
```

## Process Queue

```typescript
const result = await processQueue(10)
// result.processed, result.assigned, result.failed, result.escalated
```

## Priority Levels

| Score | Level | Example |
|-------|-------|---------|
| ≥150 | urgent | Platinum users |
| ≥100 | high | Gold users, reassigned chats |
| ≥50 | normal | Silver/Bronze users |
| <50 | low | Free users |

## Priority Scoring

- **Base:** platinum=100, gold=80, silver=60, bronze=40, free=20
- **Wait:** +1 per minute
- **Value:** +1 per 100 KES
- **VIP:** +50 for platinum

## Match Scoring

- **Base:** 50 points
- **Skills:** +30 (full), +15 (partial)
- **Workload:** +20 (0 chats) to +5 (4+ chats)
- **Quality:** +10 (≥90), +7 (≥80), +5 (≥70)
- **Preferred:** +20

## Reassignment Limits

- **Max attempts:** 3
- **After 3:** Escalate to admin
- **Action:** Create admin notification
- **Flag:** 'max_reassignments_reached'

## Common Patterns

### New Chat
```typescript
await addToQueue({ chatId, userTier })
await assignOperator(chatId)
```

### Idle Operator
```typescript
await reassignChat(chatId, { reason: 'Idle 3 min' })
```

### Background Job
```typescript
setInterval(() => processQueue(10), 30000)
```

### Monitor Queue
```typescript
const stats = await getQueueStats()
if (stats.total > 20) alert('Queue too long')
```

## Error Handling

```typescript
const result = await assignOperator(chatId)

if (result.success) {
  // Assigned
} else if (result.escalated) {
  // Escalated to admin
} else {
  // Failed: result.error
}
```

## Database Function

```sql
SELECT * FROM assign_chat_to_operator('chat-uuid');
```

## Related Tables

- `chat_queue` - Queue entries
- `chats` - Chat records
- `operators` - Operator profiles
- `admin_notifications` - Escalation alerts

## Monitoring Alerts

```typescript
const stats = await getQueueStats()

if (stats.total > 50) // CRITICAL
if (stats.total > 20) // WARNING
if (stats.averageWaitTime > 10) // CRITICAL
if (stats.averageWaitTime > 5) // WARNING
if (stats.oldestWaitTime > 15) // CRITICAL
```

## Requirements

- ✅ 8.1-8.5 (Operator Assignment)
- ✅ 9.1-9.5 (Chat Reassignment)
- ✅ 11.1-11.5 (Operator Availability)
