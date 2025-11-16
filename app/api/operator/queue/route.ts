import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/operator/queue
 * 
 * Get the chat assignment queue for the current operator
 * Returns queue items with priority indicators and user information
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current operator
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get operator record
    const { data: operator, error: operatorError } = await supabase
      .from('operators')
      .select('*')
      .eq('auth_id', user.id)
      .single()

    if (operatorError || !operator) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      )
    }

    // Get queue items with user and fictional profile information
    const { data: queueItems, error: queueError } = await supabase
      .from('chat_queue')
      .select(`
        *,
        chats!inner(
          id,
          real_user_id,
          fictional_user_id,
          real_users!inner(
            id,
            username,
            display_name,
            user_tier
          ),
          fictional_users!inner(
            id,
            name
          )
        )
      `)
      .order('priority_score', { ascending: false })
      .order('entered_queue_at', { ascending: true })

    if (queueError) {
      console.error('Error fetching queue:', queueError)
      return NextResponse.json(
        { error: 'Failed to fetch queue' },
        { status: 500 }
      )
    }

    // Transform the data to include user names
    const transformedQueue = (queueItems || []).map((item: any) => ({
      ...item,
      realUserName: item.chats?.real_users?.display_name || item.chats?.real_users?.username,
      fictionalUserName: item.chats?.fictional_users?.name,
    }))

    return NextResponse.json({ queue: transformedQueue })
  } catch (error) {
    console.error('Error in GET /api/operator/queue:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
