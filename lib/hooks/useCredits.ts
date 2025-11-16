/**
 * useCredits Hook
 * 
 * React hook for managing user credits
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface UseCreditsReturn {
  credits: number
  loading: boolean
  error: Error | null
  refreshCredits: () => Promise<void>
}

/**
 * Hook for managing user credits
 */
export function useCredits(): UseCreditsReturn {
  const [credits, setCredits] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCredits = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()
      
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        throw new Error('Not authenticated')
      }

      // Get user credits
      const { data, error: creditsError } = await supabase
        .from('real_users')
        .select('credits')
        .eq('auth_id', user.id)
        .single()

      if (creditsError) {
        throw creditsError
      }

      setCredits(data?.credits || 0)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch credits')
      setError(error)
      console.error('Error fetching credits:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCredits()
  }, [fetchCredits])

  // Subscribe to credit changes
  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel('credits-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'real_users',
        },
        (payload) => {
          if (payload.new && 'credits' in payload.new) {
            setCredits((payload.new as any).credits)
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  return {
    credits,
    loading,
    error,
    refreshCredits: fetchCredits,
  }
}
