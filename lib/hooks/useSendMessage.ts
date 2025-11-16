/**
 * useSendMessage Hook
 * 
 * React hook for sending messages with proper error handling
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface SendMessageParams {
  chatId: string
  content: string
  contentType?: 'text' | 'image' | 'voice' | 'video' | 'gif'
  mediaUrl?: string
}

export interface SendMessageResult {
  message: {
    id: string
    chat_id: string
    sender_type: string
    content: string
    content_type: string
    media_url?: string
    is_free_message: boolean
    credits_charged: number
    status: string
    created_at: string
  }
  creditsCharged: number
  remainingCredits: number
}

export interface SendMessageError {
  code: string
  message: string
  required?: number
  available?: number
}

export function useSendMessage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<SendMessageError | null>(null)
  const router = useRouter()
  
  const sendMessage = async (params: SendMessageParams): Promise<SendMessageResult | null> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        const errorData: SendMessageError = {
          code: data.code || 'UNKNOWN_ERROR',
          message: data.error || 'Failed to send message',
          required: data.required,
          available: data.available
        }
        
        setError(errorData)
        return null
      }
      
      return data.data as SendMessageResult
      
    } catch (err) {
      const errorData: SendMessageError = {
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection.'
      }
      setError(errorData)
      return null
      
    } finally {
      setIsLoading(false)
    }
  }
  
  const clearError = () => {
    setError(null)
  }
  
  return {
    sendMessage,
    isLoading,
    error,
    clearError,
    isInsufficientCredits: error?.code === 'INSUFFICIENT_CREDITS',
    isChatNotFound: error?.code === 'CHAT_NOT_FOUND',
    isUnauthorized: error?.code === 'UNAUTHORIZED'
  }
}
