# Chat Components

Real-time chat UI components for the Fantooo platform. These components handle message display, typing indicators, and message status with support for virtual scrolling and animations.

## Components

### ChatBubble

Displays a single message with sender differentiation.

**Features:**
- Sender-based styling (real user vs fictional user)
- Support for multiple content types (text, image, video, voice, gif)
- Message status indicators
- Edit indicators
- Credit cost display
- Timestamp formatting

**Usage:**
```tsx
import { ChatBubble } from '@/lib/components/chat';

<ChatBubble
  content="Hello there!"
  senderType="real"
  status="sent"
  timestamp="2024-01-15T10:30:00Z"
  creditsCharged={1}
/>
```

**Props:**
- `content` (string, required): Message text content
- `senderType` ('real' | 'fictional', required): Who sent the message
- `contentType` ('text' | 'image' | 'voice' | 'video' | 'gif'): Type of content
- `mediaUrl` (string): URL for media content
- `status` (MessageStatusType): Delivery status
- `timestamp` (string, required): ISO timestamp
- `isEdited` (boolean): Whether message was edited
- `isFreeMessage` (boolean): Whether this was a free message
- `creditsCharged` (number): Credits charged for this message
- `className` (string): Additional CSS classes

### MessageList

Displays a scrollable list of messages with virtual scrolling for performance.

**Features:**
- Virtual scrolling for large message lists (50+ messages)
- Auto-scroll to bottom on new messages
- Infinite scroll support (load more on scroll to top)
- Typing indicator integration
- Empty state display
- Smooth animations

**Usage:**
```tsx
import { MessageList } from '@/lib/components/chat';

<MessageList
  messages={messages}
  isTyping={isOperatorTyping}
  typingUserName="Sarah"
  onScrollToTop={loadMoreMessages}
  showStatus
/>
```

**Props:**
- `messages` (Message[], required): Array of message objects
- `isTyping` (boolean): Show typing indicator
- `typingUserName` (string): Name of person typing
- `className` (string): Additional CSS classes
- `onScrollToTop` (function): Callback for loading more messages
- `autoScroll` (boolean): Auto-scroll to bottom (default: true)
- `showStatus` (boolean): Show message status indicators (default: false)

**Message Interface:**
```typescript
interface Message {
  id: string;
  chatId: string;
  senderType: 'real' | 'fictional';
  content: string;
  contentType?: 'text' | 'image' | 'voice' | 'video' | 'gif';
  mediaUrl?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: string;
  isEdited?: boolean;
  isFreeMessage?: boolean;
  creditsCharged?: number;
}
```

### MessageStatus

Displays message delivery status with icons.

**Features:**
- Visual status indicators (sending, sent, delivered, read, failed)
- Animated sending state
- Color-coded status
- Optional text labels
- Tooltip support

**Usage:**
```tsx
import { MessageStatus } from '@/lib/components/chat';

<MessageStatus status="sent" showText />
<MessageStatus status="read" />
```

**Props:**
- `status` (MessageStatusType, required): Current message status
- `className` (string): Additional CSS classes
- `showText` (boolean): Show status text alongside icon (default: false)

**Status Types:**
- `sending`: Animated spinner, gray
- `sent`: Single checkmark, gray
- `delivered`: Double checkmark, blue
- `read`: Filled double checkmark, blue
- `failed`: Warning icon, red

### TypingIndicator

Animated typing indicator to show when someone is typing.

**Features:**
- Three animated dots
- Smooth pulsing animation
- Optional user name display
- Glassmorphism styling

**Usage:**
```tsx
import { TypingIndicator } from '@/lib/components/chat';

<TypingIndicator userName="Sarah" />
<TypingIndicator />
```

**Props:**
- `userName` (string): Name of person typing
- `className` (string): Additional CSS classes

## Performance Optimization

### Virtual Scrolling

The `MessageList` component automatically uses virtual scrolling for lists with 50+ messages. This ensures smooth performance even with thousands of messages by only rendering visible items.

**How it works:**
- Calculates visible area
- Renders only visible messages + overscan
- Dynamically updates as user scrolls
- Maintains scroll position during updates

### Auto-Scroll Behavior

The component intelligently handles auto-scrolling:
- Scrolls to bottom on initial load
- Auto-scrolls on new messages (if enabled)
- Preserves scroll position when loading older messages
- Smooth scroll animations

## Styling

All components use the Fantooo design system:

**Real User Messages:**
- Gradient passion background (red)
- White text
- Right-aligned
- Rounded bottom-right corner removed

**Fictional User Messages:**
- Glass elevated background
- Dark text
- Left-aligned
- Rounded bottom-left corner removed

**Animations:**
- Fade in on mount
- Smooth transitions
- Bounce animation for typing dots

## Integration Example

Complete chat interface example:

```tsx
import { useState, useEffect } from 'react';
import { MessageList, Message } from '@/lib/components/chat';

function ChatInterface({ chatId }: { chatId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Load messages
  useEffect(() => {
    loadMessages(chatId).then(setMessages);
  }, [chatId]);

  // Subscribe to new messages
  useEffect(() => {
    const subscription = subscribeToMessages(chatId, (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => subscription.unsubscribe();
  }, [chatId]);

  // Subscribe to typing indicator
  useEffect(() => {
    const subscription = subscribeToTyping(chatId, setIsTyping);
    return () => subscription.unsubscribe();
  }, [chatId]);

  const loadMoreMessages = async () => {
    const olderMessages = await loadMessages(chatId, {
      before: messages[0]?.id,
    });
    setMessages((prev) => [...olderMessages, ...prev]);
  };

  return (
    <div className="h-screen flex flex-col">
      <MessageList
        messages={messages}
        isTyping={isTyping}
        typingUserName="Sarah"
        onScrollToTop={loadMoreMessages}
        showStatus
      />
    </div>
  );
}
```

## Accessibility

All components follow accessibility best practices:

- Semantic HTML structure
- ARIA labels where appropriate
- Keyboard navigation support
- Screen reader friendly
- High contrast text
- Focus indicators

## Requirements Mapping

These components fulfill the following requirements:

**Requirement 4.1-4.5 (Real-Time Chat):**
- ✅ Real-time message display
- ✅ Typing indicators
- ✅ Message status tracking
- ✅ Sender differentiation
- ✅ Performance optimization for scale

## Dependencies

- `@tanstack/react-virtual`: Virtual scrolling
- `@/lib/utils/cn`: Class name utility
- Design system components and utilities

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 14+, Chrome Android

## Testing

Components are designed to be easily testable:

```tsx
import { render, screen } from '@testing-library/react';
import { ChatBubble } from '@/lib/components/chat';

test('renders message content', () => {
  render(
    <ChatBubble
      content="Hello"
      senderType="real"
      timestamp="2024-01-15T10:30:00Z"
    />
  );
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

## Future Enhancements

Potential improvements for future iterations:

- Message reactions (emoji)
- Reply/quote functionality
- Message search and filtering
- Read receipts per user
- Message deletion UI
- Link preview cards
- File upload progress
- Voice message waveforms
- Video thumbnails
- GIF picker integration


### MessageInput

A text input component for composing and sending chat messages with auto-resize and typing indicators.

**Features:**
- Auto-resizing textarea (up to 200px height)
- Character limit with visual feedback
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)
- Automatic typing indicators (start/stop detection)
- Loading and disabled states
- Send button with visual feedback
- Character count display

**Usage:**
```tsx
import { MessageInput } from '@/lib/components/chat';

<MessageInput
  onSend={handleSendMessage}
  placeholder="Type a message..."
  maxLength={1000}
  onTypingStart={() => broadcastTyping(true)}
  onTypingEnd={() => broadcastTyping(false)}
/>
```

**Props:**
- `onSend` (function, required): Callback when message is sent
- `placeholder` (string): Placeholder text (default: "Type a message...")
- `maxLength` (number): Maximum character limit (default: 1000)
- `disabled` (boolean): Disable input
- `isLoading` (boolean): Show loading state
- `className` (string): Additional CSS classes
- `onTypingStart` (function): Callback when user starts typing
- `onTypingEnd` (function): Callback when user stops typing (2s timeout)
- `showCharacterCount` (boolean): Show character count (default: true)
- `autoFocus` (boolean): Auto-focus input on mount

### EmojiPicker

A lightweight emoji picker with common emoji categories.

**Features:**
- 6 emoji categories (Smileys, Hearts, Gestures, Activities, Food, Travel)
- Popover interface with smooth animations
- Click outside to close
- Configurable position (top/bottom)
- Category tabs with visual indicators
- 48+ emojis per category

**Usage:**
```tsx
import { EmojiPicker } from '@/lib/components/chat';

<EmojiPicker
  onEmojiSelect={(emoji) => appendToMessage(emoji)}
  position="top"
/>
```

**Props:**
- `onEmojiSelect` (function, required): Callback when emoji is selected
- `className` (string): Additional CSS classes for container
- `buttonClassName` (string): Additional CSS classes for button
- `position` ('top' | 'bottom'): Position of picker relative to button (default: 'top')

**Emoji Categories:**
- Smileys & Emotion: 😊 (48 emojis)
- Hearts & Love: ❤️ (24 emojis)
- Gestures: 👋 (32 emojis)
- Activities: ⚽ (32 emojis)
- Food & Drink: 🍕 (32 emojis)
- Travel & Places: ✈️ (32 emojis)

### MediaUpload

A component for uploading images and videos with validation and preview.

**Features:**
- File type validation (images and/or videos)
- File size validation (configurable max size)
- Optional preview before upload
- Error handling with user-friendly messages
- Loading states
- Supports drag-and-drop (via native file input)

**Usage:**
```tsx
import { MediaUpload } from '@/lib/components/chat';

<MediaUpload
  onUpload={handleMediaUpload}
  acceptedTypes={['image', 'video']}
  maxSizeInMB={10}
  showPreview
/>
```

**Props:**
- `onUpload` (function, required): Callback when file is selected
- `acceptedTypes` (MediaType[]): Array of accepted types (default: ['image', 'video'])
- `maxSizeInMB` (number): Maximum file size in MB (default: 10)
- `disabled` (boolean): Disable upload
- `className` (string): Additional CSS classes for container
- `buttonClassName` (string): Additional CSS classes for button
- `showPreview` (boolean): Show preview after selection (default: false)

**MediaType:**
- `'image'`: Accepts all image formats (image/*)
- `'video'`: Accepts all video formats (video/*)

### CreditIndicator

Displays the user's remaining credits with optional cost preview and purchase button.

**Features:**
- 3 display variants (compact, default, detailed)
- Low credit warnings (configurable threshold)
- Insufficient credit alerts
- Next message cost preview
- KES conversion display
- Purchase button integration
- 3 size options (sm, md, lg)

**Usage:**
```tsx
import { CreditIndicator } from '@/lib/components/chat';

<CreditIndicator
  credits={50}
  messageCost={2}
  showKES
  onPurchaseClick={() => router.push('/credits')}
  variant="detailed"
/>
```

**Props:**
- `credits` (number, required): Current credit balance
- `messageCost` (number): Cost of the next message
- `showKES` (boolean): Show KES equivalent (default: false)
- `showWarning` (boolean): Show warning when credits are low (default: true)
- `warningThreshold` (number): Credit threshold for warning (default: 10)
- `onPurchaseClick` (function): Callback when purchase button is clicked
- `className` (string): Additional CSS classes
- `size` ('sm' | 'md' | 'lg'): Size variant (default: 'md')
- `variant` ('default' | 'compact' | 'detailed'): Display variant (default: 'default')

**Variants:**
- `compact`: Just the credit number with icon
- `default`: Credit balance with optional message cost and purchase button
- `detailed`: Full breakdown with KES conversion, warnings, and purchase button

**Color States:**
- Normal: Trust blue (sufficient credits)
- Low: Luxury purple (below warning threshold)
- Insufficient: Passion red (cannot afford next message)

## Complete Chat Input Interface

Combine all components for a full-featured chat input:

```tsx
import {
  MessageInput,
  EmojiPicker,
  MediaUpload,
  CreditIndicator,
} from '@/lib/components/chat';

function ChatInputArea({ 
  userCredits, 
  nextMessageCost,
  onSendMessage,
  onMediaUpload,
  onPurchaseCredits 
}) {
  const [messageContent, setMessageContent] = useState('');

  const handleEmojiSelect = (emoji: string) => {
    setMessageContent((prev) => prev + emoji);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Credit Display */}
      <CreditIndicator
        credits={userCredits}
        messageCost={nextMessageCost}
        showKES
        onPurchaseClick={onPurchaseCredits}
        variant="detailed"
      />

      {/* Input Area with Actions */}
      <div className="flex items-end gap-2">
        <EmojiPicker
          onEmojiSelect={handleEmojiSelect}
          position="top"
        />
        <MediaUpload
          onUpload={onMediaUpload}
          acceptedTypes={['image', 'video']}
          maxSizeInMB={10}
        />
        <div className="flex-1">
          <MessageInput
            onSend={onSendMessage}
            placeholder="Type your message..."
            maxLength={1000}
            disabled={userCredits < nextMessageCost}
            onTypingStart={() => broadcastTyping(true)}
            onTypingEnd={() => broadcastTyping(false)}
          />
        </div>
      </div>

      {/* Insufficient Credits Warning */}
      {userCredits < nextMessageCost && (
        <div className="p-3 bg-passion-50 border border-passion-200 rounded-lg text-sm text-passion-700">
          <strong>Insufficient credits!</strong> You need {nextMessageCost} credits to send this message.
        </div>
      )}
    </div>
  );
}
```

## Credit System Integration

The components integrate seamlessly with the credit calculation system:

```typescript
import { 
  calculateMessageCost, 
  FREE_MESSAGES_COUNT,
  getMessageCostBreakdown 
} from '@/lib/utils/credits';

// Calculate cost for next message
const messageCost = calculateMessageCost(
  messageNumber,
  userTier,
  isFeaturedProfile,
  new Date()
);

// Get detailed breakdown
const breakdown = getMessageCostBreakdown(
  messageNumber,
  userTier,
  isFeaturedProfile,
  new Date()
);

// Display in CreditIndicator
<CreditIndicator
  credits={userCredits}
  messageCost={messageCost}
  showKES
/>
```

**Credit Calculation Features:**
- First 3 messages are free
- Time-based multipliers (peak/off-peak hours in EAT timezone)
- Featured profile multipliers (1.5x)
- User tier discounts (5-20% based on tier)
- 1 credit = 10 KES

## Demo

View the comprehensive demo showcasing all components:

```tsx
import MessageInputDemo from '@/lib/components/chat/__demo__/MessageInputDemo';
```

The demo includes:
- Complete chat input interface
- All component variants
- Interactive examples
- Usage instructions
- Credit system integration

## Requirements Mapping (Updated)

These components fulfill the following requirements:

**Requirement 4.1-4.5 (Real-Time Chat):**
- ✅ Real-time message display
- ✅ Typing indicators
- ✅ Message status tracking
- ✅ Sender differentiation
- ✅ Performance optimization for scale
- ✅ Message input with character limits
- ✅ Emoji support
- ✅ Media upload support

**Requirement 6.1-6.5 (Message Cost Calculation):**
- ✅ Credit indicator display
- ✅ Message cost preview
- ✅ Free message tracking (first 3)
- ✅ Time-based pricing display
- ✅ Featured profile pricing
- ✅ User tier discounts
- ✅ KES conversion display
- ✅ Low credit warnings
- ✅ Insufficient credit handling

## Updated Future Enhancements

Additional potential improvements:

- GIF picker integration (similar to emoji picker)
- Sticker support
- Rich text formatting (bold, italic, etc.)
- Link previews
- Voice message recording
- Video message recording
- Message drafts (auto-save)
- Mention/tag support (@username)
- Command shortcuts (/gif, /sticker)
- Custom emoji upload
