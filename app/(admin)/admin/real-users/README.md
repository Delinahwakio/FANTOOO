# Real Users Management Page

## Overview

The Real Users Management page (`/admin/real-users`) provides comprehensive tools for admins to manage real users on the Fantooo platform. This includes user search, filtering, detailed user information, ban/suspension management, credit refunds, and GDPR-compliant account deletion.

## Features

### 1. User List with Search and Filtering

- **Search**: Search users by username, email, or display name
- **Status Filter**: Filter by all, active, banned, or suspended users
- **Tier Filter**: Filter by user tier (free, bronze, silver, gold, platinum)
- **Pagination**: Navigate through large user lists with page controls

### 2. User Details View

When clicking on a user, a detailed modal displays:

- **Basic Information**: Username, display name, email, age, gender, location
- **Statistics**: Credits, total chats, active chats, total spent
- **Account Status**: Active, banned, or suspended status with reasons
- **Ban Circumvention Alerts**: Shows attempts to circumvent bans with timestamps
- **Recent Activity**: User activity logs

### 3. Ban Management

**Ban User:**
- Provide ban reason (required)
- Set ban duration in days or make it permanent
- Automatically tracks IP addresses and device fingerprints for circumvention detection
- Closes all active chats
- Creates ban tracking record

**Unban User:**
- Removes ban status
- Clears ban reason and expiry date
- User can log in again

### 4. Suspension Management

**Suspend User:**
- Temporarily restrict account access
- Different from ban (less severe)
- Closes active chats
- Requires suspension reason

**Reactivate User:**
- Restores account access
- User can log in and use platform again

### 5. Credit Refund System

Process credit refunds with full audit trail:

- **Amount**: Number of credits to refund
- **Reason**: Select from predefined reasons:
  - Accidental Send
  - Inappropriate Content
  - System Error
  - Admin Discretion
- **Notes**: Optional additional notes
- **Audit Trail**: All refunds are logged with admin ID and timestamp
- **Notification**: Creates admin notification for tracking

### 6. GDPR-Compliant Account Deletion

Delete user accounts with full GDPR compliance:

- **Anonymization**: All user messages are anonymized
- **Data Archival**: User data is archived in `deleted_users` table
- **Refund Calculation**: Unused credits are calculated and refunded (10 KES per credit)
- **Chat Closure**: All active chats are closed
- **Deletion Reason**: Required for audit purposes
- **Edge Function**: Uses `delete-user-account` Edge Function for safe processing

### 7. Ban Circumvention Detection

Automatically detects when banned users attempt to create new accounts:

- **IP Tracking**: Records IP addresses from user activity
- **Device Fingerprinting**: Tracks device fingerprints
- **Attempt Counter**: Counts circumvention attempts
- **Visual Alerts**: Orange warning badges on user cards
- **Last Attempt Timestamp**: Shows when last attempt occurred

## API Endpoints

### GET /api/admin/users

Fetch all users with search and filtering.

**Query Parameters:**
- `search`: Search term
- `status`: Filter by status (all, active, banned, suspended)
- `tier`: Filter by tier (all, free, bronze, silver, gold, platinum)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "users": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### GET /api/admin/users/[id]

Get detailed information about a specific user.

**Response:**
```json
{
  "user": {...},
  "circumvention": {...},
  "recentActivity": [...],
  "stats": {
    "activeChats": 2,
    "totalCreditsSpent": 150
  }
}
```

### POST /api/admin/users/[id]/ban

Ban a user with reason and optional duration.

**Request Body:**
```json
{
  "reason": "Violation of terms",
  "duration": 30,
  "isPermanent": false
}
```

### DELETE /api/admin/users/[id]/ban

Unban a user.

### POST /api/admin/users/[id]/suspend

Suspend a user account.

**Request Body:**
```json
{
  "reason": "Suspicious activity"
}
```

### DELETE /api/admin/users/[id]/suspend

Reactivate a suspended user.

### POST /api/admin/users/[id]/refund

Process credit refund.

**Request Body:**
```json
{
  "amount": 50,
  "reason": "system_error",
  "notes": "Optional notes"
}
```

### GET /api/admin/users/[id]/refund

Get refund history for a user.

### DELETE /api/admin/users/[id]

Delete user account with GDPR compliance.

**Request Body:**
```json
{
  "reason": "User requested deletion"
}
```

## Requirements Covered

This implementation covers the following requirements:

### Requirement 14: User Account Deletion (GDPR Compliance)
- ✅ 14.1: Archive user data in deleted_users table
- ✅ 14.2: Anonymize all messages
- ✅ 14.3: Close all active chats
- ✅ 14.4: Calculate refund for unused credits
- ✅ 14.5: Delete auth user and soft delete user record

### Requirement 18: Credit Refund Processing
- ✅ 18.1: Require refund reason from predefined list
- ✅ 18.2: Add credits back to user account
- ✅ 18.3: Create audit record in credit_refunds table
- ✅ 18.4: Record admin ID and notes
- ✅ 18.5: Notify user of refund

### Requirement 21: Banned User Circumvention Detection
- ✅ 21.1: Record IP addresses and device fingerprints
- ✅ 21.2: Check IP and device against banned_users_tracking
- ✅ 21.3: Increment circumvention_attempts counter
- ✅ 21.4: Flag new account for admin review
- ✅ 21.5: Log all circumvention attempts

## Security

- **Admin Authentication**: All endpoints require admin authentication
- **Permission Checks**: Verifies admin role and permissions
- **Audit Trail**: All actions are logged with admin ID and timestamp
- **RLS Policies**: Database-level security with Row Level Security
- **Input Validation**: All inputs are validated before processing

## Usage

1. Navigate to `/admin/real-users` in the admin panel
2. Use search and filters to find specific users
3. Click on a user to view detailed information
4. Use action buttons to manage user accounts:
   - Ban/Unban users
   - Suspend/Reactivate accounts
   - Process credit refunds
   - Delete accounts (GDPR-compliant)

## Notes

- All destructive actions require confirmation
- Ban circumvention alerts are automatically displayed
- Refunds create admin notifications for tracking
- Account deletion is irreversible and GDPR-compliant
- All actions are logged for audit purposes
