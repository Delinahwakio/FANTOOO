'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import type { UserRole } from '@/lib/types/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  redirectTo?: string
  loadingComponent?: React.ReactNode
}

/**
 * Protected route component
 * Wraps pages that require authentication and/or specific roles
 * 
 * @example
 * // Protect a user page
 * <ProtectedRoute allowedRoles={['user']}>
 *   <UserDashboard />
 * </ProtectedRoute>
 * 
 * @example
 * // Protect an admin page
 * <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
 *   <AdminPanel />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo,
  loadingComponent,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, role } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      // Not authenticated - redirect to login
      if (!isAuthenticated) {
        const defaultRedirect = allowedRoles?.includes('admin') || allowedRoles?.includes('super_admin')
          ? '/admin-login'
          : allowedRoles?.includes('operator')
          ? '/op-login'
          : '/get-started'
        
        router.push(redirectTo || defaultRedirect)
        return
      }

      // Authenticated but wrong role - redirect to home
      if (allowedRoles && role && !allowedRoles.includes(role)) {
        router.push('/')
        return
      }
    }
  }, [isAuthenticated, isLoading, role, allowedRoles, redirectTo, router])

  // Show loading state
  if (isLoading) {
    return loadingComponent || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Not authenticated or wrong role
  if (!isAuthenticated || (allowedRoles && role && !allowedRoles.includes(role))) {
    return null
  }

  // Authenticated and authorized
  return <>{children}</>
}
