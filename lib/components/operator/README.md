# Operator Components

This directory contains specialized components for the operator interface, designed to help operators manage conversations between real users and fictional profiles efficiently.

## Components

### ThreePanelLayout

The main operator chat interface with three panels:
- **Left Panel**: Real user profile with editable notes
- **Center Panel**: Chat messages and input
- **Right Panel**: Fictional user profile with personality guidelines and response templates

```tsx
import { ThreePanelLayout } from '@/lib/components/operator';

<ThreePanelLayout
  chatId={chatId}
  realUser={realUser}
  fictionalUser={fictionalUser}
  messages={messages}
  operatorNotes={operatorNotes}
  onSendMessage={handleSendMessage}
  onSaveRealUserNotes={handleSaveRealUserNotes}
  onSaveFictionalUserNotes={handleSaveFictionalUserNotes}
  onTemplateSelect={handleTemplateSelect}
  isTyping={isRealUserTyping}
/>
```

**Features:**
- Three-panel responsive layout
- Real-time message display
- Integrated note-taking for both user types
- Response template integration
- User profile information display
- Credit and tier information
- Typing indicators

### ProfileNotes

Editable notes component for operators to save information about users or fictional profiles.

```tsx
import { ProfileNotes } from '@/lib/components/operator';

<ProfileNotes
  title="Notes about User"
  notes={userNotes}
  onSave={handleSaveNotes}
  placeholder="Add notes about this user's preferences..."
  maxLength={2000}
/>
```

**Features:**
- Auto-save indication
- Character count with warning
- Save/Cancel buttons
- Success/Error feedback
- Textarea with resize capability

### QueueDisplay

Displays the chat assignment queue with priority indicators.

```tsx
import { QueueDisplay } from '@/lib/components/operator';

<QueueDisplay
  queueItems={queueItems}
  onAcceptChat={handleAcceptChat}
  isLoading={isLoading}
/>
```

**Features:**
- Priority-based sorting (urgent, high, normal, low)
- Visual priority indicators with colors
- Wait time display
- User tier and lifetime value
- Required specializations
- Attempt count tracking
- Accept chat action

### AvailabilityToggle

Toggle for operators to set their availability status with validation.

```tsx
import { AvailabilityToggle } from '@/lib/components/operator';

<AvailabilityToggle
  isAvailable={isAvailable}
  activeChatsCount={activeChatsCount}
  onToggle={handleToggleAvailability}
/>
```

**Features:**
- Visual toggle switch
- Active chat count display
- Validation preventing offline with active chats
- Warning modal with instructions
- Loading state during toggle
- Error handling

### ResponseTemplates

Quick reply templates for operators to maintain character consistency.

```tsx
import { ResponseTemplates } from '@/lib/components/operator';

<ResponseTemplates
  templates={{
    greeting: "Hey! How's your day going?",
    flirty: "You're making me smile 😊",
    goodbye: "Talk to you soon! 💕"
  }}
  onSelect={handleTemplateSelect}
/>
```

**Features:**
- Template categorization
- Expand/collapse for long templates
- One-click template insertion
- Visual feedback on selection
- Scrollable template list
- Template preview

## Design Patterns

### Glassmorphism
All operator components use the glassmorphism design system with:
- `GlassCard` for containers
- `GlassButton` for actions
- Consistent color palette (passion, luxury, trust, neutral)

### Responsive Layout
Components are designed to work in various layouts:
- Three-panel layout for desktop
- Collapsible panels for tablets
- Stacked layout for mobile

### Real-time Updates
Components support real-time data updates:
- Message streaming
- Queue updates
- Availability changes
- Note synchronization

### Error Handling
All components include:
- Loading states
- Error messages
- Validation feedback
- Retry mechanisms

## Requirements Mapping

These components fulfill the following requirements:

**Requirement 11.1-11.5 (Operator Availability)**
- AvailabilityToggle enforces availability rules
- Prevents going offline with active chats
- Visual status indicators

**Requirement 25.1-25.5 (Operator Dashboard)**
- ThreePanelLayout provides the main operator interface
- ProfileNotes enables operator note-taking
- QueueDisplay shows assignment queue
- ResponseTemplates support quick replies

## Usage Example

Complete operator waiting room page:

```tsx
import {
  AvailabilityToggle,
  QueueDisplay,
} from '@/lib/components/operator';

export default function OperatorWaitingRoom() {
  const { operator, queueItems, isLoading } = useOperatorData();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <AvailabilityToggle
        isAvailable={operator.is_available}
        activeChatsCount={operator.current_chat_count}
        onToggle={handleToggleAvailability}
      />

      <QueueDisplay
        queueItems={queueItems}
        onAcceptChat={handleAcceptChat}
        isLoading={isLoading}
      />
    </div>
  );
}
```

Complete operator chat page:

```tsx
import { ThreePanelLayout } from '@/lib/components/operator';

export default function OperatorChatPage({ chatId }: { chatId: string }) {
  const { chat, messages, realUser, fictionalUser } = useChatData(chatId);

  return (
    <ThreePanelLayout
      chatId={chatId}
      realUser={realUser}
      fictionalUser={fictionalUser}
      messages={messages}
      operatorNotes={chat.operator_notes}
      onSendMessage={handleSendMessage}
      onSaveRealUserNotes={handleSaveRealUserNotes}
      onSaveFictionalUserNotes={handleSaveFictionalUserNotes}
      isTyping={isRealUserTyping}
    />
  );
}
```

## Testing

Each component includes:
- TypeScript type safety
- PropTypes validation
- Accessibility features (ARIA labels, keyboard navigation)
- Responsive design testing
- Error boundary integration

## Performance

Optimizations include:
- Virtual scrolling for long lists (QueueDisplay)
- Debounced save operations (ProfileNotes)
- Memoized callbacks
- Lazy loading for templates
- Optimistic UI updates
