# Admin Dashboard

## Overview

The admin dashboard provides a comprehensive overview of the Fantooo platform, including key statistics, system health indicators, unread notifications, recent activity, and quick access links to all admin sections.

## Features

### 1. Overview Statistics
- **Total Users**: Display total registered users with active user count
- **Active Chats**: Show currently active chats and total chat count
- **Total Revenue**: Display total revenue in KES with message count
- **Operators**: Show total operators with available operator count

### 2. System Health Indicators
Real-time monitoring of critical system components:
- **Database**: PostgreSQL connection and query performance
- **Realtime**: WebSocket connection status
- **Payment Gateway**: Paystack API connectivity
- **Edge Functions**: Supabase Edge Functions status

Health statuses:
- `healthy`: System operating normally (green)
- `warning`: Minor issues detected (yellow)
- `error`: Critical issues requiring attention (red)

### 3. Unread Admin Notifications
Displays the 5 most recent unread notifications with:
- Priority badges (critical, high, normal, low)
- Notification message
- Time ago indicator
- Click to mark as read functionality
- Link to view all notifications

Notification types:
- `operator_suspended`: Operator quality score dropped below threshold
- `chat_escalation`: Chat reached maximum reassignment attempts
- `payment_failed`: Payment processing failed
- `high_refund_rate`: Unusual refund activity detected
- `system_error`: Critical system error occurred
- `security_alert`: Security-related event detected

### 4. Recent Activity Feed
Shows the 10 most recent platform activities:
- User registrations
- Chat creations
- Payment completions
- Operator assignments
- Chat closures
- User bans
- Refund processing
- Other system events

### 5. Quick Access Links
One-click navigation to all admin sections:
- **Users**: Manage real users
- **Profiles**: Manage fictional profiles
- **Operators**: Manage operators
- **Chats**: Inspect and manage chats
- **Payments**: Payment reconciliation
- **Analytics**: Platform analytics and reporting

## API Endpoints

### GET /api/admin/dashboard/stats
Fetches dashboard statistics including user counts, chat counts, revenue, and operator availability.

**Response:**
```json
{
  "total_users": 1250,
  "active_users": 847,
  "total_chats": 3420,
  "active_chats": 156,
  "total_revenue": 458900,
  "total_messages": 28450,
  "total_operators": 15,
  "available_operators": 8
}
```

### GET /api/admin/dashboard/notifications
Fetches admin notifications with optional filtering.

**Query Parameters:**
- `unread` (boolean): Filter for unread notifications only
- `limit` (number): Maximum number of notifications to return (default: 10)

**Response:**
```json
[
  {
    "id": "uuid",
    "type": "operator_suspended",
    "message": "Operator John Doe suspended due to low quality score",
    "priority": "high",
    "is_read": false,
    "created_at": "2024-11-16T10:30:00Z",
    "metadata": {}
  }
]
```

### GET /api/admin/dashboard/activity
Fetches recent platform activity.

**Query Parameters:**
- `limit` (number): Maximum number of activities to return (default: 10)

**Response:**
```json
[
  {
    "id": "uuid",
    "activity_type": "user_registered",
    "description": "New user registered",
    "created_at": "2024-11-16T10:30:00Z",
    "entity_type": "user",
    "entity_id": "uuid"
  }
]
```

### PATCH /api/admin/notifications/[id]/read
Marks a notification as read.

**Response:**
```json
{
  "id": "uuid",
  "is_read": true,
  "read_by": "admin_uuid",
  "read_at": "2024-11-16T10:30:00Z"
}
```

## Database Requirements

The dashboard relies on the following database tables:
- `real_users`: User accounts
- `chats`: Chat sessions
- `messages`: Chat messages
- `transactions`: Payment transactions
- `operators`: Operator accounts
- `admin_notifications`: Admin notifications
- `user_activity_log`: Activity tracking

### Optional RPC Functions

For optimized performance, the following RPC functions can be created:

```sql
-- Get user statistics
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS TABLE (
  total_users BIGINT,
  active_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE deleted_at IS NULL) AS total_users,
    COUNT(*) FILTER (WHERE deleted_at IS NULL AND is_active = true AND last_active_at >= NOW() - INTERVAL '24 hours') AS active_users
  FROM real_users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get chat statistics
CREATE OR REPLACE FUNCTION get_chat_stats()
RETURNS TABLE (
  total_chats BIGINT,
  active_chats BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_chats,
    COUNT(*) FILTER (WHERE status = 'active') AS active_chats
  FROM chats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get revenue statistics
CREATE OR REPLACE FUNCTION get_revenue_stats()
RETURNS TABLE (
  total_revenue NUMERIC,
  total_messages BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(amount), 0) AS total_revenue,
    (SELECT COUNT(*) FROM messages WHERE deleted_at IS NULL) AS total_messages
  FROM transactions
  WHERE status = 'success' AND type = 'purchase';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get operator statistics
CREATE OR REPLACE FUNCTION get_operator_stats()
RETURNS TABLE (
  total_operators BIGINT,
  available_operators BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE deleted_at IS NULL) AS total_operators,
    COUNT(*) FILTER (WHERE deleted_at IS NULL AND is_available = true AND is_active = true) AS available_operators
  FROM operators;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Security

### Authentication & Authorization
- Requires valid Supabase session
- Verifies admin role from `admins` table
- Checks `is_active` status
- All API routes protected with admin verification

### Row Level Security (RLS)
The dashboard respects all RLS policies:
- Admins have full read access to all data
- Statistics are aggregated server-side
- No sensitive user data exposed in activity logs

## Usage

### Accessing the Dashboard
1. Navigate to `/admin/dashboard`
2. Must be logged in as an admin
3. Dashboard loads automatically with real-time data

### Monitoring System Health
- Green indicators: All systems operational
- Yellow indicators: Minor issues, monitor closely
- Red indicators: Critical issues, immediate action required

### Managing Notifications
- Click any notification to mark as read
- Click "View All" to see complete notification history
- Critical notifications appear with red badges

### Quick Navigation
- Click any quick access card to navigate to that section
- Icons provide visual identification of each section

## Performance Considerations

### Data Loading
- All statistics loaded in parallel for fast initial render
- Notifications and activity limited to recent items
- Full data available through "View All" links

### Caching Strategy
- Statistics can be cached for 30-60 seconds
- Notifications should be real-time or near real-time
- Activity feed can tolerate slight delays

### Optimization Tips
1. Create database indexes on frequently queried columns
2. Use RPC functions for complex aggregations
3. Implement materialized views for analytics
4. Consider Redis caching for high-traffic scenarios

## Future Enhancements

### Planned Features
- Real-time updates via WebSocket subscriptions
- Customizable dashboard widgets
- Exportable reports
- Advanced filtering and date range selection
- Interactive charts and graphs
- System performance metrics
- Automated alerting

### Integration Opportunities
- Email notifications for critical alerts
- SMS alerts for urgent issues
- Slack/Discord webhooks
- Mobile app push notifications

## Troubleshooting

### No Data Displayed
- Verify database tables exist and are populated
- Check RLS policies allow admin access
- Ensure admin account is active
- Check browser console for API errors

### Slow Loading
- Review database query performance
- Check for missing indexes
- Consider implementing RPC functions
- Monitor Supabase dashboard for bottlenecks

### Notifications Not Updating
- Verify `admin_notifications` table exists
- Check notification creation triggers
- Ensure proper permissions on table
- Review Edge Function logs

## Related Files
- Layout: `app/(admin)/layout.tsx`
- Page: `app/(admin)/admin/dashboard/page.tsx`
- Stats API: `app/api/admin/dashboard/stats/route.ts`
- Notifications API: `app/api/admin/dashboard/notifications/route.ts`
- Activity API: `app/api/admin/dashboard/activity/route.ts`
- Mark Read API: `app/api/admin/notifications/[id]/read/route.ts`
