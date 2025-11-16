import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Operator } from '@/lib/types/operator'

interface OperatorStats {
  operator: {
    id: string
    name: string
    email: string
    is_available: boolean
    is_suspended: boolean
    suspension_reason?: string
    suspended_until?: string
  }
  performance: {
    total_messages_sent: number
    total_chats_handled: number
    quality_score: number
    average_response_time?: string
    average_user_rating: number
    total_ratings: number
    idle_incidents: number
    reassignment_count: number
    user_complaints: number
    total_online_time?: string
    total_earnings: number
  }
  current: {
    active_chats_count: number
    active_chats: any[]
    max_concurrent_chats: number
  }
  warnings: {
    low_quality_score: boolean
    quality_threshold: number
    suspension_warning: boolean
  }
  trends?: {
    daily: Array<{
      date: string
      messages_sent: number
      chats_handled: number
      average_rating: number
    }>
    period_totals: {
      messages_sent: number
      chats_handled: number
      average_rating: number
      total_credits_earned: number
    }
  }
}

/**
 * Hook to fetch operator statistics and performance data
 * @param queryParams - Optional query parameters (e.g., "?startDate=...&endDate=...")
 */
export function useOperatorStats(queryParams: string = '') {
  return useQuery<OperatorStats>({
    queryKey: ['operator', 'stats', queryParams],
    queryFn: async () => {
      const response = await fetch(`/api/operator/stats${queryParams}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch operator stats')
      }
      
      return response.json()
    },
    refetchInterval: queryParams ? undefined : 30000, // Only auto-refetch for current stats
  })
}

/**
 * Hook to toggle operator availability
 */
export function useToggleAvailability() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (available: boolean) => {
      const response = await fetch('/api/operator/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ available }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update availability')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate operator stats to refetch
      queryClient.invalidateQueries({ queryKey: ['operator', 'stats'] })
    },
  })
}

/**
 * Hook to fetch operator's active chats
 */
export function useOperatorChats() {
  return useQuery({
    queryKey: ['operator', 'chats'],
    queryFn: async () => {
      const response = await fetch('/api/operator/chats')
      
      if (!response.ok) {
        throw new Error('Failed to fetch operator chats')
      }
      
      const data = await response.json()
      return data.chats
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  })
}

/**
 * Hook to fetch operator settings
 */
export function useOperatorSettings() {
  return useQuery({
    queryKey: ['operator', 'settings'],
    queryFn: async () => {
      const response = await fetch('/api/operator/settings')
      
      if (!response.ok) {
        throw new Error('Failed to fetch operator settings')
      }
      
      return response.json()
    },
  })
}

/**
 * Hook to update operator settings
 */
export function useUpdateOperatorSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: { specializations?: string[] }) => {
      const response = await fetch('/api/operator/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update settings')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate operator settings to refetch
      queryClient.invalidateQueries({ queryKey: ['operator', 'settings'] })
      queryClient.invalidateQueries({ queryKey: ['operator', 'stats'] })
    },
  })
}
