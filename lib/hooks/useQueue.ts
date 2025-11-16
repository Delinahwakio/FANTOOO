import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ChatQueue } from '@/lib/types/chat'

interface QueueItem extends ChatQueue {
  realUserName?: string
  fictionalUserName?: string
}

/**
 * Hook to fetch the chat assignment queue
 */
export function useQueue() {
  return useQuery<QueueItem[]>({
    queryKey: ['operator', 'queue'],
    queryFn: async () => {
      const response = await fetch('/api/operator/queue')
      
      if (!response.ok) {
        throw new Error('Failed to fetch queue')
      }
      
      const data = await response.json()
      return data.queue
    },
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  })
}

/**
 * Hook to accept a chat from the queue
 */
export function useAcceptChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (chatId: string) => {
      const response = await fetch('/api/operator/accept-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to accept chat')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate queue and stats to refetch
      queryClient.invalidateQueries({ queryKey: ['operator', 'queue'] })
      queryClient.invalidateQueries({ queryKey: ['operator', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['operator', 'chats'] })
    },
  })
}
