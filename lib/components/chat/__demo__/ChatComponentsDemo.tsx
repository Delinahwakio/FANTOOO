'use client';

import React, { useState, useEffect } from 'react';
import { ChatBubble, MessageList, MessageStatus, TypingIndicator, Message } from '../index';
import { GlassCard } from '@/lib/components/ui/GlassCard';
import { GlassButton } from '@/lib/components/ui/GlassButton';

/**
 * Demo component showcasing all chat components
 */
export function ChatComponentsDemo() {
  const [showTyping, setShowTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      chatId: 'demo-chat',
      senderType: 'fictional',
      content: 'Hey there! How are you doing today? 😊',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      status: 'read',
      isFreeMessage: true,
    },
    {
      id: '2',
      chatId: 'demo-chat',
      senderType: 'real',
      content: "I'm doing great! Thanks for asking. How about you?",
      createdAt: new Date(Date.now() - 3500000).toISOString(),
      status: 'read',
      isFreeMessage: true,
    },
    {
      id: '3',
      chatId: 'demo-chat',
      senderType: 'fictional',
      content: "I'm wonderful! Just thinking about our last conversation. You mentioned you love traveling?",
      createdAt: new Date(Date.now() - 3400000).toISOString(),
      status: 'read',
      isFreeMessage: true,
    },
    {
      id: '4',
      chatId: 'demo-chat',
      senderType: 'real',
      content: 'Yes! I absolutely love exploring new places. My favorite trip was to Japan last year.',
      createdAt: new Date(Date.now() - 3300000).toISOString(),
      status: 'delivered',
      creditsCharged: 1,
    },
    {
      id: '5',
      chatId: 'demo-chat',
      senderType: 'fictional',
      content: 'Oh wow, Japan! That must have been amazing. What was your favorite part?',
      createdAt: new Date(Date.now() - 3200000).toISOString(),
      status: 'delivered',
      creditsCharged: 1,
    },
    {
      id: '6',
      chatId: 'demo-chat',
      senderType: 'real',
      content: 'Definitely Kyoto! The temples were breathtaking, and the food was incredible.',
      createdAt: new Date(Date.now() - 3100000).toISOString(),
      status: 'sent',
      creditsCharged: 2,
    },
  ]);

  const addMessage = (senderType: 'real' | 'fictional', content: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      chatId: 'demo-chat',
      senderType,
      content,
      createdAt: new Date().toISOString(),
      status: 'sending',
      creditsCharged: senderType === 'real' ? 1 : 0,
    };

    setMessages((prev) => [...prev, newMessage]);

    // Simulate status updates
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: 'sent' as const } : msg
        )
      );
    }, 500);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: 'delivered' as const } : msg
        )
      );
    }, 1000);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: 'read' as const } : msg
        )
      );
    }, 1500);
  };

  const simulateTyping = () => {
    setShowTyping(true);
    setTimeout(() => {
      setShowTyping(false);
      addMessage('fictional', 'That sounds absolutely wonderful! I would love to visit Japan someday.');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-passion-50 via-luxury-50 to-trust-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-5xl font-bold text-gradient-passion mb-4">
            Chat Components Demo
          </h1>
          <p className="text-neutral-600 text-lg">
            Real-time chat UI components with virtual scrolling and animations
          </p>
        </div>

        {/* Individual Component Demos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* ChatBubble Demo */}
          <GlassCard variant="elevated">
            <h2 className="font-display text-2xl font-bold mb-4 text-neutral-900">
              ChatBubble Component
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-neutral-600 mb-2">Real User Message:</p>
                <ChatBubble
                  content="Hello! This is a message from a real user."
                  senderType="real"
                  timestamp={new Date().toISOString()}
                  status="sent"
                  creditsCharged={1}
                />
              </div>
              <div>
                <p className="text-sm text-neutral-600 mb-2">Fictional User Message:</p>
                <ChatBubble
                  content="Hi there! This is a response from a fictional profile."
                  senderType="fictional"
                  timestamp={new Date().toISOString()}
                  status="delivered"
                />
              </div>
              <div>
                <p className="text-sm text-neutral-600 mb-2">Free Message:</p>
                <ChatBubble
                  content="This is one of the first 3 free messages!"
                  senderType="real"
                  timestamp={new Date().toISOString()}
                  isFreeMessage
                />
              </div>
              <div>
                <p className="text-sm text-neutral-600 mb-2">Edited Message:</p>
                <ChatBubble
                  content="This message was edited by an admin."
                  senderType="fictional"
                  timestamp={new Date().toISOString()}
                  isEdited
                />
              </div>
            </div>
          </GlassCard>

          {/* MessageStatus Demo */}
          <GlassCard variant="elevated">
            <h2 className="font-display text-2xl font-bold mb-4 text-neutral-900">
              MessageStatus Component
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <MessageStatus status="sending" showText />
                <span className="text-neutral-600">Message is being sent</span>
              </div>
              <div className="flex items-center gap-4">
                <MessageStatus status="sent" showText />
                <span className="text-neutral-600">Message sent to server</span>
              </div>
              <div className="flex items-center gap-4">
                <MessageStatus status="delivered" showText />
                <span className="text-neutral-600">Message delivered to recipient</span>
              </div>
              <div className="flex items-center gap-4">
                <MessageStatus status="read" showText />
                <span className="text-neutral-600">Message read by recipient</span>
              </div>
              <div className="flex items-center gap-4">
                <MessageStatus status="failed" showText />
                <span className="text-neutral-600">Message failed to send</span>
              </div>
            </div>
          </GlassCard>

          {/* TypingIndicator Demo */}
          <GlassCard variant="elevated">
            <h2 className="font-display text-2xl font-bold mb-4 text-neutral-900">
              TypingIndicator Component
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-neutral-600 mb-2">With username:</p>
                <TypingIndicator userName="Sarah" />
              </div>
              <div>
                <p className="text-sm text-neutral-600 mb-2">Without username:</p>
                <TypingIndicator />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Full MessageList Demo */}
        <GlassCard variant="elevated" className="h-[600px] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-bold text-neutral-900">
              MessageList Component
            </h2>
            <div className="flex gap-2">
              <GlassButton
                variant="outline"
                size="sm"
                onClick={() => addMessage('real', 'This is a new message from me!')}
              >
                Add User Message
              </GlassButton>
              <GlassButton
                variant="luxury"
                size="sm"
                onClick={simulateTyping}
              >
                Simulate Response
              </GlassButton>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <MessageList
              messages={messages}
              isTyping={showTyping}
              typingUserName="Sarah"
              showStatus
              autoScroll
            />
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-200">
            <p className="text-sm text-neutral-600">
              <strong>Features:</strong> Virtual scrolling, auto-scroll, typing indicators, 
              message status, and smooth animations.
            </p>
          </div>
        </GlassCard>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard variant="subtle" className="text-center">
            <div className="text-passion-500 mb-3">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="font-display text-xl font-bold mb-2">High Performance</h3>
            <p className="text-neutral-600 text-sm">
              Virtual scrolling handles thousands of messages smoothly
            </p>
          </GlassCard>

          <GlassCard variant="subtle" className="text-center">
            <div className="text-luxury-500 mb-3">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
            </div>
            <h3 className="font-display text-xl font-bold mb-2">Real-Time Updates</h3>
            <p className="text-neutral-600 text-sm">
              Live typing indicators and instant message delivery
            </p>
          </GlassCard>

          <GlassCard variant="subtle" className="text-center">
            <div className="text-trust-500 mb-3">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-display text-xl font-bold mb-2">Status Tracking</h3>
            <p className="text-neutral-600 text-sm">
              Complete message lifecycle from sending to read
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
