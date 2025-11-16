import { createClient as createBrowserClient } from './client'

/**
 * Authentication utilities for Supabase Auth
 * Handles user registration, login, logout, and session management
 */

// Types for authentication
export interface SignUpCredentials {
  email: string
  password: string
  options?: {
    data?: {
      username?: string
      display_name?: string
      age?: number
      gender?: string
      location?: string
      [key: string]: string | number | boolean | undefined
    }
  }
}

export interface SignInCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  user: any | null
  session: any | null
  error: {
    message: string
    status?: number
    code?: string
  } | null
}

/**
 * Sign up a new user with email and password
 * @param credentials - Email, password, and optional metadata
 * @returns AuthResponse with user, session, and error
 */
export async function signUp(credentials: SignUpCredentials): Promise<AuthResponse> {
  const supabase = createBrowserClient()
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: credentials.options,
    })

    if (error) {
      return {
        user: null,
        session: null,
        error: {
          message: error.message,
          status: error.status,
          code: error.code,
        },
      }
    }

    return {
      user: data.user,
      session: data.session,
      error: null,
    }
  } catch (error: any) {
    return {
      user: null,
      session: null,
      error: {
        message: error.message || 'An unexpected error occurred during sign up',
        status: 500,
        code: 'UNKNOWN_ERROR',
      },
    }
  }
}

/**
 * Sign in an existing user with email and password
 * @param credentials - Email and password
 * @returns AuthResponse with user, session, and error
 */
export async function signIn(credentials: SignInCredentials): Promise<AuthResponse> {
  const supabase = createBrowserClient()
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) {
      return {
        user: null,
        session: null,
        error: {
          message: error.message,
          status: error.status,
          code: error.code,
        },
      }
    }

    return {
      user: data.user,
      session: data.session,
      error: null,
    }
  } catch (error: any) {
    return {
      user: null,
      session: null,
      error: {
        message: error.message || 'An unexpected error occurred during sign in',
        status: 500,
        code: 'UNKNOWN_ERROR',
      },
    }
  }
}

/**
 * Sign out the current user
 * @returns Error if sign out fails, null otherwise
 */
export async function signOut(): Promise<{ error: { message: string; status?: number; code?: string } | null }> {
  const supabase = createBrowserClient()
  
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        error: {
          message: error.message,
          status: error.status,
          code: error.code,
        },
      }
    }

    return { error: null }
  } catch (error: any) {
    return {
      error: {
        message: error.message || 'An unexpected error occurred during sign out',
        status: 500,
        code: 'UNKNOWN_ERROR',
      },
    }
  }
}

/**
 * Get the current session (server-side)
 * Note: This function should only be used in Server Components or API routes
 * For client-side, use getClientSession instead
 */
export async function getSession() {
  // This function is for server-side use only
  // Import createClient from './server' dynamically when needed
  throw new Error('getSession should only be used in Server Components. Use getClientSession for client-side.')
}

/**
 * Get the current user (server-side)
 * Note: This function should only be used in Server Components or API routes
 * For client-side, use getClientUser instead
 */
export async function getUser() {
  // This function is for server-side use only
  // Import createClient from './server' dynamically when needed
  throw new Error('getUser should only be used in Server Components. Use getClientUser for client-side.')
}

/**
 * Get the current session (client-side)
 * @returns Session object or null if not authenticated
 */
export async function getClientSession() {
  const supabase = createBrowserClient()
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Error getting client session:', error)
      return null
    }

    return session
  } catch (error) {
    console.error('Unexpected error getting client session:', error)
    return null
  }
}

/**
 * Get the current user (client-side)
 * @returns User object or null if not authenticated
 */
export async function getClientUser() {
  const supabase = createBrowserClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error('Error getting client user:', error)
      return null
    }

    return user
  } catch (error) {
    console.error('Unexpected error getting client user:', error)
    return null
  }
}

/**
 * Check if user is authenticated (server-side)
 * Note: This function should only be used in Server Components or API routes
 * For client-side, use isClientAuthenticated instead
 */
export async function isAuthenticated(): Promise<boolean> {
  throw new Error('isAuthenticated should only be used in Server Components. Use isClientAuthenticated for client-side.')
}

/**
 * Check if user is authenticated (client-side)
 * @returns Boolean indicating authentication status
 */
export async function isClientAuthenticated(): Promise<boolean> {
  const session = await getClientSession()
  return session !== null
}

/**
 * Reset password for a user
 * @param email - User's email address
 * @returns Error if reset fails, null otherwise
 */
export async function resetPassword(email: string): Promise<{ error: { message: string; status?: number; code?: string } | null }> {
  const supabase = createBrowserClient()
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      return {
        error: {
          message: error.message,
          status: error.status,
          code: error.code,
        },
      }
    }

    return { error: null }
  } catch (error: any) {
    return {
      error: {
        message: error.message || 'An unexpected error occurred during password reset',
        status: 500,
        code: 'UNKNOWN_ERROR',
      },
    }
  }
}

/**
 * Update user password
 * @param newPassword - New password
 * @returns Error if update fails, null otherwise
 */
export async function updatePassword(newPassword: string): Promise<{ error: { message: string; status?: number; code?: string } | null }> {
  const supabase = createBrowserClient()
  
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      return {
        error: {
          message: error.message,
          status: error.status,
          code: error.code,
        },
      }
    }

    return { error: null }
  } catch (error: any) {
    return {
      error: {
        message: error.message || 'An unexpected error occurred during password update',
        status: 500,
        code: 'UNKNOWN_ERROR',
      },
    }
  }
}
