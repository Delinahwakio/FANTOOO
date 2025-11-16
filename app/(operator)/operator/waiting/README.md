# Operator Waiting Room

This page serves as the main dashboard for operators when they're not actively in a chat. It provides a comprehensive overview of their performance, availability status, active chats, and the assignment queue.

## Features

### 1. Availability Toggle
- Visual toggle switch to go online/offline
- Validates that operators cannot go offline with active chats
- Shows warning modal if attempting to go offline with active chats
- Real-time status indicator (green pulse when online)

### 2. Operator Statistics
Displays key performance metrics:
- **Messages Sent**: Total messages sent by the operator
- **Chats Handled**: Total number of chats handled
- **Quality Score**: Current quality score with color-coded warnings
- **Average Rating**: User satisfaction rating
- **Idle Incidents**: Number of times operator was idle
- **Reassignments**: Number of chat reassignments
- **Complaints**: Number of user complaints

### 3. Quality Score Warnings
- **Suspension Warning**: Orange alert when quality score is within 10 points of threshold
- **Suspended Account**: Red alert when account is suspended
- Shows suspension reason and duration

### 4. Active Chats Display
- Grid view of all currently assigned chats
- Shows real user and fictional profile information
- Displays message count and user tier
- Click to navigate to chat interface
- Shows current/max concurrent chats ratio

### 5. Assignment Queue
- Priority-based queue display (urgent, high, normal, low)
- Visual priority indicators with colors and icons
- Wait time for each chat
- User tier and lifetime value
- Required specializations
- Accept chat button for each queue item
- Auto-refreshes every 10 seconds

## Requirements Fulfilled

### Requirement 8.1-8.5 (Operator Assignment)
- Displays assignment queue with priority scoring
- Shows user tier and lifetime value
- Displays required specializations
- Allows operators to accept chats from queue

### Requirement 11.1-11.5 (Operator Availability)
- Availability toggle with validation
- Prevents going offline with active chats
- Shows active chat count
- Updates availability status in real-time

### Requirement 12.1-12.5 (Operator Performance)
- Displays quality score with warnings
- Shows suspension status and warnings
- Tracks idle incidents and reassignments
- Displays user ratings and complaints
- Auto-suspension warning when quality score is low

## Auto-Refresh Behavior

The page automatically refreshes data at different intervals:
- **Operator Stats**: Every 30 seconds
- **Assignment Queue**: Every 10 seconds
- **Active Chats**: Every 10 seconds

This ensures operators always have up-to-date information without manual refresh.

## API Endpoints Used

- `GET /api/operator/stats` - Fetch operator statistics
- `POST /api/operator/availability` - Toggle availability
- `GET /api/operator/queue` - Fetch assignment queue
- `GET /api/operator/chats` - Fetch active chats
- `POST /api/operator/accept-chat` - Accept a chat from queue

## Components Used

- `AvailabilityToggle` - Toggle availability with validation
- `QueueDisplay` - Display assignment queue
- `GlassCard` - Glassmorphism card containers
- `GlassButton` - Styled buttons
- `LoadingSpinner` - Loading states

## Navigation

- **Active Chats**: Click on any active chat card to navigate to the chat interface
- **Accept Chat**: Click "Accept Chat" button in queue to accept and navigate to chat

## Error Handling

- Shows error state if operator data fails to load
- Displays toast notifications for success/error actions
- Retry button on error state
- Graceful handling of missing data

## Responsive Design

- Desktop: Three-column grid for stats, multi-column for active chats
- Tablet: Two-column layouts
- Mobile: Single-column stacked layout

## Performance Optimizations

- React Query for data fetching and caching
- Automatic background refetching
- Optimistic updates for availability toggle
- Efficient re-renders with proper memoization

## Testing Considerations

To test this page:
1. Create an operator account via admin panel
2. Log in as operator at `/op-login`
3. Toggle availability on/off
4. Create test chats and add them to queue
5. Accept chats from queue
6. Verify auto-refresh behavior
7. Test with active chats (should prevent going offline)
8. Test quality score warnings by adjusting operator quality_score in database

## Future Enhancements

- Real-time notifications for new queue items
- Sound alerts for urgent priority chats
- Detailed performance analytics charts
- Export performance reports
- Customizable refresh intervals
- Keyboard shortcuts for common actions
