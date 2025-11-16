/**
 * Age verification logging utilities
 * Handles logging of age verification for compliance
 */

import { createClient } from '@/lib/supabase/client'

export interface AgeVerificationLog {
  user_id?: string
  stated_age: number
  verification_method: 'self_declared'
  ip_address?: string
  user_agent?: string
  verified_at: string
}

/**
 * Log age verification for compliance purposes
 * @param userId - User ID (optional, may not exist yet during registration)
 * @param age - User's stated age
 * @param ipAddress - User's IP address (optional)
 * @param userAgent - User's user agent (optional)
 * @returns Success status
 */
export async function logAgeVerification(
  userId: string | undefined,
  age: number,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const logEntry: AgeVerificationLog = {
      user_id: userId,
      stated_age: age,
      verification_method: 'self_declared',
      ip_address: ipAddress,
      user_agent: userAgent,
      verified_at: new Date().toISOString(),
    }

    // Insert into age_verification_log table
    const { error } = await supabase.from('age_verification_log').insert(logEntry)

    if (error) {
      console.error('Error logging age verification:', error)
      return {
        success: false,
        error: 'Failed to log age verification',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error logging age verification:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get age verification logs for a user
 * @param userId - User ID
 * @returns Array of age verification logs
 */
export async function getAgeVerificationLogs(
  userId: string
): Promise<{ logs: AgeVerificationLog[]; error?: string }> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('age_verification_log')
      .select('*')
      .eq('user_id', userId)
      .order('verified_at', { ascending: false })

    if (error) {
      console.error('Error fetching age verification logs:', error)
      return {
        logs: [],
        error: 'Failed to fetch age verification logs',
      }
    }

    return { logs: data || [] }
  } catch (error) {
    console.error('Unexpected error fetching age verification logs:', error)
    return {
      logs: [],
      error: 'An unexpected error occurred',
    }
  }
}
