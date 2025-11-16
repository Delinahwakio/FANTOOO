import { NextRequest, NextResponse } from 'next/server'
import { requireRole, getRealUserProfile } from '@/lib/supabase/auth-helpers'

/**
 * Example protected API route
 * Demonstrates how to protect an API route and require specific roles
 * 
 * GET /api/auth/example-protected
 * Requires: user role
 */
export async function GET() {
  try {
    // Require user role
    const { user, role, error } = await requireRole('user')
    
    if (error) {
      return error
    }

    // Get user profile
    const profile = await getRealUserProfile(user!.id)

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Access granted',
      user: {
        id: user!.id,
        email: user!.email,
        role,
      },
      profile: {
        username: profile.username,
        displayName: profile.display_name,
        credits: profile.credits,
      },
    })
  } catch (error) {
    console.error('Error in protected route:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Example admin-only endpoint
 * POST /api/auth/example-protected
 * Requires: admin or super_admin role
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin role
    const { user, role, error } = await requireRole(['admin', 'super_admin'])
    
    if (error) {
      return error
    }

    const body = await request.json()

    return NextResponse.json({
      message: 'Admin action completed',
      user: {
        id: user!.id,
        email: user!.email,
        role,
      },
      data: body,
    })
  } catch (error) {
    console.error('Error in admin route:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
