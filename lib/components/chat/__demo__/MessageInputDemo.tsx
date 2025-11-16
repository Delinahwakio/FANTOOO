/**
 * Demo: Message Input Components
 * 
 * This demo showcases the MessageInput, EmojiPicker, MediaUpload, and CreditIndicator components
 * working together in a complete chat input interface.
 */

'use client';

import React, { useState } from 'react';
import { MessageInput } from '../MessageInput';
import { EmojiPicker } from '../EmojiPicker';
import { MediaUpload, MediaType } from '../MediaUpload';
import { CreditIndicator } from '../CreditIndicator';
import { GlassCard } from '@/lib/components/ui/GlassCard';

export default function MessageInputDemo() {
  const [messages, setMessages] = useState<string[]>([]);
  const [credits, setCredits] = useState(50);
  const [messageCount, setMessageCount] = useState(0);
  const messageCost = messageCount < 3 ? 0 : 2; // First 3 messages are free

  const handleSendMessage = async (content: string) => {
    // Simulate sending message
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    setMessages((prev) => [...prev, content]);
    setMessageCount((prev) => prev + 1);
    
    // Deduct credits if not a free message
    if (messageCost > 0) {
      setCredits((prev) => Math.max(0, prev - messageCost));
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    console.log('Emoji selected:', emoji);
    // In real implementation, this would append to the message input
  };

  const handleMediaUpload = async (file: File, type: MediaType) => {
    console.log('Media uploaded:', file.name, type);
    // In real implementation, this would upload to storage and send as message
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const handlePurchaseCredits = () => {
    console.log('Navigate to credits purchase page');
    // In real implementation, this would navigate to /credits
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-passion-50 via-luxury-50 to-trust-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold text-gradient-passion mb-2">
            Message Input Components Demo
          </h1>
          <p className="text-neutral-600">
            Complete chat input interface with emoji picker, media upload, and credit indicator
          </p>
        </div>

        {/* Demo Section 1: Complete Chat Input */}
        <GlassCard className="p-6">
          <h2 className="font-display text-2xl font-bold mb-4 text-neutral-900">
            Complete Chat Input Interface
          </h2>
          
          {/* Credit Indicator */}
          <div className="mb-4">
            <CreditIndicator
              credits={credits}
              messageCost={messageCost}
              showKES
              onPurchaseClick={handlePurchaseCredits}
              variant="detailed"
            />
          </div>

          {/* Message History */}
          <div className="mb-4 p-4 glass rounded-xl max-h-48 overflow-y-auto scrollbar-thin">
            {messages.length === 0 ? (
              <p className="text-neutral-400 text-center text-sm">
                No messages yet. Start typing below!
              </p>
            ) : (
              <div className="space-y-2">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className="bg-gradient-passion text-white px-4 py-2 rounded-xl max-w-[80%] ml-auto"
                  >
                    <p className="text-sm">{msg}</p>
                    <div className="text-xs opacity-80 mt-1">
                      Message #{idx + 1} • {idx < 3 ? 'Free' : `${messageCost} credits`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input Area with Actions */}
          <div className="flex items-end gap-2">
            <EmojiPicker
              onEmojiSelect={handleEmojiSelect}
              position="top"
            />
            <MediaUpload
              onUpload={handleMediaUpload}
              acceptedTypes={['image', 'video']}
              maxSizeInMB={10}
            />
            <div className="flex-1">
              <MessageInput
                onSend={handleSendMessage}
                placeholder="Type your message..."
                maxLength={1000}
                disabled={credits < messageCost}
              />
            </div>
          </div>

          {credits < messageCost && (
            <div className="mt-3 p-3 bg-passion-50 border border-passion-200 rounded-lg text-sm text-passion-700">
              <strong>Insufficient credits!</strong> You need {messageCost} credits to send this message.
              <button
                onClick={handlePurchaseCredits}
                className="ml-2 underline font-semibold hover:text-passion-900"
              >
                Purchase more credits
              </button>
            </div>
          )}
        </GlassCard>

        {/* Demo Section 2: MessageInput Variants */}
        <GlassCard className="p-6">
          <h2 className="font-display text-2xl font-bold mb-4 text-neutral-900">
            MessageInput Component
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-2">Default</h3>
              <MessageInput
                onSend={(msg) => console.log('Sent:', msg)}
                placeholder="Type a message..."
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-2">With Character Limit (100)</h3>
              <MessageInput
                onSend={(msg) => console.log('Sent:', msg)}
                placeholder="Short message..."
                maxLength={100}
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-2">Loading State</h3>
              <MessageInput
                onSend={(msg) => console.log('Sent:', msg)}
                placeholder="Sending..."
                isLoading
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-2">Disabled</h3>
              <MessageInput
                onSend={(msg) => console.log('Sent:', msg)}
                placeholder="Cannot send messages"
                disabled
              />
            </div>
          </div>
        </GlassCard>

        {/* Demo Section 3: CreditIndicator Variants */}
        <GlassCard className="p-6">
          <h2 className="font-display text-2xl font-bold mb-4 text-neutral-900">
            CreditIndicator Component
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-2">Compact Variant</h3>
              <CreditIndicator
                credits={50}
                variant="compact"
                size="md"
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-2">Default Variant with Message Cost</h3>
              <CreditIndicator
                credits={50}
                messageCost={2}
                showKES
                onPurchaseClick={() => console.log('Purchase clicked')}
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-2">Low Credits Warning</h3>
              <CreditIndicator
                credits={8}
                messageCost={2}
                warningThreshold={10}
                onPurchaseClick={() => console.log('Purchase clicked')}
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-2">Insufficient Credits</h3>
              <CreditIndicator
                credits={1}
                messageCost={2}
                onPurchaseClick={() => console.log('Purchase clicked')}
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-2">Detailed Variant</h3>
              <CreditIndicator
                credits={25}
                messageCost={2}
                showKES
                variant="detailed"
                onPurchaseClick={() => console.log('Purchase clicked')}
              />
            </div>
          </div>
        </GlassCard>

        {/* Demo Section 4: EmojiPicker */}
        <GlassCard className="p-6">
          <h2 className="font-display text-2xl font-bold mb-4 text-neutral-900">
            EmojiPicker Component
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-2">Click to open emoji picker</h3>
              <div className="flex gap-4">
                <EmojiPicker
                  onEmojiSelect={(emoji) => console.log('Selected:', emoji)}
                  position="top"
                />
                <EmojiPicker
                  onEmojiSelect={(emoji) => console.log('Selected:', emoji)}
                  position="bottom"
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Demo Section 5: MediaUpload */}
        <GlassCard className="p-6">
          <h2 className="font-display text-2xl font-bold mb-4 text-neutral-900">
            MediaUpload Component
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-2">Images Only</h3>
              <MediaUpload
                onUpload={(file, type) => console.log('Uploaded:', file.name, type)}
                acceptedTypes={['image']}
                maxSizeInMB={5}
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-2">Images and Videos with Preview</h3>
              <MediaUpload
                onUpload={(file, type) => console.log('Uploaded:', file.name, type)}
                acceptedTypes={['image', 'video']}
                maxSizeInMB={10}
                showPreview
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-2">Disabled</h3>
              <MediaUpload
                onUpload={(file, type) => console.log('Uploaded:', file.name, type)}
                disabled
              />
            </div>
          </div>
        </GlassCard>

        {/* Usage Instructions */}
        <GlassCard className="p-6">
          <h2 className="font-display text-2xl font-bold mb-4 text-neutral-900">
            Usage Instructions
          </h2>
          
          <div className="space-y-4 text-sm text-neutral-700">
            <div>
              <h3 className="font-semibold mb-2">MessageInput</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Press Enter to send, Shift+Enter for new line</li>
                <li>Auto-resizes up to 200px height</li>
                <li>Shows character count and limit</li>
                <li>Triggers typing indicators automatically</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">EmojiPicker</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>6 emoji categories: Smileys, Hearts, Gestures, Activities, Food, Travel</li>
                <li>Click outside to close</li>
                <li>Position can be 'top' or 'bottom'</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">MediaUpload</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Validates file type and size</li>
                <li>Shows error messages for invalid files</li>
                <li>Optional preview before upload</li>
                <li>Supports images and videos</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">CreditIndicator</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>3 variants: compact, default, detailed</li>
                <li>Shows warnings when credits are low</li>
                <li>Displays next message cost</li>
                <li>Optional KES conversion display</li>
              </ul>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
