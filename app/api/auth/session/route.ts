import { NextResponse } from 'next/server'
import { getAuthUser, getUserRole } from '@/lib/supabase/auth-helpers'

/**
 * GET /api/auth/session
 * Get current user session and role
 */
export async function GET() {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const role = await getUserRole(user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role,
      },
    })
  } catch (error) {
    console.error('Error getting session:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
