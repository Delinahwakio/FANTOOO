/**
 * Authentication types for the Fantooo platform
 * Defines user roles, session types, and authentication-related interfaces
 */

import { User, Session } from '@supabase/supabase-js'

/**
 * User roles in the system
 */
export type UserRole = 'user' | 'operator' | 'admin' | 'super_admin'

/**
 * Authentication state
 */
export interface AuthState {
  user: User | null
  session: Session | null
  role: UserRole | null
  isLoading: boolean
  isAuthenticated: boolean
}

/**
 * Extended user profile with role information
 */
export interface UserProfile {
  id: string
  authId: string
  role: UserRole
  email: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Real user profile
 */
export interface RealUserProfile extends UserProfile {
  username: string
  displayName: string
  age: number
  gender: string
  lookingFor: string
  location: string
  bio?: string
  profilePicture?: string
  credits: number
  userTier: string
  lastActiveAt: string
}

/**
 * Operator profile
 */
export interface OperatorProfile extends UserProfile {
  name: string
  specializations: string[]
  isAvailable: boolean
  qualityScore: number
  isSuspended: boolean
  currentChatCount: number
  maxConcurrentChats: number
}

/**
 * Admin profile
 */
export interface AdminProfile extends UserProfile {
  name: string
  role: 'super_admin' | 'admin' | 'moderator'
  permissions: Record<string, boolean>
  lastLogin?: string
}

/**
 * Authentication error
 */
export interface AuthError {
  message: string
  status?: number
  code?: string
}

/**
 * Sign up data
 */
export interface SignUpData {
  email: string
  password: string
  username?: string
  displayName?: string
  age?: number
  gender?: string
  location?: string
  metadata?: Record<string, any>
}

/**
 * Sign in data
 */
export interface SignInData {
  email: string
  password: string
}

/**
 * Password reset data
 */
export interface PasswordResetData {
  email: string
}

/**
 * Password update data
 */
export interface PasswordUpdateData {
  newPassword: string
  currentPassword?: string
}

/**
 * Authentication response
 */
export interface AuthResponse<T = any> {
  data: T | null
  error: AuthError | null
}

/**
 * Session response
 */
export interface SessionResponse {
  session: Session | null
  user: User | null
  error: AuthError | null
}
