import { NextResponse } from 'next/server'
import { createClient } from './server'
import type { UserRole } from '@/lib/types/auth'

/**
 * Server-side authentication helpers
 * Used in API routes and server components for authentication and authorization
 */

/**
 * Get authenticated user from request
 * @returns User object or null if not authenticated
 */
export async function getAuthUser() {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error('Error getting authenticated user:', error)
    return null
  }
}

/**
 * Get user role from database
 * @param userId - Auth user ID
 * @returns User role or null
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  const supabase = await createClient()
  
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
 * Require authentication for API route
 * Returns user or error response
 */
export async function requireAuth() {
  const user = await getAuthUser()
  
  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      ),
    }
  }

  return { user, error: null }
}

/**
 * Require specific role for API route
 * Returns user and role or error response
 */
export async function requireRole(
  allowedRoles: UserRole | UserRole[]
) {
  const { user, error } = await requireAuth()
  
  if (error) {
    return { user: null, role: null, error }
  }

  const role = await getUserRole(user!.id)
  
  if (!role) {
    return {
      user: null,
      role: null,
      error: NextResponse.json(
        { error: 'Forbidden', message: 'User role not found' },
        { status: 403 }
      ),
    }
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
  
  if (!roles.includes(role)) {
    return {
      user: null,
      role: null,
      error: NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      ),
    }
  }

  return { user, role, error: null }
}

/**
 * Get real user profile by auth ID
 */
export async function getRealUserProfile(authId: string) {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('real_users')
      .select('*')
      .eq('auth_id', authId)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error getting real user profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error getting real user profile:', error)
    return null
  }
}

/**
 * Get operator profile by auth ID
 */
export async function getOperatorProfile(authId: string) {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('operators')
      .select('*')
      .eq('auth_id', authId)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error getting operator profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error getting operator profile:', error)
    return null
  }
}

/**
 * Get admin profile by auth ID
 */
export async function getAdminProfile(authId: string) {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('auth_id', authId)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error getting admin profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error getting admin profile:', error)
    return null
  }
}

/**
 * Check if user has specific permission (for admins)
 */
export async function hasPermission(
  authId: string,
  permission: string
): Promise<boolean> {
  const admin = await getAdminProfile(authId)
  
  if (!admin) {
    return false
  }

  // Super admins have all permissions
  if (admin.role === 'super_admin') {
    return true
  }

  // Check specific permission
  const permissions = admin.permissions as Record<string, boolean>
  return permissions[permission] === true
}

/**
 * Verify user is not banned or suspended
 */
export async function verifyUserStatus(authId: string): Promise<{
  isValid: boolean
  reason?: string
}> {
  const supabase = await createClient()
  
  try {
    // Check real user
    const { data: realUser } = await supabase
      .from('real_users')
      .select('is_banned, ban_reason, banned_until')
      .eq('auth_id', authId)
      .maybeSingle()

    if (realUser) {
      if (realUser.is_banned) {
        const bannedUntil = realUser.banned_until ? new Date(realUser.banned_until) : null
        if (!bannedUntil || bannedUntil > new Date()) {
          return {
            isValid: false,
            reason: realUser.ban_reason || 'Account is banned',
          }
        }
      }
      return { isValid: true }
    }

    // Check operator
    const { data: operator } = await supabase
      .from('operators')
      .select('is_suspended, suspension_reason, suspended_until')
      .eq('auth_id', authId)
      .maybeSingle()

    if (operator) {
      if (operator.is_suspended) {
        const suspendedUntil = operator.suspended_until ? new Date(operator.suspended_until) : null
        if (!suspendedUntil || suspendedUntil > new Date()) {
          return {
            isValid: false,
            reason: operator.suspension_reason || 'Account is suspended',
          }
        }
      }
      return { isValid: true }
    }

    return { isValid: true }
  } catch (error) {
    console.error('Error verifying user status:', error)
    return { isValid: false, reason: 'Error verifying account status' }
  }
}
