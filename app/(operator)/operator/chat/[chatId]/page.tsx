'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ThreePanelLayout } from '@/lib/components/operator/ThreePanelLayout'
import { LoadingSpinner } from '@/lib/components/ui/LoadingSpinner'
import { GlassButton } from '@/lib/components/ui/GlassButton'
import { useRealtimeMessages } from '@/lib/hooks/useRealtime'
import { useMessages } from '@/lib/hooks/useMessages'
import { toast } from '@/lib/hooks/useToast'
import type { Chat } from '@/lib/types/chat'
import type { RealUser, FictionalUser } from '@/lib/types/user'
import type { Message } from '@/lib/components/chat/MessageList'

interface ChatData {
  chat: Chat
  realUser: RealUser
  fictionalUser: FictionalUser
  assignmentInfo: {
    currentOperator: string
    previousOperators: string[]
    assignmentCount: number
  }
}

/**
 * Operator Chat Page
 * 
 * Three-panel operator interface for managing chats:
 * - Left: Real user profile with editable notes
 * - Center: Chat messages and input
 * - Right: Fictional user profile with personality guidelines and response templates
 */
export default function OperatorChatPage() {
  const params = useParams()
  const router = useRouter()
  const chatId = params.chatId as string

  const [chatData, setChatData] = useState<ChatData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)

  const { messages, addMessage, loading: messagesLoading } = useMessages({ chatId })
  
  // Subscribe to real-time updates
  const { isConnected } = useRealtimeMessages({
    chatId,
    onNewMessage: (message) => {
      addMessage(message)
    },
    onTypingStart: () => {
      setIsTyping(true)
    },
    onTypingEnd: () => {
      setIsTyping(false)
    }
  })

  // Fetch chat data
  useEffect(() => {
    const fetchChatData = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/operator/chats/${chatId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Chat not found')
          }
          if (response.status === 403) {
            throw new Error('You are not assigned to this chat')
          }
          throw new Error('Failed to load chat')
        }

        const data: ChatData = await response.json()
        setChatData(data)
      } catch (err) {
        console.error('Error fetching chat data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load chat')
        toast.error('Failed to load chat')
      } finally {
        setLoading(false)
      }
    }

    if (chatId) {
      fetchChatData()
    }
  }, [chatId])

  const handleSendMessage = async (content: string) => {
    if (!chatData) return

    try {
      // Send message via API
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          senderType: 'fictional'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const result = await response.json()
      addMessage(result.message)
      toast.success('Message sent')
    } catch (err) {
      console.error('Error sending message:', err)
      toast.error('Failed to send message')
      throw err
    }
  }

  const handleSaveRealUserNotes = async (notes: string) => {
    if (!chatData) return

    try {
      const response = await fetch(`/api/operator/chats/${chatId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, type: 'real_user' })
      })

      if (!response.ok) {
        throw new Error('Failed to save notes')
      }

      toast.success('Notes saved')
    } catch (err) {
      console.error('Error saving notes:', err)
      toast.error('Failed to save notes')
      throw err
    }
  }

  const handleSaveFictionalUserNotes = async (notes: string) => {
    if (!chatData) return

    try {
      const response = await fetch(`/api/operator/chats/${chatId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, type: 'fictional_user' })
      })

      if (!response.ok) {
        throw new Error('Failed to save notes')
      }

      toast.success('Notes saved')
    } catch (err) {
      console.error('Error saving notes:', err)
      toast.error('Failed to save notes')
      throw err
    }
  }

  const handleBackToWaiting = () => {
    router.push('/operator/waiting')
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-neutral-600">Loading chat...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !chatData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            {error || 'Chat not found'}
          </h2>
          <p className="text-neutral-600 mb-6">
            This chat may have been closed or you may not have access to it.
          </p>
          <GlassButton
            variant="passion"
            onClick={handleBackToWaiting}
          >
            Back to Waiting Room
          </GlassButton>
        </div>
      </div>
    )
  }

  // Convert messages to the format expected by MessageList
  const formattedMessages: Message[] = messages.map(msg => ({
    id: msg.id,
    chatId: msg.chat_id,
    content: msg.content,
    sender: msg.sender_type === 'real' ? 'user' : 'other',
    senderType: msg.sender_type,
    timestamp: msg.created_at,
    createdAt: msg.created_at,
    status: msg.status,
    isEdited: msg.is_edited,
    isFreeMessage: msg.is_free_message,
    creditsCharged: msg.credits_charged
  }))

  return (
    <div className="relative">
      {/* Header with assignment info */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-sm border-b border-neutral-200 px-4 py-2">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-4">
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={handleBackToWaiting}
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </GlassButton>
            
            <div className="text-sm">
              <span className="text-neutral-500">Assignment #{chatData.assignmentInfo.assignmentCount}</span>
              {chatData.assignmentInfo.previousOperators.length > 0 && (
                <span className="ml-2 text-orange-600">
                  • {chatData.assignmentInfo.previousOperators.length} previous operator(s)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-neutral-600">
              Chat Status: <span className="font-semibold text-neutral-900">{chatData.chat.status}</span>
            </div>
            {chatData.chat.flags && chatData.chat.flags.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                </svg>
                {chatData.chat.flags.length} flag(s)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Three-panel layout */}
      <div className="pt-16">
        <ThreePanelLayout
          chatId={chatId}
          realUser={chatData.realUser}
          fictionalUser={chatData.fictionalUser}
          messages={formattedMessages}
          operatorNotes={chatData.chat.operator_notes}
          onSendMessage={handleSendMessage}
          onSaveRealUserNotes={handleSaveRealUserNotes}
          onSaveFictionalUserNotes={handleSaveFictionalUserNotes}
          isTyping={isTyping}
        />
      </div>
    </div>
  )
}
