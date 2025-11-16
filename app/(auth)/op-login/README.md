# Operator Login Page

## Overview

The operator login page (`/op-login`) is a restricted access route for operators to sign in to the platform. This is a **hidden route** with no links from the public landing page.

## Features

### Authentication Flow

1. **Email and Password Input**: Operators enter their email and password
2. **Supabase Authentication**: Validates credentials using Supabase Auth
3. **Role Validation**: Verifies the user has an operator account in the `operators` table
4. **Account Status Checks**:
   - Checks if account is deleted (`deleted_at` is not null)
   - Checks if account is suspended (`is_suspended` is true)
   - Checks if account is active (`is_active` is true)
5. **Redirect**: On successful authentication, redirects to `/operator/waiting`

### Security Features

- **Role-based Access**: Only users with valid operator accounts can access
- **Account Status Validation**: Prevents login for deleted, suspended, or inactive accounts
- **Session Cleanup**: Signs out users who fail role validation
- **Hidden Route**: No links from public pages (direct URL access only)

## Error Handling

The page handles the following error scenarios:

| Error | Message | Action |
|-------|---------|--------|
| Empty fields | "Please enter your email and password" | Show validation error |
| Invalid credentials | "Invalid email or password" | Show authentication error |
| Not an operator | "This account does not have operator access" | Sign out and show error |
| Deleted account | "This operator account has been deleted" | Sign out and show error |
| Suspended account | "This operator account is currently suspended" | Sign out and show error |
| Inactive account | "This operator account is not active" | Sign out and show error |
| Unexpected error | "An unexpected error occurred. Please try again." | Show generic error |

## Database Schema

The page queries the `operators` table with the following structure:

```sql
CREATE TABLE operators (
  id UUID PRIMARY KEY,
  auth_id UUID REFERENCES auth.users UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_suspended BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP,
  -- ... other fields
);
```

## Requirements Satisfied

This implementation satisfies **Requirement 11.1-11.5 (Operator Availability)**:

- ✅ Operator authentication with email and password
- ✅ Role validation against operators table
- ✅ Account status checks (active, suspended, deleted)
- ✅ Redirect to operator waiting room on success
- ✅ Hidden route (no links from landing page)

## Usage

### Direct Access

Operators can access the login page directly at:
```
https://fantooo.com/op-login
```

### Testing

To test the operator login:

1. Create an operator account via admin panel
2. Navigate to `/op-login`
3. Enter operator email and password
4. Verify redirect to `/operator/waiting`

### Error Testing

Test error scenarios:

```typescript
// Test suspended account
UPDATE operators SET is_suspended = true WHERE email = 'test@example.com';

// Test inactive account
UPDATE operators SET is_active = false WHERE email = 'test@example.com';

// Test deleted account
UPDATE operators SET deleted_at = NOW() WHERE email = 'test@example.com';
```

## Related Files

- `app/(auth)/admin-login/page.tsx` - Similar pattern for admin login
- `app/(auth)/login/page.tsx` - User login page
- `lib/supabase/client.ts` - Supabase client configuration
- `lib/components/ui/GlassCard.tsx` - UI component
- `lib/components/ui/GlassButton.tsx` - UI component
- `lib/components/ui/GlassInput.tsx` - UI component

## Next Steps

After implementing this page, the following tasks should be completed:

1. **Task 41**: Create operator waiting room page (`/operator/waiting`)
2. **Task 42**: Create operator chat page (`/operator/chat/[chatId]`)
3. **Task 43**: Create operator stats page (`/operator/stats`)
4. **Task 44**: Create operator settings page (`/operator/settings`)
