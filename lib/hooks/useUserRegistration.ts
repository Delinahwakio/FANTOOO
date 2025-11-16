/**
 * React hook for user registration
 * Provides registration functionality with validation and debouncing
 */

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { registerUser, checkUsername, type UserRegistrationData, type RegistrationResult } from '@/lib/services/user-registration'
import { debounce } from '@/lib/utils'

export interface UseUserRegistrationReturn {
  register: (data: UserRegistrationData) => Promise<RegistrationResult>
  isRegistering: boolean
  checkUsernameAvailability: (username: string) => void
  usernameCheckResult: {
    checking: boolean
    available: boolean | null
    error?: string
  }
}

/**
 * Hook for user registration with username availability checking
 * @returns Registration functions and state
 */
export function useUserRegistration(): UseUserRegistrationReturn {
  const router = useRouter()
  const [isRegistering, setIsRegistering] = useState(false)
  const [usernameCheckResult, setUsernameCheckResult] = useState<{
    checking: boolean
    available: boolean | null
    error?: string
  }>({
    checking: false,
    available: null,
  })

  // Debounced username check function (500ms delay)
  const debouncedUsernameCheck = useCallback(
    debounce(async (username: string) => {
      if (!username || username.trim().length === 0) {
        setUsernameCheckResult({
          checking: false,
          available: null,
        })
        return
      }

      setUsernameCheckResult({
        checking: true,
        available: null,
      })

      const result = await checkUsername(username)

      setUsernameCheckResult({
        checking: false,
        available: result.available,
        error: result.error,
      })
    }, 500),
    []
  )

  /**
   * Check username availability with debouncing
   * @param username - Username to check
   */
  const checkUsernameAvailability = useCallback(
    (username: string) => {
      debouncedUsernameCheck(username)
    },
    [debouncedUsernameCheck]
  )

  /**
   * Register a new user
   * @param data - User registration data
   * @returns Registration result
   */
  const register = useCallback(
    async (data: UserRegistrationData): Promise<RegistrationResult> => {
      setIsRegistering(true)

      try {
        // Get IP address and user agent if available
        const ipAddress = undefined // Can be obtained from request headers in API route
        const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : undefined

        const result = await registerUser(data, ipAddress, userAgent)

        if (result.success) {
          // Redirect to discover page on success
          router.push('/discover')
        }

        return result
      } finally {
        setIsRegistering(false)
      }
    },
    [router]
  )

  return {
    register,
    isRegistering,
    checkUsernameAvailability,
    usernameCheckResult,
  }
}
