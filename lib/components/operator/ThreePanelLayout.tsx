import React, { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { GlassCard } from '@/lib/components/ui/GlassCard';
import { MessageList, Message } from '@/lib/components/chat/MessageList';
import { MessageInput } from '@/lib/components/chat/MessageInput';
import { ProfileNotes } from './ProfileNotes';
import { ResponseTemplates } from './ResponseTemplates';
import type { RealUser, FictionalUser } from '@/lib/types/user';

export interface ThreePanelLayoutProps {
  chatId: string;
  realUser: RealUser;
  fictionalUser: FictionalUser;
  messages: Message[];
  operatorNotes?: string;
  onSendMessage: (content: string) => Promise<void>;
  onSaveRealUserNotes: (notes: string) => Promise<void>;
  onSaveFictionalUserNotes: (notes: string) => Promise<void>;
  onTemplateSelect?: (template: string) => void;
  isTyping?: boolean;
  className?: string;
}

/**
 * ThreePanelLayout Component
 * 
 * Three-panel operator chat interface:
 * - Left panel: Real user profile with editable notes
 * - Center panel: Chat messages and input
 * - Right panel: Fictional user profile with personality guidelines and response templates
 * 
 * @param chatId - The chat ID
 * @param realUser - Real user profile data
 * @param fictionalUser - Fictional user profile data
 * @param messages - Array of chat messages
 * @param operatorNotes - Current operator notes
 * @param onSendMessage - Callback when sending a message
 * @param onSaveRealUserNotes - Callback to save notes about real user
 * @param onSaveFictionalUserNotes - Callback to save notes about fictional user
 * @param onTemplateSelect - Callback when a response template is selected
 * @param isTyping - Whether the real user is typing
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <ThreePanelLayout
 *   chatId={chatId}
 *   realUser={realUser}
 *   fictionalUser={fictionalUser}
 *   messages={messages}
 *   onSendMessage={handleSendMessage}
 *   onSaveRealUserNotes={handleSaveRealUserNotes}
 *   onSaveFictionalUserNotes={handleSaveFictionalUserNotes}
 * />
 * ```
 */
export const ThreePanelLayout = React.forwardRef<HTMLDivElement, ThreePanelLayoutProps>(
  (
    {
      chatId,
      realUser,
      fictionalUser,
      messages,
      operatorNotes,
      onSendMessage,
      onSaveRealUserNotes,
      onSaveFictionalUserNotes,
      onTemplateSelect,
      isTyping = false,
      className,
    },
    ref
  ) => {
    const [messageContent, setMessageContent] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
      if (!messageContent.trim() || isSending) return;

      setIsSending(true);
      try {
        await onSendMessage(messageContent);
        setMessageContent('');
      } catch (error) {
        console.error('Failed to send message:', error);
      } finally {
        setIsSending(false);
      }
    };

    const handleTemplateSelect = (template: string) => {
      setMessageContent(template);
      onTemplateSelect?.(template);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'grid grid-cols-12 gap-4 h-screen p-4 bg-gradient-to-br from-neutral-50 to-neutral-100',
          className
        )}
      >
        {/* Left Panel - Real User Profile */}
        <div className="col-span-3 flex flex-col gap-4 overflow-y-auto scrollbar-thin">
          <GlassCard variant="elevated" className="flex-shrink-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                {realUser.profile_picture ? (
                  <img
                    src={realUser.profile_picture}
                    alt={realUser.display_name}
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-passion-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-passion flex items-center justify-center text-white text-2xl font-bold">
                    {realUser.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-neutral-900 truncate">
                  {realUser.display_name}
                </h3>
                <p className="text-sm text-neutral-500">@{realUser.username}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-neutral-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{realUser.age} years old • {realUser.gender}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{realUser.location}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-passion-600">{realUser.credits} credits</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'px-2 py-1 rounded-full text-xs font-semibold',
                  realUser.user_tier === 'platinum' && 'bg-purple-100 text-purple-700',
                  realUser.user_tier === 'gold' && 'bg-yellow-100 text-yellow-700',
                  realUser.user_tier === 'silver' && 'bg-gray-100 text-gray-700',
                  realUser.user_tier === 'bronze' && 'bg-orange-100 text-orange-700',
                  realUser.user_tier === 'free' && 'bg-neutral-100 text-neutral-700'
                )}>
                  {realUser.user_tier.toUpperCase()}
                </span>
              </div>
            </div>

            {realUser.bio && (
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <p className="text-sm text-neutral-600 italic">{realUser.bio}</p>
              </div>
            )}
          </GlassCard>

          <ProfileNotes
            title="Notes about User"
            notes={operatorNotes || ''}
            onSave={onSaveRealUserNotes}
            placeholder="Add notes about this user's preferences, conversation style, interests..."
          />
        </div>

        {/* Center Panel - Chat Interface */}
        <div className="col-span-6 flex flex-col">
          <GlassCard variant="elevated" className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-neutral-200 bg-white/50 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">
                    {realUser.display_name} ↔ {fictionalUser.name}
                  </h2>
                  <p className="text-sm text-neutral-500">
                    Chat ID: {chatId.slice(0, 8)}...
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500">
                    {messages.length} messages
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              <MessageList
                messages={messages}
                isTyping={isTyping}
                typingUserName={realUser.display_name}
                autoScroll
              />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-neutral-200 bg-white/50 backdrop-blur-sm">
              <MessageInput
                value={messageContent}
                onChange={setMessageContent}
                onSend={handleSend}
                placeholder={`Reply as ${fictionalUser.name}...`}
                disabled={isSending}
                showEmojiPicker
                showMediaUpload={false}
              />
            </div>
          </GlassCard>
        </div>

        {/* Right Panel - Fictional User Profile & Templates */}
        <div className="col-span-3 flex flex-col gap-4 overflow-y-auto scrollbar-thin">
          <GlassCard variant="elevated" className="flex-shrink-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                {fictionalUser.profile_pictures?.[0] ? (
                  <img
                    src={fictionalUser.profile_pictures[0]}
                    alt={fictionalUser.name}
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-luxury-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-luxury flex items-center justify-center text-white text-2xl font-bold">
                    {fictionalUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {fictionalUser.is_featured && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-neutral-900 truncate">
                  {fictionalUser.name}
                </h3>
                <p className="text-sm text-neutral-500">
                  {fictionalUser.age} • {fictionalUser.location}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              {fictionalUser.response_style && (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-luxury-100 text-luxury-700">
                    {fictionalUser.response_style}
                  </span>
                </div>
              )}

              {fictionalUser.personality_traits && fictionalUser.personality_traits.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase mb-2">Personality</p>
                  <div className="flex flex-wrap gap-1">
                    {fictionalUser.personality_traits.map((trait, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 rounded-full text-xs bg-neutral-100 text-neutral-700"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {fictionalUser.interests && fictionalUser.interests.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase mb-2">Interests</p>
                  <div className="flex flex-wrap gap-1">
                    {fictionalUser.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 rounded-full text-xs bg-passion-50 text-passion-700"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {fictionalUser.personality_guidelines && (
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <p className="text-xs font-semibold text-neutral-500 uppercase mb-2">Guidelines</p>
                <p className="text-sm text-neutral-600 whitespace-pre-wrap">
                  {fictionalUser.personality_guidelines}
                </p>
              </div>
            )}
          </GlassCard>

          {fictionalUser.response_templates && (
            <ResponseTemplates
              templates={fictionalUser.response_templates}
              onSelect={handleTemplateSelect}
            />
          )}

          <ProfileNotes
            title="Notes about Character"
            notes={fictionalUser.personality_guidelines || ''}
            onSave={onSaveFictionalUserNotes}
            placeholder="Add notes about how to portray this character..."
          />
        </div>
      </div>
    );
  }
);

ThreePanelLayout.displayName = 'ThreePanelLayout';
