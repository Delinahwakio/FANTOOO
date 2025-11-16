import React from 'react';
import { cn } from '@/lib/utils/cn';
import { formatCredits } from '@/lib/utils/credits';

export interface CreditIndicatorProps {
  credits: number;
  nextMessageCost: number;
  className?: string;
  onPurchaseClick?: () => void;
}

/**
 * CreditIndicator Component
 * 
 * Displays the user's current credit balance and the cost of the next message.
 * Shows a warning when credits are low and provides a purchase button.
 * 
 * @param credits - Current credit balance
 * @param nextMessageCost - Cost of the next message
 * @param className - Additional CSS classes
 * @param onPurchaseClick - Callback when purchase button is clicked
 * 
 * @example
 * ```tsx
 * <CreditIndicator
 *   credits={50}
 *   nextMessageCost={2}
 *   onPurchaseClick={() => setShowPayment(true)}
 * />
 * ```
 */
export const CreditIndicator = React.forwardRef<HTMLDivElement, CreditIndicatorProps>(
  ({ credits, nextMessageCost, className, onPurchaseClick }, ref) => {
    const isLow = credits < 10;
    const isInsufficient = credits < nextMessageCost;
    const isFree = nextMessageCost === 0;

    return (
      <div
        ref={ref}
        className={cn(
          'glass-elevated rounded-xl p-4 transition-smooth',
          isInsufficient && 'border-2 border-passion-500',
          className
        )}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Credit Balance */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full',
                isInsufficient
                  ? 'bg-passion-100'
                  : isLow
                  ? 'bg-luxury-100'
                  : 'bg-trust-100'
              )}
            >
              <svg
                className={cn(
                  'w-5 h-5',
                  isInsufficient
                    ? 'text-passion-600'
                    : isLow
                    ? 'text-luxury-600'
                    : 'text-trust-600'
                )}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span
                  className={cn(
                    'text-2xl font-bold',
                    isInsufficient
                      ? 'text-passion-600'
                      : isLow
                      ? 'text-luxury-600'
                      : 'text-neutral-900'
                  )}
                >
                  {credits}
                </span>
                <span className="text-sm text-neutral-600">
                  {credits === 1 ? 'credit' : 'credits'}
                </span>
              </div>

              {/* Next Message Cost */}
              <div className="text-xs text-neutral-500 mt-0.5">
                {isFree ? (
                  <span className="text-luxury-600 font-semibold">
                    Next message is free!
                  </span>
                ) : (
                  <>
                    Next message: <span className="font-semibold">{formatCredits(nextMessageCost)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Purchase Button */}
          {(isLow || isInsufficient) && onPurchaseClick && (
            <button
              onClick={onPurchaseClick}
              className={cn(
                'px-4 py-2 rounded-lg font-semibold text-sm transition-smooth',
                'hover:scale-105 shadow-md',
                isInsufficient
                  ? 'bg-gradient-passion text-white shadow-passion'
                  : 'bg-gradient-luxury text-white shadow-luxury'
              )}
            >
              {isInsufficient ? 'Buy Credits' : 'Top Up'}
            </button>
          )}
        </div>

        {/* Warning Message */}
        {isInsufficient && (
          <div className="mt-3 pt-3 border-t border-passion-200">
            <p className="text-sm text-passion-700 font-medium">
              ⚠️ Insufficient credits to send the next message. Purchase more to continue chatting.
            </p>
          </div>
        )}
      </div>
    );
  }
);

CreditIndicator.displayName = 'CreditIndicator';
