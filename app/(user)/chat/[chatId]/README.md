# User Chat Page

## Overview

The user chat page (`/chat/[chatId]`) provides a real-time messaging interface for users to chat with fictional profiles. It includes credit management, message history, typing indicators, and optimistic updates for a smooth user experience.

## Features

### Real-Time Messaging
- **WebSocket Connection**: Real-time message delivery using Supabase Realtime
- **Typing Indicators**: Shows when the fictional user is typing
- **Optimistic Updates**: Messages appear instantly before server confirmation
- **Message Status**: Visual feedback for sending, sent, delivered, and failed states

### Credit Management
- **Credit Display**: Shows current credit balance prominently
- **Cost Preview**: Displays the cost of the next message
- **Free Messages**: First 3 messages in each chat are free
- **Low Credit Warning**: Alerts when credits are running low
- **Insufficient Credits**: Automatically shows payment modal when credits are insufficient
- **Dynamic Pricing**: Calculates cost based on:
  - Message number (first 3 free)
  - Time of day (peak/off-peak multipliers)
  - User tier (discounts for higher tiers)
  - Featured profile status (premium multiplier)

### Message History
- **Virtual Scrolling**: Efficient rendering of long message histories
- **Pagination**: Load more messages as user scrolls up
- **Auto-Scroll**: Automatically scrolls to newest messages
- **Message Metadata**: Shows timestamp, edit status, and credits charged

### User Experience
- **Glassmorphism Design**: Beautiful glass-effect UI matching the design system
- **Responsive Layout**: Works on all screen sizes
- **Loading States**: Smooth loading indicators
- **Error Handling**: User-friendly error messages
- **Payment Integration**: Seamless credit purchase flow

## Technical Implementation

### Components Used
- `ChatBubble`: Displays individual messages with sender differentiation
- `MessageInput`: Text input with character limit and send button
- `TypingIndicator`: Animated typing indicator
- `CreditIndicator`: Shows credit balance and next message cost
- `PaymentModal`: Credit purchase interface
- `GlassCard`: Container with glassmorphism effect
- `LoadingSpinner`: Loading state indicator

### Hooks Used
- `useMessages`: Fetches and manages message history
- `useCredits`: Manages user credit balance
- `useRealtimeMessages`: Real-time message subscriptions
- `useSendMessage`: Sends messages with error handling
- `useToast`: Toast notifications

### API Routes
- `GET /api/chats/[id]`: Fetch chat details with fictional user info
- `GET /api/chats/[id]/messages`: Fetch message history with pagination
- `POST /api/messages/send`: Send a new message

### Real-Time Features
- **Message Subscriptions**: Listen for new messages via Supabase Realtime
- **Typing Indicators**: Broadcast and receive typing status
- **Credit Updates**: Real-time credit balance updates
- **Presence Detection**: Track user online/offline status

## Requirements Satisfied

### 4.1-4.5 (Real-Time Chat)
- ✅ Real-time message delivery within 100ms
- ✅ WebSocket connection with heartbeat
- ✅ Typing indicators for both users
- ✅ Message status tracking

### 6.1-6.5 (Message Cost)
- ✅ First 3 messages free
- ✅ Peak hour multiplier (8pm-2am EAT)
- ✅ Off-peak multiplier (2am-8am EAT)
- ✅ Featured profile multiplier
- ✅ User tier discounts

### 7.1-7.5 (Race Condition Prevention)
- ✅ Optimistic updates with rollback on failure
- ✅ Credit balance validation before sending
- ✅ Transaction safety in backend
- ✅ Error handling for insufficient credits

## Usage

### Navigation
Users can access the chat page by:
1. Clicking "Chat" on a fictional profile card
2. Selecting an existing chat from their chat list
3. Direct URL: `/chat/[chatId]`

### Sending Messages
1. Type message in the input field
2. Press Enter or click send button
3. Message appears immediately (optimistic update)
4. Credits are deducted after server confirmation
5. If insufficient credits, payment modal appears

### Purchasing Credits
1. Click "Buy Credits" or "Top Up" button
2. Select a credit package
3. Complete payment via Paystack
4. Credits are added automatically
5. Continue chatting

## Error Handling

### Chat Not Found
- Shows error message with option to browse profiles
- Redirects to discover page

### Insufficient Credits
- Displays warning in credit indicator
- Shows payment modal automatically
- Prevents message sending until credits purchased

### Network Errors
- Shows toast notification
- Marks message as failed
- Allows retry

### Closed Chat
- Disables message input
- Shows chat status and close reason
- Prevents new messages

## Future Enhancements

- [ ] Message reactions (like, love, etc.)
- [ ] Media attachments (images, videos, voice)
- [ ] Message search
- [ ] Chat export
- [ ] Read receipts
- [ ] Message deletion
- [ ] Block user functionality
- [ ] Report inappropriate content

## Testing

### Manual Testing
1. Create a chat with a fictional profile
2. Send free messages (first 3)
3. Send paid messages and verify credit deduction
4. Test insufficient credits flow
5. Test real-time message delivery
6. Test typing indicators
7. Test payment modal
8. Test error states

### Edge Cases
- Chat with 0 credits
- Chat with closed status
- Network disconnection
- Rapid message sending
- Long messages (character limit)
- Special characters and emojis

## Performance Considerations

- Virtual scrolling for long message histories
- Debounced typing indicators
- Optimistic updates for instant feedback
- Efficient real-time subscriptions
- Lazy loading of older messages
- Image optimization for profile pictures

## Security

- User authentication required
- Chat access validation (user must own the chat)
- RLS policies enforce data access
- Input sanitization
- XSS prevention
- Rate limiting on message sending
