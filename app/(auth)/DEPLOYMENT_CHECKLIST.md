# Admin Setup Page - Deployment Checklist

## Pre-Deployment

### Database Setup
- [ ] Verify database migrations have been applied
- [ ] Confirm `admins` table exists with correct schema
- [ ] Verify `auth.users` table is accessible
- [ ] Test database connection from Edge Function
- [ ] Verify RLS policies allow service role access

### Environment Variables - Next.js
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` in Vercel/hosting platform
- [ ] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel/hosting platform
- [ ] Set `ADMIN_SETUP_TOKEN` in Vercel/hosting platform (keep secret!)
- [ ] Verify environment variables are loaded correctly
- [ ] Test environment variables in staging

### Environment Variables - Supabase
- [ ] Set `ADMIN_SETUP_TOKEN` in Supabase Edge Function secrets
- [ ] Verify `SUPABASE_URL` is available to Edge Function
- [ ] Verify `SUPABASE_SERVICE_ROLE_KEY` is available to Edge Function
- [ ] Test Edge Function can access environment variables

### Supabase Configuration
- [ ] Verify Supabase Auth is enabled
- [ ] Enable email/password authentication
- [ ] Configure email templates (optional)
- [ ] Set up email provider (optional)
- [ ] Verify service role key has admin permissions

## Deployment Steps

### 1. Deploy Edge Function
```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy bootstrap-first-admin

# Set the secret
supabase secrets set ADMIN_SETUP_TOKEN=your_secure_token

# Verify deployment
supabase functions list
```

- [ ] Edge Function deployed successfully
- [ ] Edge Function appears in Supabase dashboard
- [ ] Secret is set and visible in dashboard
- [ ] Function logs are accessible

### 2. Deploy Frontend
```bash
# Build the application
npm run build

# Deploy to Vercel (or your hosting platform)
vercel deploy --prod

# Or use Git-based deployment
git push origin main
```

- [ ] Frontend deployed successfully
- [ ] Environment variables are set in hosting platform
- [ ] Build completed without errors
- [ ] Application is accessible at production URL

### 3. Verify Deployment
- [ ] Navigate to `/setup` page
- [ ] Verify page loads without errors
- [ ] Check browser console for errors
- [ ] Verify glassmorphism styling is applied
- [ ] Test form validation (submit empty form)
- [ ] Verify error messages display correctly

## Post-Deployment Testing

### Functional Testing
- [ ] Test with invalid setup token (should show error)
- [ ] Test with missing fields (should show validation errors)
- [ ] Test with invalid email format (should show error)
- [ ] Test with short password (should show error)
- [ ] Test with correct credentials and token (should succeed)
- [ ] Verify redirect to admin login after success
- [ ] Verify success message displays on admin login page
- [ ] Try accessing `/setup` again (should redirect to admin login)

### Database Verification
```sql
-- Check admin was created
SELECT * FROM admins WHERE role = 'super_admin';

-- Check auth user was created
SELECT * FROM auth.users WHERE email = 'your-admin-email';

-- Verify permissions
SELECT permissions FROM admins WHERE role = 'super_admin';
```

- [ ] Admin record exists in database
- [ ] Auth user exists in auth.users
- [ ] Role is set to 'super_admin'
- [ ] All permissions are set to true
- [ ] is_active is true
- [ ] Timestamps are correct

### Security Testing
- [ ] Verify setup token is not exposed in client-side code
- [ ] Test with wrong token (should fail)
- [ ] Verify HTTPS is enforced
- [ ] Check CORS headers are appropriate
- [ ] Verify no sensitive data in error messages
- [ ] Test that setup page is disabled after admin creation

### Performance Testing
- [ ] Page loads in < 2 seconds
- [ ] Form submission completes in < 3 seconds
- [ ] No memory leaks in browser
- [ ] Edge Function responds in < 1 second
- [ ] Database queries complete in < 100ms

## Documentation

- [ ] Document the setup token securely (password manager)
- [ ] Share setup instructions with authorized personnel
- [ ] Document the admin email and credentials
- [ ] Update deployment documentation
- [ ] Create runbook for troubleshooting
- [ ] Document rollback procedure

## Security Hardening

### Immediate Actions
- [ ] Rotate setup token after first admin is created (optional)
- [ ] Enable 2FA for admin account (when implemented)
- [ ] Review Edge Function logs for suspicious activity
- [ ] Set up monitoring alerts for failed attempts
- [ ] Document incident response procedure

### Future Enhancements
- [ ] Add rate limiting to Edge Function
- [ ] Implement IP whitelist for setup page
- [ ] Add email verification for admin accounts
- [ ] Implement audit logging for admin creation
- [ ] Add webhook notification on admin creation
- [ ] Implement password complexity requirements

## Monitoring Setup

### Supabase Dashboard
- [ ] Enable Edge Function logging
- [ ] Set up error alerts
- [ ] Monitor function invocations
- [ ] Track response times
- [ ] Monitor database queries

### Application Monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor page load times
- [ ] Track form submission success rate
- [ ] Monitor API error rates
- [ ] Set up uptime monitoring

### Alerts
- [ ] Alert on Edge Function errors
- [ ] Alert on multiple failed setup attempts
- [ ] Alert on database connection issues
- [ ] Alert on authentication failures
- [ ] Alert on unexpected admin creation attempts

## Rollback Plan

### If Deployment Fails
1. [ ] Revert to previous deployment
2. [ ] Check error logs
3. [ ] Fix issues in development
4. [ ] Test thoroughly in staging
5. [ ] Redeploy

### If Admin Creation Fails
1. [ ] Check Edge Function logs
2. [ ] Verify database schema
3. [ ] Check environment variables
4. [ ] Test Edge Function directly with curl
5. [ ] Fix issues and retry

### Emergency Rollback
```bash
# Rollback Edge Function
supabase functions deploy bootstrap-first-admin --version previous

# Rollback Frontend (Vercel)
vercel rollback

# Or use Git
git revert HEAD
git push origin main
```

## Post-Setup Cleanup

### After First Admin is Created
- [ ] Verify setup page is disabled
- [ ] Test that `/setup` redirects to admin login
- [ ] Document admin credentials securely
- [ ] Remove setup token from easily accessible locations
- [ ] Consider rotating the setup token
- [ ] Update documentation with actual admin email

### Optional Cleanup
- [ ] Remove setup page from sitemap (if applicable)
- [ ] Add robots.txt entry to block `/setup` (optional)
- [ ] Set up monitoring for unauthorized access attempts
- [ ] Review and update security policies

## Success Criteria

The deployment is successful when:
- ✅ Setup page is accessible at `/setup`
- ✅ Form validation works correctly
- ✅ Setup token validation works
- ✅ Admin account can be created successfully
- ✅ Auth user is created in Supabase Auth
- ✅ Admin record is created in database
- ✅ Super admin has all permissions
- ✅ Setup page auto-disables after first admin
- ✅ Redirect to admin login works
- ✅ Success message displays correctly
- ✅ No errors in browser console
- ✅ No errors in Edge Function logs
- ✅ All security checks pass
- ✅ Performance targets are met

## Sign-Off

- [ ] Developer: Tested and verified
- [ ] QA: All tests passed
- [ ] Security: Security review completed
- [ ] DevOps: Deployment successful
- [ ] Product Owner: Acceptance criteria met

## Notes

Date Deployed: _______________
Deployed By: _______________
Admin Email: _______________
Setup Token Location: _______________
Issues Encountered: _______________
Resolution: _______________

---

## Quick Reference

### Important URLs
- Setup Page: `https://your-domain.com/setup`
- Admin Login: `https://your-domain.com/admin-login`
- Edge Function: `https://your-project.supabase.co/functions/v1/bootstrap-first-admin`

### Important Commands
```bash
# Deploy Edge Function
supabase functions deploy bootstrap-first-admin

# Set secret
supabase secrets set ADMIN_SETUP_TOKEN=your_token

# View logs
supabase functions logs bootstrap-first-admin

# Test Edge Function
curl -X POST https://your-project.supabase.co/functions/v1/bootstrap-first-admin \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@example.com","password":"SecurePass123!","setupToken":"YOUR_TOKEN"}'
```

### Support Contacts
- Developer: _______________
- DevOps: _______________
- Security: _______________
- On-Call: _______________
