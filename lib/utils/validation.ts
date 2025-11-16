/**
 * Validation utilities for user input
 * Handles age validation, username checks, location validation, etc.
 */

import { createClient } from '@/lib/supabase/client'

/**
 * Validate age is 18 or above
 * @param age - User's age
 * @returns Validation result with error message if invalid
 */
export function validateAge(age: number): { isValid: boolean; error?: string } {
  if (age < 18) {
    return {
      isValid: false,
      error: 'Must be 18 or older',
    }
  }

  if (age > 100) {
    return {
      isValid: false,
      error: 'Invalid age',
    }
  }

  return { isValid: true }
}

/**
 * Check if username is available (not already taken)
 * @param username - Username to check
 * @returns Availability result
 */
export async function checkUsernameAvailability(
  username: string
): Promise<{ available: boolean; error?: string }> {
  try {
    const supabase = createClient()

    // Query real_users table for existing username
    const { data, error } = await supabase
      .from('real_users')
      .select('username')
      .eq('username', username)
      .maybeSingle()

    if (error) {
      console.error('Error checking username availability:', error)
      return {
        available: false,
        error: 'Failed to check username availability',
      }
    }

    return {
      available: data === null,
      error: data ? 'Username already taken' : undefined,
    }
  } catch (error) {
    console.error('Unexpected error checking username:', error)
    return {
      available: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Validate username format
 * @param username - Username to validate
 * @returns Validation result
 */
export function validateUsername(username: string): { isValid: boolean; error?: string } {
  if (!username || username.trim().length === 0) {
    return {
      isValid: false,
      error: 'Username is required',
    }
  }

  if (username.length < 3) {
    return {
      isValid: false,
      error: 'Username must be at least 3 characters',
    }
  }

  if (username.length > 30) {
    return {
      isValid: false,
      error: 'Username must be less than 30 characters',
    }
  }

  // Only allow alphanumeric characters, underscores, and hyphens
  const usernameRegex = /^[a-zA-Z0-9_-]+$/
  if (!usernameRegex.test(username)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, underscores, and hyphens',
    }
  }

  return { isValid: true }
}

/**
 * Validate password complexity
 * @param password - Password to validate
 * @returns Validation result
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password || password.length === 0) {
    return {
      isValid: false,
      error: 'Password is required',
    }
  }

  if (password.length < 8) {
    return {
      isValid: false,
      error: 'Password must be at least 8 characters',
    }
  }

  if (password.length > 72) {
    return {
      isValid: false,
      error: 'Password must be less than 72 characters',
    }
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one uppercase letter',
    }
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one lowercase letter',
    }
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one number',
    }
  }

  return { isValid: true }
}

/**
 * Validate location coordinates
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Validation result
 */
export function validateCoordinates(
  latitude: number,
  longitude: number
): { isValid: boolean; error?: string } {
  if (latitude < -90 || latitude > 90) {
    return {
      isValid: false,
      error: 'Invalid latitude',
    }
  }

  if (longitude < -180 || longitude > 180) {
    return {
      isValid: false,
      error: 'Invalid longitude',
    }
  }

  return { isValid: true }
}
