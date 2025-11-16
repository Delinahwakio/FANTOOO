/**
 * Email utilities
 * Handles email generation and validation
 */

/**
 * Generate email address in format username@fantooo.com
 * @param username - User's username
 * @returns Generated email address
 */
export function generateEmail(username: string): string {
  return `${username.toLowerCase()}@fantooo.com`
}

/**
 * Validate email format
 * @param email - Email address to validate
 * @returns Validation result
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || email.trim().length === 0) {
    return {
      isValid: false,
      error: 'Email is required',
    }
  }

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'Invalid email format',
    }
  }

  return { isValid: true }
}

/**
 * Check if email is from fantooo.com domain
 * @param email - Email address to check
 * @returns Boolean indicating if email is from fantooo.com
 */
export function isFantoooEmail(email: string): boolean {
  return email.toLowerCase().endsWith('@fantooo.com')
}
