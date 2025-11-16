import React, { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { GlassCard } from '@/lib/components/ui/GlassCard';
import { Modal } from '@/lib/components/ui/Modal';
import { GlassButton } from '@/lib/components/ui/GlassButton';

export interface AvailabilityToggleProps {
  isAvailable: boolean;
  activeChatsCount: number;
  onToggle: (available: boolean) => Promise<void>;
  className?: string;
}

/**
 * AvailabilityToggle Component
 * 
 * Toggle for operators to set their availability status.
 * Validates that operators cannot go offline with active chats.
 * 
 * @param isAvailable - Current availability status
 * @param activeChatsCount - Number of active chats assigned to operator
 * @param onToggle - Callback to toggle availability
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <AvailabilityToggle
 *   isAvailable={isAvailable}
 *   activeChatsCount={activeChatsCount}
 *   onToggle={handleToggleAvailability}
 * />
 * ```
 */
export const AvailabilityToggle = React.forwardRef<HTMLDivElement, AvailabilityToggleProps>(
  (
    {
      isAvailable,
      activeChatsCount,
      onToggle,
      className,
    },
    ref
  ) => {
    const [isToggling, setIsToggling] = useState(false);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleToggle = async () => {
      // Prevent going offline with active chats
      if (isAvailable && activeChatsCount > 0) {
        setShowWarningModal(true);
        return;
      }

      setIsToggling(true);
      setError(null);

      try {
        await onToggle(!isAvailable);
      } catch (err) {
        console.error('Failed to toggle availability:', err);
        setError(err instanceof Error ? err.message : 'Failed to update availability');
      } finally {
        setIsToggling(false);
      }
    };

    return (
      <>
        <GlassCard
          ref={ref}
          variant="elevated"
          className={cn('flex flex-col', className)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-neutral-900 mb-1">
                Availability Status
              </h3>
              <p className="text-sm text-neutral-600">
                {isAvailable ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    You are online and receiving assignments
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-neutral-400 rounded-full" />
                    You are offline and not receiving assignments
                  </span>
                )}
              </p>
              {activeChatsCount > 0 && (
                <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {activeChatsCount} active {activeChatsCount === 1 ? 'chat' : 'chats'}
                </p>
              )}
            </div>

            <button
              onClick={handleToggle}
              disabled={isToggling}
              className={cn(
                'relative inline-flex h-12 w-24 items-center rounded-full transition-smooth',
                'focus:outline-none focus:ring-2 focus:ring-passion-300 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isAvailable ? 'bg-green-500' : 'bg-neutral-300'
              )}
              aria-label={isAvailable ? 'Go offline' : 'Go online'}
            >
              <span
                className={cn(
                  'inline-block h-10 w-10 transform rounded-full bg-white shadow-lg transition-smooth',
                  isAvailable ? 'translate-x-12' : 'translate-x-1'
                )}
              >
                {isToggling ? (
                  <svg
                    className="w-10 h-10 p-2 text-neutral-400 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : isAvailable ? (
                  <svg
                    className="w-10 h-10 p-2 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-10 h-10 p-2 text-neutral-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </span>
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-700 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            </div>
          )}
        </GlassCard>

        {/* Warning Modal */}
        <Modal
          isOpen={showWarningModal}
          onClose={() => setShowWarningModal(false)}
          title="Cannot Go Offline"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-orange-50 border border-orange-200">
              <svg
                className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h4 className="font-semibold text-orange-900 mb-1">
                  Active Chats in Progress
                </h4>
                <p className="text-sm text-orange-700">
                  You currently have {activeChatsCount} active {activeChatsCount === 1 ? 'chat' : 'chats'}.
                  You must close or reassign all active chats before going offline.
                </p>
              </div>
            </div>

            <div className="bg-neutral-50 rounded-lg p-4">
              <h5 className="font-semibold text-neutral-900 mb-2 text-sm">
                To go offline:
              </h5>
              <ul className="space-y-2 text-sm text-neutral-700">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-passion-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Complete and close all active conversations</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-passion-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Or request reassignment from an admin</span>
                </li>
              </ul>
            </div>

            <div className="flex justify-end">
              <GlassButton
                variant="passion"
                onClick={() => setShowWarningModal(false)}
              >
                Got it
              </GlassButton>
            </div>
          </div>
        </Modal>
      </>
    );
  }
);

AvailabilityToggle.displayName = 'AvailabilityToggle';
