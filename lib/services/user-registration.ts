/**
 * User registration service
 * Handles complete user registration flow with transaction safety
 */

import { createClient } from '@/lib/supabase/client'
import { signUp } from '@/lib/supabase/auth'
import { validateAge, validateUsername, validatePassword, checkUsernameAvailability } from '@/lib/utils/validation'
import { validateLocation } from '@/lib/utils/geocoding'
import { generateEmail } from '@/lib/utils/email'
import { logAgeVerification } from '@/lib/utils/age-verification'
import type { Gender, LookingFor } from '@/lib/types/user'

export interface UserRegistrationData {
  username: string
  displayName: string
  age: number
  gender: Gender
  lookingFor: LookingFor
  location: string
  password: string
  bio?: string
  profilePicture?: string
}

export interface RegistrationResult {
  success: boolean
  userId?: string
  email?: string
  error?: string
  errorCode?: string
}

/**
 * Register a new user with complete validation and transaction safety
 * @param data - User registration data
 * @param ipAddress - User's IP address for logging (optional)
 * @param userAgent - User's user agent for logging (optional)
 * @returns Registration result
 */
export async function registerUser(
  data: UserRegistrationData,
  ipAddress?: string,
  userAgent?: string
): Promise<RegistrationResult> {
  const supabase = createClient()

  try {
    // Step 1: Validate username format
    const usernameValidation = validateUsername(data.username)
    if (!usernameValidation.isValid) {
      return {
        success: false,
        error: usernameValidation.error,
        errorCode: 'INVALID_USERNAME',
      }
    }

    // Step 2: Check username availability
    const usernameAvailability = await checkUsernameAvailability(data.username)
    if (!usernameAvailability.available) {
      return {
        success: false,
        error: usernameAvailability.error || 'Username already taken',
        errorCode: 'USERNAME_TAKEN',
      }
    }

    // Step 3: Validate age (18+ enforcement)
    const ageValidation = validateAge(data.age)
    if (!ageValidation.isValid) {
      return {
        success: false,
        error: ageValidation.error,
        errorCode: 'INVALID_AGE',
      }
    }

    // Step 4: Validate password
    const passwordValidation = validatePassword(data.password)
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: passwordValidation.error,
        errorCode: 'INVALID_PASSWORD',
      }
    }

    // Step 5: Validate location with geocoding
    const locationResult = await validateLocation(data.location)
    if (!locationResult.success) {
      // Log validation failure but don't block registration
      console.warn('Location validation failed:', locationResult.error)
      
      // Insert into location_validation_log if table exists
      try {
        await supabase.from('location_validation_log').insert({
          location_text: data.location,
          validation_error: locationResult.error,
          created_at: new Date().toISOString(),
        })
      } catch (logError) {
        console.error('Failed to log location validation error:', logError)
      }
    }

    // Step 6: Generate email address
    const email = generateEmail(data.username)

    // Step 7: Create auth user with Supabase Auth
    const authResult = await signUp({
      email,
      password: data.password,
      options: {
        data: {
          username: data.username,
          display_name: data.displayName,
          age: data.age,
          gender: data.gender,
          location: data.location,
        },
      },
    })

    if (authResult.error || !authResult.user) {
      return {
        success: false,
        error: authResult.error?.message || 'Failed to create account',
        errorCode: authResult.error?.code || 'AUTH_ERROR',
      }
    }

    const authUserId = authResult.user.id

    // Step 8: Create user record in real_users table
    const { data: userData, error: userError } = await supabase
      .from('real_users')
      .insert({
        auth_id: authUserId,
        username: data.username,
        display_name: data.displayName,
        email,
        age: data.age,
        gender: data.gender,
        looking_for: data.lookingFor,
        location: locationResult.success ? locationResult.formattedAddress : data.location,
        latitude: locationResult.success ? locationResult.latitude : null,
        longitude: locationResult.success ? locationResult.longitude : null,
        bio: data.bio || null,
        profile_picture: data.profilePicture || null,
        credits: 0,
        total_spent: 0,
        user_tier: 'free',
        loyalty_points: 0,
        total_messages_sent: 0,
        total_chats: 0,
        favorite_count: 0,
        last_active_at: new Date().toISOString(),
        is_active: true,
        is_verified: false,
        is_banned: false,
        notification_preferences: { email: true, push: true },
        privacy_settings: { show_online: true, show_location: true },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (userError) {
      console.error('Error creating user record:', userError)
      
      // Rollback: Delete auth user if user record creation fails
      try {
        await supabase.auth.admin.deleteUser(authUserId)
      } catch (deleteError) {
        console.error('Failed to rollback auth user:', deleteError)
      }

      return {
        success: false,
        error: 'Failed to create user profile',
        errorCode: 'USER_CREATION_ERROR',
      }
    }

    // Step 9: Log age verification for compliance
    await logAgeVerification(userData.id, data.age, ipAddress, userAgent)

    // Step 10: Return success
    return {
      success: true,
      userId: userData.id,
      email,
    }
  } catch (error: any) {
    console.error('Unexpected error during registration:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during registration',
      errorCode: 'UNEXPECTED_ERROR',
    }
  }
}

/**
 * Check username availability with debouncing support
 * This is a wrapper around checkUsernameAvailability for use in forms
 * @param username - Username to check
 * @returns Availability result
 */
export async function checkUsername(username: string): Promise<{
  available: boolean
  error?: string
}> {
  // Validate format first
  const validation = validateUsername(username)
  if (!validation.isValid) {
    return {
      available: false,
      error: validation.error,
    }
  }

  // Check availability
  return await checkUsernameAvailability(username)
}
