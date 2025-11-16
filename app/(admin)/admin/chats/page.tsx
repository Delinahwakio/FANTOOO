'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/lib/components/ui/GlassCard';
import { GlassButton } from '@/lib/components/ui/GlassButton';
import { GlassInput } from '@/lib/components/ui/GlassInput';
import { LoadingSpinner } from '@/lib/components/ui/LoadingSpinner';
import { Chat, Message } from '@/lib/types/chat';
import { RealUser, FictionalUser, Operator } from '@/lib/types/user';
import { cn } from '@/lib/utils/cn';
import { useToast } from '@/lib/hooks/useToast';

interface ChatWithDetails extends Chat {
  real_user?: RealUser;
  fictional_user?: FictionalUser;
  operator?: Operator;
}

interface MessageEditHistory {
  id: string;
  message_id: string;
  original_content: string;
  new_content: string;
  edited_by: string;
  editor_type: 'admin' | 'operator';
  edit_reason?: string;
  created_at: string;
}

interface ChatReassignment {
  id: string;
  chat_id: string;
  from_operator_id?: string;
  to_operator_id?: string;
  reason: string;
  reassigned_by: string;
  created_at: string;
}

export default function AdminChatsPage() {
  const { success: showSuccess, error: showError } = useToast();
  const [chats, setChats] = useState<ChatWithDetails[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatWithDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [editHistory, setEditHistory] = useState<MessageEditHistory[]>([]);
  const [reassignmentHistory, setReassignmentHistory] = useState<ChatReassignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editReason, setEditReason] = useState('');
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedOperatorId, setSelectedOperatorId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [showEditHistory, setShowEditHistory] = useState(false);
  const [showReassignHistory, setShowReassignHistory] = useState(false);

  useEffect(() => {
    loadChats();
    loadOperators();
  }, [statusFilter]);

  const loadChats = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      const response = await fetch(`/api/admin/chats?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to load chats');
      
      const data = await response.json();
      setChats(data);
    } catch (error) {
      console.error('Failed to load chats:', error);
      showError('Failed to load chats');
    } finally {
      setIsLoading(false);
    }
  };

  const loadOperators = async () => {
    try {
      const response = await fetch('/api/admin/operators?active=true');
      if (!response.ok) throw new Error('Failed to load operators');
      
      const data = await response.json();
      setOperators(data);
    } catch (error) {
      console.error('Failed to load operators:', error);
    }
  };

  const loadChatMessages = async (chatId: string) => {
    try {
      const response = await fetch(`/api/admin/chats/${chatId}/messages`);
      if (!response.ok) throw new Error('Failed to load messages');
      
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
      showError('Failed to load messages');
    }
  };

  const loadEditHistory = async (messageId: string) => {
    try {
      const response = await fetch(`/api/admin/messages/${messageId}/edit-history`);
      if (!response.ok) throw new Error('Failed to load edit history');
      
      const data = await response.json();
      setEditHistory(data);
      setShowEditHistory(true);
    } catch (error) {
      console.error('Failed to load edit history:', error);
      showError('Failed to load edit history');
    }
  };

  const loadReassignmentHistory = async (chatId: string) => {
    try {
      const response = await fetch(`/api/admin/chats/${chatId}/reassignment-history`);
      if (!response.ok) throw new Error('Failed to load reassignment history');
      
      const data = await response.json();
      setReassignmentHistory(data);
      setShowReassignHistory(true);
    } catch (error) {
      console.error('Failed to load reassignment history:', error);
      showError('Failed to load reassignment history');
    }
  };

  const handleChatClick = (chat: ChatWithDetails) => {
    setSelectedChat(chat);
    loadChatMessages(chat.id);
  };

  const handleEditMessage = async (messageId: string, newContent: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent, edit_reason: reason }),
      });

      if (!response.ok) throw new Error('Failed to edit message');

      showSuccess('Message edited successfully');
      setEditingMessageId(null);
      setEditContent('');
      setEditReason('');
      
      if (selectedChat) {
        loadChatMessages(selectedChat.id);
      }
    } catch (error) {
      console.error('Failed to edit message:', error);
      showError('Failed to edit message');
    }
  };

  const handleReassignChat = async () => {
    if (!selectedChat || !selectedOperatorId || !reassignReason) {
      showError('Please select an operator and provide a reason');
      return;
    }

    try {
      const response = await fetch(`/api/admin/chats/${selectedChat.id}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator_id: selectedOperatorId,
          reason: reassignReason,
        }),
      });

      if (!response.ok) throw new Error('Failed to reassign chat');

      showSuccess('Chat reassigned successfully');
      setShowReassignModal(false);
      setSelectedOperatorId('');
      setReassignReason('');
      loadChats();
      
      if (selectedChat) {
        const updatedChat = chats.find(c => c.id === selectedChat.id);
        if (updatedChat) {
          setSelectedChat(updatedChat);
        }
      }
    } catch (error) {
      console.error('Failed to reassign chat:', error);
      showError('Failed to reassign chat');
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const filteredChats = chats.filter((chat) => {
    const matchesSearch =
      searchQuery === '' ||
      chat.real_user?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.fictional_user?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || chat.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const escalatedChats = chats.filter(chat => chat.status === 'escalated');

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-neutral-900 mb-2">
          Chat Management
        </h1>
        <p className="text-neutral-600 text-lg">
          Monitor, inspect, and manage all platform chats in real-time
        </p>
      </div>

      {/* Escalated Chats Alert */}
      {escalatedChats.length > 0 && (
        <GlassCard variant="elevated" className="p-4 mb-6 border-2 border-red-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">
                {escalatedChats.length} Escalated Chat{escalatedChats.length !== 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-red-700">
                These chats require immediate attention due to max reassignments reached
              </p>
            </div>
            <GlassButton
              variant="passion"
              size="sm"
              onClick={() => setStatusFilter('escalated')}
            >
              View Escalated
            </GlassButton>
          </div>
        </GlassCard>
      )}

      {/* Search and Filter Bar */}
      <GlassCard variant="subtle" className="p-4 mb-6">
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
          
          <div className="flex gap-2 flex-wrap">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>{chat.assignment_count}</span>
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

      {/* Selected Chat Detail View - Three Panel Layout */}
      {selectedChat && (
        <GlassCard variant="elevated" className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-display text-2xl font-bold text-neutral-900">
                Chat Inspection
              </h3>
              <p className="text-neutral-600 mt-1">
                {selectedChat.real_user?.username} ↔ {selectedChat.fictional_user?.name}
              </p>
            </div>
            <div className="flex gap-2">
              <GlassButton
                variant="outline"
                size="sm"
                onClick={() => loadReassignmentHistory(selectedChat.id)}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                History
              </GlassButton>
              <GlassButton
                variant="passion"
                size="sm"
                onClick={() => setShowReassignModal(true)}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Reassign
              </GlassButton>
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={() => setSelectedChat(null)}
              >
                Close
              </GlassButton>
            </div>
          </div>

          {/* Chat Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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
            <div className="glass-subtle p-4 rounded-xl">
              <div className="text-sm text-neutral-600">Last Activity</div>
              <div className="text-sm font-medium text-neutral-900">
                {selectedChat.last_message_at ? formatTimeAgo(selectedChat.last_message_at) : 'N/A'}
              </div>
            </div>
          </div>

          {/* Three Panel Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Real User */}
            <div className="glass-subtle p-4 rounded-xl">
              <h4 className="font-semibold text-lg text-neutral-900 mb-4">Real User</h4>
              {selectedChat.real_user && (
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-neutral-600">Username</div>
                    <div className="font-medium text-neutral-900">{selectedChat.real_user.username}</div>
                  </div>
                  <div>
                    <div className="text-sm text-neutral-600">Credits</div>
                    <div className="font-medium text-neutral-900">{selectedChat.real_user.credits}</div>
                  </div>
                  <div>
                    <div className="text-sm text-neutral-600">Tier</div>
                    <div className="font-medium text-neutral-900 capitalize">{selectedChat.real_user.user_tier}</div>
                  </div>
                  <div>
                    <div className="text-sm text-neutral-600">Location</div>
                    <div className="font-medium text-neutral-900">{selectedChat.real_user.location}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Center Panel - Messages */}
            <div className="glass-subtle p-4 rounded-xl">
              <h4 className="font-semibold text-lg text-neutral-900 mb-4">Messages</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
                {messages.length === 0 ? (
                  <p className="text-neutral-500 text-center py-8">No messages yet</p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'p-3 rounded-xl',
                        message.sender_type === 'real' ? 'glass ml-4' : 'bg-gradient-trust text-white mr-4'
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={cn(
                          'font-medium text-xs',
                          message.sender_type === 'real' ? 'text-neutral-700' : 'text-white/90'
                        )}>
                          {message.sender_type === 'real' ? 'User' : 'Fictional'}
                        </span>
                        <div className="flex items-center gap-2">
                          {message.is_edited && (
                            <button
                              onClick={() => loadEditHistory(message.id)}
                              className={cn(
                                'text-xs underline',
                                message.sender_type === 'real' ? 'text-neutral-500' : 'text-white/70'
                              )}
                            >
                              (edited)
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingMessageId(message.id);
                              setEditContent(message.content);
                            }}
                            className={cn(
                              'text-xs hover:underline',
                              message.sender_type === 'real' ? 'text-trust-600' : 'text-white'
                            )}
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
                            className="w-full glass p-2 rounded-lg focus-ring text-neutral-900"
                            rows={3}
                          />
                          <input
                            type="text"
                            placeholder="Edit reason (optional)"
                            value={editReason}
                            onChange={(e) => setEditReason(e.target.value)}
                            className="w-full glass p-2 rounded-lg focus-ring text-neutral-900 text-sm"
                          />
                          <div className="flex gap-2">
                            <GlassButton
                              size="sm"
                              onClick={() => handleEditMessage(message.id, editContent, editReason)}
                            >
                              Save
                            </GlassButton>
                            <GlassButton
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingMessageId(null);
                                setEditContent('');
                                setEditReason('');
                              }}
                            >
                              Cancel
                            </GlassButton>
                          </div>
                        </div>
                      ) : (
                        <p className={message.sender_type === 'real' ? 'text-neutral-900' : 'text-white'}>
                          {message.content}
                        </p>
                      )}
                      
                      <div className={cn(
                        'flex justify-between items-center mt-2 text-xs',
                        message.sender_type === 'real' ? 'text-neutral-500' : 'text-white/70'
                      )}>
                        <span>{new Date(message.created_at).toLocaleString()}</span>
                        {message.credits_charged > 0 && (
                          <span className={message.sender_type === 'real' ? 'text-passion-600' : 'text-white'}>
                            {message.credits_charged} credits
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Panel - Fictional User */}
            <div className="glass-subtle p-4 rounded-xl">
              <h4 className="font-semibold text-lg text-neutral-900 mb-4">Fictional User</h4>
              {selectedChat.fictional_user && (
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-neutral-600">Name</div>
                    <div className="font-medium text-neutral-900">{selectedChat.fictional_user.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-neutral-600">Age</div>
                    <div className="font-medium text-neutral-900">{selectedChat.fictional_user.age}</div>
                  </div>
                  <div>
                    <div className="text-sm text-neutral-600">Response Style</div>
                    <div className="font-medium text-neutral-900 capitalize">
                      {selectedChat.fictional_user.response_style || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-neutral-600">Featured</div>
                    <div className="font-medium text-neutral-900">
                      {selectedChat.fictional_user.is_featured ? 'Yes' : 'No'}
                    </div>
                  </div>
                  {selectedChat.operator && (
                    <div className="mt-4 pt-4 border-t border-neutral-200">
                      <div className="text-sm text-neutral-600 mb-2">Current Operator</div>
                      <div className="font-medium text-neutral-900">{selectedChat.operator.name}</div>
                      <div className="text-xs text-neutral-500 mt-1">
                        Quality Score: {selectedChat.operator.quality_score.toFixed(1)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          {(selectedChat.operator_notes || selectedChat.admin_notes) && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedChat.operator_notes && (
                <div className="glass-subtle p-4 rounded-xl">
                  <h5 className="font-semibold text-sm text-neutral-700 mb-2">Operator Notes</h5>
                  <p className="text-sm text-neutral-900">{selectedChat.operator_notes}</p>
                </div>
              )}
              {selectedChat.admin_notes && (
                <div className="glass-subtle p-4 rounded-xl">
                  <h5 className="font-semibold text-sm text-neutral-700 mb-2">Admin Notes</h5>
                  <p className="text-sm text-neutral-900">{selectedChat.admin_notes}</p>
                </div>
              )}
            </div>
          )}
        </GlassCard>
      )}

      {/* Reassign Modal */}
      {showReassignModal && selectedChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <GlassCard variant="elevated" className="p-6 max-w-md w-full">
            <h3 className="font-display text-2xl font-bold text-neutral-900 mb-4">
              Reassign Chat
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Select Operator
                </label>
                <select
                  value={selectedOperatorId}
                  onChange={(e) => setSelectedOperatorId(e.target.value)}
                  className="w-full glass p-3 rounded-lg focus-ring"
                >
                  <option value="">Choose an operator...</option>
                  {operators
                    .filter(op => op.is_available && !op.is_suspended)
                    .map((operator) => (
                      <option key={operator.id} value={operator.id}>
                        {operator.name} (Quality: {operator.quality_score.toFixed(1)}, 
                        Active: {operator.current_chat_count}/{operator.max_concurrent_chats})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Reason for Reassignment
                </label>
                <textarea
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="Enter reason for reassignment..."
                  className="w-full glass p-3 rounded-lg focus-ring"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <GlassButton
                  variant="passion"
                  onClick={handleReassignChat}
                  disabled={!selectedOperatorId || !reassignReason}
                  className="flex-1"
                >
                  Reassign Chat
                </GlassButton>
                <GlassButton
                  variant="ghost"
                  onClick={() => {
                    setShowReassignModal(false);
                    setSelectedOperatorId('');
                    setReassignReason('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Edit History Modal */}
      {showEditHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <GlassCard variant="elevated" className="p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-display text-2xl font-bold text-neutral-900">
                Message Edit History
              </h3>
              <button
                onClick={() => {
                  setShowEditHistory(false);
                  setEditHistory([]);
                }}
                className="text-neutral-500 hover:text-neutral-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {editHistory.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">No edit history available</p>
            ) : (
              <div className="space-y-4">
                {editHistory.map((edit) => (
                  <div key={edit.id} className="glass-subtle p-4 rounded-xl">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-sm font-medium text-neutral-700">
                          Edited by {edit.editor_type}
                        </span>
                        <div className="text-xs text-neutral-500 mt-1">
                          {new Date(edit.created_at).toLocaleString()}
                        </div>
                      </div>
                      {edit.edit_reason && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {edit.edit_reason}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-neutral-600 mb-1">Original:</div>
                        <div className="text-sm text-neutral-900 bg-red-50 p-2 rounded">
                          {edit.original_content}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-600 mb-1">New:</div>
                        <div className="text-sm text-neutral-900 bg-green-50 p-2 rounded">
                          {edit.new_content}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* Reassignment History Modal */}
      {showReassignHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <GlassCard variant="elevated" className="p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-display text-2xl font-bold text-neutral-900">
                Reassignment History
              </h3>
              <button
                onClick={() => {
                  setShowReassignHistory(false);
                  setReassignmentHistory([]);
                }}
                className="text-neutral-500 hover:text-neutral-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {reassignmentHistory.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">No reassignment history available</p>
            ) : (
              <div className="space-y-4">
                {reassignmentHistory.map((reassignment) => (
                  <div key={reassignment.id} className="glass-subtle p-4 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <svg className="w-5 h-5 text-trust-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-neutral-900">
                          {reassignment.from_operator_id ? 'Reassigned' : 'Initially Assigned'}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {new Date(reassignment.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-neutral-700 mb-2">
                      <span className="font-medium">Reason:</span> {reassignment.reason}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}
