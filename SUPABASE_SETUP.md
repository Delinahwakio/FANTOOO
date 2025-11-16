# Supabase Setup Guide

This guide will help you set up Supabase for the Fantooo platform.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A Supabase account (free tier works for development)

## Option 1: Using Supabase Cloud (Recommended for Development)

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Fill in the project details:
   - **Name**: fantooo-platform (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users (e.g., Singapore for East Africa)
   - **Pricing Plan**: Free (for development)
5. Click "Create new project"
6. Wait for the project to be provisioned (takes 1-2 minutes)

### Step 2: Get Your API Keys

1. Once your project is ready, go to **Project Settings** (gear icon in sidebar)
2. Navigate to **API** section
3. You'll see:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (long string)
   - **service_role key**: `eyJhbGc...` (long string - keep this secret!)

### Step 3: Configure Environment Variables

1. Open `.env.local` in your project root
2. Fill in the Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Admin Setup (generate a secure random string)
ADMIN_SETUP_TOKEN=your_secure_random_token_here

# Other configurations...
```

3. **Important**: Never commit `.env.local` to version control!

### Step 4: Test the Connection

1. Start your development server:
```bash
npm run dev
```

2. Open your browser and navigate to:
```
http://localhost:3000/api/test-connection
```

3. You should see a JSON response like:
```json
{
  "success": true,
  "message": "Connection successful. Run migrations to create tables.",
  "connectionStatus": "connected",
  "tablesExist": false
}
```

If `tablesExist` is `false`, that's expected - you'll create tables in the next task (Task 3).

### Step 5: Verify in Supabase Dashboard

1. Go back to your Supabase project dashboard
2. Click on **Table Editor** in the sidebar
3. You should see an empty database (no tables yet)
4. This confirms your connection is working!

## Option 2: Using Supabase CLI (Local Development)

### Step 1: Install Supabase CLI

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows (using Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or using npm (all platforms)
npm install -g supabase
```

### Step 2: Initialize Supabase Locally

```bash
# Login to Supabase
supabase login

# Initialize Supabase in your project
supabase init

# Start local Supabase instance
supabase start
```

This will:
- Start a local PostgreSQL database
- Start Supabase Studio (local dashboard)
- Start authentication services
- Start storage services

### Step 3: Get Local Credentials

After `supabase start` completes, you'll see output like:

```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
anon key: eyJhbGc...
service_role key: eyJhbGc...
```

### Step 4: Configure Local Environment

Update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 5: Test Local Connection

```bash
npm run dev
```

Visit: `http://localhost:3000/api/test-connection`

## Troubleshooting

### Error: "Invalid API key"

- Double-check that you copied the entire API key (they're very long)
- Make sure there are no extra spaces or line breaks
- Verify you're using the correct key (anon vs service_role)

### Error: "Failed to fetch"

- Check that your Supabase project is running
- Verify the URL is correct (no trailing slash)
- Check your internet connection (for cloud setup)
- For local setup, ensure `supabase start` is running

### Error: "relation 'real_users' does not exist"

- This is expected! You haven't created tables yet
- The connection test should still pass with `tablesExist: false`
- You'll create tables in Task 3 (database migrations)

### Connection works but tables don't appear

- Make sure you're looking at the correct project in Supabase dashboard
- Refresh the Table Editor page
- Check that migrations have been run (Task 3)

## Next Steps

Once your connection test passes:

1. ✅ Task 2 is complete!
2. Move on to **Task 3**: Create core database schema
3. Run migrations to create tables
4. Set up Row Level Security (RLS) policies

## Useful Commands

```bash
# Check Supabase CLI version
supabase --version

# View local Supabase status
supabase status

# Stop local Supabase
supabase stop

# Reset local database (careful!)
supabase db reset

# View logs
supabase logs
```

## Security Best Practices

1. **Never commit** `.env.local` to version control
2. **Never expose** `SUPABASE_SERVICE_ROLE_KEY` in client-side code
3. **Always use** `NEXT_PUBLIC_SUPABASE_ANON_KEY` for client-side operations
4. **Rotate keys** if they're ever exposed
5. **Use RLS policies** to secure your data (Task 7)

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Next.js Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Support

If you encounter issues:
1. Check the [Supabase Discord](https://discord.supabase.com)
2. Review [Supabase GitHub Issues](https://github.com/supabase/supabase/issues)
3. Consult the project documentation
