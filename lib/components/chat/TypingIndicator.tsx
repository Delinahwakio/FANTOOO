import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface TypingIndicatorProps {
  userName?: string;
  className?: string;
}

/**
 * TypingIndicator Component
 * 
 * Displays an animated typing indicator to show when someone is typing.
 * Features three animated dots with a smooth pulsing animation.
 * 
 * @param userName - Optional name of the person typing
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <TypingIndicator userName="Sarah" />
 * <TypingIndicator />
 * ```
 */
export const TypingIndicator = React.forwardRef<HTMLDivElement, TypingIndicatorProps>(
  ({ userName, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-3 mb-4 animate-fade-in',
          className
        )}
      >
        <div className="glass-elevated rounded-2xl rounded-bl-sm px-4 py-3 max-w-[70%]">
          <div className="flex items-center gap-2">
            {userName && (
              <span className="text-sm text-neutral-600 font-medium mr-1">
                {userName} is typing
              </span>
            )}
            <div className="flex items-center gap-1">
              <span
                className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                style={{ animationDelay: '0ms', animationDuration: '1.4s' }}
              />
              <span
                className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                style={{ animationDelay: '200ms', animationDuration: '1.4s' }}
              />
              <span
                className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"
                style={{ animationDelay: '400ms', animationDuration: '1.4s' }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

TypingIndicator.displayName = 'TypingIndicator';
