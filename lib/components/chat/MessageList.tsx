import React, { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils/cn';
import { ChatBubble, MessageSenderType, MessageStatus as MessageStatusType, MessageContentType } from './ChatBubble';
import { MessageStatus } from './MessageStatus';
import { TypingIndicator } from './TypingIndicator';

export interface Message {
  id: string;
  chatId: string;
  senderType: MessageSenderType;
  content: string;
  contentType?: MessageContentType;
  mediaUrl?: string;
  status?: MessageStatusType;
  createdAt: string;
  isEdited?: boolean;
  isFreeMessage?: boolean;
  creditsCharged?: number;
}

export interface MessageListProps {
  messages: Message[];
  isTyping?: boolean;
  typingUserName?: string;
  className?: string;
  onScrollToTop?: () => void;
  autoScroll?: boolean;
  showStatus?: boolean;
}

/**
 * MessageList Component
 * 
 * Displays a list of chat messages with virtual scrolling for performance.
 * Automatically scrolls to the bottom when new messages arrive.
 * Supports infinite scroll loading when scrolling to the top.
 * 
 * @param messages - Array of message objects to display
 * @param isTyping - Whether to show typing indicator
 * @param typingUserName - Name of the person typing
 * @param className - Additional CSS classes
 * @param onScrollToTop - Callback when user scrolls to top (for loading more messages)
 * @param autoScroll - Whether to auto-scroll to bottom on new messages (default: true)
 * @param showStatus - Whether to show message status indicators (default: false)
 * 
 * @example
 * ```tsx
 * <MessageList
 *   messages={messages}
 *   isTyping={isOperatorTyping}
 *   typingUserName="Sarah"
 *   onScrollToTop={loadMoreMessages}
 * />
 * ```
 */
export const MessageList = React.forwardRef<HTMLDivElement, MessageListProps>(
  (
    {
      messages,
      isTyping = false,
      typingUserName,
      className,
      onScrollToTop,
      autoScroll = true,
      showStatus = false,
    },
    ref
  ) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const lastMessageRef = useRef<HTMLDivElement>(null);
    const prevMessagesLengthRef = useRef(messages.length);

    // Virtual scrolling for performance with large message lists
    const virtualizer = useVirtualizer({
      count: messages.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 80, // Estimated height of each message
      overscan: 5, // Number of items to render outside visible area
    });

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
      if (autoScroll && messages.length > prevMessagesLengthRef.current) {
        lastMessageRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
      prevMessagesLengthRef.current = messages.length;
    }, [messages.length, autoScroll]);

    // Scroll to bottom on initial load
    useEffect(() => {
      if (messages.length > 0 && lastMessageRef.current) {
        lastMessageRef.current.scrollIntoView({ behavior: 'auto' });
      }
    }, []);

    // Handle scroll to top for loading more messages
    useEffect(() => {
      const element = parentRef.current;
      if (!element || !onScrollToTop) return;

      const handleScroll = () => {
        if (element.scrollTop === 0) {
          onScrollToTop();
        }
      };

      element.addEventListener('scroll', handleScroll);
      return () => element.removeEventListener('scroll', handleScroll);
    }, [onScrollToTop]);

    // If there are few messages, use simple rendering without virtualization
    const useSimpleRendering = messages.length < 50;

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col h-full overflow-hidden',
          className
        )}
      >
        <div
          ref={parentRef}
          className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin"
        >
          {useSimpleRendering ? (
            // Simple rendering for small lists
            <div className="space-y-2">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  ref={index === messages.length - 1 ? lastMessageRef : undefined}
                  className="flex flex-col"
                >
                  <ChatBubble
                    content={message.content}
                    senderType={message.senderType}
                    contentType={message.contentType}
                    mediaUrl={message.mediaUrl}
                    status={message.status}
                    timestamp={message.createdAt}
                    isEdited={message.isEdited}
                    isFreeMessage={message.isFreeMessage}
                    creditsCharged={message.creditsCharged}
                  />
                  {showStatus && message.status && message.senderType === 'real' && (
                    <div className="flex justify-end px-2 -mt-2 mb-2">
                      <MessageStatus status={message.status} />
                    </div>
                  )}
                </div>
              ))}
              {isTyping && <TypingIndicator userName={typingUserName} />}
            </div>
          ) : (
            // Virtual scrolling for large lists
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const message = messages[virtualItem.index];
                const isLastMessage = virtualItem.index === messages.length - 1;

                return (
                  <div
                    key={virtualItem.key}
                    ref={isLastMessage ? lastMessageRef : undefined}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <div className="flex flex-col">
                      <ChatBubble
                        content={message.content}
                        senderType={message.senderType}
                        contentType={message.contentType}
                        mediaUrl={message.mediaUrl}
                        status={message.status}
                        timestamp={message.createdAt}
                        isEdited={message.isEdited}
                        isFreeMessage={message.isFreeMessage}
                        creditsCharged={message.creditsCharged}
                      />
                      {showStatus && message.status && message.senderType === 'real' && (
                        <div className="flex justify-end px-2 -mt-2 mb-2">
                          <MessageStatus status={message.status} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {isTyping && (
                <div
                  style={{
                    position: 'absolute',
                    top: virtualizer.getTotalSize(),
                    left: 0,
                    width: '100%',
                  }}
                >
                  <TypingIndicator userName={typingUserName} />
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {messages.length === 0 && !isTyping && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-neutral-400 mb-2">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <p className="text-neutral-500 font-medium">No messages yet</p>
                <p className="text-neutral-400 text-sm mt-1">
                  Start the conversation!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

MessageList.displayName = 'MessageList';
