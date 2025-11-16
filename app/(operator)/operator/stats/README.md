# Operator Stats Page

## Overview

The operator stats page (`/operator/stats`) provides comprehensive performance analytics for operators, including quality score tracking, performance trends, and detailed metrics.

## Features

### 1. Performance Metrics
- **Quality Score**: Current quality score with threshold comparison and status indicators
- **Messages Sent**: Total messages sent (all-time or filtered by date range)
- **Chats Handled**: Total chats handled (all-time or filtered by date range)
- **Average Rating**: User satisfaction ratings with star display

### 2. Performance Issues Tracking
- **Idle Incidents**: Number of times operator was idle during active chats
- **Reassignments**: Number of chats reassigned to other operators
- **User Complaints**: Number of complaints received from users

### 3. Additional Metrics
- **Average Response Time**: Time taken to respond to messages
- **Total Earnings**: Earnings from handled chats (KES)

### 4. Date Range Filtering
- Select custom date ranges to view historical performance
- Filter by start and end dates
- View period-specific totals and trends

### 5. Performance Trends
When a date range is selected, displays:
- **Messages Sent Over Time**: Bar chart showing daily message volume
- **Chats Handled Over Time**: Bar chart showing daily chat volume
- **Average Rating Over Time**: Bar chart showing daily rating trends

### 6. Warnings and Alerts
- **Suspension Warning**: Displayed when quality score approaches threshold
- **Account Suspended**: Displayed when operator is suspended with reason and duration
- **Improvement Tips**: Suggestions for improving quality score

## Requirements Satisfied

### Requirement 12.1-12.5 (Operator Performance)

1. **Quality Score Monitoring**
   - Real-time quality score display
   - Threshold comparison
   - Visual indicators (green/orange/red)
   - Automatic suspension warnings

2. **Performance Metrics**
   - Messages sent tracking
   - Chats handled tracking
   - Response time monitoring
   - User rating aggregation

3. **Issue Tracking**
   - Idle incidents counter
   - Reassignment count
   - User complaints tracking

4. **Suspension Management**
   - Suspension status display
   - Suspension reason
   - Suspension duration
   - Warning system before suspension

5. **Historical Analysis**
   - Date range filtering
   - Daily performance trends
   - Period totals
   - Visual trend charts

## API Integration

### GET /api/operator/stats

**Query Parameters:**
- `startDate` (optional): ISO date string for filtering start
- `endDate` (optional): ISO date string for filtering end

**Response:**
```typescript
{
  operator: {
    id: string
    name: string
    email: string
    is_available: boolean
    is_suspended: boolean
    suspension_reason?: string
    suspended_until?: string
  }
  performance: {
    total_messages_sent: number
    total_chats_handled: number
    quality_score: number
    average_response_time?: string
    average_user_rating: number
    total_ratings: number
    idle_incidents: number
    reassignment_count: number
    user_complaints: number
    total_online_time?: string
    total_earnings: number
  }
  current: {
    active_chats_count: number
    active_chats: any[]
    max_concurrent_chats: number
  }
  warnings: {
    low_quality_score: boolean
    quality_threshold: number
    suspension_warning: boolean
  }
  trends?: {
    daily: Array<{
      date: string
      messages_sent: number
      chats_handled: number
      average_rating: number
    }>
    period_totals: {
      messages_sent: number
      chats_handled: number
      average_rating: number
      total_credits_earned: number
    }
  }
}
```

## Components Used

- **GlassCard**: Container for metrics and charts
- **GlassButton**: Action buttons (apply filter, clear, back)
- **LoadingSpinner**: Loading state indicator
- **DatePicker**: Date range selection
- **useOperatorStats**: Hook for fetching stats with date filtering
- **useToast**: Toast notifications for errors

## User Flow

1. **View Overall Stats**
   - Operator navigates to `/operator/stats`
   - Page displays all-time performance metrics
   - Quality score and warnings are prominently displayed

2. **Filter by Date Range**
   - Operator selects start and end dates
   - Clicks "Apply Filter"
   - Page displays period-specific metrics and trends

3. **Analyze Trends**
   - View daily performance charts
   - Identify patterns in messages, chats, and ratings
   - Compare period totals to overall performance

4. **Address Warnings**
   - If quality score is low, view improvement tips
   - Monitor idle incidents and reassignments
   - Take action to improve performance

5. **Return to Dashboard**
   - Click "Back to Dashboard" to return to waiting room

## Quality Score Indicators

- **Green (Good Standing)**: Quality score above threshold + 10
- **Orange (Warning)**: Quality score between threshold and threshold + 10
- **Red (Below Threshold)**: Quality score below threshold (suspension risk)

## Improvement Tips

When quality score is low, the page displays actionable tips:
- Respond faster to messages
- Maintain engaging conversations
- Avoid idle time during active chats
- Follow fictional profile guidelines

## Navigation

- **From**: Operator waiting room (`/operator/waiting`)
- **To**: Back to waiting room via "Back to Dashboard" button

## Error Handling

- **Authentication Error**: Redirects to operator login
- **Operator Not Found**: Displays error message with retry option
- **API Error**: Shows error toast and retry button
- **No Data**: Displays friendly message when no data exists for date range

## Performance Considerations

- Stats auto-refresh every 30 seconds (for current stats only)
- Date-filtered stats do not auto-refresh
- Trends are calculated server-side for efficiency
- Charts use simple bar visualization for fast rendering

## Future Enhancements

- Export stats to CSV/PDF
- More detailed charts (line charts, pie charts)
- Comparison with other operators (anonymized)
- Goal setting and progress tracking
- Weekly/monthly performance reports
