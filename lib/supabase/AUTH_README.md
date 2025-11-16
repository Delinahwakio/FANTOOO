# Authentication System Documentation

This document describes the authentication system implementation for the Fantooo platform using Supabase Auth.

## Overview

The authentication system provides:
- Email/password authentication
- Role-based access control (User, Operator, Admin, Super Admin)
- Protected routes with middleware
- Server-side and client-side authentication helpers
- React hooks for easy integration

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Components                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   useAuth    │  │ProtectedRoute│  │ Auth Forms   │      │
│  │    Hook      │  │  Component   │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Authentication Layer                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              lib/supabase/auth.ts                     │  │
│  │  • signUp()    • signIn()    • signOut()             │  │
│  │  • getSession() • getUser()                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Middleware Layer                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           lib/supabase/middleware.ts                  │  │
│  │  • Route protection                                   │  │
│  │  • Role-based access control                         │  │
│  │  • Session refresh                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase Auth                              │
│  • JWT tokens                                                │
│  • Session management                                        │
│  • Password hashing                                          │
└─────────────────────────────────────────────────────────────┘
```

## Files Structure

```
lib/
├── supabase/
│   ├── auth.ts              # Core authentication functions
│   ├── auth-helpers.ts      # Server-side helpers for API routes
│   ├── client.ts            # Browser Supabase client
│   ├── server.ts            # Server Supabase client
│   └── middleware.ts        # Route protection middleware
├── hooks/
│   └── useAuth.ts           # React hook for authentication
├── types/
│   └── auth.ts              # TypeScript types for auth
└── components/
    └── ProtectedRoute.tsx   # Component for protecting routes
```

## Usage Examples

### 1. Client-Side Authentication (React Components)

#### Using the useAuth Hook

```typescript
'use client'

import { useAuth } from '@/lib/hooks/useAuth'

export default function LoginPage() {
  const { signIn, isLoading, isAuthenticated } = useAuth()
  
  const handleLogin = async (email: string, password: string) => {
    const { error } = await signIn({ email, password })
    
    if (error) {
      console.error('Login failed:', error.message)
      return
    }
    
    // Redirect to dashboard
    router.push('/discover')
  }
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      const formData = new FormData(e.currentTarget)
      handleLogin(
        formData.get('email') as string,
        formData.get('password') as string
      )
    }}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit" disabled={isLoading}>
        Sign In
      </button>
    </form>
  )
}
```

#### Protecting a Page with ProtectedRoute

```typescript
'use client'

import { ProtectedRoute } from '@/lib/components/ProtectedRoute'

export default function UserDashboard() {
  return (
    <ProtectedRoute allowedRoles={['user']}>
      <div>
        <h1>User Dashboard</h1>
        {/* Dashboard content */}
      </div>
    </ProtectedRoute>
  )
}
```

#### Checking User Role

```typescript
'use client'

import { useAuth } from '@/lib/hooks/useAuth'

export default function Navigation() {
  const { isAuthenticated, role, isAdmin, isOperator, isUser } = useAuth()
  
  return (
    <nav>
      {isAuthenticated && (
        <>
          {isUser && <Link href="/discover">Discover</Link>}
          {isOperator && <Link href="/operator/waiting">Waiting Room</Link>}
          {isAdmin && <Link href="/admin/dashboard">Admin Panel</Link>}
        </>
      )}
    </nav>
  )
}
```

### 2. Server-Side Authentication (API Routes)

#### Requiring Authentication

```typescript
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/supabase/auth-helpers'

export async function GET() {
  const { user, error } = await requireAuth()
  
  if (error) {
    return error // Returns 401 response
  }
  
  // User is authenticated
  return NextResponse.json({ userId: user.id })
}
```

#### Requiring Specific Role

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/supabase/auth-helpers'

export async function POST(request: NextRequest) {
  const { user, role, error } = await requireRole(['admin', 'super_admin'])
  
  if (error) {
    return error // Returns 401 or 403 response
  }
  
  // User is authenticated and has admin role
  const body = await request.json()
  return NextResponse.json({ message: 'Admin action completed', data: body })
}
```

#### Getting User Profile

```typescript
import { getRealUserProfile, getOperatorProfile, getAdminProfile } from '@/lib/supabase/auth-helpers'

// Get real user profile
const userProfile = await getRealUserProfile(authId)

// Get operator profile
const operatorProfile = await getOperatorProfile(authId)

// Get admin profile
const adminProfile = await getAdminProfile(authId)
```

### 3. Server Components

#### Getting Session in Server Component

```typescript
import { getSession, getUser } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/get-started')
  }
  
  const user = await getUser()
  
  return (
    <div>
      <h1>Profile</h1>
      <p>Email: {user?.email}</p>
    </div>
  )
}
```

### 4. Direct Authentication Functions

#### Sign Up

```typescript
import { signUp } from '@/lib/supabase/auth'

const { user, session, error } = await signUp({
  email: 'user@example.com',
  password: 'securepassword',
  options: {
    data: {
      username: 'johndoe',
      display_name: 'John Doe',
      age: 25,
    }
  }
})

if (error) {
  console.error('Sign up failed:', error.message)
}
```

#### Sign In

```typescript
import { signIn } from '@/lib/supabase/auth'

const { user, session, error } = await signIn({
  email: 'user@example.com',
  password: 'securepassword',
})

if (error) {
  console.error('Sign in failed:', error.message)
}
```

#### Sign Out

```typescript
import { signOut } from '@/lib/supabase/auth'

const { error } = await signOut()

if (error) {
  console.error('Sign out failed:', error.message)
}
```

## Route Protection

The middleware automatically protects routes based on configuration:

### Protected Routes

- **User routes** (`/discover`, `/profile`, `/chat`, etc.): Require `user` role
- **Operator routes** (`/operator/*`): Require `operator` role
- **Admin routes** (`/admin/*`): Require `admin` or `super_admin` role

### Public Routes

- `/` - Landing page
- `/get-started` - User registration
- `/op-login` - Operator login
- `/admin-login` - Admin login
- `/setup` - First admin setup

### Automatic Redirects

- Unauthenticated users accessing protected routes → Redirected to appropriate login
- Authenticated users accessing wrong role routes → Redirected to home
- Authenticated users accessing login pages → Redirected to their dashboard

## Role Hierarchy

```
super_admin (highest privileges)
    ↓
admin (manage users, operators, content)
    ↓
operator (manage assigned chats)
    ↓
user (basic access)
```

## Security Features

1. **JWT-based authentication**: Secure token-based auth with Supabase
2. **Row Level Security (RLS)**: Database-level access control
3. **Role-based access control**: Middleware and helper functions enforce roles
4. **Session refresh**: Automatic token refresh in middleware
5. **Password hashing**: Handled by Supabase Auth
6. **HTTPS only**: All authentication happens over secure connections

## Error Handling

All authentication functions return consistent error objects:

```typescript
interface AuthError {
  message: string
  status?: number
  code?: string
}
```

Common error codes:
- `INVALID_CREDENTIALS`: Wrong email or password
- `USER_NOT_FOUND`: User doesn't exist
- `EMAIL_ALREADY_EXISTS`: Email is already registered
- `WEAK_PASSWORD`: Password doesn't meet requirements
- `UNKNOWN_ERROR`: Unexpected error occurred

## Testing

### Testing Authentication in Components

```typescript
import { render, screen } from '@testing-library/react'
import { useAuth } from '@/lib/hooks/useAuth'

// Mock the useAuth hook
jest.mock('@/lib/hooks/useAuth')

test('shows login button when not authenticated', () => {
  (useAuth as jest.Mock).mockReturnValue({
    isAuthenticated: false,
    isLoading: false,
  })
  
  render(<Navigation />)
  expect(screen.getByText('Sign In')).toBeInTheDocument()
})
```

### Testing Protected Routes

```typescript
import { requireRole } from '@/lib/supabase/auth-helpers'

// Mock Supabase client
jest.mock('@/lib/supabase/server')

test('returns 403 for unauthorized role', async () => {
  const { error } = await requireRole(['admin'])
  expect(error?.status).toBe(403)
})
```

## Best Practices

1. **Always use server-side auth for sensitive operations**: Never trust client-side auth alone
2. **Check user status**: Verify user is not banned/suspended before allowing actions
3. **Use RLS policies**: Enforce access control at database level
4. **Handle errors gracefully**: Show user-friendly error messages
5. **Refresh sessions**: Use middleware to keep sessions fresh
6. **Log security events**: Track failed logins, permission denials, etc.

## Troubleshooting

### Session not persisting
- Check that middleware is configured correctly
- Verify cookies are being set properly
- Ensure HTTPS is used in production

### Role not detected
- Verify user exists in appropriate table (real_users, operators, admins)
- Check that `is_active` is true
- Ensure `auth_id` matches Supabase auth user ID

### Middleware redirects not working
- Check route patterns in middleware configuration
- Verify Next.js middleware matcher is correct
- Test with console.log statements in middleware

## Related Documentation

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
