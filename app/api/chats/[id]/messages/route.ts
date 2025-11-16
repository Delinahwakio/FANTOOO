/**
 * API Route: Get Chat Messages
 * 
 * GET /api/chats/[id]/messages
 * 
 * Fetches messages for a specific chat with pagination
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Query params validation schema
const querySchema = z.object({
  limit: z.string().optional().default('50').transform(Number),
  offset: z.string().optional().default('0').transform(Number),
})

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
      .select('id')
      .eq('auth_id', user.id)
      .single()
    
    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Verify user has access to this chat
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('id, real_user_id, status')
      .eq('id', chatId)
      .eq('real_user_id', userData.id)
      .single()

    if (chatError || !chat) {
      return NextResponse.json(
        { error: 'Chat not found or access denied', code: 'CHAT_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const { limit, offset } = querySchema.parse({
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
    })

    // Fetch messages with pagination
    const { data: messages, error: messagesError, count } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json(
        { error: 'Failed to fetch messages', code: 'DATABASE_ERROR' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        messages: messages || [],
        pagination: {
          limit,
          offset,
          total: count || 0,
          hasMore: (offset + limit) < (count || 0),
        },
      },
    })

  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters', 
          code: 'VALIDATION_ERROR',
          details: err.issues 
        },
        { status: 400 }
      )
    }

    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'An unexpected error occurred', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
