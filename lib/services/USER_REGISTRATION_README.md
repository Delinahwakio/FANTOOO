# User Registration Business Logic

This document describes the user registration business logic implementation for the Fantooo platform.

## Overview

The user registration system handles the complete flow of registering new users with comprehensive validation, location geocoding, age verification logging, and transaction safety.

## Components

### 1. Validation Utilities (`lib/utils/validation.ts`)

Provides validation functions for user input:

- **`validateAge(age: number)`**: Validates age is 18 or above (18-100 range)
- **`checkUsernameAvailability(username: string)`**: Checks if username is available in database
- **`validateUsername(username: string)`**: Validates username format (3-30 chars, alphanumeric + underscore/hyphen)
- **`validatePassword(password: string)`**: Validates password complexity (8+ chars, uppercase, lowercase, number)
- **`validateCoordinates(latitude: number, longitude: number)`**: Validates coordinate ranges

### 2. Geocoding Utilities (`lib/utils/geocoding.ts`)

Handles location validation using Google Maps Geocoding API:

- **`validateLocation(location: string)`**: Validates location and returns coordinates
- **`reverseGeocode(latitude: number, longitude: number)`**: Converts coordinates to address

**Configuration Required:**
- Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` environment variable

### 3. Email Utilities (`lib/utils/email.ts`)

Manages email generation and validation:

- **`generateEmail(username: string)`**: Generates email in format `username@fantooo.com`
- **`validateEmail(email: string)`**: Validates email format
- **`isFantoooEmail(email: string)`**: Checks if email is from fantooo.com domain

### 4. Age Verification Logging (`lib/utils/age-verification.ts`)

Handles compliance logging for age verification:

- **`logAgeVerification(userId, age, ipAddress, userAgent)`**: Logs age verification to database
- **`getAgeVerificationLogs(userId)`**: Retrieves age verification logs for a user

**Database Table Required:**
```sql
CREATE TABLE age_verification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES real_users(id),
  stated_age INTEGER NOT NULL,
  verification_method TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  verified_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5. User Registration Service (`lib/services/user-registration.ts`)

Main registration handler with transaction safety:

#### `registerUser(data: UserRegistrationData, ipAddress?, userAgent?)`

Complete registration flow:

1. **Validate username format** - Check length and characters
2. **Check username availability** - Query database for duplicates
3. **Validate age** - Enforce 18+ requirement
4. **Validate password** - Check complexity requirements
5. **Validate location** - Geocode location to get coordinates
6. **Generate email** - Create `username@fantooo.com` email
7. **Create auth user** - Use Supabase Auth to create account
8. **Create user record** - Insert into `real_users` table
9. **Log age verification** - Record for compliance
10. **Return success** - Return user ID and email

**Transaction Safety:**
- If user record creation fails, the auth user is automatically deleted (rollback)
- Location validation failures are logged but don't block registration
- All database operations use proper error handling

#### `checkUsername(username: string)`

Wrapper for username availability checking with format validation.

### 6. React Hook (`lib/hooks/useUserRegistration.ts`)

React hook for use in components:

```typescript
const {
  register,
  isRegistering,
  checkUsernameAvailability,
  usernameCheckResult
} = useUserRegistration()
```

**Features:**
- Debounced username checking (500ms delay)
- Loading states for registration and username checks
- Automatic redirect to `/discover` on success
- Error handling and state management

## Usage Example

### In a React Component

```typescript
import { useUserRegistration } from '@/lib/hooks/useUserRegistration'
import { useState } from 'react'

function RegistrationForm() {
  const { register, isRegistering, checkUsernameAvailability, usernameCheckResult } = useUserRegistration()
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    age: 18,
    gender: 'male' as const,
    lookingFor: 'female' as const,
    location: '',
    password: '',
  })

  const handleUsernameChange = (username: string) => {
    setFormData({ ...formData, username })
    checkUsernameAvailability(username)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await register(formData)
    
    if (!result.success) {
      alert(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.username}
        onChange={(e) => handleUsernameChange(e.target.value)}
        placeholder="Username"
      />
      {usernameCheckResult.checking && <span>Checking...</span>}
      {usernameCheckResult.available === false && <span>Username taken</span>}
      {usernameCheckResult.available === true && <span>Username available</span>}
      
      {/* Other form fields */}
      
      <button type="submit" disabled={isRegistering}>
        {isRegistering ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  )
}
```

### Direct Service Usage

```typescript
import { registerUser } from '@/lib/services/user-registration'

const result = await registerUser({
  username: 'johndoe',
  displayName: 'John Doe',
  age: 25,
  gender: 'male',
  lookingFor: 'female',
  location: 'Nairobi, Kenya',
  password: 'SecurePass123',
  bio: 'Hello world',
})

if (result.success) {
  console.log('User created:', result.userId, result.email)
} else {
  console.error('Registration failed:', result.error, result.errorCode)
}
```

## Error Codes

| Error Code | Description |
|------------|-------------|
| `INVALID_USERNAME` | Username format is invalid |
| `USERNAME_TAKEN` | Username already exists |
| `INVALID_AGE` | Age is below 18 or invalid |
| `INVALID_PASSWORD` | Password doesn't meet complexity requirements |
| `AUTH_ERROR` | Supabase Auth error |
| `USER_CREATION_ERROR` | Failed to create user record |
| `UNEXPECTED_ERROR` | Unexpected error occurred |

## Requirements Satisfied

This implementation satisfies the following requirements:

- **2.1-2.5 (User Registration)**: Complete registration flow with validation
- **22.1-22.5 (Location Validation)**: Geocoding integration with Google Maps API
- **23.1-23.5 (Age Verification)**: Age validation and compliance logging

## Database Tables Required

### `real_users` table
Must exist with columns as defined in the design document.

### `age_verification_log` table
```sql
CREATE TABLE age_verification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES real_users(id),
  stated_age INTEGER NOT NULL,
  verification_method TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  verified_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### `location_validation_log` table (optional)
```sql
CREATE TABLE location_validation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_text TEXT NOT NULL,
  validation_error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Environment Variables

```env
# Required for location validation
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Supabase configuration (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing

To test the registration flow:

1. Ensure database tables exist
2. Configure environment variables
3. Use the React hook in a component or call the service directly
4. Verify user is created in `real_users` table
5. Verify age verification is logged in `age_verification_log` table
6. Verify location coordinates are populated (if geocoding succeeds)

## Notes

- Username checking is debounced by 500ms to reduce API calls
- Location validation failures are logged but don't block registration
- Email format is always `username@fantooo.com`
- Age verification is logged for compliance purposes
- Transaction safety ensures auth user is deleted if user record creation fails
- All validation errors return user-friendly messages
