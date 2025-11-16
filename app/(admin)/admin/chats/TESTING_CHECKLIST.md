# Admin Chat Management Testing Checklist

## Pre-Testing Setup

- [ ] Ensure database has sample data:
  - [ ] At least 10 chats with various statuses
  - [ ] At least 5 active operators
  - [ ] Messages in chats (some edited, some not)
  - [ ] At least 2 escalated chats (assignment_count >= 3)
  - [ ] Some chats with flags
  - [ ] Some chats approaching timeout (20+ hours since last message)

- [ ] Ensure admin account is set up and logged in
- [ ] Clear browser cache and cookies
- [ ] Test in multiple browsers (Chrome, Firefox, Safari)
- [ ] Test on multiple screen sizes (mobile, tablet, desktop)

## Feature Testing

### 1. Page Load & Initial Display

- [ ] Navigate to `/admin/chats`
- [ ] Page loads without errors
- [ ] Loading spinner displays during data fetch
- [ ] Chat grid displays after loading
- [ ] All chats are visible
- [ ] Status indicators show correct colors
- [ ] Escalated chats alert banner appears (if escalated chats exist)

### 2. Search Functionality

- [ ] Enter username in search box
- [ ] Grid filters to matching chats
- [ ] Clear search shows all chats again
- [ ] Enter fictional profile name in search
- [ ] Grid filters to matching chats
- [ ] Search is case-insensitive
- [ ] No results message shows when no matches

### 3. Status Filtering

- [ ] Click "all" filter - shows all chats
- [ ] Click "active" filter - shows only active chats
- [ ] Click "idle" filter - shows only idle chats
- [ ] Click "escalated" filter - shows only escalated chats
- [ ] Click "closed" filter - shows only closed chats
- [ ] Active filter button is highlighted
- [ ] Chat count updates correctly

### 4. Chat Grid Display

- [ ] Each chat card shows:
  - [ ] Status indicator (colored dot)
  - [ ] Timeout warning icon (if applicable)
  - [ ] Real username
  - [ ] Fictional profile name
  - [ ] Message count
  - [ ] Credits spent
  - [ ] Assignment count
  - [ ] Operator name (if assigned)
  - [ ] Flag badges (if any)
- [ ] Cards are clickable
- [ ] Hover effect works on cards
- [ ] Grid is responsive on different screen sizes

### 5. Escalated Chats Alert

- [ ] Alert banner shows when escalated chats exist
- [ ] Correct count displayed
- [ ] "View Escalated" button works
- [ ] Clicking button filters to escalated status
- [ ] Alert doesn't show when no escalated chats

### 6. Chat Inspection View

#### Opening Inspection
- [ ] Click on a chat card
- [ ] Inspection view opens below grid
- [ ] Three panels display correctly
- [ ] Statistics grid shows 5 metrics
- [ ] All data loads correctly

#### Left Panel - Real User
- [ ] Username displays
- [ ] Credits balance displays
- [ ] User tier displays
- [ ] Location displays
- [ ] All fields formatted correctly

#### Center Panel - Messages
- [ ] All messages display
- [ ] Messages ordered by time (oldest first)
- [ ] User messages styled differently from fictional
- [ ] Timestamps display correctly
- [ ] Credits charged shown for paid messages
- [ ] Free messages indicated
- [ ] Edit indicators show on edited messages
- [ ] Scrolling works for long message lists

#### Right Panel - Fictional User
- [ ] Name displays
- [ ] Age displays
- [ ] Response style displays
- [ ] Featured status displays
- [ ] Operator info displays (if assigned)
- [ ] Quality score displays

#### Notes Section
- [ ] Operator notes display (if present)
- [ ] Admin notes display (if present)
- [ ] Section hidden if no notes

### 7. Message Editing

#### Edit Interface
- [ ] Click "Edit" on a message
- [ ] Edit form appears inline
- [ ] Current content pre-filled
- [ ] Reason field available
- [ ] Save and Cancel buttons appear

#### Editing Process
- [ ] Modify message content
- [ ] Enter edit reason (optional)
- [ ] Click "Save"
- [ ] Success toast appears
- [ ] Message updates in view
- [ ] "(edited)" indicator appears
- [ ] Edit form closes

#### Edit Validation
- [ ] Cannot save empty message
- [ ] Edit reason is optional
- [ ] Cancel button works
- [ ] Canceling restores original content

### 8. Edit History

#### Viewing History
- [ ] Click "(edited)" on edited message
- [ ] Edit history modal opens
- [ ] All edits listed in reverse chronological order
- [ ] Each edit shows:
  - [ ] Editor type (admin/operator)
  - [ ] Timestamp
  - [ ] Edit reason (if provided)
  - [ ] Original content (red background)
  - [ ] New content (green background)

#### Modal Interaction
- [ ] Close button works
- [ ] Clicking outside modal closes it
- [ ] Scrolling works for long history
- [ ] Empty state shows if no history

### 9. Chat Reassignment

#### Opening Reassign Modal
- [ ] Click "Reassign" button
- [ ] Modal opens
- [ ] Operator dropdown populated
- [ ] Only available operators shown
- [ ] Suspended operators excluded
- [ ] Operators at capacity excluded

#### Operator Selection
- [ ] Dropdown shows operator details:
  - [ ] Name
  - [ ] Quality score
  - [ ] Current/max chat count
- [ ] Can select an operator
- [ ] Placeholder text shows initially

#### Reassignment Process
- [ ] Select an operator
- [ ] Enter reassignment reason
- [ ] Click "Reassign Chat"
- [ ] Success toast appears
- [ ] Modal closes
- [ ] Chat list refreshes
- [ ] Operator updated in chat card

#### Reassignment Validation
- [ ] Cannot submit without operator selection
- [ ] Cannot submit without reason
- [ ] Error toast shows for validation failures
- [ ] Cancel button works
- [ ] Canceling clears form

### 10. Reassignment History

#### Viewing History
- [ ] Click "History" button
- [ ] Reassignment history modal opens
- [ ] All reassignments listed in reverse chronological order
- [ ] Each reassignment shows:
  - [ ] Type (Reassigned/Initially Assigned)
  - [ ] Timestamp
  - [ ] Reason
  - [ ] Reassignment icon

#### Modal Interaction
- [ ] Close button works
- [ ] Clicking outside modal closes it
- [ ] Scrolling works for long history
- [ ] Empty state shows if no history

### 11. Refresh Functionality

- [ ] Click refresh button in header
- [ ] Loading state shows
- [ ] Chat list updates
- [ ] Filters remain applied
- [ ] Selected chat remains selected (if still exists)

### 12. Close Inspection View

- [ ] Click "Close" button
- [ ] Inspection view closes
- [ ] Chat grid remains visible
- [ ] Can select another chat

## Error Handling Testing

### Network Errors
- [ ] Disconnect network
- [ ] Try to load chats
- [ ] Error toast appears
- [ ] Reconnect network
- [ ] Refresh works

### API Errors
- [ ] Test with invalid chat ID
- [ ] Error handled gracefully
- [ ] Test with invalid message ID
- [ ] Error handled gracefully

### Permission Errors
- [ ] Test with non-admin user (if possible)
- [ ] Access denied appropriately
- [ ] Redirect to login or error page

## Performance Testing

- [ ] Load page with 100+ chats
- [ ] Page loads in reasonable time (< 3 seconds)
- [ ] Scrolling is smooth
- [ ] Filtering is responsive
- [ ] Search is responsive
- [ ] No memory leaks after extended use

## Responsive Design Testing

### Mobile (< 768px)
- [ ] Chat grid shows 1 column
- [ ] Search and filters stack vertically
- [ ] Three-panel layout stacks vertically
- [ ] Modals are full-width
- [ ] All buttons are tappable
- [ ] Text is readable

### Tablet (768px - 1024px)
- [ ] Chat grid shows 2 columns
- [ ] Search and filters layout appropriately
- [ ] Three-panel layout may stack or show 2 columns
- [ ] Modals are appropriately sized

### Desktop (> 1024px)
- [ ] Chat grid shows 3 columns
- [ ] Search and filters in single row
- [ ] Three-panel layout shows all 3 panels
- [ ] Modals are centered and sized appropriately

## Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Tab order is logical
- [ ] Focus indicators visible
- [ ] Screen reader compatible (test with NVDA/JAWS)
- [ ] Color contrast meets WCAG AA standards
- [ ] All interactive elements have labels
- [ ] Error messages are announced

## Security Testing

- [ ] Cannot access without authentication
- [ ] Cannot access without admin role
- [ ] Cannot edit messages from other admins (or can, depending on permissions)
- [ ] Cannot reassign to invalid operators
- [ ] SQL injection attempts fail
- [ ] XSS attempts are sanitized

## Data Integrity Testing

### Message Editing
- [ ] Original content preserved in database
- [ ] Edit history created correctly
- [ ] Edit count increments
- [ ] Timestamps accurate

### Chat Reassignment
- [ ] Chat assignment updated
- [ ] Old operator chat count decremented
- [ ] New operator chat count incremented
- [ ] Assignment count incremented
- [ ] Notification created

## Edge Cases

- [ ] Chat with no messages
- [ ] Chat with 1000+ messages
- [ ] Chat with very long message content
- [ ] Chat with special characters in content
- [ ] Chat with emojis
- [ ] Chat with no operator assigned
- [ ] Chat with deleted operator
- [ ] Chat with deleted user
- [ ] Multiple admins editing same message simultaneously
- [ ] Multiple admins reassigning same chat simultaneously

## Regression Testing

After any bug fixes or changes:
- [ ] Re-run all tests above
- [ ] Verify bug is fixed
- [ ] Verify no new bugs introduced
- [ ] Check related features still work

## Sign-Off

- [ ] All critical tests passed
- [ ] All high-priority tests passed
- [ ] Known issues documented
- [ ] Ready for production deployment

**Tested By**: _______________
**Date**: _______________
**Environment**: _______________
**Notes**: _______________
