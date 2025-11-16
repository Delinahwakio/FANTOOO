'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GlassCard } from '@/lib/components/ui/GlassCard'
import { GlassButton } from '@/lib/components/ui/GlassButton'
import { LoadingSpinner } from '@/lib/components/ui/LoadingSpinner'
import { QueueDisplay } from '@/lib/components/operator/QueueDisplay'
import { AvailabilityToggle } from '@/lib/components/operator/AvailabilityToggle'
import { useOperatorStats, useToggleAvailability, useOperatorChats } from '@/lib/hooks/useOperator'
import { useQueue, useAcceptChat } from '@/lib/hooks/useQueue'
import { toast } from '@/lib/hooks/useToast'

/**
 * Operator Waiting Room Page
 * 
 * Displays:
 * - Assignment queue with priority indicators
 * - Operator stats (messages sent, chats handled, quality score)
 * - Availability toggle with active chat validation
 * - Current active chats
 * - Quality score and suspension warnings
 * - Auto-refresh queue every 10 seconds
 * 
 * Requirements: 8.1-8.5 (Operator Assignment), 11.1-11.5 (Operator Availability), 
 *               12.1-12.5 (Operator Performance)
 */
export default function OperatorWaitingRoom() {
  const router = useRouter()
  
  // Fetch operator data
  const { data: stats, isLoading: statsLoading, error: statsError } = useOperatorStats()
  const { data: queue, isLoading: queueLoading } = useQueue()
  const { data: activeChats, isLoading: chatsLoading } = useOperatorChats()
  
  // Mutations
  const toggleAvailability = useToggleAvailability()
  const acceptChat = useAcceptChat()

  // Handle availability toggle
  const handleToggleAvailability = async (available: boolean) => {
    try {
      await toggleAvailability.mutateAsync(available)
      toast.success(available ? 'You are now online' : 'You are now offline')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update availability')
      throw error // Re-throw to let AvailabilityToggle handle it
    }
  }

  // Handle accepting a chat
  const handleAcceptChat = async (chatId: string) => {
    try {
      await acceptChat.mutateAsync(chatId)
      toast.success('Chat accepted!')
      router.push(`/operator/chat/${chatId}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to accept chat')
    }
  }

  // Show loading state
  if (statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Show error state
  if (statsError || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <GlassCard variant="elevated" className="max-w-md text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">
            Failed to Load Operator Data
          </h2>
          <p className="text-neutral-600 mb-6">
            {statsError instanceof Error ? statsError.message : 'An error occurred'}
          </p>
          <GlassButton
            variant="passion"
            onClick={() => window.location.reload()}
          >
            Retry
          </GlassButton>
        </GlassCard>
      </div>
    )
  }

  const { operator, performance, current, warnings } = stats

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">
            Operator Dashboard
          </h1>
          <p className="text-neutral-600">
            Welcome back, {operator.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/operator/stats">
            <GlassButton variant="outline">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Stats
            </GlassButton>
          </Link>
          <Link href="/operator/settings">
            <GlassButton variant="outline">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </GlassButton>
          </Link>
        </div>
      </div>

      {/* Suspension Warning */}
      {operator.is_suspended && (
        <GlassCard variant="elevated" className="mb-6 border-2 border-red-300 bg-red-50/50">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900 mb-1">
                Account Suspended
              </h3>
              <p className="text-red-700 mb-2">
                {operator.suspension_reason || 'Your account has been suspended due to low quality score.'}
              </p>
              {operator.suspended_until && (
                <p className="text-sm text-red-600">
                  Suspended until: {new Date(operator.suspended_until).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Quality Score Warning */}
      {warnings.suspension_warning && !operator.is_suspended && (
        <GlassCard variant="elevated" className="mb-6 border-2 border-orange-300 bg-orange-50/50">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-orange-900 mb-1">
                Quality Score Warning
              </h3>
              <p className="text-orange-700">
                Your quality score ({performance.quality_score.toFixed(2)}) is approaching the threshold ({warnings.quality_threshold}).
                Improve your performance to avoid suspension.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Availability Toggle */}
        <div className="lg:col-span-3">
          <AvailabilityToggle
            isAvailable={operator.is_available}
            activeChatsCount={current.active_chats_count}
            onToggle={handleToggleAvailability}
          />
        </div>

        {/* Stats Cards */}
        <GlassCard variant="elevated">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">
              Messages Sent
            </h3>
            <svg className="w-5 h-5 text-passion-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-neutral-900">
            {performance.total_messages_sent.toLocaleString()}
          </p>
        </GlassCard>

        <GlassCard variant="elevated">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">
              Chats Handled
            </h3>
            <svg className="w-5 h-5 text-luxury-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-neutral-900">
            {performance.total_chats_handled.toLocaleString()}
          </p>
        </GlassCard>

        <GlassCard variant="elevated">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">
              Quality Score
            </h3>
            <svg className="w-5 h-5 text-trust-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <p className={`text-3xl font-bold ${
            warnings.low_quality_score ? 'text-red-600' : 
            warnings.suspension_warning ? 'text-orange-600' : 
            'text-green-600'
          }`}>
            {performance.quality_score.toFixed(2)}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            Threshold: {warnings.quality_threshold}
          </p>
        </GlassCard>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <GlassCard variant="subtle" className="text-center">
          <p className="text-sm text-neutral-600 mb-1">Average Rating</p>
          <p className="text-2xl font-bold text-neutral-900">
            {performance.average_user_rating.toFixed(2)} ⭐
          </p>
          <p className="text-xs text-neutral-500">
            {performance.total_ratings} ratings
          </p>
        </GlassCard>

        <GlassCard variant="subtle" className="text-center">
          <p className="text-sm text-neutral-600 mb-1">Idle Incidents</p>
          <p className="text-2xl font-bold text-neutral-900">
            {performance.idle_incidents}
          </p>
        </GlassCard>

        <GlassCard variant="subtle" className="text-center">
          <p className="text-sm text-neutral-600 mb-1">Reassignments</p>
          <p className="text-2xl font-bold text-neutral-900">
            {performance.reassignment_count}
          </p>
        </GlassCard>

        <GlassCard variant="subtle" className="text-center">
          <p className="text-sm text-neutral-600 mb-1">Complaints</p>
          <p className="text-2xl font-bold text-neutral-900">
            {performance.user_complaints}
          </p>
        </GlassCard>
      </div>

      {/* Active Chats */}
      {current.active_chats_count > 0 && (
        <div className="mb-8">
          <GlassCard variant="elevated">
            <h3 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-passion-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Active Chats ({current.active_chats_count}/{current.max_concurrent_chats})
            </h3>
            
            {chatsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeChats?.map((chat: any) => (
                  <Link
                    key={chat.id}
                    href={`/operator/chat/${chat.id}`}
                    className="block"
                  >
                    <GlassCard 
                      variant="subtle" 
                      className="hover:scale-105 transition-smooth cursor-pointer border-2 border-transparent hover:border-passion-300"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {chat.real_users?.profile_picture ? (
                            <img
                              src={chat.real_users.profile_picture}
                              alt={chat.real_users.display_name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-passion-200 flex items-center justify-center">
                              <span className="text-passion-700 font-bold text-lg">
                                {chat.real_users?.display_name?.[0] || '?'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-neutral-900 truncate">
                            {chat.real_users?.display_name || 'Unknown User'}
                          </p>
                          <p className="text-sm text-neutral-600 truncate">
                            → {chat.fictional_users?.name || 'Unknown Profile'}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500">
                            <span className="px-2 py-0.5 rounded-full bg-neutral-200">
                              {chat.message_count} messages
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-passion-100 text-passion-700">
                              {chat.real_users?.user_tier}
                            </span>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </Link>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* Assignment Queue */}
      <div>
        <QueueDisplay
          queueItems={queue || []}
          onAcceptChat={handleAcceptChat}
          isLoading={acceptChat.isPending}
        />
      </div>
    </div>
  )
}
