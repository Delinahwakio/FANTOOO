# Operator Chat Page

## Overview

The operator chat page provides a comprehensive three-panel interface for operators to manage conversations between real users and fictional profiles. This interface is designed to maximize efficiency and maintain character consistency.

## Route

```
/operator/chat/[chatId]
```

## Features

### Three-Panel Layout

#### Left Panel - Real User Profile
- **User Information Display**
  - Profile picture with online status indicator
  - Display name and username
  - Age, gender, and location
  - Current credit balance
  - User tier badge (Free, Bronze, Silver, Gold, Platinum)
  - Bio (if available)

- **Editable Notes**
  - Add and save notes about the user
  - Track preferences, conversation style, interests
  - Auto-save with status indicators
  - Character count (max 2000 characters)

#### Center Panel - Chat Interface
- **Chat Header**
  - Shows conversation participants (Real User ↔ Fictional User)
  - Chat ID for reference
  - Message count

- **Message History**
  - Real-time message display
  - Virtual scrolling for performance
  - Typing indicators
  - Message status (sent, delivered, read)
  - Edit indicators for modified messages

- **Message Input**
  - Text input for composing messages as fictional user
  - Emoji picker integration
  - Character limit enforcement
  - Send button with loading state

#### Right Panel - Fictional User Profile
- **Character Information**
  - Profile picture with featured badge (if applicable)
  - Name, age, and location
  - Response style badge (flirty, romantic, friendly, intellectual, playful)
  - Personality traits
  - Interests

- **Personality Guidelines**
  - Detailed character guidelines
  - Response style instructions
  - Character consistency tips

- **Quick Reply Templates**
  - Pre-written response templates
  - One-click insertion into message input
  - Categorized by type (greeting, flirty, goodbye, etc.)
  - Expandable for long templates

- **Character Notes**
  - Add notes about portraying the character
  - Save character-specific observations
  - Track successful conversation patterns

### Assignment Information

The page header displays:
- Assignment number (how many times this chat has been assigned)
- Previous operators count (if reassigned)
- Current chat status
- Flags (if any issues are flagged)

### Real-Time Features

- **Live Message Updates**: Messages appear instantly via WebSocket
- **Typing Indicators**: Shows when real user is typing
- **Status Updates**: Chat status changes reflected in real-time
- **Presence Detection**: Online/offline status of real user

## API Endpoints

### GET /api/operator/chats/[chatId]
Fetches complete chat data including:
- Chat details and metadata
- Real user profile
- Fictional user profile with guidelines and templates
- Assignment information (current operator, previous operators)

**Response:**
```json
{
  "chat": {
    "id": "uuid",
    "status": "active",
    "message_count": 15,
    "operator_notes": "User prefers casual conversation",
    "flags": [],
    ...
  },
  "realUser": {
    "id": "uuid",
    "display_name": "John Doe",
    "username": "johndoe",
    "age": 28,
    "credits": 150,
    "user_tier": "gold",
    ...
  },
  "fictionalUser": {
    "id": "uuid",
    "name": "Emma",
    "response_style": "flirty",
    "personality_guidelines": "...",
    "response_templates": {
      "greeting": "Hey! How's your day going?",
      ...
    },
    ...
  },
  "assignmentInfo": {
    "currentOperator": "Jane Smith",
    "previousOperators": ["Mike Johnson"],
    "assignmentCount": 2
  }
}
```

### PATCH /api/operator/chats/[chatId]/notes
Saves operator notes about users or characters.

**Request Body:**
```json
{
  "notes": "User enjoys talking about travel and photography",
  "type": "real_user" // or "fictional_user"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notes saved successfully"
}
```

## Security

- **Authentication Required**: Operator must be logged in
- **Assignment Verification**: Operator must be assigned to the chat
- **RLS Policies**: Database-level access control
- **Activity Tracking**: All actions logged with timestamps

## User Experience

### Loading States
- Full-page spinner while fetching chat data
- Inline loading for message sending
- Auto-save indicators for notes

### Error Handling
- Chat not found: Redirects to waiting room
- Not assigned: Shows error with back button
- Network errors: Toast notifications with retry options
- Failed message send: Error indication with retry

### Navigation
- Back button to return to waiting room
- Preserves chat state on navigation
- Breadcrumb showing current location

## Performance Optimizations

- **Virtual Scrolling**: Efficient rendering of long message histories
- **Optimistic Updates**: Messages appear immediately before server confirmation
- **Debounced Auto-save**: Notes saved after typing stops
- **Lazy Loading**: Components loaded on demand
- **Memoization**: Prevents unnecessary re-renders

## Accessibility

- Keyboard navigation support
- Screen reader friendly labels
- Focus management for modals
- High contrast mode support
- ARIA labels for interactive elements

## Requirements Satisfied

This implementation satisfies the following requirements:

### Requirement 4.1-4.5: Real-Time Chat
- ✅ Sub-100ms message delivery
- ✅ WebSocket connections with heartbeat
- ✅ Typing indicators
- ✅ Message status tracking

### Requirement 25.1-25.5: Operator Dashboard
- ✅ Three-panel layout (real user | chat | fictional user)
- ✅ Real user profile with editable notes
- ✅ Fictional user profile with personality guidelines
- ✅ Response templates for quick replies
- ✅ Assignment information display
- ✅ Save notes functionality for both profiles

## Testing

### Manual Testing Checklist
- [ ] Load chat page with valid chat ID
- [ ] Verify all three panels display correctly
- [ ] Send message as fictional user
- [ ] Receive real-time messages from real user
- [ ] Save notes about real user
- [ ] Save notes about fictional character
- [ ] Use quick reply template
- [ ] Verify typing indicators work
- [ ] Test back navigation to waiting room
- [ ] Test with chat not assigned to operator (should show error)
- [ ] Test with invalid chat ID (should show error)

### Edge Cases
- Chat closed while operator is viewing
- Operator reassigned during conversation
- Network disconnection and reconnection
- Very long message histories (1000+ messages)
- Multiple operators viewing same chat (shouldn't happen but handle gracefully)

## Future Enhancements

- [ ] Voice message support
- [ ] Image/video sharing
- [ ] Message translation for multilingual support
- [ ] AI-powered response suggestions
- [ ] Sentiment analysis indicators
- [ ] User mood detection
- [ ] Conversation analytics
- [ ] Performance metrics per chat
- [ ] Keyboard shortcuts for common actions
- [ ] Split-screen mode for multiple chats
