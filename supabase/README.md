# Supabase Migrations

This directory contains database migrations for the Fantooo platform.

## Migration Files

### 20241116000001_create_user_tables.sql
Creates the core user tables for the platform:
- `real_users` - Authenticated users who chat with fictional profiles
- `fictional_users` - Fictional profiles managed by operators
- `admins` - Platform administrators with role-based permissions
- `operators` - Staff members who manage fictional profiles

**Key Features:**
- Age validation (18+ requirement) for real_users and fictional_users
- Profile picture validation (3-10 pictures) for fictional_users
- Role-based permissions for admins (super_admin, admin, moderator)
- Performance tracking fields for operators (quality_score, response_time, etc.)
- Automatic updated_at timestamp triggers
- Comprehensive indexes for query optimization
- Soft delete support (deleted_at column)

## Applying Migrations

### Using Supabase CLI (Local Development)

1. Make sure you have Supabase CLI installed:
```bash
npm install -g supabase
```

2. Initialize Supabase (if not already done):
```bash
supabase init
```

3. Start local Supabase:
```bash
supabase start
```

4. Apply migrations:
```bash
supabase db reset
```

Or apply specific migration:
```bash
supabase migration up
```

### Using Supabase Dashboard (Production)

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of the migration file
4. Execute the SQL

### Verifying Migration

After applying the migration, verify the tables were created:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('real_users', 'fictional_users', 'admins', 'operators');

-- Check constraints
SELECT constraint_name, table_name 
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
AND table_name IN ('real_users', 'fictional_users', 'admins', 'operators');

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('real_users', 'fictional_users', 'admins', 'operators');
```

## Requirements Mapping

This migration satisfies the following requirements:

- **1.1-1.5**: Admin Bootstrap System - admins table with role-based permissions
- **2.1-2.5**: User Registration - real_users table with age validation (18+)
- **3.1-3.5**: Fictional Profiles - fictional_users table with profile picture validation (3-10)
- **8.1-8.5**: Operator Assignment - operators table with assignment tracking
- **11.1-11.5**: Operator Availability - is_available field in operators table
- **12.1-12.5**: Operator Performance - quality_score and performance tracking fields

## Next Steps

After applying this migration, you should:
1. Set up Row Level Security (RLS) policies
2. Create database triggers for business logic
3. Create database functions for complex operations
4. Set up the remaining tables (chats, messages, transactions, etc.)
