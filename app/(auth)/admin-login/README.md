# Admin Login Page

## Overview

The admin login page (`/admin-login`) provides secure authentication for platform administrators. This is a hidden route with no links from the public landing page, accessible only via direct URL.

## Features

### Authentication Flow
1. Email and password input with validation
2. Supabase Auth authentication
3. Admin role verification via `admins` table
4. Account status validation (active, not deleted)
5. Redirect to admin dashboard on success

### Security Validations
- **Admin Role Check**: Verifies user exists in `admins` table
- **Account Status**: Checks `is_active` flag
- **Deletion Check**: Verifies `deleted_at` is null
- **Auth Cleanup**: Signs out user if validation fails

### Error Handling
- Invalid credentials
- Non-admin accounts
- Deleted admin accounts
- Inactive admin accounts
- Network/unexpected errors

## Implementation Details

### Form Fields
- **Email**: Admin email address
- **Password**: Admin password

### Validation Rules
1. Both fields required
2. Must be valid admin account
3. Account must be active
4. Account must not be deleted

### Success Flow
```
User submits form
  → Authenticate with Supabase Auth
  → Query admins table by auth_id
  → Validate admin exists
  → Check deleted_at is null
  → Check is_active is true
  → Redirect to /admin/dashboard
```

### Error Flow
```
Authentication fails
  → Show "Invalid email or password"

Admin not found
  → Sign out user
  → Show "This account does not have admin access"

Admin deleted
  → Sign out user
  → Show "This admin account has been deleted"

Admin inactive
  → Sign out user
  → Show "This admin account is not active"
```

## UI Components Used

- `GlassCard`: Container with glassmorphism effect
- `GlassInput`: Form inputs with icons
- `GlassButton`: Submit button with loading state

## Route Security

This route is **hidden** and has:
- No links from landing page
- No links from public pages
- Direct URL access only
- Restricted to admin users

## Setup Success Message

When redirected from `/setup?setup=success`, displays a success message:
> "Super admin account created successfully! You can now sign in."

## Requirements Satisfied

- **1.1-1.5**: Admin Bootstrap System
  - Validates admin role
  - Checks account status
  - Secure authentication flow

- **19.1-19.5**: Admin Role Management
  - Role-based access control
  - Permission validation
  - Account status checks

## Related Files

- `/setup` - First admin account creation
- `/admin/dashboard` - Redirect destination (Task 45)
- `lib/supabase/client.ts` - Supabase client
- `admins` table - Admin data storage

## Testing Checklist

- [ ] Valid admin can sign in
- [ ] Invalid credentials show error
- [ ] Non-admin accounts rejected
- [ ] Deleted admin accounts rejected
- [ ] Inactive admin accounts rejected
- [ ] Setup success message displays
- [ ] Redirects to admin dashboard
- [ ] No links from landing page
- [ ] Form validation works
- [ ] Loading states display correctly
