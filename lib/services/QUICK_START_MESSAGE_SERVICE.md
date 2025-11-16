# Quick Start: Message Service

## 🚀 Send a Message in 3 Steps

### 1. Import the Hook

```typescript
import { useSendMessage } from '@/lib/hooks/useSendMessage'
```

### 2. Use in Component

```typescript
function ChatComponent({ chatId }: { chatId: string }) {
  const { sendMessage, isLoading, error, isInsufficientCredits } = useSendMessage()
  
  const handleSend = async (content: string) => {
    const result = await sendMessage({ chatId, content })
    
    if (result) {
      console.log('Message sent!', result.message)
    }
  }
  
  return (
    <div>
      {error && <div>Error: {error.message}</div>}
      {isInsufficientCredits && <button>Buy Credits</button>}
      <button onClick={() => handleSend('Hello!')} disabled={isLoading}>
        Send
      </button>
    </div>
  )
}
```

### 3. Handle Errors

```typescript
if (error) {
  switch (error.code) {
    case 'INSUFFICIENT_CREDITS':
      // Show purchase modal
      openPurchaseModal(error.required, error.available)
      break
    case 'CHAT_NOT_FOUND':
      // Redirect to discover
      router.push('/discover')
      break
    case 'UNAUTHORIZED':
      // Redirect to login
      router.push('/login')
      break
    default:
      // Show generic error
      toast.error(error.message)
  }
}
```

## 📋 Common Patterns

### With Media

```typescript
await sendMessage({
  chatId,
  content: 'Check this out!',
  contentType: 'image',
  mediaUrl: 'https://example.com/image.jpg'
})
```

### With Loading State

```typescript
<button disabled={isLoading}>
  {isLoading ? 'Sending...' : 'Send'}
</button>
```

### With Optimistic Updates

```typescript
const handleSend = async (content: string) => {
  // Add message to UI immediately
  addOptimisticMessage({ content, status: 'sending' })
  
  const result = await sendMessage({ chatId, content })
  
  if (result) {
    // Update with real message
    updateMessage(result.message)
  } else {
    // Remove optimistic message
    removeOptimisticMessage()
  }
}
```

## 🔒 Security

The service automatically:
- ✅ Validates authentication
- ✅ Checks user permissions
- ✅ Prevents race conditions
- ✅ Validates input
- ✅ Sanitizes content

## 💰 Credit Calculation

| Factor | Effect |
|--------|--------|
| First 3 messages | FREE |
| Peak hours (8pm-2am) | +20% cost |
| Off-peak (2am-8am) | -20% cost |
| Featured profile | +50% cost |
| Bronze tier | -5% cost |
| Silver tier | -10% cost |
| Gold tier | -15% cost |
| Platinum tier | -20% cost |

## 🐛 Debugging

### Check Failed Transactions

```sql
SELECT * FROM failed_transaction_log
WHERE user_id = 'your-user-id'
ORDER BY attempted_at DESC
LIMIT 10;
```

### Monitor Performance

```sql
SELECT 
  COUNT(*) as total_messages,
  AVG(credits_charged) as avg_cost,
  SUM(credits_charged) as total_revenue
FROM messages
WHERE created_at > NOW() - INTERVAL '1 day';
```

## 📚 Full Documentation

See `MESSAGE_SERVICE_README.md` for complete documentation.
