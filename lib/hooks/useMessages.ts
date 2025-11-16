/**
 * useMessages Hook
 * 
 * React hook for fetching and managing chat messages
 */

import { useState, useEffect, useCallback } from 'react'
import type { Message } from '@/lib/types/chat'

export interface UseMessagesOptions {
  chatId: string
  limit?: number
}

export interface UseMessagesReturn {
  messages: Message[]
  loading: boolean
  error: Error | null
  hasMore: boolean
  loadMore: () => Promise<void>
  addMessage: (message: Message) => void
  updateMessage: (messageId: string, updates: Partial<Message>) => void
  refreshMessages: () => Promise<void>
}

/**
 * Hook for fetching and managing chat messages
 */
export function useMessages({
  chatId,
  limit = 50,
}: UseMessagesOptions): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)

  const fetchMessages = useCallback(
    async (newOffset: number = 0, append: boolean = false) => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          `/api/chats/${chatId}/messages?limit=${limit}&offset=${newOffset}`
        )

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch messages')
        }

        const result = await response.json()
        const { messages: newMessages, pagination } = result.data

        if (append) {
          setMessages((prev) => [...prev, ...newMessages])
        } else {
          setMessages(newMessages)
        }

        setHasMore(pagination.hasMore)
        setOffset(newOffset)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch messages')
        setError(error)
        console.error('Error fetching messages:', error)
      } finally {
        setLoading(false)
      }
    },
    [chatId, limit]
  )

  useEffect(() => {
    fetchMessages(0, false)
  }, [fetchMessages])

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    await fetchMessages(offset + limit, true)
  }, [hasMore, loading, offset, limit, fetchMessages])

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message])
  }, [])

  const updateMessage = useCallback(
    (messageId: string, updates: Partial<Message>) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        )
      )
    },
    []
  )

  const refreshMessages = useCallback(async () => {
    await fetchMessages(0, false)
  }, [fetchMessages])

  return {
    messages,
    loading,
    error,
    hasMore,
    loadMore,
    addMessage,
    updateMessage,
    refreshMessages,
  }
}
