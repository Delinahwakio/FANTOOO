'use client';

import React, { useState } from 'react';
import {
  ThreePanelLayout,
  ProfileNotes,
  QueueDisplay,
  AvailabilityToggle,
  ResponseTemplates,
} from '@/lib/components/operator';
import { GlassCard } from '@/lib/components/ui/GlassCard';
import type { RealUser, FictionalUser } from '@/lib/types/user';
import type { ChatQueue } from '@/lib/types/chat';
import type { Message } from '@/lib/components/chat/MessageList';

/**
 * Demo page showcasing all operator components
 */
export default function OperatorDemo() {
  const [activeDemo, setActiveDemo] = useState<'three-panel' | 'queue' | 'availability' | 'notes' | 'templates'>('three-panel');

  // Mock data
  const mockRealUser: RealUser = {
    id: '1',
    auth_id: 'auth-1',
    username: 'john_doe',
    display_name: 'John Doe',
    email: 'john_doe@fantooo.com',
    age: 28,
    gender: 'male',
    looking_for: 'female',
    location: 'Nairobi, Kenya',
    latitude: -1.286389,
    longitude: 36.817223,
    bio: 'Love traveling and meeting new people',
    profile_picture: 'https://i.pravatar.cc/150?img=12',
    credits: 45,
    total_spent: 150.00,
    user_tier: 'gold',
    loyalty_points: 500,
    total_messages_sent: 234,
    total_chats: 12,
    favorite_count: 5,
    last_active_at: new Date().toISOString(),
    is_active: true,
    is_verified: true,
    is_banned: false,
    notification_preferences: { email: true, push: true },
    privacy_settings: { show_online: true, show_location: true },
    created_at: '2024-01-15T10:00:00Z',
    updated_at: new Date().toISOString(),
  };

  const mockFictionalUser: FictionalUser = {
    id: '2',
    name: 'Sarah',
    age: 25,
    gender: 'female',
    location: 'Mombasa, Kenya',
    bio: 'Beach lover, yoga enthusiast, and coffee addict ☕',
    personality_traits: ['Playful', 'Caring', 'Adventurous', 'Witty'],
    interests: ['Yoga', 'Travel', 'Photography', 'Coffee', 'Beach'],
    occupation: 'Photographer',
    education: 'Bachelor of Arts',
    relationship_status: 'Single',
    profile_pictures: [
      'https://i.pravatar.cc/300?img=47',
      'https://i.pravatar.cc/300?img=48',
      'https://i.pravatar.cc/300?img=49',
    ],
    response_style: 'flirty',
    response_templates: {
      greeting: "Hey there! 😊 How's your day going?",
      flirty: "You're making me smile... I like talking to you 💕",
      playful: "Haha, you're funny! Tell me more 😄",
      goodbye: "I had a great time chatting! Talk soon? 💋",
      compliment: "That's so sweet of you to say! You're pretty amazing yourself 🥰",
    },
    personality_guidelines: 'Sarah is warm, flirty, and playful. She loves adventure and spontaneity. Use emojis frequently. Keep responses light and fun. Show genuine interest in the user.',
    total_chats: 156,
    total_messages: 3420,
    average_rating: 4.8,
    total_revenue: 5600.00,
    conversion_rate: 78.5,
    is_active: true,
    is_featured: true,
    max_concurrent_chats: 10,
    tags: ['flirty', 'beach', 'yoga'],
    category: 'lifestyle',
    popularity_score: 95,
    created_at: '2024-01-10T08:00:00Z',
    updated_at: new Date().toISOString(),
  };

  const mockMessages: Message[] = [
    {
      id: '1',
      chatId: 'chat-1',
      senderType: 'real',
      content: 'Hey Sarah! How are you?',
      createdAt: new Date(Date.now() - 300000).toISOString(),
      status: 'read',
      isFreeMessage: true,
      creditsCharged: 0,
    },
    {
      id: '2',
      chatId: 'chat-1',
      senderType: 'fictional',
      content: "Hey there! 😊 I'm doing great! Just got back from the beach. How's your day going?",
      createdAt: new Date(Date.now() - 240000).toISOString(),
      status: 'read',
      isFreeMessage: true,
      creditsCharged: 0,
    },
    {
      id: '3',
      chatId: 'chat-1',
      senderType: 'real',
      content: 'Sounds amazing! I love the beach too. What were you doing there?',
      createdAt: new Date(Date.now() - 180000).toISOString(),
      status: 'read',
      isFreeMessage: true,
      creditsCharged: 0,
    },
    {
      id: '4',
      chatId: 'chat-1',
      senderType: 'fictional',
      content: 'I was doing a photoshoot! The sunset was absolutely gorgeous 🌅 I wish you could have seen it!',
      createdAt: new Date(Date.now() - 120000).toISOString(),
      status: 'read',
      isFreeMessage: false,
      creditsCharged: 1,
    },
  ];

  const mockQueueItems: (ChatQueue & { realUserName?: string; fictionalUserName?: string })[] = [
    {
      id: 'q1',
      chat_id: 'chat-2',
      priority: 'urgent',
      priority_score: 95,
      user_tier: 'platinum',
      user_lifetime_value: 500.00,
      required_specializations: ['flirty', 'romantic'],
      entered_queue_at: new Date(Date.now() - 600000).toISOString(),
      attempts: 0,
      created_at: new Date(Date.now() - 600000).toISOString(),
      realUserName: 'Michael Smith',
      fictionalUserName: 'Emma',
    },
    {
      id: 'q2',
      chat_id: 'chat-3',
      priority: 'high',
      priority_score: 80,
      user_tier: 'gold',
      user_lifetime_value: 250.00,
      entered_queue_at: new Date(Date.now() - 300000).toISOString(),
      attempts: 1,
      created_at: new Date(Date.now() - 300000).toISOString(),
      realUserName: 'David Johnson',
      fictionalUserName: 'Sophia',
    },
    {
      id: 'q3',
      chat_id: 'chat-4',
      priority: 'normal',
      priority_score: 50,
      user_tier: 'silver',
      entered_queue_at: new Date(Date.now() - 120000).toISOString(),
      attempts: 0,
      created_at: new Date(Date.now() - 120000).toISOString(),
      realUserName: 'James Wilson',
      fictionalUserName: 'Olivia',
    },
  ];

  const [isAvailable, setIsAvailable] = useState(true);
  const [activeChatsCount, setActiveChatsCount] = useState(2);
  const [notes, setNotes] = useState('User seems interested in beach activities. Prefers casual conversation.');

  const handleSendMessage = async (content: string) => {
    console.log('Sending message:', content);
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleSaveNotes = async (newNotes: string) => {
    console.log('Saving notes:', newNotes);
    await new Promise(resolve => setTimeout(resolve, 500));
    setNotes(newNotes);
  };

  const handleToggleAvailability = async (available: boolean) => {
    console.log('Toggling availability:', available);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsAvailable(available);
  };

  const handleAcceptChat = (chatId: string) => {
    console.log('Accepting chat:', chatId);
    setActiveChatsCount(prev => prev + 1);
  };

  const handleTemplateSelect = (template: string) => {
    console.log('Template selected:', template);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <GlassCard variant="elevated">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Operator Components Demo
          </h1>
          <p className="text-neutral-600">
            Explore all operator-specific components for the Fantooo platform
          </p>
        </GlassCard>

        {/* Navigation */}
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'three-panel', label: 'Three Panel Layout' },
            { id: 'queue', label: 'Queue Display' },
            { id: 'availability', label: 'Availability Toggle' },
            { id: 'notes', label: 'Profile Notes' },
            { id: 'templates', label: 'Response Templates' },
          ].map((demo) => (
            <button
              key={demo.id}
              onClick={() => setActiveDemo(demo.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-smooth ${
                activeDemo === demo.id
                  ? 'bg-gradient-passion text-white shadow-passion'
                  : 'bg-white text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              {demo.label}
            </button>
          ))}
        </div>

        {/* Demo Content */}
        {activeDemo === 'three-panel' && (
          <ThreePanelLayout
            chatId="chat-1"
            realUser={mockRealUser}
            fictionalUser={mockFictionalUser}
            messages={mockMessages}
            operatorNotes="User prefers casual conversation. Interested in beach activities."
            onSendMessage={handleSendMessage}
            onSaveRealUserNotes={handleSaveNotes}
            onSaveFictionalUserNotes={handleSaveNotes}
            onTemplateSelect={handleTemplateSelect}
          />
        )}

        {activeDemo === 'queue' && (
          <QueueDisplay
            queueItems={mockQueueItems}
            onAcceptChat={handleAcceptChat}
          />
        )}

        {activeDemo === 'availability' && (
          <div className="max-w-2xl mx-auto">
            <AvailabilityToggle
              isAvailable={isAvailable}
              activeChatsCount={activeChatsCount}
              onToggle={handleToggleAvailability}
            />
          </div>
        )}

        {activeDemo === 'notes' && (
          <div className="max-w-2xl mx-auto">
            <ProfileNotes
              title="Notes about User"
              notes={notes}
              onSave={handleSaveNotes}
              placeholder="Add notes about this user's preferences, conversation style, interests..."
            />
          </div>
        )}

        {activeDemo === 'templates' && (
          <div className="max-w-2xl mx-auto">
            <ResponseTemplates
              templates={mockFictionalUser.response_templates || {}}
              onSelect={handleTemplateSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
}
