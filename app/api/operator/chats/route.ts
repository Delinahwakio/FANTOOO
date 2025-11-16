import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/operator/chats
 * 
 * Get active chats assigned to the current operator
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
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (operatorError || !operator) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      )
    }

    // Get active chats with user information
    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select(`
        *,
        real_users!inner(
          id,
          username,
          display_name,
          profile_picture,
          user_tier,
          credits
        ),
        fictional_users!inner(
          id,
          name,
          profile_pictures
        )
      `)
      .eq('assigned_operator_id', operator.id)
      .eq('status', 'active')
      .order('last_message_at', { ascending: false })

    if (chatsError) {
      console.error('Error fetching chats:', chatsError)
      return NextResponse.json(
        { error: 'Failed to fetch chats' },
        { status: 500 }
      )
    }

    return NextResponse.json({ chats: chats || [] })
  } catch (error) {
    console.error('Error in GET /api/operator/chats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
