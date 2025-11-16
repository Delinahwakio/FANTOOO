# Supabase Configuration

This directory contains the Supabase client configuration for the Fantooo platform.

## Files

### `client.ts`
Browser-side Supabase client for use in Client Components.

```typescript
import { createClient } from '@/lib/supabase/client'

export default function MyComponent() {
  const supabase = createClient()
  // Use supabase client...
}
```

### `server.ts`
Server-side Supabase client for use in Server Components, API Routes, and Server Actions.

```typescript
import { createClient } from '@/lib/supabase/server'

export async function MyServerComponent() {
  const supabase = await createClient()
  // Use supabase client...
}
```

### `middleware.ts`
Middleware helper for refreshing auth sessions automatically.

Used in the root `middleware.ts` file to keep user sessions fresh.

### `test-connection.ts`
Utility functions to test database connectivity.

```typescript
import { testConnection, testServerConnection } from '@/lib/supabase/test-connection'

// Client-side test
const result = await testConnection()

// Server-side test
const result = await testServerConnection()
```

## Usage Guidelines

### When to use `client.ts`
- Client Components (components with 'use client')
- Browser-side operations
- Real-time subscriptions
- User-initiated actions

### When to use `server.ts`
- Server Components (default in Next.js 14)
- API Routes
- Server Actions
- Data fetching on the server
- Operations requiring service role key

### Security Notes

1. **Never use service role key in client-side code**
   - The `client.ts` only uses the anon key
   - Service role key bypasses RLS policies

2. **Always use RLS policies**
   - Row Level Security protects your data
   - Even with the anon key, users can only access their own data

3. **Environment variables**
   - `NEXT_PUBLIC_SUPABASE_URL` - Safe to expose (public)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Safe to expose (public)
   - `SUPABASE_SERVICE_ROLE_KEY` - **NEVER expose** (server-only)

## Testing Connection

### Method 1: Using the API route
```bash
npm run dev
# Visit: http://localhost:3000/api/test-connection
```

### Method 2: Using the test script
```bash
npm run test:supabase
```

### Method 3: Manual test in code
```typescript
import { testConnection } from '@/lib/supabase/test-connection'

const result = await testConnection()
console.log(result)
```

## Common Issues

### "Invalid API key"
- Check `.env.local` has correct values
- Ensure no extra spaces in the keys
- Verify you copied the entire key

### "Failed to fetch"
- Check Supabase project is running
- Verify URL is correct (no trailing slash)
- Check internet connection

### "relation does not exist"
- Tables haven't been created yet
- Run migrations (Task 3)
- This is expected before migrations

## Next Steps

After setting up Supabase:
1. ✅ Connection is working
2. Create database schema (Task 3)
3. Set up RLS policies (Task 7)
4. Create Edge Functions (Tasks 18-19)

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Integration](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Authentication Guide](https://supabase.com/docs/guides/auth)
- [Database Guide](https://supabase.com/docs/guides/database)
