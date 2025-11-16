# Admin Chat Management Page

## Overview

The Admin Chat Management page (`/admin/chats`) provides comprehensive tools for monitoring, inspecting, and managing all platform chats in real-time. This implementation fulfills task 49 requirements including chat search/filtering, live chat grid, escalated chats queue, three-panel inspection view, message editing with audit trail, and manual chat reassignment.

## Features Implemented

### 1. Chat Search and Filtering
- **Search**: Search chats by real user username or fictional profile name
- **Status Filters**: Filter by status (all, active, idle, escalated, closed)
- **Real-time Updates**: Refresh button to reload chat data
- **Visual Indicators**: Status badges and timeout warnings

### 2. Live Chat Grid with Status Indicators
- **Grid Layout**: Responsive grid showing all chats
- **Status Colors**:
  - Green: Active chats
  - Yellow: Idle chats
  - Red: Escalated chats
  - Gray: Closed chats
- **Timeout Warnings**: Orange warning icon for chats approaching 24h timeout
- **Chat Metrics**: Message count, credits spent, assignment count
- **Operator Info**: Current operator name displayed
- **Flags**: Visual display of chat flags (if any)

### 3. Escalated Chats Queue
- **Alert Banner**: Prominent alert showing number of escalated chats
- **Quick Filter**: Button to quickly filter to escalated chats only
- **Priority Handling**: Escalated chats highlighted for immediate attention

### 4. Three-Panel Chat Inspection View
When a chat is selected, displays:

**Left Panel - Real User Info**:
- Username
- Credits balance
- User tier
- Location

**Center Panel - Messages**:
- Full message history with virtual scrolling
- Sender type differentiation (user vs fictional)
- Message timestamps
- Credits charged per message
- Edit indicators
- Inline message editing capability

**Right Panel - Fictional User Info**:
- Name and age
- Response style
- Featured status
- Current operator details (name, quality score)

### 5. Message Editing with Audit Trail
- **Inline Editing**: Click "Edit" on any message to edit content
- **Edit Reason**: Optional reason field for edit justification
- **Edit History**: View complete edit history for any message
- **Audit Trail**: Tracks:
  - Original content
  - New content
  - Editor (admin ID)
  - Editor type (admin/operator)
  - Edit reason
  - Timestamp
- **Edit Indicators**: "(edited)" label on edited messages

### 6. Reassignment History
- **View History**: Button to view all reassignments for a chat
- **History Details**:
  - From/to operator IDs
  - Reassignment reason
  - Reassigned by (admin ID)
  - Timestamp
- **Assignment Count**: Displayed in chat statistics

### 7. Manual Chat Reassignment
- **Reassign Modal**: Clean modal interface for reassignment
- **Operator Selection**: Dropdown showing available operators with:
  - Operator name
  - Quality score
  - Current chat count / max capacity
- **Filters**: Only shows available, non-suspended operators
- **Reason Required**: Mandatory reason field for accountability
- **Validation**: Checks operator capacity before reassignment
- **Notifications**: Success/error toasts for user feedback

## API Endpoints

### GET /api/admin/chats
Fetches all chats with related data (real user, fictional user, operator).

**Query Parameters**:
- `status`: Filter by chat status (optional)
- `search`: Search by username or profile name (optional)

**Response**: Array of chat objects with nested user/operator data

### GET /api/admin/chats/[chatId]/messages
Fetches all messages for a specific chat.

**Response**: Array of message objects ordered by creation time

### POST /api/admin/chats/[chatId]/reassign
Reassigns a chat to a different operator.

**Body**:
```json
{
  "operator_id": "uuid",
  "reason": "string"
}
```

**Response**: Success confirmation

### GET /api/admin/chats/[chatId]/reassignment-history
Fetches reassignment history for a chat.

**Response**: Array of reassignment records

### PATCH /api/admin/messages/[messageId]
Edits a message and creates audit trail entry.

**Body**:
```json
{
  "content": "string",
  "edit_reason": "string (optional)"
}
```

**Response**: Success confirmation

### GET /api/admin/messages/[messageId]/edit-history
Fetches edit history for a message.

**Response**: Array of edit history records

## Database Requirements

The implementation assumes the following tables exist:

1. **chats**: Core chat table with status, assignment info, metrics
2. **messages**: Messages table with edit tracking fields
3. **message_edit_history**: Audit trail for message edits
4. **real_users**: Real user profiles
5. **fictional_users**: Fictional user profiles
6. **operators**: Operator accounts
7. **admins**: Admin accounts
8. **admin_notifications**: For logging reassignments

## Security

- **Authentication**: All endpoints verify user authentication
- **Authorization**: All endpoints verify admin role
- **RLS Policies**: Relies on Supabase RLS for data access control
- **Audit Trail**: All edits and reassignments are logged

## Requirements Fulfilled

✅ **9.1-9.5 (Chat Reassignment)**:
- Manual reassignment with operator selection
- Reassignment history tracking
- Assignment count tracking
- Reason logging for accountability

✅ **13.1-13.5 (Message Editing)**:
- Message editing capability
- Original content preservation
- Edit history with audit trail
- Editor tracking (admin/operator)
- Edit reason logging

✅ **26.1-26.5 (Admin Chat Inspection)**:
- Live chat grid with real-time status
- Three-panel detailed view
- Search and filter functionality
- Escalated chats queue
- Timeout warnings
- Full message history access

## Usage

1. Navigate to `/admin/chats` (requires admin authentication)
2. Use search and filters to find specific chats
3. Click on any chat card to open detailed inspection view
4. In inspection view:
   - View three-panel layout with user/message/profile info
   - Click "Edit" on messages to modify content
   - Click "(edited)" to view edit history
   - Click "Reassign" to reassign chat to different operator
   - Click "History" to view reassignment history
5. Monitor escalated chats via alert banner

## Future Enhancements

- Real-time updates via WebSocket subscriptions
- Bulk operations (reassign multiple chats)
- Advanced search with full-text search
- Export chat transcripts
- Chat analytics and metrics
- Automated reassignment rules
- Message flagging and moderation tools
