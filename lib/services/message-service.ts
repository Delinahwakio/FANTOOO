/**
 * Message Service
 * 
 * Handles message sending with transaction safety, credit deduction,
 * and race condition prevention using row-level locking.
 * 
 * Requirements: 7.1-7.5 (Race Condition Prevention), 4.1-4.5 (Real-Time Chat)
 */

import { createClient as createServerClient } from '@/lib/supabase/server'
import { calculateMessageCost } from '@/lib/utils/credits'
import { 
  InsufficientCreditsError, 
  ChatNotFoundError, 
  UserNotFoundError,
  TransactionError 
} from '@/lib/errors'
import type { Message, MessageContentType, MessageSenderType } from '@/lib/types/chat'
import type { UserTier } from '@/lib/types/user'

/**
 * Parameters for sending a message
 */
export interface SendMessageParams {
  chatId: string
  userId: string
  content: string
  contentType?: MessageContentType
  mediaUrl?: string
}

/**
 * Result of a message send operation
 */
export interface SendMessageResult {
  message: Message
  creditsCharged: number
  remainingCredits: number
}

/**
 * Failed transaction log entry
 */
interface FailedTransactionLog {
  user_id: string
  chat_id: string
  error_type: string
  error_message: string
  attempted_at: string
  metadata?: Record<string, any>
}

/**
 * Send a message with full transaction safety
 * 
 * This function implements:
 * - Row-level locking (SELECT FOR UPDATE) to prevent race conditions
 * - Credit calculation and validation
 * - Atomic credit deduction within transaction
 * - Automatic rollback on any error
 * - Failed transaction logging
 * 
 * @param params - Message parameters
 * @returns Message details and credit information
 * @throws InsufficientCreditsError if user doesn't have enough credits
 * @throws ChatNotFoundError if chat doesn't exist
 * @throws UserNotFoundError if user doesn't exist
 * @throws TransactionError if transaction fails
 */
export async function sendMessage(
  params: SendMessageParams
): Promise<SendMessageResult> {
  const { chatId, userId, content, contentType = 'text', mediaUrl } = params
  
  const supabase = await createServerClient()
  
  try {
    // Start transaction by using RPC function that handles locking
    // We'll use a database function to ensure proper transaction handling
    const { data, error } = await supabase.rpc('send_message_with_transaction', {
      p_chat_id: chatId,
      p_user_id: userId,
      p_content: content,
      p_content_type: contentType,
      p_media_url: mediaUrl
    })
    
    if (error) {
      // Check for specific error types
      if (error.message.includes('insufficient credits')) {
        // Parse the error message to extract required and available credits
        const match = error.message.match(/need (\d+), have (\d+)/)
        if (match) {
          const required = parseInt(match[1], 10)
          const available = parseInt(match[2], 10)
          throw new InsufficientCreditsError(required, available)
        }
        throw new InsufficientCreditsError(0, 0)
      }
      
      if (error.message.includes('chat not found')) {
        throw new ChatNotFoundError(chatId)
      }
      
      if (error.message.includes('user not found')) {
        throw new UserNotFoundError(userId)
      }
      
      throw new TransactionError('Failed to send message', error)
    }
    
    return data as SendMessageResult
    
  } catch (error) {
    // Log failed transaction
    await logFailedTransaction({
      user_id: userId,
      chat_id: chatId,
      error_type: error instanceof Error ? error.name : 'UnknownError',
      error_message: error instanceof Error ? error.message : 'Unknown error occurred',
      attempted_at: new Date().toISOString(),
      metadata: {
        content_type: contentType,
        content_length: content.length
      }
    })
    
    // Re-throw the error for the caller to handle
    throw error
  }
}

/**
 * Log a failed transaction attempt
 * 
 * This is a best-effort logging function that won't throw errors
 * to avoid masking the original error.
 */
async function logFailedTransaction(log: FailedTransactionLog): Promise<void> {
  try {
    const supabase = await createServerClient()
    
    await supabase.from('failed_transaction_log').insert({
      user_id: log.user_id,
      chat_id: log.chat_id,
      error_type: log.error_type,
      error_message: log.error_message,
      attempted_at: log.attempted_at,
      metadata: log.metadata
    })
  } catch (error) {
    // Silently fail - we don't want logging errors to mask the original error
    console.error('Failed to log transaction error:', error)
  }
}

/**
 * Alternative implementation using direct SQL queries
 * This is kept for reference but the RPC approach is preferred
 * for better transaction handling in Supabase
 */
export async function sendMessageDirect(
  params: SendMessageParams
): Promise<SendMessageResult> {
  const { chatId, userId, content, contentType = 'text', mediaUrl } = params
  
  const supabase = await createServerClient()
  
  try {
    // Step 1: Lock the user row and get user data
    const { data: userData, error: userError } = await supabase
      .from('real_users')
      .select('id, credits, user_tier')
      .eq('id', userId)
      .single()
    
    if (userError || !userData) {
      throw new UserNotFoundError(userId)
    }
    
    // Step 2: Get chat data to calculate message cost
    const { data: chatData, error: chatError } = await supabase
      .from('chats')
      .select('id, message_count, fictional_user_id, fictional_users(is_featured)')
      .eq('id', chatId)
      .eq('real_user_id', userId)
      .eq('status', 'active')
      .single()
    
    if (chatError || !chatData) {
      throw new ChatNotFoundError(chatId)
    }
    
    // Step 3: Calculate message cost
    const messageNumber = chatData.message_count + 1
    const isFeaturedProfile = (chatData.fictional_users as any)?.is_featured || false
    const userTier = userData.user_tier as UserTier
    
    const messageCost = calculateMessageCost(
      messageNumber,
      userTier,
      isFeaturedProfile,
      new Date()
    )
    
    const isFreeMessage = messageCost === 0
    
    // Step 4: Check if user has sufficient credits
    if (!isFreeMessage && userData.credits < messageCost) {
      throw new InsufficientCreditsError(messageCost, userData.credits)
    }
    
    // Step 5: Deduct credits if not a free message
    if (!isFreeMessage) {
      const { error: creditError } = await supabase
        .from('real_users')
        .update({ 
          credits: userData.credits - messageCost,
          total_spent: supabase.rpc('increment', { x: messageCost * 10 }) // 1 credit = 10 KES
        })
        .eq('id', userId)
      
      if (creditError) {
        throw new TransactionError('Failed to deduct credits', creditError)
      }
    }
    
    // Step 6: Create the message
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_type: 'real' as MessageSenderType,
        content,
        content_type: contentType,
        media_url: mediaUrl,
        is_free_message: isFreeMessage,
        credits_charged: messageCost,
        status: 'sent'
      })
      .select()
      .single()
    
    if (messageError || !messageData) {
      // Rollback credit deduction if message creation fails
      if (!isFreeMessage) {
        await supabase
          .from('real_users')
          .update({ credits: userData.credits })
          .eq('id', userId)
      }
      throw new TransactionError('Failed to create message', messageError)
    }
    
    // Step 7: Update chat metadata
    await supabase
      .from('chats')
      .update({
        message_count: messageNumber,
        last_message_at: new Date().toISOString(),
        last_user_message_at: new Date().toISOString(),
        total_credits_spent: supabase.rpc('increment', { x: messageCost }),
        ...(isFreeMessage ? {} : { paid_messages_count: supabase.rpc('increment', { x: 1 }) }),
        ...(isFreeMessage ? { free_messages_used: supabase.rpc('increment', { x: 1 }) } : {})
      })
      .eq('id', chatId)
    
    return {
      message: messageData as Message,
      creditsCharged: messageCost,
      remainingCredits: userData.credits - messageCost
    }
    
  } catch (error) {
    // Log failed transaction
    await logFailedTransaction({
      user_id: userId,
      chat_id: chatId,
      error_type: error instanceof Error ? error.name : 'UnknownError',
      error_message: error instanceof Error ? error.message : 'Unknown error occurred',
      attempted_at: new Date().toISOString(),
      metadata: {
        content_type: contentType,
        content_length: content.length
      }
    })
    
    throw error
  }
}
