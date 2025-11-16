import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';

export interface MessageInputProps {
  onSend: (content: string) => void | Promise<void>;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  onTypingStart?: () => void;
  onTypingEnd?: () => void;
  showCharacterCount?: boolean;
  autoFocus?: boolean;
}

/**
 * MessageInput Component
 * 
 * A text input component for composing and sending chat messages.
 * Features character limit, typing indicators, and auto-resize.
 * 
 * @param onSend - Callback when message is sent
 * @param placeholder - Placeholder text
 * @param maxLength - Maximum character limit (default: 1000)
 * @param disabled - Disable input
 * @param isLoading - Show loading state
 * @param className - Additional CSS classes
 * @param onTypingStart - Callback when user starts typing
 * @param onTypingEnd - Callback when user stops typing
 * @param showCharacterCount - Show character count (default: true)
 * @param autoFocus - Auto-focus input on mount
 * 
 * @example
 * ```tsx
 * <MessageInput
 *   onSend={handleSendMessage}
 *   placeholder="Type a message..."
 *   maxLength={1000}
 * />
 * ```
 */
export const MessageInput = React.forwardRef<HTMLTextAreaElement, MessageInputProps>(
  (
    {
      onSend,
      placeholder = 'Type a message...',
      maxLength = 1000,
      disabled = false,
      isLoading = false,
      className,
      onTypingStart,
      onTypingEnd,
      showCharacterCount = true,
      autoFocus = false,
    },
    ref
  ) => {
    const [content, setContent] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Merge refs
    useEffect(() => {
      if (ref && textareaRef.current) {
        if (typeof ref === 'function') {
          ref(textareaRef.current);
        } else {
          ref.current = textareaRef.current;
        }
      }
    }, [ref]);

    // Auto-resize textarea based on content
    useEffect(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
      }
    }, [content]);

    // Handle typing indicators
    useEffect(() => {
      if (content.length > 0 && !isTyping) {
        setIsTyping(true);
        onTypingStart?.();
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to detect when user stops typing
      if (content.length > 0) {
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          onTypingEnd?.();
        }, 2000); // 2 seconds of inactivity
      } else {
        setIsTyping(false);
        onTypingEnd?.();
      }

      return () => {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      };
    }, [content, isTyping, onTypingStart, onTypingEnd]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      if (newContent.length <= maxLength) {
        setContent(newContent);
      }
    };

    const handleSend = async () => {
      const trimmedContent = content.trim();
      if (!trimmedContent || disabled || isLoading) return;

      try {
        await onSend(trimmedContent);
        setContent('');
        setIsTyping(false);
        onTypingEnd?.();
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Send on Enter (without Shift)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    const remainingChars = maxLength - content.length;
    const isNearLimit = remainingChars < 100;
    const isAtLimit = remainingChars === 0;

    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            autoFocus={autoFocus}
            rows={1}
            className={cn(
              'glass w-full px-4 py-3 pr-12 rounded-xl resize-none',
              'text-neutral-900 placeholder:text-neutral-400',
              'focus-ring transition-smooth',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'scrollbar-thin',
              isAtLimit && 'border-2 border-passion-500'
            )}
            style={{
              minHeight: '48px',
              maxHeight: '200px',
            }}
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!content.trim() || disabled || isLoading}
            className={cn(
              'absolute right-2 bottom-2 p-2 rounded-lg',
              'transition-smooth',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              content.trim() && !disabled && !isLoading
                ? 'bg-gradient-passion text-white hover:scale-110 shadow-passion'
                : 'bg-neutral-200 text-neutral-400'
            )}
            aria-label="Send message"
          >
            {isLoading ? (
              <svg
                className="w-5 h-5 animate-spin"
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
            ) : (
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
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Character Count */}
        {showCharacterCount && (
          <div className="flex justify-between items-center px-2 text-xs">
            <span className="text-neutral-500">
              Press Enter to send, Shift+Enter for new line
            </span>
            <span
              className={cn(
                'font-medium transition-colors',
                isAtLimit
                  ? 'text-passion-600'
                  : isNearLimit
                  ? 'text-luxury-600'
                  : 'text-neutral-500'
              )}
            >
              {content.length} / {maxLength}
            </span>
          </div>
        )}
      </div>
    );
  }
);

MessageInput.displayName = 'MessageInput';
