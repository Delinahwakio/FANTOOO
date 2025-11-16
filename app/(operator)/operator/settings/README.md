# Operator Settings Page

## Overview

The operator settings page allows operators to manage their account settings and preferences. This page provides functionality for password changes, specialization management, and displays account information including suspension status.

## Features

### 1. Account Information Display
- **Name**: Operator's full name
- **Email**: Operator's email address
- **Skill Level**: Current skill level (junior, mid, senior, expert)
- **Account Status**: Active, Inactive, or Suspended
- **Max Concurrent Chats**: Maximum number of chats the operator can handle simultaneously
- **Quality Threshold**: Minimum quality score required to avoid suspension

### 2. Suspension Status
- Displays prominent warning banner if account is suspended
- Shows suspension reason
- Shows suspension end date if applicable
- Explains what suspension means (no new assignments, forced offline)

### 3. Specializations Management
- View current specializations
- Add new specializations
- Remove existing specializations
- Save changes to update operator profile
- Specializations help with intelligent chat assignment

### 4. Password Change
- Secure password update functionality
- Requires current password (for security)
- New password validation:
  - Minimum 8 characters
  - Must contain uppercase letters
  - Must contain lowercase letters
  - Must contain numbers
- Password confirmation to prevent typos
- Uses Supabase Auth for secure password updates

## Requirements Addressed

### Requirement 11.1-11.5: Operator Availability
- Displays account status and suspension information
- Shows if operator is active or suspended
- Explains impact of suspension on availability

### Requirement 12.1-12.5: Operator Performance
- Displays quality threshold
- Shows suspension status and reason
- Provides context about performance requirements

## API Endpoints

### GET /api/operator/settings
Retrieves operator settings and account information.

**Response:**
```json
{
  "operator": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "specializations": ["flirty", "romantic"],
    "languages": ["en"],
    "skill_level": "mid",
    "is_active": true,
    "is_available": false,
    "is_suspended": false,
    "suspension_reason": null,
    "suspended_until": null,
    "max_concurrent_chats": 5,
    "quality_threshold": 60,
    "quality_score": 85.5
  }
}
```

### PATCH /api/operator/settings
Updates operator settings (specializations).

**Request Body:**
```json
{
  "specializations": ["flirty", "romantic", "playful"]
}
```

**Response:**
```json
{
  "success": true,
  "operator": {
    "id": "uuid",
    "specializations": ["flirty", "romantic", "playful"],
    ...
  }
}
```

## User Interface

### Layout
- Clean, organized layout with glassmorphism design
- Sections clearly separated with GlassCard components
- Responsive design for mobile and desktop

### Components Used
- **GlassCard**: Container for each settings section
- **GlassButton**: Action buttons (save, cancel, edit)
- **GlassInput**: Form inputs for password and specializations
- **LoadingSpinner**: Loading states
- **Toast notifications**: Success and error feedback

### Sections
1. **Header**: Page title and back button
2. **Suspension Warning**: Prominent alert if suspended (conditional)
3. **Account Information**: Read-only account details
4. **Specializations**: Editable list of specializations
5. **Password Change**: Secure password update form

## Security

### Password Security
- Uses Supabase Auth's built-in password update functionality
- Validates password complexity on client-side
- Server-side validation through Supabase
- No password storage in application database

### Authorization
- Requires authenticated operator session
- Operators can only view/edit their own settings
- API routes verify operator identity via Supabase Auth

### Data Validation
- Client-side validation for immediate feedback
- Server-side validation for security
- Prevents invalid specialization formats
- Ensures password meets complexity requirements

## Error Handling

### Client-Side Errors
- Form validation errors (toast notifications)
- Network errors (toast notifications)
- Loading states during async operations

### Server-Side Errors
- 401 Unauthorized: Not logged in or invalid session
- 404 Not Found: Operator record not found
- 400 Bad Request: Invalid input data
- 500 Internal Server Error: Database or server issues

## Usage Flow

### Changing Password
1. Operator enters current password
2. Operator enters new password (validated)
3. Operator confirms new password
4. Click "Update Password"
5. System validates and updates password
6. Success toast shown, form cleared

### Managing Specializations
1. Click "Edit" button in Specializations section
2. Add new specializations using input field
3. Remove unwanted specializations by clicking X
4. Click "Save Changes" to persist updates
5. Or click "Cancel" to discard changes

## Testing

### Manual Testing Checklist
- [ ] Page loads correctly for authenticated operator
- [ ] Account information displays correctly
- [ ] Suspension warning shows when operator is suspended
- [ ] Can add new specializations
- [ ] Can remove existing specializations
- [ ] Can save specialization changes
- [ ] Can cancel specialization editing
- [ ] Password validation works (length, complexity)
- [ ] Password mismatch detected
- [ ] Password update succeeds with valid input
- [ ] Error messages display for invalid input
- [ ] Loading states show during async operations
- [ ] Back button navigates to dashboard

### Edge Cases
- Suspended operator viewing settings
- Operator with no specializations
- Very long specialization names
- Duplicate specialization attempts
- Network failures during save
- Invalid password formats

## Future Enhancements

Potential improvements for future iterations:
- Language preferences editing
- Email notification preferences
- Profile picture upload
- Two-factor authentication setup
- Session management (view active sessions)
- Activity log (recent logins, changes)
- Export personal data (GDPR compliance)

## Related Files

- `app/(operator)/operator/settings/page.tsx` - Main settings page component
- `app/api/operator/settings/route.ts` - API endpoints for settings
- `lib/supabase/auth.ts` - Authentication utilities including password update
- `lib/hooks/useOperator.ts` - Operator data hooks
- `lib/types/operator.ts` - Operator type definitions
