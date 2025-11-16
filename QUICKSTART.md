# Fantooo Platform - Quick Start Guide

## Task 2: Supabase Setup ✅

This task sets up the Supabase connection for the Fantooo platform.

## What's Been Done

✅ Supabase client configuration files created:
- `lib/supabase/client.ts` - Browser-side client
- `lib/supabase/server.ts` - Server-side client  
- `lib/supabase/middleware.ts` - Auth session management

✅ Connection testing utilities:
- `lib/supabase/test-connection.ts` - Connection test functions
- `app/api/test-connection/route.ts` - API endpoint for testing
- `scripts/test-supabase.js` - CLI test script

✅ Documentation:
- `SUPABASE_SETUP.md` - Comprehensive setup guide
- `lib/supabase/README.md` - Usage documentation

✅ Environment configuration:
- `.env.example` - Template with all required variables
- `.env.local` - Local environment file (needs your credentials)

## Next Steps: Complete Your Setup

### 1. Get Supabase Credentials

**Option A: Cloud Setup (Recommended)**
1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Get your credentials from Project Settings → API

**Option B: Local Setup**
```bash
npm install -g supabase
supabase init
supabase start
```

### 2. Configure Environment Variables

Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 3. Test Your Connection

**Method 1: CLI Test**
```bash
npm run test:supabase
```

Expected output:
```
✓ Environment variables found
✓ Connection successful
✓ Supabase API is responding correctly
✅ All tests passed!
```

**Method 2: Browser Test**
```bash
npm run dev
```
Then visit: http://localhost:3000/api/test-connection

Expected response:
```json
{
  "success": true,
  "message": "Connection successful. Run migrations to create tables.",
  "connectionStatus": "connected",
  "tablesExist": false
}
```

Note: `tablesExist: false` is expected - you'll create tables in Task 3.

## Troubleshooting

### "Missing environment variables"
- Make sure you've edited `.env.local` with your actual credentials
- Check there are no extra spaces or quotes around the values

### "Invalid API key"
- Verify you copied the entire key (they're very long)
- Make sure you're using the anon key, not the service role key for NEXT_PUBLIC_SUPABASE_ANON_KEY

### "Connection failed"
- Check your internet connection
- Verify the Supabase URL is correct
- For local setup, ensure `supabase start` is running

### Need more help?
See `SUPABASE_SETUP.md` for detailed troubleshooting and setup instructions.

## What's Next?

Once your connection test passes:

1. ✅ **Task 2 Complete!** - Supabase is connected
2. 📋 **Task 3** - Create database schema (migrations)
3. 🔒 **Task 7** - Set up Row Level Security policies
4. ⚡ **Task 18-19** - Create Edge Functions

## Project Structure

```
fantooo-platform/
├── lib/
│   └── supabase/
│       ├── client.ts          # Browser client
│       ├── server.ts          # Server client
│       ├── middleware.ts      # Auth middleware
│       ├── test-connection.ts # Test utilities
│       └── README.md          # Usage docs
├── app/
│   └── api/
│       └── test-connection/
│           └── route.ts       # Test endpoint
├── scripts/
│   └── test-supabase.js       # CLI test script
├── .env.local                 # Your credentials (not in git)
├── .env.example               # Template
├── SUPABASE_SETUP.md          # Detailed setup guide
└── QUICKSTART.md              # This file
```

## Useful Commands

```bash
# Test Supabase connection
npm run test:supabase

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

## Security Reminders

⚠️ **Never commit `.env.local` to version control**
⚠️ **Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code**
✅ **Always use RLS policies to secure your data**

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Project Design Document](.kiro/specs/fantooo-platform/design.md)
- [Project Requirements](.kiro/specs/fantooo-platform/requirements.md)

---

**Ready to continue?** Once your connection test passes, move on to Task 3 to create the database schema!
