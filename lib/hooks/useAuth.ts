'use client'

import { useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { 
  signIn as authSignIn, 
  signUp as authSignUp, 
  signOut as authSignOut,
  getClientUser,
  getClientSession,
} from '@/lib/supabase/auth'
import type { 
  UserRole, 
  AuthState, 
  SignInData, 
  SignUpData,
  AuthError,
} from '@/lib/types/auth'

/**
 * Custom hook for authentication
 * Provides authentication state and methods for sign in, sign up, and sign out
 */
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    isLoading: true,
    isAuthenticated: false,
  })

  const supabase = createClient()

  /**
   * Get user role from database
   */
  const getUserRole = async (userId: string): Promise<UserRole | null> => {
    try {
      // Check if user is an admin
      const { data: admin } = await supabase
        .from('admins')
        .select('id, role, is_active')
        .eq('auth_id', userId)
        .eq('is_active', true)
        .maybeSingle()
      
      if (admin) {
        return admin.role as UserRole
      }

      // Check if user is an operator
      const { data: operator } = await supabase
        .from('operators')
        .select('id, is_active')
        .eq('auth_id', userId)
        .eq('is_active', true)
        .maybeSingle()
      
      if (operator) {
        return 'operator'
      }

      // Check if user is a real user
      const { data: realUser } = await supabase
        .from('real_users')
        .select('id, is_active')
        .eq('auth_id', userId)
        .eq('is_active', true)
        .maybeSingle()
      
      if (realUser) {
        return 'user'
      }

      return null
    } catch (error) {
      console.error('Error getting user role:', error)
      return null
    }
  }

  /**
   * Update auth state
   */
  const updateAuthState = async (user: User | null, session: Session | null) => {
    if (user && session) {
      const role = await getUserRole(user.id)
      setAuthState({
        user,
        session,
        role,
        isLoading: false,
        isAuthenticated: true,
      })
    } else {
      setAuthState({
        user: null,
        session: null,
        role: null,
        isLoading: false,
        isAuthenticated: false,
      })
    }
  }

  /**
   * Initialize auth state
   */
  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      const session = await getClientSession()
      const user = await getClientUser()
      await updateAuthState(user, session)
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        await updateAuthState(session?.user ?? null, session)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Sign in with email and password
   */
  const signIn = async (credentials: SignInData): Promise<{ error: AuthError | null }> => {
    try {
      const response = await authSignIn(credentials)
      
      if (response.error) {
        return { error: response.error }
      }

      await updateAuthState(response.user, response.session)
      return { error: null }
    } catch (error: any) {
      return {
        error: {
          message: error.message || 'An unexpected error occurred',
          code: 'UNKNOWN_ERROR',
        },
      }
    }
  }

  /**
   * Sign up with email and password
   */
  const signUp = async (credentials: SignUpData): Promise<{ error: AuthError | null }> => {
    try {
      const response = await authSignUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            username: credentials.username,
            display_name: credentials.displayName,
            age: credentials.age,
            gender: credentials.gender,
            location: credentials.location,
            ...credentials.metadata,
          },
        },
      })
      
      if (response.error) {
        return { error: response.error }
      }

      await updateAuthState(response.user, response.session)
      return { error: null }
    } catch (error: any) {
      return {
        error: {
          message: error.message || 'An unexpected error occurred',
          code: 'UNKNOWN_ERROR',
        },
      }
    }
  }

  /**
   * Sign out current user
   */
  const signOut = async (): Promise<{ error: AuthError | null }> => {
    try {
      const response = await authSignOut()
      
      if (response.error) {
        return { error: response.error }
      }

      setAuthState({
        user: null,
        session: null,
        role: null,
        isLoading: false,
        isAuthenticated: false,
      })

      return { error: null }
    } catch (error: any) {
      return {
        error: {
          message: error.message || 'An unexpected error occurred',
          code: 'UNKNOWN_ERROR',
        },
      }
    }
  }

  /**
   * Refresh session
   */
  const refreshSession = async () => {
    const { data: { session } } = await supabase.auth.refreshSession()
    if (session) {
      await updateAuthState(session.user, session)
    }
  }

  return {
    // State
    user: authState.user,
    session: authState.session,
    role: authState.role,
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,
    
    // Methods
    signIn,
    signUp,
    signOut,
    refreshSession,
    
    // Helpers
    isUser: authState.role === 'user',
    isOperator: authState.role === 'operator',
    isAdmin: authState.role === 'admin' || authState.role === 'super_admin',
    isSuperAdmin: authState.role === 'super_admin',
  }
}
