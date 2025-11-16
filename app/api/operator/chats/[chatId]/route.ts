import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/operator/chats/[chatId]
 * 
 * Get detailed chat information for operator interface
 * Includes real user profile, fictional user profile, and assignment information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const supabase = await createClient()
    const { chatId } = params

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
      .select('id, name')
      .eq('auth_id', user.id)
      .single()

    if (operatorError || !operator) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      )
    }

    // Get chat with full details
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select(`
        *,
        real_users!inner(
          id,
          username,
          display_name,
          email,
          age,
          gender,
          looking_for,
          location,
          bio,
          profile_picture,
          profile_pictures,
          credits,
          user_tier,
          total_messages_sent,
          total_chats,
          last_active_at
        ),
        fictional_users!inner(
          id,
          name,
          age,
          gender,
          location,
          bio,
          personality_traits,
          interests,
          occupation,
          education,
          relationship_status,
          profile_pictures,
          response_style,
          response_templates,
          personality_guidelines,
          is_featured
        )
      `)
      .eq('id', chatId)
      .single()

    if (chatError) {
      console.error('Error fetching chat:', chatError)
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      )
    }

    // Verify operator is assigned to this chat
    if (chat.assigned_operator_id !== operator.id) {
      return NextResponse.json(
        { error: 'You are not assigned to this chat' },
        { status: 403 }
      )
    }

    // Note: Previous operators tracking would require a chat_assignment_history table
    // For now, we'll indicate if there were previous assignments based on assignment_count
    const previousOperators: string[] = []
    if (chat.assignment_count > 1) {
      // Indicate there were previous operators without specific names
      for (let i = 1; i < chat.assignment_count; i++) {
        previousOperators.push(`Operator ${i}`)
      }
    }

    // Structure the response
    const response = {
      chat: {
        id: chat.id,
        real_user_id: chat.real_user_id,
        fictional_user_id: chat.fictional_user_id,
        assigned_operator_id: chat.assigned_operator_id,
        assignment_time: chat.assignment_time,
        last_operator_activity: chat.last_operator_activity,
        assignment_count: chat.assignment_count,
        status: chat.status,
        close_reason: chat.close_reason,
        message_count: chat.message_count,
        free_messages_used: chat.free_messages_used,
        paid_messages_count: chat.paid_messages_count,
        total_credits_spent: chat.total_credits_spent,
        operator_notes: chat.operator_notes,
        admin_notes: chat.admin_notes,
        flags: chat.flags,
        first_message_at: chat.first_message_at,
        last_message_at: chat.last_message_at,
        created_at: chat.created_at,
        updated_at: chat.updated_at,
        closed_at: chat.closed_at
      },
      realUser: chat.real_users,
      fictionalUser: chat.fictional_users,
      assignmentInfo: {
        currentOperator: operator.name,
        previousOperators,
        assignmentCount: chat.assignment_count
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in GET /api/operator/chats/[chatId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
