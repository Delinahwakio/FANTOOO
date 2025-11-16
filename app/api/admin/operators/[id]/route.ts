import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/operators/[id]
 * Get operator details - Admin only
 */
export async function GET(
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

    if (!admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { data: operator, error: operatorError } = await supabase
      .from('operators')
      .select('*')
      .eq('id', operatorId)
      .is('deleted_at', null)
      .single()

    if (operatorError || !operator) {
      return NextResponse.json({ error: 'Operator not found' }, { status: 404 })
    }

    return NextResponse.json({ operator })
  } catch (error) {
    console.error('Error in GET /api/admin/operators/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/operators/[id]
 * Delete operator account (soft delete)
 * Requirement: 15.1-15.5 (Operator Deletion) - Must check for active chats
 */
export async function DELETE(
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

    const { data: operator } = await supabase
      .from('operators')
      .select('id, auth_id, current_chat_count')
      .eq('id', operatorId)
      .is('deleted_at', null)
      .single()

    if (!operator) {
      return NextResponse.json({ error: 'Operator not found' }, { status: 404 })
    }

    // Requirement 15.1-15.5: Check for active chats before deletion
    if (operator.current_chat_count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete operator with active chats. Please reassign or close all chats first.' },
        { status: 400 }
      )
    }

    // Soft delete operator record
    await supabase
      .from('operators')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', operatorId)

    // Delete auth user
    await supabase.auth.admin.deleteUser(operator.auth_id)

    return NextResponse.json({ message: 'Operator deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/admin/operators/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
