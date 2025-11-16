import React from 'react';
import { cn } from '@/lib/utils/cn';
import { formatCredits, creditsToKES } from '@/lib/utils/credits';

export interface CreditIndicatorProps {
  credits: number;
  messageCost?: number;
  showKES?: boolean;
  showWarning?: boolean;
  warningThreshold?: number;
  onPurchaseClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'detailed';
}

/**
 * CreditIndicator Component
 * 
 * Displays the user's remaining credits with optional cost preview and purchase button.
 * Shows warnings when credits are low.
 * 
 * @param credits - Current credit balance
 * @param messageCost - Cost of the next message (optional)
 * @param showKES - Show KES equivalent (default: false)
 * @param showWarning - Show warning when credits are low (default: true)
 * @param warningThreshold - Credit threshold for warning (default: 10)
 * @param onPurchaseClick - Callback when purchase button is clicked
 * @param className - Additional CSS classes
 * @param size - Size variant ('sm', 'md', 'lg')
 * @param variant - Display variant ('default', 'compact', 'detailed')
 * 
 * @example
 * ```tsx
 * <CreditIndicator
 *   credits={50}
 *   messageCost={2}
 *   onPurchaseClick={() => router.push('/credits')}
 * />
 * ```
 */
export const CreditIndicator = React.forwardRef<HTMLDivElement, CreditIndicatorProps>(
  (
    {
      credits,
      messageCost,
      showKES = false,
      showWarning = true,
      warningThreshold = 10,
      onPurchaseClick,
      className,
      size = 'md',
      variant = 'default',
    },
    ref
  ) => {
    const isLow = showWarning && credits <= warningThreshold;
    const isInsufficient = messageCost !== undefined && credits < messageCost;
    const kesValue = creditsToKES(credits);

    const sizeClasses = {
      sm: 'text-xs px-2 py-1',
      md: 'text-sm px-3 py-2',
      lg: 'text-base px-4 py-3',
    };

    const iconSizes = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };

    // Compact variant - just the number
    if (variant === 'compact') {
      return (
        <div
          ref={ref}
          className={cn(
            'inline-flex items-center gap-1.5 font-semibold',
            isInsufficient
              ? 'text-passion-600'
              : isLow
              ? 'text-luxury-600'
              : 'text-trust-600',
            className
          )}
        >
          <svg
            className={cn(iconSizes[size])}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{credits}</span>
        </div>
      );
    }

    // Detailed variant - full breakdown
    if (variant === 'detailed') {
      return (
        <div
          ref={ref}
          className={cn(
            'glass-elevated rounded-xl p-4',
            className
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'p-2 rounded-lg',
                  isInsufficient
                    ? 'bg-passion-100 text-passion-600'
                    : isLow
                    ? 'bg-luxury-100 text-luxury-600'
                    : 'bg-trust-100 text-trust-600'
                )}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <div className="text-xs text-neutral-600 font-medium">
                  Available Credits
                </div>
                <div className="text-2xl font-bold text-neutral-900">
                  {credits}
                </div>
              </div>
            </div>

            {onPurchaseClick && (
              <button
                onClick={onPurchaseClick}
                className="px-3 py-1.5 bg-gradient-passion text-white text-sm font-semibold rounded-lg hover:scale-105 transition-smooth shadow-passion"
              >
                Buy More
              </button>
            )}
          </div>

          {showKES && (
            <div className="text-xs text-neutral-600 mb-2">
              ≈ {kesValue.toLocaleString()} KES
            </div>
          )}

          {messageCost !== undefined && (
            <div className="pt-3 border-t border-neutral-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Next message cost:</span>
                <span
                  className={cn(
                    'font-semibold',
                    isInsufficient ? 'text-passion-600' : 'text-neutral-900'
                  )}
                >
                  {formatCredits(messageCost)}
                </span>
              </div>
              {isInsufficient && (
                <div className="mt-2 text-xs text-passion-600 font-medium">
                  Insufficient credits. Please purchase more to continue.
                </div>
              )}
            </div>
          )}

          {isLow && !isInsufficient && (
            <div className="mt-3 flex items-start gap-2 p-2 bg-luxury-50 rounded-lg">
              <svg
                className="w-4 h-4 text-luxury-600 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="text-xs text-luxury-700">
                Your credits are running low. Consider purchasing more to avoid interruptions.
              </div>
            </div>
          )}
        </div>
      );
    }

    // Default variant - balanced display
    return (
      <div
        ref={ref}
        className={cn(
          'glass rounded-xl flex items-center justify-between',
          sizeClasses[size],
          isInsufficient && 'border-2 border-passion-500',
          className
        )}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex items-center gap-1.5 font-semibold',
              isInsufficient
                ? 'text-passion-600'
                : isLow
                ? 'text-luxury-600'
                : 'text-trust-600'
            )}
          >
            <svg
              className={cn(iconSizes[size])}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{credits}</span>
          </div>

          {showKES && (
            <span className="text-neutral-500 text-xs">
              ({kesValue} KES)
            </span>
          )}

          {messageCost !== undefined && (
            <>
              <span className="text-neutral-400">•</span>
              <span className="text-neutral-600 text-xs">
                Next: {messageCost}
              </span>
            </>
          )}
        </div>

        {onPurchaseClick && (isLow || isInsufficient) && (
          <button
            onClick={onPurchaseClick}
            className={cn(
              'ml-3 px-2 py-1 rounded-lg text-xs font-semibold transition-smooth',
              isInsufficient
                ? 'bg-passion-500 text-white hover:bg-passion-600'
                : 'bg-luxury-500 text-white hover:bg-luxury-600'
            )}
          >
            {isInsufficient ? 'Buy Now' : 'Top Up'}
          </button>
        )}
      </div>
    );
  }
);

CreditIndicator.displayName = 'CreditIndicator';
