import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/operator/accept-chat
 * 
 * Accept a chat from the assignment queue
 * Assigns the chat to the current operator and removes it from the queue
 */
export async function POST(request: NextRequest) {
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

    // Check if operator is available
    if (!operator.is_available) {
      return NextResponse.json(
        { error: 'Operator is not available' },
        { status: 400 }
      )
    }

    // Check if operator has reached max concurrent chats
    if (operator.current_chat_count >= operator.max_concurrent_chats) {
      return NextResponse.json(
        { error: 'Maximum concurrent chats reached' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { chatId } = body

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 }
      )
    }

    // Check if chat exists in queue
    const { data: queueItem, error: queueError } = await supabase
      .from('chat_queue')
      .select('*')
      .eq('chat_id', chatId)
      .single()

    if (queueError || !queueItem) {
      return NextResponse.json(
        { error: 'Chat not found in queue' },
        { status: 404 }
      )
    }

    // Assign chat to operator
    const { data: updatedChat, error: chatUpdateError } = await supabase
      .from('chats')
      .update({
        assigned_operator_id: operator.id,
        assignment_time: new Date().toISOString(),
        assignment_count: queueItem.attempts + 1,
        status: 'active',
      })
      .eq('id', chatId)
      .select()
      .single()

    if (chatUpdateError) {
      console.error('Error assigning chat:', chatUpdateError)
      return NextResponse.json(
        { error: 'Failed to assign chat' },
        { status: 500 }
      )
    }

    // Remove from queue
    const { error: queueDeleteError } = await supabase
      .from('chat_queue')
      .delete()
      .eq('id', queueItem.id)

    if (queueDeleteError) {
      console.error('Error removing from queue:', queueDeleteError)
      // Don't fail the request if queue deletion fails
    }

    // Update operator's current chat count
    const { error: operatorUpdateError } = await supabase
      .from('operators')
      .update({
        current_chat_count: operator.current_chat_count + 1,
        last_activity: new Date().toISOString(),
      })
      .eq('id', operator.id)

    if (operatorUpdateError) {
      console.error('Error updating operator:', operatorUpdateError)
      // Don't fail the request if operator update fails
    }

    return NextResponse.json({
      success: true,
      chat: updatedChat,
    })
  } catch (error) {
    console.error('Error in POST /api/operator/accept-chat:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
