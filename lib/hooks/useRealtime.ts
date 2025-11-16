/**
 * useRealtime Hook
 * 
 * React hook for managing real-time subscriptions with Supabase
 */

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'
import type { Message } from '@/lib/types/chat'

export interface UseRealtimeMessagesOptions {
  chatId: string
  onNewMessage?: (message: Message) => void
  onMessageUpdate?: (message: Message) => void
  onTypingStart?: (userId: string) => void
  onTypingEnd?: (userId: string) => void
}

export interface UseRealtimeMessagesReturn {
  isConnected: boolean
  error: Error | null
  sendTypingIndicator: (isTyping: boolean) => void
}

/**
 * Hook for real-time message subscriptions
 */
export function useRealtimeMessages({
  chatId,
  onNewMessage,
  onMessageUpdate,
  onTypingStart,
  onTypingEnd,
}: UseRealtimeMessagesOptions): UseRealtimeMessagesReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    const supabase = createClient()
    
    // Create channel for this chat
    const chatChannel = supabase.channel(`chat:${chatId}`)

    // Subscribe to new messages
    chatChannel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          if (onNewMessage && payload.new) {
            onNewMessage(payload.new as Message)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          if (onMessageUpdate && payload.new) {
            onMessageUpdate(payload.new as Message)
          }
        }
      )
      .on('presence', { event: 'sync' }, () => {
        // Handle presence sync
        setIsConnected(true)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // Handle user joining
        console.log('User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // Handle user leaving
        console.log('User left:', key, leftPresences)
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        // Handle typing indicators
        if (payload.isTyping && onTypingStart) {
          onTypingStart(payload.userId)
        } else if (!payload.isTyping && onTypingEnd) {
          onTypingEnd(payload.userId)
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          setError(null)
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false)
          setError(new Error('Failed to connect to real-time channel'))
        } else if (status === 'TIMED_OUT') {
          setIsConnected(false)
          setError(new Error('Connection timed out'))
        }
      })

    setChannel(chatChannel)

    // Cleanup on unmount
    return () => {
      chatChannel.unsubscribe()
      setChannel(null)
      setIsConnected(false)
    }
  }, [chatId, onNewMessage, onMessageUpdate, onTypingStart, onTypingEnd])

  const sendTypingIndicator = useCallback(
    (isTyping: boolean) => {
      if (channel) {
        channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: { isTyping, userId: 'current-user' },
        })
      }
    },
    [channel]
  )

  return {
    isConnected,
    error,
    sendTypingIndicator,
  }
}
