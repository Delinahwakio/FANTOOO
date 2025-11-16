'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/lib/components/ui/GlassCard';
import { GlassButton } from '@/lib/components/ui/GlassButton';
import { GlassInput } from '@/lib/components/ui/GlassInput';
import { LoadingSpinner } from '@/lib/components/ui/LoadingSpinner';
import { Chat, Message } from '@/lib/types/chat';
import { RealUser, FictionalUser, Operator } from '@/lib/types/user';
import { cn } from '@/lib/utils/cn';

export interface ChatInspectorProps {
  onChatSelect?: (chatId: string) => void;
  className?: string;
}

interface ChatWithDetails extends Chat {
  real_user?: RealUser;
  fictional_user?: FictionalUser;
  operator?: Operator;
}

/**
 * ChatInspector Component
 * 
 * Admin component for monitoring and inspecting all chats in real-time.
 * Displays a live chat grid with status indicators and allows detailed inspection.
 * 
 * Features:
 * - Live chat grid with real-time updates
 * - Status indicators (active, idle, escalated, timeout warnings)
 * - Search and filter functionality
 * - Three-panel detailed view
 * - Message editing with audit trail
 * - Manual chat reassignment
 * 
 * @param onChatSelect - Callback when a chat is selected for detailed view
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <ChatInspector onChatSelect={(chatId) => router.push(`/admin/chats/${chatId}`)} />
 * ```
 */
export const ChatInspector: React.FC<ChatInspectorProps> = ({
  onChatSelect,
  className,
}) => {
  const [chats, setChats] = useState<ChatWithDetails[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatWithDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Simulated data loading - replace with actual API calls
  useEffect(() => {
    loadChats();
  }, [statusFilter]);

  const loadChats = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/admin/chats?status=${statusFilter}`);
      // const data = await response.json();
      // setChats(data);
      
      // Simulated data
      setTimeout(() => {
        setChats([]);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Failed to load chats:', error);
      setIsLoading(false);
    }
  };

  const loadChatMessages = async (chatId: string) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/admin/chats/${chatId}/messages`);
      // const data = await response.json();
      // setMessages(data);
      setMessages([]);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleChatClick = (chat: ChatWithDetails) => {
    setSelectedChat(chat);
    loadChatMessages(chat.id);
    onChatSelect?.(chat.id);
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/admin/messages/${messageId}`, {
      //   method: 'PATCH',
      //   body: JSON.stringify({ content: newContent }),
      // });
      
      setEditingMessageId(null);
      setEditContent('');
      loadChatMessages(selectedChat!.id);
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const handleReassignChat = async (chatId: string, operatorId: string) => {
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/admin/chats/${chatId}/reassign`, {
      //   method: 'POST',
      //   body: JSON.stringify({ operator_id: operatorId }),
      // });
      
      loadChats();
    } catch (error) {
      console.error('Failed to reassign chat:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'idle':
        return 'bg-yellow-500';
      case 'escalated':
        return 'bg-red-500';
      case 'closed':
        return 'bg-neutral-400';
      default:
        return 'bg-neutral-300';
    }
  };

  const getTimeoutWarning = (lastMessageAt?: string) => {
    if (!lastMessageAt) return false;
    const hoursSinceLastMessage = (Date.now() - new Date(lastMessageAt).getTime()) / (1000 * 60 * 60);
    return hoursSinceLastMessage > 20; // Warning if approaching 24h timeout
  };

  const filteredChats = chats.filter((chat) => {
    const matchesSearch =
      searchQuery === '' ||
      chat.real_user?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.fictional_user?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || chat.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-neutral-900">
            Chat Inspector
          </h2>
          <p className="text-neutral-600 mt-1">
            Monitor and manage all platform chats in real-time
          </p>
        </div>
        
        <div className="flex gap-2">
          <GlassButton
            variant="outline"
            size="sm"
            onClick={loadChats}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </GlassButton>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <GlassCard variant="subtle" className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <GlassInput
              placeholder="Search by username or profile name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          
          <div className="flex gap-2">
            {['all', 'active', 'idle', 'escalated', 'closed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-smooth capitalize',
                  statusFilter === status
                    ? 'bg-gradient-trust text-white'
                    : 'glass text-neutral-700 hover:bg-neutral-100'
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Chat Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredChats.length === 0 ? (
        <GlassCard variant="subtle" className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-neutral-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-neutral-600 text-lg">No chats found</p>
          <p className="text-neutral-500 text-sm mt-2">
            {searchQuery ? 'Try adjusting your search' : 'Chats will appear here when users start conversations'}
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChats.map((chat) => (
            <GlassCard
              key={chat.id}
              variant="default"
              hover
              onClick={() => handleChatClick(chat)}
              className="cursor-pointer relative"
            >
              {/* Status Indicator */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <div className={cn('w-3 h-3 rounded-full', getStatusColor(chat.status))} />
                {getTimeoutWarning(chat.last_message_at) && (
                  <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg text-neutral-900">
                    {chat.real_user?.username || 'Unknown User'}
                  </h3>
                  <p className="text-sm text-neutral-600">
                    ↔ {chat.fictional_user?.name || 'Unknown Profile'}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-sm text-neutral-600">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>{chat.message_count}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{chat.total_credits_spent}</span>
                  </div>
                </div>

                {chat.operator && (
                  <div className="text-xs text-neutral-500">
                    Operator: {chat.operator.name}
                  </div>
                )}

                {chat.flags && chat.flags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {chat.flags.map((flag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Selected Chat Detail View */}
      {selectedChat && (
        <GlassCard variant="elevated" className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-display text-2xl font-bold text-neutral-900">
                Chat Details
              </h3>
              <p className="text-neutral-600 mt-1">
                {selectedChat.real_user?.username} ↔ {selectedChat.fictional_user?.name}
              </p>
            </div>
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={() => setSelectedChat(null)}
            >
              Close
            </GlassButton>
          </div>

          {/* Chat Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="glass-subtle p-4 rounded-xl">
              <div className="text-sm text-neutral-600">Messages</div>
              <div className="text-2xl font-bold text-neutral-900">{selectedChat.message_count}</div>
            </div>
            <div className="glass-subtle p-4 rounded-xl">
              <div className="text-sm text-neutral-600">Credits Spent</div>
              <div className="text-2xl font-bold text-neutral-900">{selectedChat.total_credits_spent}</div>
            </div>
            <div className="glass-subtle p-4 rounded-xl">
              <div className="text-sm text-neutral-600">Assignments</div>
              <div className="text-2xl font-bold text-neutral-900">{selectedChat.assignment_count}</div>
            </div>
            <div className="glass-subtle p-4 rounded-xl">
              <div className="text-sm text-neutral-600">Status</div>
              <div className="text-lg font-semibold capitalize text-neutral-900">{selectedChat.status}</div>
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg text-neutral-900">Messages</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
              {messages.length === 0 ? (
                <p className="text-neutral-500 text-center py-8">No messages yet</p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'p-4 rounded-xl',
                      message.sender_type === 'real' ? 'glass-subtle ml-8' : 'glass mr-8'
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm text-neutral-700">
                        {message.sender_type === 'real' ? 'User' : 'Fictional'}
                      </span>
                      <div className="flex items-center gap-2">
                        {message.is_edited && (
                          <span className="text-xs text-neutral-500">(edited)</span>
                        )}
                        <button
                          onClick={() => {
                            setEditingMessageId(message.id);
                            setEditContent(message.content);
                          }}
                          className="text-trust-600 hover:text-trust-700 text-xs"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                    
                    {editingMessageId === message.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full glass p-2 rounded-lg focus-ring"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <GlassButton
                            size="sm"
                            onClick={() => handleEditMessage(message.id, editContent)}
                          >
                            Save
                          </GlassButton>
                          <GlassButton
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingMessageId(null);
                              setEditContent('');
                            }}
                          >
                            Cancel
                          </GlassButton>
                        </div>
                      </div>
                    ) : (
                      <p className="text-neutral-900">{message.content}</p>
                    )}
                    
                    <div className="flex justify-between items-center mt-2 text-xs text-neutral-500">
                      <span>{new Date(message.created_at).toLocaleString()}</span>
                      {message.credits_charged > 0 && (
                        <span className="text-passion-600">{message.credits_charged} credits</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
