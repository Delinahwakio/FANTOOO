/**
 * Chat Service
 * 
 * Handles chat creation, retrieval, closure, and metrics management.
 * Implements duplicate prevention and user validation.
 * 
 * Requirements: 4.1-4.5 (Real-Time Chat), 24.1-24.5 (Duplicate Chat Prevention)
 */

import { createClient as createServerClient } from '@/lib/supabase/server'
import { 
  ChatNotFoundError, 
  UserNotFoundError,
  FictionalUserNotFoundError,
  UnauthorizedError,
  DatabaseError
} from '@/lib/errors'
import type { Chat, ChatStatus } from '@/lib/types/chat'

/**
 * Result of chat creation operation
 */
export interface CreateChatResult {
  chat: Chat
  isNew: boolean
}

/**
 * Parameters for creating a chat
 */
export interface CreateChatParams {
  realUserId: string
  fictionalUserId: string
}

/**
 * Parameters for getting a chat
 */
export interface GetChatParams {
  chatId: string
  userId: string
}

/**
 * Parameters for closing a chat
 */
export interface CloseChatParams {
  chatId: string
  userId: string
  closeReason: string
}

/**
 * Parameters for updating chat metrics
 */
export interface UpdateChatMetricsParams {
  chatId: string
  messageCount?: number
  creditsSpent?: number
  lastMessageAt?: Date
  lastUserMessageAt?: Date
  lastFictionalMessageAt?: Date
}

/**
 * Create a new chat or return existing chat between real user and fictional user
 * 
 * This function implements duplicate prevention by using the database function
 * create_or_get_chat which has a UNIQUE constraint on (real_user_id, fictional_user_id).
 * 
 * @param params - Chat creation parameters
 * @returns Chat details and whether it's a new chat
 * @throws UserNotFoundError if real user doesn't exist
 * @throws FictionalUserNotFoundError if fictional user doesn't exist
 * @throws DatabaseError if database operation fails
 */
export async function createChat(
  params: CreateChatParams
): Promise<CreateChatResult> {
  const { realUserId, fictionalUserId } = params
  
  const supabase = await createServerClient()
  
  try {
    // Verify real user exists and is active
    const { data: realUser, error: realUserError } = await supabase
      .from('real_users')
      .select('id, is_active, is_banned')
      .eq('id', realUserId)
      .eq('deleted_at', null)
      .single()
    
    if (realUserError || !realUser) {
      throw new UserNotFoundError(realUserId)
    }
    
    if (!realUser.is_active) {
      throw new UnauthorizedError('User account is not active')
    }
    
    if (realUser.is_banned) {
      throw new UnauthorizedError('User account is banned')
    }
    
    // Verify fictional user exists and is active
    const { data: fictionalUser, error: fictionalUserError } = await supabase
      .from('fictional_users')
      .select('id, is_active')
      .eq('id', fictionalUserId)
      .eq('deleted_at', null)
      .single()
    
    if (fictionalUserError || !fictionalUser) {
      throw new FictionalUserNotFoundError(fictionalUserId)
    }
    
    if (!fictionalUser.is_active) {
      throw new DatabaseError('Fictional user is not active')
    }
    
    // Use database function to create or get chat (handles duplicate prevention)
    const { data, error } = await supabase.rpc('create_or_get_chat', {
      p_real_user_id: realUserId,
      p_fictional_user_id: fictionalUserId
    })
    
    if (error) {
      throw new DatabaseError('Failed to create chat', error)
    }
    
    if (!data || data.length === 0) {
      throw new DatabaseError('No chat data returned from database')
    }
    
    const chatResult = data[0]
    
    // Fetch the complete chat record
    const { data: chatData, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatResult.chat_id)
      .single()
    
    if (chatError || !chatData) {
      throw new ChatNotFoundError(chatResult.chat_id)
    }
    
    return {
      chat: chatData as Chat,
      isNew: chatResult.is_new
    }
    
  } catch (error) {
    // Re-throw known errors
    if (
      error instanceof UserNotFoundError ||
      error instanceof FictionalUserNotFoundError ||
      error instanceof UnauthorizedError ||
      error instanceof DatabaseError ||
      error instanceof ChatNotFoundError
    ) {
      throw error
    }
    
    // Wrap unknown errors
    throw new DatabaseError(
      'Unexpected error creating chat',
      error instanceof Error ? error : undefined
    )
  }
}

/**
 * Get a chat by ID with user validation
 * 
 * Ensures the requesting user has permission to access the chat.
 * Users can only access their own chats unless they are operators or admins.
 * 
 * @param params - Chat retrieval parameters
 * @returns Chat details
 * @throws ChatNotFoundError if chat doesn't exist
 * @throws UnauthorizedError if user doesn't have permission
 * @throws DatabaseError if database operation fails
 */
export async function getChat(
  params: GetChatParams
): Promise<Chat> {
  const { chatId, userId } = params
  
  const supabase = await createServerClient()
  
  try {
    // Get the chat
    const { data: chatData, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .single()
    
    if (chatError || !chatData) {
      throw new ChatNotFoundError(chatId)
    }
    
    // Verify user has permission to access this chat
    // Check if user is the real user in the chat
    if (chatData.real_user_id === userId) {
      return chatData as Chat
    }
    
    // Check if user is the assigned operator
    const { data: operatorData } = await supabase
      .from('operators')
      .select('id')
      .eq('auth_id', userId)
      .single()
    
    if (operatorData && chatData.assigned_operator_id === operatorData.id) {
      return chatData as Chat
    }
    
    // Check if user is an admin
    const { data: adminData } = await supabase
      .from('admins')
      .select('id, is_active')
      .eq('auth_id', userId)
      .eq('is_active', true)
      .single()
    
    if (adminData) {
      return chatData as Chat
    }
    
    // User doesn't have permission
    throw new UnauthorizedError('You do not have permission to access this chat')
    
  } catch (error) {
    // Re-throw known errors
    if (
      error instanceof ChatNotFoundError ||
      error instanceof UnauthorizedError ||
      error instanceof DatabaseError
    ) {
      throw error
    }
    
    // Wrap unknown errors
    throw new DatabaseError(
      'Unexpected error retrieving chat',
      error instanceof Error ? error : undefined
    )
  }
}

/**
 * Close a chat with reason tracking
 * 
 * Updates the chat status to 'closed', records the close reason,
 * and updates the closed_at timestamp.
 * 
 * @param params - Chat closure parameters
 * @returns Updated chat
 * @throws ChatNotFoundError if chat doesn't exist
 * @throws UnauthorizedError if user doesn't have permission
 * @throws DatabaseError if database operation fails
 */
export async function closeChat(
  params: CloseChatParams
): Promise<Chat> {
  const { chatId, userId, closeReason } = params
  
  const supabase = await createServerClient()
  
  try {
    // First verify the chat exists and user has permission
    const chat = await getChat({ chatId, userId })
    
    // Check if chat is already closed
    if (chat.status === 'closed' || chat.status === 'archived') {
      return chat
    }
    
    // Close the chat
    const { data: updatedChat, error: updateError } = await supabase
      .from('chats')
      .update({
        status: 'closed' as ChatStatus,
        close_reason: closeReason,
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', chatId)
      .select()
      .single()
    
    if (updateError || !updatedChat) {
      throw new DatabaseError('Failed to close chat', updateError)
    }
    
    // If chat was assigned to an operator, decrement their active chat count
    if (chat.assigned_operator_id) {
      await supabase
        .from('operators')
        .update({
          current_chat_count: supabase.rpc('decrement', { x: 1 }),
          updated_at: new Date().toISOString()
        })
        .eq('id', chat.assigned_operator_id)
    }
    
    return updatedChat as Chat
    
  } catch (error) {
    // Re-throw known errors
    if (
      error instanceof ChatNotFoundError ||
      error instanceof UnauthorizedError ||
      error instanceof DatabaseError
    ) {
      throw error
    }
    
    // Wrap unknown errors
    throw new DatabaseError(
      'Unexpected error closing chat',
      error instanceof Error ? error : undefined
    )
  }
}

/**
 * Update chat metrics
 * 
 * Updates various chat metrics such as message count, credits spent,
 * and timestamp tracking. This is typically called after message operations.
 * 
 * @param params - Chat metrics update parameters
 * @returns Updated chat
 * @throws ChatNotFoundError if chat doesn't exist
 * @throws DatabaseError if database operation fails
 */
export async function updateChatMetrics(
  params: UpdateChatMetricsParams
): Promise<Chat> {
  const { 
    chatId, 
    messageCount, 
    creditsSpent, 
    lastMessageAt,
    lastUserMessageAt,
    lastFictionalMessageAt
  } = params
  
  const supabase = await createServerClient()
  
  try {
    // Verify chat exists
    const { data: existingChat, error: chatError } = await supabase
      .from('chats')
      .select('id')
      .eq('id', chatId)
      .single()
    
    if (chatError || !existingChat) {
      throw new ChatNotFoundError(chatId)
    }
    
    // Build update object with only provided fields
    const updates: Partial<Chat> = {
      updated_at: new Date().toISOString()
    }
    
    if (messageCount !== undefined) {
      updates.message_count = messageCount
    }
    
    if (creditsSpent !== undefined) {
      // Use increment function for atomic update
      updates.total_credits_spent = supabase.rpc('increment', { x: creditsSpent }) as any
    }
    
    if (lastMessageAt) {
      updates.last_message_at = lastMessageAt.toISOString()
    }
    
    if (lastUserMessageAt) {
      updates.last_user_message_at = lastUserMessageAt.toISOString()
    }
    
    if (lastFictionalMessageAt) {
      updates.last_fictional_message_at = lastFictionalMessageAt.toISOString()
    }
    
    // Update the chat
    const { data: updatedChat, error: updateError } = await supabase
      .from('chats')
      .update(updates)
      .eq('id', chatId)
      .select()
      .single()
    
    if (updateError || !updatedChat) {
      throw new DatabaseError('Failed to update chat metrics', updateError)
    }
    
    return updatedChat as Chat
    
  } catch (error) {
    // Re-throw known errors
    if (
      error instanceof ChatNotFoundError ||
      error instanceof DatabaseError
    ) {
      throw error
    }
    
    // Wrap unknown errors
    throw new DatabaseError(
      'Unexpected error updating chat metrics',
      error instanceof Error ? error : undefined
    )
  }
}

/**
 * Get all chats for a user
 * 
 * Returns all chats where the user is the real user participant.
 * Results are ordered by last message timestamp (most recent first).
 * 
 * @param userId - The user ID
 * @param status - Optional status filter
 * @returns Array of chats
 * @throws DatabaseError if database operation fails
 */
export async function getUserChats(
  userId: string,
  status?: ChatStatus
): Promise<Chat[]> {
  const supabase = await createServerClient()
  
  try {
    let query = supabase
      .from('chats')
      .select('*')
      .eq('real_user_id', userId)
      .order('last_message_at', { ascending: false, nullsFirst: false })
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data, error } = await query
    
    if (error) {
      throw new DatabaseError('Failed to retrieve user chats', error)
    }
    
    return (data || []) as Chat[]
    
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error
    }
    
    throw new DatabaseError(
      'Unexpected error retrieving user chats',
      error instanceof Error ? error : undefined
    )
  }
}
