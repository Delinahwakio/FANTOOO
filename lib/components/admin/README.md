# Admin Components

This directory contains admin-specific components for managing the Fantooo platform.

## Components

### ChatInspector

Admin component for monitoring and inspecting all chats in real-time.

**Features:**
- Live chat grid with real-time updates
- Status indicators (active, idle, escalated, timeout warnings)
- Search and filter functionality
- Three-panel detailed view
- Message editing with audit trail
- Manual chat reassignment

**Usage:**
```tsx
import { ChatInspector } from '@/lib/components/admin';

<ChatInspector 
  onChatSelect={(chatId) => router.push(`/admin/chats/${chatId}`)} 
/>
```

**Requirements:** 26.1-26.5 (Admin Chat Inspection)

---

### UserManagement

Admin component for managing real users with full CRUD operations.

**Features:**
- User list with search and filtering
- User details view
- Block/suspend functionality
- Account deletion with GDPR compliance
- Credit refund interface
- Ban circumvention detection alerts

**Usage:**
```tsx
import { UserManagement } from '@/lib/components/admin';

<UserManagement />
```

**Requirements:** 14.1-14.5 (User Deletion), 18.1-18.5 (Credit Refund), 21.1-21.5 (Banned User Detection)

---

### OperatorManagement

Admin component for managing operators with performance metrics.

**Features:**
- Operator account creation
- Operator list with performance metrics
- Quality scores and suspension status
- Operator suspension/reactivation
- Active chat check before deletion
- Operator activity logs

**Usage:**
```tsx
import { OperatorManagement } from '@/lib/components/admin';

<OperatorManagement />
```

**Requirements:** 12.1-12.5 (Operator Performance), 15.1-15.5 (Operator Deletion), 19.1-19.5 (Admin Role Management)

---

### PaymentReconciliation

Admin component for managing payment reconciliation and failed transactions.

**Features:**
- Failed payments dashboard
- Manual reconciliation interface
- Transaction details with Paystack status
- Refund processing functionality
- Transaction audit trail
- Webhook duplicate detection

**Usage:**
```tsx
import { PaymentReconciliation } from '@/lib/components/admin';

<PaymentReconciliation />
```

**Requirements:** 16.1-16.5 (Payment Idempotency), 17.1-17.5 (Payment Reconciliation)

---

### AnalyticsDashboard

Admin component for displaying comprehensive platform analytics.

**Features:**
- Platform-wide analytics (users, chats, revenue)
- Operator performance rankings
- Revenue metrics over time
- User engagement trends
- Conversion rate tracking (free to paid)
- Date range filtering and export functionality

**Usage:**
```tsx
import { AnalyticsDashboard } from '@/lib/components/admin';

<AnalyticsDashboard />
```

**Requirements:** 27.1-27.5 (Analytics and Reporting)

---

## Implementation Notes

### API Integration

All components currently use placeholder data and TODO comments for API calls. When implementing the backend:

1. Replace `// TODO: Replace with actual API call` comments with real API calls
2. Use the Supabase client for database queries
3. Implement proper error handling and loading states
4. Add real-time subscriptions where appropriate

### Real-time Updates

Components like ChatInspector should subscribe to real-time updates:

```tsx
useEffect(() => {
  const subscription = supabase
    .channel('chats')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'chats' 
    }, handleChatUpdate)
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

### Chart Libraries

The AnalyticsDashboard includes placeholders for charts. Consider using:

- **Recharts**: React-specific, good for simple charts
- **Chart.js**: Powerful, widely used
- **Victory**: Flexible, composable charts
- **Nivo**: Beautiful, responsive charts

Example with Recharts:
```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

<LineChart width={600} height={300} data={revenueData}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Line type="monotone" dataKey="amount" stroke="#ef4444" />
</LineChart>
```

### Security Considerations

1. **Role-based Access**: Ensure all admin routes are protected with proper authentication
2. **Audit Logging**: Log all admin actions (edits, deletions, refunds)
3. **Confirmation Modals**: Always confirm destructive actions
4. **Data Validation**: Validate all inputs before sending to API
5. **Rate Limiting**: Implement rate limiting on sensitive operations

### Performance Optimization

1. **Pagination**: Implement pagination for large lists
2. **Virtual Scrolling**: Use for very long lists (e.g., react-window)
3. **Debouncing**: Debounce search inputs
4. **Caching**: Cache analytics data with React Query
5. **Lazy Loading**: Lazy load modals and heavy components

### Accessibility

All components follow accessibility best practices:

- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Focus management in modals
- Color contrast compliance

### Testing

When writing tests for these components:

1. Test user interactions (clicks, form submissions)
2. Test loading and error states
3. Test modal open/close behavior
4. Test search and filter functionality
5. Mock API calls appropriately

Example test:
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { UserManagement } from './UserManagement';

test('opens user details modal on user click', async () => {
  render(<UserManagement />);
  
  const userCard = await screen.findByText('testuser');
  fireEvent.click(userCard);
  
  expect(screen.getByText('User Details')).toBeInTheDocument();
});
```

## Design System Integration

All components use the Fantooo design system:

- **GlassCard**: For card containers
- **GlassButton**: For all buttons
- **GlassInput**: For form inputs
- **Modal**: For dialogs
- **LoadingSpinner**: For loading states
- **Toast**: For notifications (not shown in examples, but should be used)

## Future Enhancements

1. **Bulk Operations**: Select multiple items for bulk actions
2. **Advanced Filters**: More sophisticated filtering options
3. **Export Formats**: Support CSV, PDF, Excel exports
4. **Scheduled Reports**: Email reports on schedule
5. **Custom Dashboards**: Allow admins to customize their dashboard
6. **Activity Feed**: Real-time feed of platform activity
7. **Notifications**: Push notifications for critical events
8. **Mobile Optimization**: Better mobile layouts

## Related Documentation

- [Design System](../../DESIGN_SYSTEM.md)
- [Requirements Document](.kiro/specs/fantooo-platform/requirements.md)
- [Design Document](.kiro/specs/fantooo-platform/design.md)
- [Tasks Document](.kiro/specs/fantooo-platform/tasks.md)
