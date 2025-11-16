import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PATCH /api/operator/chats/[chatId]/notes
 * 
 * Save operator notes about real user or fictional user
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const supabase = await createClient()
    const { chatId } = params
    const body = await request.json()
    const { notes, type } = body

    if (!notes || typeof notes !== 'string') {
      return NextResponse.json(
        { error: 'Notes are required' },
        { status: 400 }
      )
    }

    if (!type || !['real_user', 'fictional_user'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid note type. Must be "real_user" or "fictional_user"' },
        { status: 400 }
      )
    }

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

    // Get chat to verify assignment
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('assigned_operator_id, real_user_id, fictional_user_id')
      .eq('id', chatId)
      .single()

    if (chatError || !chat) {
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

    if (type === 'real_user') {
      // Save notes in the chat's operator_notes field
      const { error: updateError } = await supabase
        .from('chats')
        .update({
          operator_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', chatId)

      if (updateError) {
        console.error('Error updating operator notes:', updateError)
        return NextResponse.json(
          { error: 'Failed to save notes' },
          { status: 500 }
        )
      }
    } else {
      // For fictional user notes, we could store them in a separate table
      // or in the fictional_users table. For now, we'll use the chat's operator_notes
      // with a prefix to distinguish them
      const { data: currentChat } = await supabase
        .from('chats')
        .select('operator_notes')
        .eq('id', chatId)
        .single()

      const updatedNotes = `[FICTIONAL_USER_NOTES]\n${notes}\n\n[REAL_USER_NOTES]\n${currentChat?.operator_notes || ''}`

      const { error: updateError } = await supabase
        .from('chats')
        .update({
          operator_notes: updatedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', chatId)

      if (updateError) {
        console.error('Error updating fictional user notes:', updateError)
        return NextResponse.json(
          { error: 'Failed to save notes' },
          { status: 500 }
        )
      }
    }

    // Update operator's last activity
    await supabase
      .from('operators')
      .update({
        last_activity: new Date().toISOString()
      })
      .eq('id', operator.id)

    return NextResponse.json({ 
      success: true,
      message: 'Notes saved successfully' 
    })
  } catch (error) {
    console.error('Error in PATCH /api/operator/chats/[chatId]/notes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
