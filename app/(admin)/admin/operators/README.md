# Operators Management Page

## Overview
Admin interface for managing operator accounts with comprehensive performance monitoring and control features.

## Location
`/admin/operators`

## Features

### 1. Operator Account Creation
- Create new operator accounts with email/password authentication
- Set skill level (junior, mid, senior, expert)
- Assign specializations (e.g., flirty, romantic, intellectual)
- Configure language preferences

### 2. Operator List Display
- Grid view of all operators with key metrics
- Real-time availability indicators
- Quality score visualization with color coding:
  - Green (≥80): Excellent performance
  - Yellow (60-79): Acceptable performance
  - Red (<60): Poor performance (suspension risk)
- Performance stats: chats handled, messages sent, user rating
- Skill level and specialization badges

### 3. Filtering and Search
- Search by name or email
- Filter by status:
  - All operators
  - Active operators only
  - Suspended operators only

### 4. Operator Details Modal
- Complete operator information
- Performance metrics dashboard:
  - Quality score
  - User rating
  - Chats handled
  - Messages sent
  - Idle incidents
  - Reassignment count
- Active chat count and capacity
- Last activity timestamp
- Suspension status and reason (if applicable)

### 5. Operator Suspension
**Requirement: 12.1-12.5 (Operator Performance)**
- Suspend operators for policy violations or poor performance
- Specify suspension reason (required)
- Set suspension duration in days (default: 7 days)
- Automatically forces operator offline
- Displays suspension details in operator profile

### 6. Operator Reactivation
- Reactivate suspended operators
- Clears suspension reason and end date
- Allows operator to log in again

### 7. Operator Deletion
**Requirement: 15.1-15.5 (Operator Deletion)**
- Soft delete operator accounts
- **Active chat check**: Cannot delete operators with active chats
- Must reassign or close all chats first
- Deletes both operator record and auth account
- Preserves operator data with deleted_at timestamp

### 8. Activity Logs
- View recent operator activity
- Shows last 50 activity events
- Activity types include:
  - Login/logout events
  - Chat assignments
  - Message sending
  - Status changes
- Timestamp for each activity

## API Endpoints

### GET /api/admin/operators
- Fetch all operators
- Returns operators with performance metrics
- Admin authentication required
- Requires `manage_operators` permission

### POST /api/admin/operators
- Create new operator account
- Creates auth user and operator record
- Validates required fields
- Returns created operator

### GET /api/admin/operators/[id]
- Get single operator details
- Returns complete operator information

### DELETE /api/admin/operators/[id]
- Delete operator account (soft delete)
- Checks for active chats (Requirement 15.1-15.5)
- Returns error if operator has active chats
- Deletes auth user and soft deletes operator record

### POST /api/admin/operators/[id]/suspend
- Suspend operator account
- Requires suspension reason
- Sets suspension duration
- Forces operator offline

### POST /api/admin/operators/[id]/reactivate
- Reactivate suspended operator
- Clears suspension data
- Allows operator to log in

### GET /api/admin/operators/[id]/activity
- Get operator activity logs
- Returns last 50 activity events
- Ordered by most recent first

## Requirements Implemented

### Requirement 12.1-12.5: Operator Performance Monitoring
- Quality score tracking and display
- Automatic suspension warnings
- Performance metrics dashboard
- Suspension/reactivation functionality

### Requirement 15.1-15.5: Operator Deletion
- Active chat check before deletion
- Soft delete with deleted_at timestamp
- Auth user cleanup
- Error handling for operators with active chats

## Security

### Authentication
- Admin authentication required for all operations
- JWT-based session validation

### Authorization
- Requires `manage_operators` permission
- Role-based access control via RLS policies

### Data Protection
- Soft delete preserves audit trail
- Activity logs for compliance
- Secure password handling via Supabase Auth

## User Experience

### Visual Indicators
- Green dot: Operator available
- Red badge: Operator suspended
- Color-coded quality scores
- Progress bars for quality metrics

### Modals
- Create operator modal with form validation
- Operator details modal with full information
- Suspension modal with reason input
- Delete confirmation modal with warnings

### Toast Notifications
- Success messages for all operations
- Error messages with helpful context
- Loading states during API calls

## Performance Considerations
- Efficient queries with proper indexes
- Pagination for large operator lists
- Optimistic UI updates
- Debounced search input

## Future Enhancements
- Bulk operator operations
- Export operator performance reports
- Advanced filtering (by quality score, specialization)
- Operator performance trends over time
- Automated suspension based on quality thresholds
