# Admin Setup Page - Testing Guide

## Prerequisites

Before testing, ensure:

1. Supabase project is set up and running
2. Database migrations have been applied (admins table exists)
3. Environment variables are configured:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ADMIN_SETUP_TOKEN=your_secure_token
   ```
4. Edge Function `bootstrap-first-admin` is deployed to Supabase

## Test Scenarios

### Scenario 1: First Admin Setup (Happy Path)

**Preconditions:**
- No admins exist in the database
- Setup token is configured in environment

**Steps:**
1. Navigate to `http://localhost:3000/setup`
2. Verify the setup form is displayed
3. Fill in the form:
   - Name: "John Doe"
   - Email: "admin@example.com"
   - Password: "SecurePass123!"
   - Setup Token: [correct token from env]
4. Click "Create Super Admin Account"

**Expected Results:**
- ✅ Form submits successfully
- ✅ Loading state is shown during submission
- ✅ Redirect to `/admin-login?setup=success`
- ✅ Success message is displayed on admin login page
- ✅ Admin record is created in database with:
  - role: 'super_admin'
  - All permissions set to true
  - is_active: true
- ✅ Auth user is created in Supabase Auth

**Verification Queries:**
```sql
-- Check admin record
SELECT * FROM admins WHERE email = 'admin@example.com';

-- Check auth user
SELECT * FROM auth.users WHERE email = 'admin@example.com';
```

---

### Scenario 2: Setup Page Auto-Disable

**Preconditions:**
- At least one admin exists in the database

**Steps:**
1. Navigate to `http://localhost:3000/setup`

**Expected Results:**
- ✅ Immediate redirect to `/admin-login`
- ✅ Setup form is never displayed
- ✅ No API calls are made to create admin

---

### Scenario 3: Invalid Setup Token

**Preconditions:**
- No admins exist in the database

**Steps:**
1. Navigate to `http://localhost:3000/setup`
2. Fill in the form with valid data
3. Enter an incorrect setup token
4. Click "Create Super Admin Account"

**Expected Results:**
- ✅ Error message: "Invalid setup token"
- ✅ Form remains on the page
- ✅ No admin record is created
- ✅ No auth user is created

---

### Scenario 4: Missing Required Fields

**Preconditions:**
- No admins exist in the database

**Steps:**
1. Navigate to `http://localhost:3000/setup`
2. Leave one or more fields empty
3. Click "Create Super Admin Account"

**Expected Results:**
- ✅ Field-specific error messages are displayed:
  - "Name is required"
  - "Email is required"
  - "Password is required"
  - "Setup token is required"
- ✅ Form does not submit
- ✅ No API calls are made

---

### Scenario 5: Invalid Email Format

**Preconditions:**
- No admins exist in the database

**Steps:**
1. Navigate to `http://localhost:3000/setup`
2. Enter an invalid email (e.g., "notanemail")
3. Fill in other fields correctly
4. Click "Create Super Admin Account"

**Expected Results:**
- ✅ Error message: "Invalid email format"
- ✅ Form does not submit
- ✅ No API calls are made

---

### Scenario 6: Password Too Short

**Preconditions:**
- No admins exist in the database

**Steps:**
1. Navigate to `http://localhost:3000/setup`
2. Enter a password with less than 8 characters
3. Fill in other fields correctly
4. Click "Create Super Admin Account"

**Expected Results:**
- ✅ Error message: "Password must be at least 8 characters"
- ✅ Form does not submit
- ✅ No API calls are made

---

### Scenario 7: Duplicate Admin Prevention

**Preconditions:**
- Admin already exists in database

**Steps:**
1. Manually call the Edge Function with valid data
2. Attempt to create another admin

**Expected Results:**
- ✅ Error response: "Admin account already exists. Setup is disabled."
- ✅ HTTP status: 403
- ✅ No new admin is created

---

### Scenario 8: Network Error Handling

**Preconditions:**
- No admins exist in the database
- Supabase is unreachable or Edge Function is not deployed

**Steps:**
1. Navigate to `http://localhost:3000/setup`
2. Fill in the form correctly
3. Click "Create Super Admin Account"

**Expected Results:**
- ✅ Error message is displayed
- ✅ Loading state ends
- ✅ User can retry submission
- ✅ Form data is preserved

---

### Scenario 9: Field Error Clearing

**Preconditions:**
- No admins exist in the database

**Steps:**
1. Navigate to `http://localhost:3000/setup`
2. Submit form with empty fields to trigger errors
3. Start typing in a field with an error

**Expected Results:**
- ✅ Error message for that field disappears
- ✅ Other field errors remain visible
- ✅ User can correct and resubmit

---

### Scenario 10: Loading State

**Preconditions:**
- No admins exist in the database

**Steps:**
1. Navigate to `http://localhost:3000/setup`
2. Fill in the form correctly
3. Click "Create Super Admin Account"
4. Observe the button during submission

**Expected Results:**
- ✅ Button shows loading spinner
- ✅ Button text changes to "Loading..."
- ✅ Button is disabled during submission
- ✅ All form fields are disabled during submission
- ✅ User cannot submit multiple times

---

## Edge Function Testing

### Test Edge Function Directly

You can test the Edge Function using curl:

```bash
# Test with valid data
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

# Test with invalid token
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

# Test when admin already exists
curl -X POST \
  https://your-project.supabase.co/functions/v1/bootstrap-first-admin \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Another Admin",
    "email": "another@example.com",
    "password": "SecurePass123!",
    "setupToken": "YOUR_SETUP_TOKEN"
  }'
```

---

## Security Testing

### Test 1: Token Brute Force Protection
- Attempt multiple requests with different tokens
- Verify rate limiting (if implemented)
- Ensure no timing attacks are possible

### Test 2: SQL Injection
- Try injecting SQL in name, email fields
- Verify parameterized queries prevent injection

### Test 3: XSS Prevention
- Try injecting scripts in form fields
- Verify output is properly escaped

### Test 4: CORS Configuration
- Verify CORS headers are properly set
- Test from different origins

---

## Performance Testing

### Test 1: Page Load Time
- Measure time to first contentful paint
- Verify page loads in < 2 seconds

### Test 2: Form Submission Time
- Measure time from submit to redirect
- Verify submission completes in < 3 seconds

### Test 3: Database Query Performance
- Verify admin check query is fast (< 50ms)
- Verify admin creation is atomic

---

## Cleanup After Testing

After testing, you may want to clean up test data:

```sql
-- Delete test admin records
DELETE FROM admins WHERE email LIKE '%test%' OR email LIKE '%example%';

-- Delete test auth users (use Supabase dashboard or admin API)
```

---

## Known Limitations

1. **No Rate Limiting**: Currently no rate limiting on the Edge Function
2. **No Email Verification**: Admin email is not verified
3. **No Password Complexity**: Only checks minimum length
4. **No Audit Trail**: Admin creation is not logged

These limitations will be addressed in future tasks.

---

## Troubleshooting

### Issue: "Setup token not configured on server"
**Solution:** Ensure `ADMIN_SETUP_TOKEN` is set in Supabase Edge Function secrets

### Issue: "Failed to check existing admins"
**Solution:** Verify database migrations have been applied and admins table exists

### Issue: "Failed to create auth user"
**Solution:** Check Supabase Auth is enabled and email/password auth is configured

### Issue: Page shows loading spinner indefinitely
**Solution:** Check browser console for errors, verify Supabase URL and keys are correct

### Issue: Redirect doesn't work
**Solution:** Verify Next.js router is working, check for JavaScript errors
