import React from 'react';
import { cn } from '@/lib/utils/cn';
import { GlassCard } from '@/lib/components/ui/GlassCard';
import { GlassButton } from '@/lib/components/ui/GlassButton';
import type { ChatQueue } from '@/lib/types/chat';

export interface QueueDisplayProps {
  queueItems: (ChatQueue & {
    realUserName?: string;
    fictionalUserName?: string;
  })[];
  onAcceptChat?: (chatId: string) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * QueueDisplay Component
 * 
 * Displays the chat assignment queue for operators with priority indicators.
 * Shows waiting chats with user information and priority levels.
 * 
 * @param queueItems - Array of queue items with chat and user information
 * @param onAcceptChat - Callback when operator accepts a chat
 * @param isLoading - Loading state for queue operations
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <QueueDisplay
 *   queueItems={queueItems}
 *   onAcceptChat={handleAcceptChat}
 * />
 * ```
 */
export const QueueDisplay = React.forwardRef<HTMLDivElement, QueueDisplayProps>(
  (
    {
      queueItems,
      onAcceptChat,
      isLoading = false,
      className,
    },
    ref
  ) => {
    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'urgent':
          return 'bg-red-100 text-red-700 border-red-300';
        case 'high':
          return 'bg-orange-100 text-orange-700 border-orange-300';
        case 'normal':
          return 'bg-blue-100 text-blue-700 border-blue-300';
        case 'low':
          return 'bg-neutral-100 text-neutral-700 border-neutral-300';
        default:
          return 'bg-neutral-100 text-neutral-700 border-neutral-300';
      }
    };

    const getPriorityIcon = (priority: string) => {
      switch (priority) {
        case 'urgent':
          return (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          );
        case 'high':
          return (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          );
        default:
          return (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
          );
      }
    };

    const formatWaitTime = (enteredAt: string) => {
      const entered = new Date(enteredAt);
      const now = new Date();
      const diffMs = now.getTime() - entered.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours}h ${diffMins % 60}m ago`;
    };

    return (
      <GlassCard
        ref={ref}
        variant="elevated"
        className={cn('flex flex-col', className)}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg text-neutral-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-passion-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Assignment Queue
          </h3>
          <span className="px-3 py-1 rounded-full bg-passion-100 text-passion-700 text-sm font-semibold">
            {queueItems.length} waiting
          </span>
        </div>

        {queueItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-neutral-400 mb-3">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-neutral-500 font-medium">No chats in queue</p>
            <p className="text-neutral-400 text-sm mt-1">
              You'll see new assignments here
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin">
            {queueItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'p-4 rounded-xl border-2 transition-smooth',
                  'bg-white/50 hover:bg-white/80',
                  getPriorityColor(item.priority)
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-bold uppercase flex items-center gap-1',
                        getPriorityColor(item.priority)
                      )}>
                        {getPriorityIcon(item.priority)}
                        {item.priority}
                      </span>
                      <span className="text-xs text-neutral-500">
                        Score: {item.priority_score}
                      </span>
                    </div>
                    <p className="font-semibold text-neutral-900 truncate">
                      {item.realUserName || 'Unknown User'} → {item.fictionalUserName || 'Unknown Profile'}
                    </p>
                    <p className="text-sm text-neutral-600">
                      Tier: <span className="font-semibold">{item.user_tier.toUpperCase()}</span>
                      {item.user_lifetime_value && (
                        <span className="ml-2">
                          • LTV: ${item.user_lifetime_value.toFixed(2)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-600 mb-3">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Waiting: {formatWaitTime(item.entered_queue_at)}
                  </span>
                  {item.attempts > 0 && (
                    <span className="flex items-center gap-1 text-orange-600">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      {item.attempts} attempts
                    </span>
                  )}
                </div>

                {item.required_specializations && item.required_specializations.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-neutral-500 mb-1">Required skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {item.required_specializations.map((spec, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 rounded-full text-xs bg-neutral-200 text-neutral-700"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {onAcceptChat && (
                  <GlassButton
                    variant="passion"
                    size="sm"
                    fullWidth
                    onClick={() => onAcceptChat(item.chat_id)}
                    disabled={isLoading}
                  >
                    Accept Chat
                  </GlassButton>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    );
  }
);

QueueDisplay.displayName = 'QueueDisplay';
