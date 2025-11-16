import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/operators/[id]/activity
 * Get operator activity logs
 * Admin only
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

    // Get operator to find their auth_id
    const { data: operator } = await supabase
      .from('operators')
      .select('auth_id')
      .eq('id', operatorId)
      .single()

    if (!operator) {
      return NextResponse.json({ error: 'Operator not found' }, { status: 404 })
    }

    // Get activity logs from user_activity_log table
    const { data: logs, error: logsError } = await supabase
      .from('user_activity_log')
      .select('id, activity_type, entity_type, entity_id, metadata, created_at')
      .eq('user_id', operatorId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (logsError) {
      console.error('Error fetching activity logs:', logsError)
      // Return empty array if table doesn't exist yet
      return NextResponse.json({ logs: [] })
    }

    return NextResponse.json({ logs: logs || [] })
  } catch (error) {
    console.error('Error in GET /api/admin/operators/[id]/activity:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
