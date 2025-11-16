/**
 * useChat Hook
 * 
 * React hook for managing chat operations in components
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Chat, ChatStatus } from '@/lib/types/chat'
import {
  ChatNotFoundError,
  UserNotFoundError,
  FictionalUserNotFoundError,
  UnauthorizedError,
  DatabaseError
} from '@/lib/errors'

/**
 * Result of chat creation
 */
export interface CreateChatResult {
  chat: Chat
  isNew: boolean
}

/**
 * Hook state
 */
interface UseChatState {
  loading: boolean
  error: Error | null
  chat: Chat | null
}

/**
 * Hook for managing chat operations
 */
export function useChat() {
  const router = useRouter()
  const [state, setState] = useState<UseChatState>({
    loading: false,
    error: null,
    chat: null
  })

  /**
   * Create or get a chat
   */
  const createChat = useCallback(async (
    realUserId: string,
    fictionalUserId: string
  ): Promise<CreateChatResult | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ realUserId, fictionalUserId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create chat')
      }

      const result: CreateChatResult = await response.json()
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        chat: result.chat 
      }))

      return result
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error')
      setState(prev => ({ ...prev, loading: false, error: err }))
      return null
    }
  }, [])

  /**
   * Get a chat by ID
   */
  const getChat = useCallback(async (
    chatId: string
  ): Promise<Chat | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch(`/api/chats/${chatId}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new ChatNotFoundError(chatId)
        }
        if (response.status === 401 || response.status === 403) {
          throw new UnauthorizedError('You do not have permission to access this chat')
        }
        const error = await response.json()
        throw new Error(error.message || 'Failed to get chat')
      }

      const chat: Chat = await response.json()
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        chat 
      }))

      return chat
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error')
      setState(prev => ({ ...prev, loading: false, error: err }))
      
      // Redirect on unauthorized
      if (error instanceof UnauthorizedError) {
        router.push('/discover')
      }
      
      return null
    }
  }, [router])

  /**
   * Close a chat
   */
  const closeChat = useCallback(async (
    chatId: string,
    closeReason: string
  ): Promise<Chat | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetch(`/api/chats/${chatId}/close`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closeReason })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to close chat')
      }

      const chat: Chat = await response.json()
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        chat 
      }))

      return chat
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error')
      setState(prev => ({ ...prev, loading: false, error: err }))
      return null
    }
  }, [])

  /**
   * Get all chats for current user
   */
  const getUserChats = useCallback(async (
    status?: ChatStatus
  ): Promise<Chat[]> => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const url = status 
        ? `/api/chats?status=${status}`
        : '/api/chats'
      
      const response = await fetch(url)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to get chats')
      }

      const chats: Chat[] = await response.json()
      
      setState(prev => ({ 
        ...prev, 
        loading: false 
      }))

      return chats
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error')
      setState(prev => ({ ...prev, loading: false, error: err }))
      return []
    }
  }, [])

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    createChat,
    getChat,
    closeChat,
    getUserChats,
    clearError
  }
}
