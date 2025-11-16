import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/operators/[id]/suspend
 * Suspend operator account
 * Requirement: 12.1-12.5 (Operator Performance)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const operatorId = params.id

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('id, permissions')
      .eq('auth_id', user.id)
      .single()

    if (!admin || !admin.permissions?.manage_operators) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { reason, duration_days } = body

    if (!reason) {
      return NextResponse.json({ error: 'Suspension reason is required' }, { status: 400 })
    }

    // Calculate suspension end date
    const suspendedUntil = new Date()
    suspendedUntil.setDate(suspendedUntil.getDate() + (duration_days || 7))

    // Update operator
    const { error: updateError } = await supabase
      .from('operators')
      .update({
        is_suspended: true,
        suspension_reason: reason,
        suspended_until: suspendedUntil.toISOString(),
        is_available: false, // Force offline
      })
      .eq('id', operatorId)

    if (updateError) {
      console.error('Error suspending operator:', updateError)
      return NextResponse.json({ error: 'Failed to suspend operator' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Operator suspended successfully' })
  } catch (error) {
    console.error('Error in POST /api/admin/operators/[id]/suspend:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
