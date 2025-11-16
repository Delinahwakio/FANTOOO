import React from 'react';
import { cn } from '@/lib/utils/cn';

export type MessageStatusType = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface MessageStatusProps {
  status: MessageStatusType;
  className?: string;
  showText?: boolean;
}

/**
 * MessageStatus Component
 * 
 * Displays the delivery status of a message with visual indicators.
 * Shows different icons and colors based on the message status.
 * 
 * @param status - The current message status
 * @param className - Additional CSS classes
 * @param showText - Whether to show status text alongside icon
 * 
 * @example
 * ```tsx
 * <MessageStatus status="sent" showText />
 * <MessageStatus status="read" />
 * ```
 */
export const MessageStatus = React.forwardRef<HTMLDivElement, MessageStatusProps>(
  ({ status, className, showText = false }, ref) => {
    const statusConfig: Record<
      MessageStatusType,
      { icon: React.ReactNode; text: string; color: string }
    > = {
      sending: {
        icon: (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
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
        ),
        text: 'Sending',
        color: 'text-neutral-400',
      },
      sent: {
        icon: (
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ),
        text: 'Sent',
        color: 'text-neutral-500',
      },
      delivered: {
        icon: (
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7M5 13l4 4L19 7"
            />
          </svg>
        ),
        text: 'Delivered',
        color: 'text-trust-500',
      },
      read: {
        icon: (
          <svg
            className="h-4 w-4"
            fill="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7M5 13l4 4L19 7"
            />
          </svg>
        ),
        text: 'Read',
        color: 'text-trust-600',
      },
      failed: {
        icon: (
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        ),
        text: 'Failed',
        color: 'text-passion-500',
      },
    };

    const config = statusConfig[status];

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-1.5 transition-smooth',
          config.color,
          className
        )}
        title={config.text}
      >
        {config.icon}
        {showText && <span className="text-xs font-medium">{config.text}</span>}
      </div>
    );
  }
);

MessageStatus.displayName = 'MessageStatus';
