import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/operator/availability
 * 
 * Toggle operator availability status
 * Validates that operators cannot go offline with active chats
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

    // Parse request body
    const body = await request.json()
    const { available } = body

    if (typeof available !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid availability value' },
        { status: 400 }
      )
    }

    // If trying to go offline, check for active chats
    if (!available && operator.current_chat_count > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot go offline with active chats',
          activeChatsCount: operator.current_chat_count
        },
        { status: 400 }
      )
    }

    // Update availability
    const { data: updatedOperator, error: updateError } = await supabase
      .from('operators')
      .update({ 
        is_available: available,
        last_activity: new Date().toISOString()
      })
      .eq('id', operator.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating availability:', updateError)
      return NextResponse.json(
        { error: 'Failed to update availability' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      operator: updatedOperator
    })
  } catch (error) {
    console.error('Error in POST /api/operator/availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
