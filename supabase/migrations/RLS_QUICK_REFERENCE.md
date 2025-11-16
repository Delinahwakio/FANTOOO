# RLS Quick Reference Guide

## Quick Access Rules

### Real Users
```
✓ View own profile
✓ Update own profile
✓ View own chats
✓ View own messages
✓ Send messages in own chats
✓ View own transactions
✓ View own refunds
✓ View own activity log
✓ View active fictional profiles (public)
✓ View active credit packages
```

### Operators
```
✓ View own profile
✓ Update own profile
✓ View assigned chats
✓ View messages in assigned chats
✓ Send messages in assigned chats (as fictional user)
✓ Update messages in assigned chats
✓ View all fictional profiles
✓ View chat queue
✓ View own edit history
```

### Admins
```
✓ View all data across all tables
✓ Update most data
✓ Delete most data
✓ Create fictional profiles
✓ Create operators
✓ Process refunds
✓ Reconcile payments
✓ View analytics
✓ Manage notifications
```

### Super Admins
```
✓ All admin permissions
✓ Create/update/delete admins
✓ Manage system settings
✓ Full admin management
```

## Common Queries

### Check Current User Role
```sql
SELECT get_user_role();
```

### Check if Current User is Admin
```sql
SELECT is_admin();
```

### Get Current User's ID
```sql
-- For real users
SELECT get_real_user_id();

-- For operators
SELECT get_operator_id();

-- For admins
SELECT get_admin_id();
```

## Policy Naming Convention

All policies follow this pattern:
```
{table_name}_{operation}_{role}
```

Examples:
- `real_users_select_own` - Real users selecting their own data
- `chats_update_operator` - Operators updating assigned chats
- `fictional_users_delete_admin` - Admins deleting fictional profiles

## Troubleshooting

### "permission denied for table X"
**Cause**: User doesn't have permission to access the table  
**Solution**: 
1. Verify user is authenticated
2. Check user has correct role
3. Verify RLS policy exists for that role
4. Check policy conditions are met

### "new row violates row-level security policy"
**Cause**: INSERT/UPDATE violates WITH CHECK clause  
**Solution**:
1. Check the WITH CHECK conditions in the policy
2. Verify user is inserting/updating allowed data
3. Check foreign key references are accessible

### Query is slow
**Cause**: RLS policies add overhead to queries  
**Solution**:
1. Add indexes on columns used in policy conditions
2. Use helper functions (they're cached)
3. Consider materialized views for complex queries
4. Use service role for system operations

## Service Role Usage

The service role bypasses RLS. Use it for:
- Edge Functions
- Scheduled jobs
- System operations
- Automated tasks

**Never expose service role key to client!**

## Testing RLS Policies

### Test as Different User
```sql
-- Set up test context
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "user-auth-id"}';

-- Run your query
SELECT * FROM real_users;

-- Reset
RESET role;
```

### Verify Policy Exists
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'real_users' 
AND policyname = 'real_users_select_own';
```

### Check RLS is Enabled
```sql
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'real_users';
```

## Best Practices

1. **Always use helper functions** instead of direct auth.uid() checks
2. **Test policies thoroughly** before deploying to production
3. **Monitor query performance** as RLS adds overhead
4. **Use service role sparingly** and only when necessary
5. **Document any policy changes** in this file
6. **Regular security audits** to verify policies are effective

## Policy Modification Checklist

When modifying RLS policies:

- [ ] Test in development environment first
- [ ] Verify no unintended access granted
- [ ] Verify no legitimate access denied
- [ ] Check query performance impact
- [ ] Update documentation
- [ ] Deploy during low-traffic period
- [ ] Monitor for errors after deployment

## Emergency Procedures

### Disable RLS on a Table (Emergency Only)
```sql
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```

### Re-enable RLS
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### Drop All Policies on a Table
```sql
DROP POLICY IF EXISTS policy_name ON table_name;
```

**⚠️ Warning**: Only use these in emergencies. Always have a rollback plan!

## Contact

For questions about RLS policies:
1. Check this guide first
2. Review README_RLS_POLICIES.md for detailed documentation
3. Check the migration file: 20241116000005_create_rls_policies.sql
4. Contact the database team

---

**Last Updated**: November 16, 2024  
**Version**: 1.0  
**Status**: Production Ready
