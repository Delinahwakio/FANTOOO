/**
 * API Route: Send Message
 * 
 * POST /api/messages/send
 * 
 * Sends a message in a chat with transaction safety
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendMessage } from '@/lib/services/message-service'
import { 
  InsufficientCreditsError, 
  ChatNotFoundError, 
  UserNotFoundError,
  TransactionError 
} from '@/lib/errors'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Request validation schema
const sendMessageSchema = z.object({
  chatId: z.string().uuid('Invalid chat ID'),
  content: z.string().min(1, 'Message cannot be empty').max(1000, 'Message too long'),
  contentType: z.enum(['text', 'image', 'voice', 'video', 'gif']).optional().default('text'),
  mediaUrl: z.string().url('Invalid media URL').optional()
})

export async function POST(request: NextRequest) {
  try {
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
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = sendMessageSchema.parse(body)
    
    // Send message
    const result = await sendMessage({
      chatId: validatedData.chatId,
      userId: userData.id,
      content: validatedData.content,
      contentType: validatedData.contentType,
      mediaUrl: validatedData.mediaUrl
    })
    
    return NextResponse.json({
      success: true,
      data: result
    })
    
  } catch (error) {
    // Handle specific errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          code: 'VALIDATION_ERROR',
          details: error.errors 
        },
        { status: 400 }
      )
    }
    
    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits', 
          code: 'INSUFFICIENT_CREDITS',
          required: error.required,
          available: error.available
        },
        { status: 402 }
      )
    }
    
    if (error instanceof ChatNotFoundError) {
      return NextResponse.json(
        { 
          error: 'Chat not found or not active', 
          code: 'CHAT_NOT_FOUND'
        },
        { status: 404 }
      )
    }
    
    if (error instanceof UserNotFoundError) {
      return NextResponse.json(
        { 
          error: 'User not found', 
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      )
    }
    
    if (error instanceof TransactionError) {
      console.error('Transaction error:', error)
      return NextResponse.json(
        { 
          error: 'Failed to send message', 
          code: 'TRANSACTION_ERROR'
        },
        { status: 500 }
      )
    }
    
    // Generic error
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred', 
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}
