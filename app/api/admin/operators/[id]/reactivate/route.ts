import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/operators/[id]/reactivate
 * Reactivate suspended operator account
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

    // Update operator
    const { error: updateError } = await supabase
      .from('operators')
      .update({
        is_suspended: false,
        suspension_reason: null,
        suspended_until: null,
      })
      .eq('id', operatorId)

    if (updateError) {
      console.error('Error reactivating operator:', updateError)
      return NextResponse.json({ error: 'Failed to reactivate operator' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Operator reactivated successfully' })
  } catch (error) {
    console.error('Error in POST /api/admin/operators/[id]/reactivate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
