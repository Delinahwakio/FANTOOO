# Chat Service

The Chat Service provides functions for managing chat operations including creation, retrieval, closure, and metrics updates.

## Requirements

- **4.1-4.5**: Real-Time Chat
- **24.1-24.5**: Duplicate Chat Prevention

## Features

- ✅ Chat creation with duplicate prevention
- ✅ User validation and authorization
- ✅ Chat retrieval with permission checks
- ✅ Chat closure with reason tracking
- ✅ Chat metrics updates (message count, credits spent)
- ✅ User chat listing

## Functions

### `createChat(params: CreateChatParams): Promise<CreateChatResult>`

Creates a new chat or returns an existing chat between a real user and fictional user.

**Duplicate Prevention**: Uses the database function `create_or_get_chat` which has a UNIQUE constraint on `(real_user_id, fictional_user_id)` to prevent duplicate chats.

**Parameters:**
```typescript
{
  realUserId: string      // Real user UUID
  fictionalUserId: string // Fictional user UUID
}
```

**Returns:**
```typescript
{
  chat: Chat      // The chat object
  isNew: boolean  // True if newly created, false if existing
}
```

**Throws:**
- `UserNotFoundError` - Real user doesn't exist or is deleted
- `FictionalUserNotFoundError` - Fictional user doesn't exist or is deleted
- `UnauthorizedError` - User is banned or inactive
- `DatabaseError` - Database operation failed

**Example:**
```typescript
import { createChat } from '@/lib/services/chat-service'

try {
  const result = await createChat({
    realUserId: 'user-uuid',
    fictionalUserId: 'fictional-uuid'
  })
  
  if (result.isNew) {
    console.log('New chat created:', result.chat.id)
  } else {
    console.log('Existing chat returned:', result.chat.id)
  }
} catch (error) {
  if (error instanceof UnauthorizedError) {
    // Handle banned/inactive user
  }
}
```

---

### `getChat(params: GetChatParams): Promise<Chat>`

Retrieves a chat by ID with user validation.

**Authorization**: Users can only access:
- Chats where they are the real user
- Chats assigned to them as an operator
- All chats if they are an admin

**Parameters:**
```typescript
{
  chatId: string  // Chat UUID
  userId: string  // Requesting user's auth UUID
}
```

**Returns:** `Chat` object

**Throws:**
- `ChatNotFoundError` - Chat doesn't exist
- `UnauthorizedError` - User doesn't have permission
- `DatabaseError` - Database operation failed

**Example:**
```typescript
import { getChat } from '@/lib/services/chat-service'

try {
  const chat = await getChat({
    chatId: 'chat-uuid',
    userId: 'auth-user-uuid'
  })
  
  console.log('Chat status:', chat.status)
  console.log('Message count:', chat.message_count)
} catch (error) {
  if (error instanceof UnauthorizedError) {
    // User doesn't have permission
  }
}
```

---

### `closeChat(params: CloseChatParams): Promise<Chat>`

Closes a chat with reason tracking.

**Side Effects:**
- Sets chat status to 'closed'
- Records close reason
- Sets closed_at timestamp
- Decrements operator's active chat count (if assigned)

**Parameters:**
```typescript
{
  chatId: string      // Chat UUID
  userId: string      // User closing the chat (auth UUID)
  closeReason: string // Reason for closure
}
```

**Returns:** Updated `Chat` object

**Throws:**
- `ChatNotFoundError` - Chat doesn't exist
- `UnauthorizedError` - User doesn't have permission
- `DatabaseError` - Database operation failed

**Example:**
```typescript
import { closeChat } from '@/lib/services/chat-service'

try {
  const closedChat = await closeChat({
    chatId: 'chat-uuid',
    userId: 'auth-user-uuid',
    closeReason: 'user_requested'
  })
  
  console.log('Chat closed at:', closedChat.closed_at)
} catch (error) {
  if (error instanceof ChatNotFoundError) {
    // Chat doesn't exist
  }
}
```

**Common Close Reasons:**
- `user_requested` - User manually closed the chat
- `inactivity_timeout` - Auto-closed due to inactivity
- `operator_unavailable` - Closed because no operator available
- `inappropriate_content` - Closed by admin/moderator
- `user_deleted` - Closed because user deleted account

---

### `updateChatMetrics(params: UpdateChatMetricsParams): Promise<Chat>`

Updates chat metrics such as message count and credits spent.

**Note**: This is typically called automatically by the message service after sending messages.

**Parameters:**
```typescript
{
  chatId: string                  // Chat UUID
  messageCount?: number           // New message count
  creditsSpent?: number           // Credits to add to total
  lastMessageAt?: Date            // Last message timestamp
  lastUserMessageAt?: Date        // Last user message timestamp
  lastFictionalMessageAt?: Date   // Last fictional message timestamp
}
```

**Returns:** Updated `Chat` object

**Throws:**
- `ChatNotFoundError` - Chat doesn't exist
- `DatabaseError` - Database operation failed

**Example:**
```typescript
import { updateChatMetrics } from '@/lib/services/chat-service'

try {
  const updatedChat = await updateChatMetrics({
    chatId: 'chat-uuid',
    messageCount: 5,
    creditsSpent: 2,
    lastMessageAt: new Date(),
    lastUserMessageAt: new Date()
  })
  
  console.log('Total credits spent:', updatedChat.total_credits_spent)
} catch (error) {
  // Handle error
}
```

---

### `getUserChats(userId: string, status?: ChatStatus): Promise<Chat[]>`

Retrieves all chats for a user, optionally filtered by status.

**Parameters:**
- `userId: string` - The user's UUID (real_user_id, not auth_id)
- `status?: ChatStatus` - Optional status filter ('active', 'idle', 'closed', 'archived', 'escalated')

**Returns:** Array of `Chat` objects, ordered by last message (most recent first)

**Throws:**
- `DatabaseError` - Database operation failed

**Example:**
```typescript
import { getUserChats } from '@/lib/services/chat-service'

try {
  // Get all active chats
  const activeChats = await getUserChats('user-uuid', 'active')
  
  // Get all chats (any status)
  const allChats = await getUserChats('user-uuid')
  
  console.log('Active chats:', activeChats.length)
} catch (error) {
  // Handle error
}
```

---

## Integration with Message Service

The chat service works closely with the message service:

1. **Before sending a message**: Use `getChat()` to verify the chat exists and user has permission
2. **After sending a message**: The message service automatically updates chat metrics
3. **When closing a chat**: Use `closeChat()` to properly close and track the reason

```typescript
import { getChat } from '@/lib/services/chat-service'
import { sendMessage } from '@/lib/services/message-service'

// Verify chat before sending message
const chat = await getChat({ chatId, userId })

if (chat.status !== 'active') {
  throw new Error('Chat is not active')
}

// Send message (automatically updates chat metrics)
await sendMessage({
  chatId,
  userId,
  content: 'Hello!'
})
```

---

## Database Functions Used

The chat service leverages these database functions:

- `create_or_get_chat(real_user_id, fictional_user_id)` - Creates or retrieves chat with duplicate prevention
- `increment(x)` - Atomically increments a numeric field
- `decrement(x)` - Atomically decrements a numeric field

---

## Error Handling

All functions throw typed errors for better error handling:

```typescript
import { 
  createChat,
  ChatNotFoundError,
  UserNotFoundError,
  UnauthorizedError,
  DatabaseError
} from '@/lib/services/chat-service'

try {
  const result = await createChat({ realUserId, fictionalUserId })
} catch (error) {
  if (error instanceof UserNotFoundError) {
    // User doesn't exist
  } else if (error instanceof UnauthorizedError) {
    // User is banned or inactive
  } else if (error instanceof DatabaseError) {
    // Database operation failed
  }
}
```

---

## Testing

See `lib/services/__tests__/chat-service.test.ts` for comprehensive test coverage.

---

## Related Documentation

- [Message Service](./MESSAGE_SERVICE_README.md)
- [Requirements Document](../../.kiro/specs/fantooo-platform/requirements.md)
- [Design Document](../../.kiro/specs/fantooo-platform/design.md)
