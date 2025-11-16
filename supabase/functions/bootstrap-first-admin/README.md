# Bootstrap First Admin - Edge Function

## Overview

This Supabase Edge Function handles the creation of the first super admin account for the Fantooo platform. It validates the setup token, checks for existing admins, and creates both the auth user and admin database record.

## Features

- ✅ Setup token validation against environment variable
- ✅ Prevents duplicate admin creation
- ✅ Creates Supabase Auth user
- ✅ Creates admin database record with super_admin role
- ✅ Transaction safety with rollback on failure
- ✅ CORS support for browser requests
- ✅ Comprehensive error handling

## Environment Variables

The following environment variable must be configured in Supabase:

```
ADMIN_SETUP_TOKEN=your_secure_setup_token
```

### Setting Environment Variables

1. Go to Supabase Dashboard
2. Navigate to Project Settings > Edge Functions
3. Add the secret:
   - Name: `ADMIN_SETUP_TOKEN`
   - Value: Your secure token (e.g., a long random string)

## Deployment

### Deploy to Supabase

```bash
# Deploy the function
supabase functions deploy bootstrap-first-admin

# Set the environment variable
supabase secrets set ADMIN_SETUP_TOKEN=your_secure_token
```

### Local Development

```bash
# Start Supabase locally
supabase start

# Serve the function locally
supabase functions serve bootstrap-first-admin --env-file .env.local

# Set local environment variable in .env.local
echo "ADMIN_SETUP_TOKEN=your_local_token" >> .env.local
```

## API Reference

### Endpoint

```
POST /functions/v1/bootstrap-first-admin
```

### Request Headers

```
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
Content-Type: application/json
```

### Request Body

```json
{
  "name": "John Doe",
  "email": "admin@example.com",
  "password": "SecurePassword123!",
  "setupToken": "your_setup_token"
}
```

### Success Response (201)

```json
{
  "success": true,
  "message": "Super admin account created successfully",
  "admin": {
    "id": "uuid",
    "name": "John Doe",
    "email": "admin@example.com",
    "role": "super_admin"
  }
}
```

### Error Responses

#### 400 - Missing Required Fields
```json
{
  "error": "Missing required fields"
}
```

#### 401 - Invalid Setup Token
```json
{
  "error": "Invalid setup token"
}
```

#### 403 - Admin Already Exists
```json
{
  "error": "Admin account already exists. Setup is disabled."
}
```

#### 500 - Server Error
```json
{
  "error": "Failed to create admin record"
}
```

## Security Considerations

1. **Token Security**
   - Use a long, random, cryptographically secure token
   - Never commit the token to version control
   - Rotate the token after initial setup if needed

2. **One-Time Use**
   - The function automatically prevents multiple admin creation
   - Once an admin exists, the function returns 403

3. **CORS Configuration**
   - Currently allows all origins (`*`)
   - Consider restricting to your domain in production

4. **Rate Limiting**
   - Consider adding rate limiting to prevent brute force attacks
   - Supabase provides built-in rate limiting options

## Testing

### Test with curl

```bash
# Test successful creation
curl -X POST \
  https://your-project.supabase.co/functions/v1/bootstrap-first-admin \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Admin",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "setupToken": "YOUR_SETUP_TOKEN"
  }'

# Test invalid token
curl -X POST \
  https://your-project.supabase.co/functions/v1/bootstrap-first-admin \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Admin",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "setupToken": "wrong_token"
  }'
```

### Test with JavaScript

```javascript
const response = await fetch(
  'https://your-project.supabase.co/functions/v1/bootstrap-first-admin',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Test Admin',
      email: 'test@example.com',
      password: 'SecurePass123!',
      setupToken: 'YOUR_SETUP_TOKEN',
    }),
  }
);

const result = await response.json();
console.log(result);
```

## Database Schema

The function expects the following database schema:

### admins table

```sql
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Permissions Created

The super admin is created with the following permissions:

```json
{
  "manage_users": true,
  "manage_fictional_profiles": true,
  "manage_operators": true,
  "manage_chats": true,
  "view_analytics": true,
  "manage_payments": true,
  "manage_admins": true,
  "system_settings": true,
  "delete_data": true
}
```

## Error Handling

The function implements comprehensive error handling:

1. **Validation Errors**: Returns 400 for missing or invalid fields
2. **Authentication Errors**: Returns 401 for invalid setup token
3. **Authorization Errors**: Returns 403 when admin already exists
4. **Database Errors**: Returns 500 with appropriate error message
5. **Rollback**: Deletes auth user if admin record creation fails

## Monitoring

### Logs

View function logs in Supabase Dashboard:
1. Go to Edge Functions
2. Select `bootstrap-first-admin`
3. View Logs tab

### Metrics

Monitor:
- Invocation count (should be 1 for production)
- Error rate
- Response time
- Failed authentication attempts

## Troubleshooting

### Issue: "Setup token not configured on server"
**Cause:** Environment variable not set
**Solution:** Run `supabase secrets set ADMIN_SETUP_TOKEN=your_token`

### Issue: "Failed to check existing admins"
**Cause:** Database table doesn't exist or RLS policies block access
**Solution:** 
- Verify migrations are applied
- Check RLS policies allow service role access

### Issue: "Failed to create auth user"
**Cause:** Supabase Auth configuration issue
**Solution:**
- Verify Auth is enabled in project settings
- Check email/password auth is enabled
- Verify email is not already in use

### Issue: Function times out
**Cause:** Database connection issues or slow queries
**Solution:**
- Check database health
- Verify network connectivity
- Review query performance

## Future Enhancements

- [ ] Add rate limiting to prevent brute force attacks
- [ ] Implement email verification for admin accounts
- [ ] Add audit logging for admin creation
- [ ] Support for multi-factor authentication setup
- [ ] Password complexity validation
- [ ] IP whitelist for setup requests
- [ ] Webhook notification on admin creation

## Related Files

- Frontend: `app/(auth)/setup/page.tsx`
- Documentation: `app/(auth)/README.md`
- Testing: `app/(auth)/TESTING.md`

## Requirements

This Edge Function satisfies requirements 1.1-1.5 (Admin Bootstrap System) from the requirements document.
