/**
 * API Route: Get Single Chat
 * 
 * GET /api/chats/[id]
 * 
 * Fetches a single chat by ID with fictional user details
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const chatId = params.id

    // Validate chat ID
    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required', code: 'INVALID_CHAT_ID' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Get user ID from database
    const { data: userData, error: userError } = await supabase
      .from('real_users')
      .select('id, credits, user_tier')
      .eq('auth_id', user.id)
      .single()
    
    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Fetch chat with fictional user details
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select(`
        *,
        fictional_user:fictional_users(
          id,
          name,
          age,
          gender,
          location,
          bio,
          profile_pictures,
          is_featured
        )
      `)
      .eq('id', chatId)
      .eq('real_user_id', userData.id)
      .single()

    if (chatError || !chat) {
      return NextResponse.json(
        { error: 'Chat not found or access denied', code: 'CHAT_NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        chat,
        userCredits: userData.credits,
        userTier: userData.user_tier,
      },
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
