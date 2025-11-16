import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Route protection configuration
 * Defines which routes require authentication and specific roles
 */
const protectedRoutes = {
  // User routes - require authentication as real user
  user: ['/discover', '/profile', '/chat', '/favorites', '/me', '/credits'],
  
  // Operator routes - require authentication as operator
  operator: ['/operator'],
  
  // Admin routes - require authentication as admin
  admin: ['/admin'],
  
  // Public routes - no authentication required
  public: ['/', '/get-started', '/op-login', '/admin-login', '/setup', '/auth'],
}

/**
 * Check if a path matches any of the route patterns
 */
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some(route => pathname.startsWith(route))
}

/**
 * Get user role from database based on auth user
 */
async function getUserRole(supabase: any, userId: string): Promise<'user' | 'operator' | 'admin' | null> {
  try {
    // Check if user is an admin
    const { data: admin } = await supabase
      .from('admins')
      .select('id, is_active')
      .eq('auth_id', userId)
      .eq('is_active', true)
      .maybeSingle()
    
    if (admin) {
      return 'admin'
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
 * Update session and handle route protection
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refreshing the auth token
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Check if route requires authentication
  const requiresUserAuth = matchesRoute(pathname, protectedRoutes.user)
  const requiresOperatorAuth = matchesRoute(pathname, protectedRoutes.operator)
  const requiresAdminAuth = matchesRoute(pathname, protectedRoutes.admin)
  const isPublicRoute = matchesRoute(pathname, protectedRoutes.public)

  // If no authentication required, continue
  if (isPublicRoute && !requiresUserAuth && !requiresOperatorAuth && !requiresAdminAuth) {
    return supabaseResponse
  }

  // If authentication required but user not logged in, redirect to appropriate login
  if (!user) {
    if (requiresAdminAuth) {
      return NextResponse.redirect(new URL('/admin-login', request.url))
    }
    if (requiresOperatorAuth) {
      return NextResponse.redirect(new URL('/op-login', request.url))
    }
    if (requiresUserAuth) {
      return NextResponse.redirect(new URL('/get-started', request.url))
    }
  }

  // If user is logged in, check role-based access
  if (user) {
    const userRole = await getUserRole(supabase, user.id)

    // Redirect to appropriate dashboard if accessing wrong login page
    if (pathname === '/admin-login' && userRole === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
    if (pathname === '/op-login' && userRole === 'operator') {
      return NextResponse.redirect(new URL('/operator/waiting', request.url))
    }
    if (pathname === '/get-started' && userRole === 'user') {
      return NextResponse.redirect(new URL('/discover', request.url))
    }

    // Check role-based route access
    if (requiresAdminAuth && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    if (requiresOperatorAuth && userRole !== 'operator') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    if (requiresUserAuth && userRole !== 'user') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}
