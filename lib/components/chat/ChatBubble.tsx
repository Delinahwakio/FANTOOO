import React from 'react';
import { cn } from '@/lib/utils/cn';

export type MessageSenderType = 'real' | 'fictional';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageContentType = 'text' | 'image' | 'voice' | 'video' | 'gif';

export interface ChatBubbleProps {
  content: string;
  senderType: MessageSenderType;
  contentType?: MessageContentType;
  mediaUrl?: string;
  status?: MessageStatus;
  timestamp: string;
  isEdited?: boolean;
  isFreeMessage?: boolean;
  creditsCharged?: number;
  className?: string;
}

/**
 * ChatBubble Component
 * 
 * Displays a single message in a chat interface with sender differentiation.
 * Real user messages appear on the right with passion colors.
 * Fictional user messages appear on the left with luxury colors.
 * 
 * @param content - The message text content
 * @param senderType - 'real' for user messages, 'fictional' for operator messages
 * @param contentType - Type of content (text, image, voice, video, gif)
 * @param mediaUrl - URL for media content
 * @param status - Message delivery status
 * @param timestamp - Message timestamp
 * @param isEdited - Whether the message has been edited
 * @param isFreeMessage - Whether this was a free message
 * @param creditsCharged - Number of credits charged for this message
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <ChatBubble
 *   content="Hello there!"
 *   senderType="real"
 *   status="sent"
 *   timestamp="2024-01-15T10:30:00Z"
 * />
 * ```
 */
export const ChatBubble = React.forwardRef<HTMLDivElement, ChatBubbleProps>(
  (
    {
      content,
      senderType,
      contentType = 'text',
      mediaUrl,
      status = 'sent',
      timestamp,
      isEdited = false,
      isFreeMessage = false,
      creditsCharged = 0,
      className,
    },
    ref
  ) => {
    const isRealUser = senderType === 'real';
    const formattedTime = new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return (
      <div
        ref={ref}
        className={cn(
          'flex w-full mb-4 animate-fade-in',
          isRealUser ? 'justify-end' : 'justify-start',
          className
        )}
      >
        <div
          className={cn(
            'max-w-[70%] rounded-2xl px-4 py-3 transition-smooth',
            isRealUser
              ? 'bg-gradient-passion text-white rounded-br-sm'
              : 'glass-elevated text-neutral-900 rounded-bl-sm'
          )}
        >
          {/* Media Content */}
          {contentType !== 'text' && mediaUrl && (
            <div className="mb-2">
              {contentType === 'image' && (
                <img
                  src={mediaUrl}
                  alt="Shared image"
                  className="rounded-lg max-w-full h-auto"
                  loading="lazy"
                />
              )}
              {contentType === 'video' && (
                <video
                  src={mediaUrl}
                  controls
                  className="rounded-lg max-w-full h-auto"
                />
              )}
              {contentType === 'gif' && (
                <img
                  src={mediaUrl}
                  alt="GIF"
                  className="rounded-lg max-w-full h-auto"
                />
              )}
              {contentType === 'voice' && (
                <audio src={mediaUrl} controls className="w-full" />
              )}
            </div>
          )}

          {/* Text Content */}
          <p className="text-base leading-relaxed break-words whitespace-pre-wrap">
            {content}
          </p>

          {/* Message Metadata */}
          <div
            className={cn(
              'flex items-center gap-2 mt-2 text-xs',
              isRealUser ? 'text-white/80' : 'text-neutral-600'
            )}
          >
            <span>{formattedTime}</span>

            {isEdited && (
              <>
                <span>•</span>
                <span className="italic">Edited</span>
              </>
            )}

            {!isFreeMessage && creditsCharged > 0 && isRealUser && (
              <>
                <span>•</span>
                <span className="font-medium">{creditsCharged} credits</span>
              </>
            )}

            {isFreeMessage && isRealUser && (
              <>
                <span>•</span>
                <span className="text-luxury-300 font-medium">Free</span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ChatBubble.displayName = 'ChatBubble';
