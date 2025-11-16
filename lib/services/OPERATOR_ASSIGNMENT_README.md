# Operator Assignment and Queue Management Service

This service handles the intelligent assignment of operators to chats, queue management with priority scoring, and reassignment with loop prevention.

## Features

- **Priority-based Queue**: Chats are queued with calculated priority scores based on user tier, wait time, and lifetime value
- **Skill Matching**: Operators are matched to chats based on specializations and workload
- **Workload Balancing**: Ensures operators don't exceed their maximum concurrent chat limit
- **Loop Prevention**: Maximum 3 reassignment attempts before escalation to admin
- **Automatic Escalation**: Chats that can't be assigned after 3 attempts are escalated to admin review

## Requirements

- Requirements 8.1-8.5 (Operator Assignment)
- Requirements 9.1-9.5 (Chat Reassignment)
- Requirements 11.1-11.5 (Operator Availability)

## Core Functions

### `addToQueue(entry: QueueEntry)`

Adds a chat to the assignment queue with priority calculation.

**Priority Scoring Algorithm:**
- User tier base score: platinum=100, gold=80, silver=60, bronze=40, free=20
- Wait time bonus: +1 point per minute
- Lifetime value bonus: +1 point per 100 KES spent
- VIP bonus: +50 points for platinum users

**Priority Levels:**
- `urgent`: score >= 150
- `high`: score >= 100
- `normal`: score >= 50
- `low`: score < 50

**Example:**
```typescript
import { addToQueue } from '@/lib/services/operator-assignment'

const result = await addToQueue({
  chatId: 'chat-uuid',
  priority: 'high',
  userTier: 'gold',
  requiredSpecializations: ['flirty', 'romantic'],
  excludedOperatorIds: ['operator-1-uuid'] // Exclude previous operator
})

if (result.success) {
  console.log('Added to queue:', result.queueId)
} else {
  console.error('Failed:', result.error)
}
```

### `assignOperator(chatId: string)`

Assigns the best available operator to a chat using skill matching algorithm.

**Matching Algorithm (in database function):**
- Base score: 50 points
- Specialization match: +30 points (full match) or +15 points (partial match)
- Workload score: +20 points (0 chats) down to +5 points (4+ chats)
- Quality score bonus: up to +10 points (based on operator quality score)
- Preferred operator bonus: +20 points

**Example:**
```typescript
import { assignOperator } from '@/lib/services/operator-assignment'

const result = await assignOperator('chat-uuid')

if (result.success) {
  console.log('Assigned to:', result.operatorName)
  console.log('Match score:', result.matchScore)
} else if (result.escalated) {
  console.log('Chat escalated to admin')
} else {
  console.error('Assignment failed:', result.error)
}
```

### `checkOperatorAvailability(operatorId: string)`

Checks if an operator is available for assignment.

**Availability Criteria:**
- Operator is active
- Operator is online (is_available = true)
- Operator is not suspended
- Operator has not reached max concurrent chats

**Example:**
```typescript
import { checkOperatorAvailability } from '@/lib/services/operator-assignment'

const { available, reason } = await checkOperatorAvailability('operator-uuid')

if (available) {
  console.log('Operator is available')
} else {
  console.log('Not available:', reason)
}
```

### `reassignChat(chatId: string, options: ReassignmentOptions)`

Reassigns a chat to a different operator with loop prevention.

**Loop Prevention:**
- Maximum 3 reassignment attempts
- After 3 attempts, chat is escalated to admin
- Previous operator is excluded from next assignment
- Reassignment count is tracked on operator record

**Example:**
```typescript
import { reassignChat } from '@/lib/services/operator-assignment'

const result = await reassignChat('chat-uuid', {
  reason: 'Operator idle for 3 minutes',
  preferNewOperator: true
})

if (result.success) {
  console.log('Reassigned to:', result.operatorName)
} else if (result.escalated) {
  console.log('Chat escalated after max reassignments')
} else {
  console.error('Reassignment failed:', result.error)
}
```

### `getQueueStats()`

Gets current queue statistics for monitoring.

**Returns:**
- Total chats in queue
- Count by priority level
- Average wait time (minutes)
- Oldest wait time (minutes)

**Example:**
```typescript
import { getQueueStats } from '@/lib/services/operator-assignment'

const stats = await getQueueStats()

console.log('Total in queue:', stats.total)
console.log('By priority:', stats.byPriority)
console.log('Average wait:', stats.averageWaitTime, 'minutes')
console.log('Oldest wait:', stats.oldestWaitTime, 'minutes')
```

### `processQueue(maxAssignments?: number)`

Processes the queue and assigns operators to waiting chats.

**Should be called periodically** (e.g., every 30 seconds via cron job or background task).

**Example:**
```typescript
import { processQueue } from '@/lib/services/operator-assignment'

const result = await processQueue(10) // Process up to 10 chats

console.log('Processed:', result.processed)
console.log('Assigned:', result.assigned)
console.log('Failed:', result.failed)
console.log('Escalated:', result.escalated)
```

## Typical Workflow

### 1. New Chat Created

When a user starts a chat with a fictional profile:

```typescript
// After chat is created
import { addToQueue, assignOperator } from '@/lib/services/operator-assignment'

// Add to queue
const queueResult = await addToQueue({
  chatId: newChat.id,
  userTier: user.user_tier,
  requiredSpecializations: fictionalProfile.response_style 
    ? [fictionalProfile.response_style] 
    : undefined
})

// Try immediate assignment
if (queueResult.success) {
  const assignResult = await assignOperator(newChat.id)
  
  if (assignResult.success) {
    // Notify operator of new assignment
    console.log('Chat assigned to:', assignResult.operatorName)
  } else {
    // Will be picked up by queue processor
    console.log('Chat queued, waiting for operator')
  }
}
```

### 2. Operator Goes Idle

When an operator doesn't respond for 3 minutes:

```typescript
import { reassignChat } from '@/lib/services/operator-assignment'

const result = await reassignChat(chatId, {
  reason: 'Operator idle for 3 minutes'
})

if (result.escalated) {
  // Notify admins
  console.log('Chat escalated to admin review')
}
```

### 3. Background Queue Processing

Set up a periodic job (every 30 seconds):

```typescript
// In a cron job or background worker
import { processQueue } from '@/lib/services/operator-assignment'

setInterval(async () => {
  const result = await processQueue(20)
  console.log('Queue processed:', result)
}, 30000) // Every 30 seconds
```

## Database Functions Used

This service leverages the following database functions:

### `assign_chat_to_operator(p_chat_id UUID)`

Located in: `supabase/migrations/20241116000007_create_business_logic_functions.sql`

**Features:**
- Skill matching algorithm
- Workload balancing
- Quality score consideration
- Automatic escalation after 3 failed attempts
- Creates admin notifications for escalated chats

## Error Handling

All functions return structured results with error information:

```typescript
interface AssignmentResult {
  success: boolean
  operatorId?: string
  operatorName?: string
  matchScore?: number
  error?: string
  escalated?: boolean
}
```

**Common Errors:**
- `Chat not found`: Invalid chat ID
- `No available operators found`: All operators are busy or offline
- `Chat escalated after maximum reassignments`: Exceeded 3 reassignment attempts
- `Operator has reached maximum concurrent chats`: Operator at capacity

## Performance Considerations

1. **Queue Indexes**: The `chat_queue` table has indexes on:
   - `priority_score DESC, entered_queue_at ASC` for efficient queue ordering
   - `chat_id` for quick lookups
   - `required_specializations` (GIN index) for skill matching

2. **Operator Indexes**: The `operators` table has indexes on:
   - `is_available, is_active, current_chat_count` for availability checks
   - `specializations` (GIN index) for skill matching

3. **Batch Processing**: Use `processQueue()` with appropriate batch size to avoid overwhelming the system

## Monitoring

Monitor these metrics:

1. **Queue Length**: Total chats waiting for assignment
2. **Wait Time**: Average and maximum wait times
3. **Assignment Success Rate**: Percentage of successful assignments
4. **Escalation Rate**: Number of chats escalated to admin
5. **Operator Utilization**: Average concurrent chats per operator

## Testing

See `lib/services/__tests__/operator-assignment.test.ts` for comprehensive test coverage.

## Related Services

- `chat-service.ts`: Chat creation and management
- `message-service.ts`: Message sending and credit deduction
- Database triggers: Operator availability enforcement, quality score monitoring

## Future Enhancements

- [ ] Machine learning for better operator-chat matching
- [ ] Predictive queue time estimates
- [ ] Dynamic priority adjustment based on user behavior
- [ ] Operator preference learning (which operators work best with which user types)
- [ ] Real-time queue position updates for users
