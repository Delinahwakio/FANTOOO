# Admin Chat Management Architecture

## Component Hierarchy

```
AdminChatsPage
├── Header Section
│   ├── Title & Description
│   └── Refresh Button
│
├── Escalated Chats Alert (conditional)
│   ├── Alert Icon
│   ├── Count & Message
│   └── View Escalated Button
│
├── Search & Filter Bar
│   ├── Search Input (username/profile name)
│   ├── Status Filter Buttons (all, active, idle, escalated, closed)
│   └── Refresh Button
│
├── Chat Grid
│   └── Chat Cards (map over filteredChats)
│       ├── Status Indicator (colored dot)
│       ├── Timeout Warning Icon (conditional)
│       ├── User Info (username ↔ fictional name)
│       ├── Metrics (messages, credits, assignments)
│       ├── Operator Name (conditional)
│       └── Flag Badges (conditional)
│
├── Chat Inspection View (conditional - when chat selected)
│   ├── Header
│   │   ├── Title & Chat Info
│   │   ├── History Button
│   │   ├── Reassign Button
│   │   └── Close Button
│   │
│   ├── Statistics Grid (5 metrics)
│   │   ├── Messages Count
│   │   ├── Credits Spent
│   │   ├── Assignments Count
│   │   ├── Status
│   │   └── Last Activity
│   │
│   ├── Three-Panel Layout
│   │   ├── Left Panel: Real User Info
│   │   │   ├── Username
│   │   │   ├── Credits
│   │   │   ├── Tier
│   │   │   └── Location
│   │   │
│   │   ├── Center Panel: Messages
│   │   │   └── Message List (map over messages)
│   │   │       ├── Sender Type Badge
│   │   │       ├── Edit Button
│   │   │       ├── Edit Indicator (if edited)
│   │   │       ├── Message Content (or Edit Form)
│   │   │       ├── Timestamp
│   │   │       └── Credits Charged
│   │   │
│   │   └── Right Panel: Fictional User Info
│   │       ├── Name & Age
│   │       ├── Response Style
│   │       ├── Featured Status
│   │       └── Current Operator Info
│   │
│   └── Notes Section (conditional)
│       ├── Operator Notes
│       └── Admin Notes
│
├── Reassign Modal (conditional)
│   ├── Title
│   ├── Operator Select Dropdown
│   ├── Reason Textarea
│   ├── Reassign Button
│   └── Cancel Button
│
├── Edit History Modal (conditional)
│   ├── Header with Close Button
│   └── Edit History List (map over editHistory)
│       ├── Editor Info & Timestamp
│       ├── Edit Reason Badge
│       ├── Original Content (red background)
│       └── New Content (green background)
│
└── Reassignment History Modal (conditional)
    ├── Header with Close Button
    └── Reassignment List (map over reassignmentHistory)
        ├── Reassignment Icon
        ├── Type (Reassigned/Initially Assigned)
        ├── Timestamp
        └── Reason
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     AdminChatsPage                          │
│                                                             │
│  State:                                                     │
│  - chats: ChatWithDetails[]                                │
│  - selectedChat: ChatWithDetails | null                    │
│  - messages: Message[]                                     │
│  - operators: Operator[]                                   │
│  - editHistory: MessageEditHistory[]                       │
│  - reassignmentHistory: ChatReassignment[]                 │
│  - filters: searchQuery, statusFilter                      │
│  - modals: showReassignModal, showEditHistory, etc.       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Endpoints                          │
│                                                             │
│  GET /api/admin/chats                                      │
│  ├─ Fetches all chats with filters                        │
│  └─ Returns: ChatWithDetails[]                            │
│                                                             │
│  GET /api/admin/chats/[chatId]/messages                   │
│  ├─ Fetches messages for specific chat                    │
│  └─ Returns: Message[]                                    │
│                                                             │
│  POST /api/admin/chats/[chatId]/reassign                  │
│  ├─ Reassigns chat to new operator                        │
│  └─ Updates: chat, operator counts, notifications         │
│                                                             │
│  GET /api/admin/chats/[chatId]/reassignment-history       │
│  ├─ Fetches reassignment history                          │
│  └─ Returns: ChatReassignment[]                           │
│                                                             │
│  PATCH /api/admin/messages/[messageId]                    │
│  ├─ Edits message content                                 │
│  └─ Creates: edit history entry                           │
│                                                             │
│  GET /api/admin/messages/[messageId]/edit-history         │
│  ├─ Fetches edit history                                  │
│  └─ Returns: MessageEditHistory[]                         │
│                                                             │
│  GET /api/admin/operators?active=true                     │
│  ├─ Fetches available operators                           │
│  └─ Returns: Operator[]                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                        │
│                                                             │
│  Tables:                                                    │
│  - chats (with RLS policies)                              │
│  - messages (with RLS policies)                           │
│  - message_edit_history                                    │
│  - real_users                                              │
│  - fictional_users                                         │
│  - operators                                               │
│  - admins                                                  │
│  - admin_notifications                                     │
└─────────────────────────────────────────────────────────────┘
```

## User Interaction Flow

### 1. View Chats
```
User lands on /admin/chats
    ↓
loadChats() called
    ↓
GET /api/admin/chats
    ↓
Chats displayed in grid
    ↓
User can search/filter
    ↓
Grid updates with filteredChats
```

### 2. Inspect Chat
```
User clicks chat card
    ↓
handleChatClick(chat) called
    ↓
setSelectedChat(chat)
    ↓
loadChatMessages(chat.id)
    ↓
GET /api/admin/chats/[chatId]/messages
    ↓
Three-panel view displayed
    ↓
User can view all details
```

### 3. Edit Message
```
User clicks "Edit" on message
    ↓
setEditingMessageId(message.id)
    ↓
Edit form displayed inline
    ↓
User edits content & reason
    ↓
User clicks "Save"
    ↓
handleEditMessage() called
    ↓
PATCH /api/admin/messages/[messageId]
    ↓
Message updated in DB
    ↓
Edit history entry created
    ↓
Messages reloaded
    ↓
Success toast shown
```

### 4. View Edit History
```
User clicks "(edited)" on message
    ↓
loadEditHistory(message.id)
    ↓
GET /api/admin/messages/[messageId]/edit-history
    ↓
setShowEditHistory(true)
    ↓
Modal displays edit history
    ↓
User can see all edits
```

### 5. Reassign Chat
```
User clicks "Reassign" button
    ↓
setShowReassignModal(true)
    ↓
Modal displays with operator dropdown
    ↓
User selects operator & enters reason
    ↓
User clicks "Reassign Chat"
    ↓
handleReassignChat() called
    ↓
POST /api/admin/chats/[chatId]/reassign
    ↓
Chat assignment updated
    ↓
Operator counts updated
    ↓
Notification created
    ↓
Chats reloaded
    ↓
Success toast shown
```

### 6. View Reassignment History
```
User clicks "History" button
    ↓
loadReassignmentHistory(chat.id)
    ↓
GET /api/admin/chats/[chatId]/reassignment-history
    ↓
setShowReassignHistory(true)
    ↓
Modal displays reassignment history
    ↓
User can see all reassignments
```

## Security Flow

```
Every API Request
    ↓
Extract Supabase client
    ↓
Get authenticated user
    ↓
Check if user exists
    ↓
Query admins table
    ↓
Verify admin role & is_active
    ↓
Check permissions (if needed)
    ↓
Process request
    ↓
Apply RLS policies automatically
    ↓
Return response
```

## State Management

```
Component State (useState)
├── Data State
│   ├── chats (all chats)
│   ├── selectedChat (currently viewing)
│   ├── messages (current chat messages)
│   ├── operators (available operators)
│   ├── editHistory (message edit history)
│   └── reassignmentHistory (chat reassignment history)
│
├── UI State
│   ├── isLoading (loading indicator)
│   ├── searchQuery (search filter)
│   ├── statusFilter (status filter)
│   ├── editingMessageId (currently editing)
│   ├── showReassignModal (modal visibility)
│   ├── showEditHistory (modal visibility)
│   └── showReassignHistory (modal visibility)
│
└── Form State
    ├── editContent (message edit content)
    ├── editReason (message edit reason)
    ├── selectedOperatorId (reassignment operator)
    └── reassignReason (reassignment reason)
```

## Performance Considerations

1. **Lazy Loading**: Messages only loaded when chat is selected
2. **Filtered Rendering**: Only filtered chats rendered in grid
3. **Memoization Opportunities**: 
   - filteredChats calculation
   - escalatedChats calculation
   - Status color mapping
4. **Virtual Scrolling**: Can be added for large message lists
5. **Debouncing**: Can be added to search input
6. **Pagination**: Can be added for large chat lists

## Error Handling

```
Try-Catch Blocks
├── loadChats()
│   └── Shows error toast on failure
├── loadChatMessages()
│   └── Shows error toast on failure
├── loadEditHistory()
│   └── Shows error toast on failure
├── loadReassignmentHistory()
│   └── Shows error toast on failure
├── handleEditMessage()
│   └── Shows error toast on failure
└── handleReassignChat()
    ├── Validates inputs
    └── Shows error toast on failure
```

All errors are logged to console for debugging and shown to user via toast notifications.
