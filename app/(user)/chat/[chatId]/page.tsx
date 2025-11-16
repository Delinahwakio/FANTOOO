'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChatBubble } from '@/lib/components/chat/ChatBubble';
import { MessageInput } from '@/lib/components/chat/MessageInput';
import { TypingIndicator } from '@/lib/components/chat/TypingIndicator';
import { CreditIndicator } from '@/lib/components/chat/CreditIndicator';
import { PaymentModal } from '@/lib/components/shared/PaymentModal';
import { GlassCard } from '@/lib/components/ui/GlassCard';
import { LoadingSpinner } from '@/lib/components/ui/LoadingSpinner';
import { useMessages } from '@/lib/hooks/useMessages';
import { useCredits } from '@/lib/hooks/useCredits';
import { useRealtimeMessages } from '@/lib/hooks/useRealtime';
import { useSendMessage } from '@/lib/hooks/useSendMessage';
import { useToast } from '@/lib/hooks/useToast';
import { calculateMessageCost } from '@/lib/utils/credits';
import type { Chat, Message } from '@/lib/types/chat';
import type { FictionalUser } from '@/lib/types/user';
import type { UserTier } from '@/lib/types/user';
import type { CreditPackage } from '@/lib/components/shared/PaymentModal';
import { cn } from '@/lib/utils/cn';

interface ChatData {
  chat: Chat & {
    fictional_user: FictionalUser;
  };
  userCredits: number;
  userTier: UserTier;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;
  const { error: showErrorToast, success: showSuccessToast } = useToast();

  // State
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Hooks
  const { messages, loading: messagesLoading, addMessage, updateMessage } = useMessages({ chatId });
  const { credits, refreshCredits } = useCredits();
  const { sendMessage, isLoading: isSending, error: sendError, isInsufficientCredits } = useSendMessage();

  // Real-time subscriptions
  const { isConnected, sendTypingIndicator } = useRealtimeMessages({
    chatId,
    onNewMessage: (message) => {
      // Remove optimistic message if it exists
      setOptimisticMessages((prev) => 
        prev.filter((m) => m.id !== message.id)
      );
      addMessage(message);
      scrollToBottom();
    },
    onMessageUpdate: (message) => {
      updateMessage(message.id, message);
    },
    onTypingStart: () => {
      setIsTyping(true);
    },
    onTypingEnd: () => {
      setIsTyping(false);
    },
  });

  // Fetch chat data
  useEffect(() => {
    const fetchChatData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/chats/${chatId}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load chat');
        }

        const result = await response.json();
        setChatData(result.data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load chat';
        setError(errorMessage);
        showErrorToast(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();
  }, [chatId, showErrorToast]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, optimisticMessages]);

  // Handle send error
  useEffect(() => {
    if (sendError) {
      if (isInsufficientCredits) {
        setShowPaymentModal(true);
        showErrorToast('Insufficient credits. Please purchase more to continue.');
      } else {
        showErrorToast(sendError.message);
      }
    }
  }, [sendError, isInsufficientCredits, showErrorToast]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content: string) => {
    if (!chatData) return;

    // Create optimistic message
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      chat_id: chatId,
      sender_type: 'real',
      content,
      content_type: 'text',
      is_free_message: chatData.chat.message_count < 3,
      credits_charged: calculateMessageCost(
        chatData.chat.message_count + 1,
        chatData.userTier,
        chatData.chat.fictional_user.is_featured
      ),
      is_edited: false,
      edit_count: 0,
      status: 'sending',
      is_flagged: false,
      created_at: new Date().toISOString(),
    };

    // Add optimistic message
    setOptimisticMessages((prev) => [...prev, optimisticMessage]);

    // Send message
    const result = await sendMessage({
      chatId,
      content,
      contentType: 'text',
    });

    if (result) {
      // Remove optimistic message
      setOptimisticMessages((prev) => 
        prev.filter((m) => m.id !== optimisticMessage.id)
      );

      // Refresh credits
      await refreshCredits();

      // Update chat data
      setChatData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          chat: {
            ...prev.chat,
            message_count: prev.chat.message_count + 1,
          },
        };
      });
    } else {
      // Mark optimistic message as failed
      setOptimisticMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticMessage.id
            ? { ...m, status: 'failed' as const }
            : m
        )
      );
    }
  };

  const calculateNextMessageCost = () => {
    if (!chatData) return 0;
    return calculateMessageCost(
      chatData.chat.message_count + 1,
      chatData.userTier,
      chatData.chat.fictional_user.is_featured
    );
  };

  // Mock credit packages (in production, fetch from API)
  const creditPackages: CreditPackage[] = [
    {
      id: '1',
      name: 'Starter',
      credits: 10,
      price: 100,
      currency: 'KES',
      bonusCredits: 0,
      isFeatured: false,
    },
    {
      id: '2',
      name: 'Popular',
      credits: 50,
      price: 450,
      currency: 'KES',
      badge: 'POPULAR',
      discountPercentage: 10,
      bonusCredits: 5,
      isFeatured: true,
    },
    {
      id: '3',
      name: 'Value',
      credits: 100,
      price: 800,
      currency: 'KES',
      badge: 'BEST VALUE',
      discountPercentage: 20,
      bonusCredits: 15,
      isFeatured: false,
    },
    {
      id: '4',
      name: 'Premium',
      credits: 500,
      price: 3500,
      currency: 'KES',
      discountPercentage: 30,
      bonusCredits: 100,
      isFeatured: false,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !chatData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassCard className="max-w-md w-full text-center p-8">
          <div className="text-passion-600 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
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
          </div>
          <h2 className="font-display text-2xl font-bold text-neutral-900 mb-2">
            Chat Not Found
          </h2>
          <p className="text-neutral-600 mb-6">
            {error || 'This chat does not exist or you do not have access to it.'}
          </p>
          <button
            onClick={() => router.push('/discover')}
            className="bg-gradient-passion text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-smooth shadow-passion"
          >
            Browse Profiles
          </button>
        </GlassCard>
      </div>
    );
  }

  const { chat, userTier } = chatData;
  const fictionalUser = chat.fictional_user;
  const allMessages = [...messages, ...optimisticMessages];

  return (
    <div className="min-h-screen bg-gradient-to-br from-passion-50 via-white to-luxury-50">
      {/* Header */}
      <div className="glass-elevated border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-smooth"
              aria-label="Go back"
            >
              <svg
                className="w-6 h-6 text-neutral-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            {/* Profile Picture */}
            <div className="relative">
              <img
                src={fictionalUser.profile_pictures[0]}
                alt={fictionalUser.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-md"
              />
              {fictionalUser.is_featured && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-luxury-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="font-display text-xl font-bold text-neutral-900">
                {fictionalUser.name}
              </h1>
              <p className="text-sm text-neutral-600">
                {fictionalUser.age} • {fictionalUser.location}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Credit Indicator */}
        <CreditIndicator
          credits={credits}
          nextMessageCost={calculateNextMessageCost()}
          onPurchaseClick={() => setShowPaymentModal(true)}
        />

        {/* Messages Container */}
        <GlassCard className="min-h-[500px] max-h-[600px] overflow-y-auto p-6">
          <div ref={messagesContainerRef} className="space-y-2">
            {messagesLoading && allMessages.length === 0 ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : allMessages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-neutral-500 mb-4">
                  No messages yet. Start the conversation!
                </p>
                <p className="text-sm text-luxury-600 font-semibold">
                  Your first 3 messages are free! 🎉
                </p>
              </div>
            ) : (
              <>
                {allMessages.map((message) => (
                  <ChatBubble
                    key={message.id}
                    content={message.content}
                    senderType={message.sender_type}
                    contentType={message.content_type}
                    mediaUrl={message.media_url}
                    status={message.status}
                    timestamp={message.created_at}
                    isEdited={message.is_edited}
                    isFreeMessage={message.is_free_message}
                    creditsCharged={message.credits_charged}
                  />
                ))}
                {isTyping && <TypingIndicator userName={fictionalUser.name} />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </GlassCard>

        {/* Message Input */}
        <MessageInput
          onSend={handleSendMessage}
          disabled={isSending || chat.status !== 'active'}
          isLoading={isSending}
          placeholder={
            chat.status !== 'active'
              ? 'This chat is closed'
              : 'Type a message...'
          }
          maxLength={1000}
          autoFocus
          onTypingStart={() => sendTypingIndicator(true)}
          onTypingEnd={() => sendTypingIndicator(false)}
        />

        {/* Chat Status */}
        {chat.status !== 'active' && (
          <div className="glass-elevated rounded-xl p-4 text-center">
            <p className="text-neutral-600">
              This chat is {chat.status}.
              {chat.close_reason && ` Reason: ${chat.close_reason}`}
            </p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        packages={creditPackages}
        onPurchaseComplete={async (credits) => {
          showSuccessToast(`Successfully purchased ${credits} credits!`);
          await refreshCredits();
        }}
        onPurchaseError={(error) => {
          showErrorToast(`Payment failed: ${error.message}`);
        }}
      />
    </div>
  );
}
