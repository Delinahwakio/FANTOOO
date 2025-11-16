/**
 * Message Send Example Component
 * 
 * Demonstrates how to use the useSendMessage hook with proper error handling
 */

'use client'

import { useState } from 'react'
import { useSendMessage } from '@/lib/hooks/useSendMessage'

interface MessageSendExampleProps {
  chatId: string
  onMessageSent?: (message: any) => void
  onInsufficientCredits?: (required: number, available: number) => void
}

export function MessageSendExample({ 
  chatId, 
  onMessageSent,
  onInsufficientCredits 
}: MessageSendExampleProps) {
  const [content, setContent] = useState('')
  const { sendMessage, isLoading, error, isInsufficientCredits, clearError } = useSendMessage()
  
  const handleSend = async () => {
    if (!content.trim()) return
    
    const result = await sendMessage({
      chatId,
      content: content.trim(),
      contentType: 'text'
    })
    
    if (result) {
      // Success
      setContent('')
      onMessageSent?.(result.message)
      
      // Show success notification
      console.log('Message sent successfully!')
      console.log('Credits charged:', result.creditsCharged)
      console.log('Remaining credits:', result.remainingCredits)
    } else if (error) {
      // Handle specific errors
      if (isInsufficientCredits && error.required && error.available) {
        onInsufficientCredits?.(error.required, error.available)
      }
    }
  }
  
  return (
    <div className="message-send-example">
      <div className="input-container">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          disabled={isLoading}
          className="message-input"
          rows={3}
        />
      </div>
      
      {error && (
        <div className="error-message">
          <p>{error.message}</p>
          {isInsufficientCredits && error.required && error.available && (
            <p>
              You need {error.required} credits but only have {error.available}.
              <button onClick={() => {/* Open purchase modal */}}>
                Purchase Credits
              </button>
            </p>
          )}
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}
      
      <button
        onClick={handleSend}
        disabled={isLoading || !content.trim()}
        className="send-button"
      >
        {isLoading ? 'Sending...' : 'Send Message'}
      </button>
      
      <style jsx>{`
        .message-send-example {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
        }
        
        .input-container {
          width: 100%;
        }
        
        .message-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ccc;
          border-radius: 0.5rem;
          font-size: 1rem;
          resize: vertical;
        }
        
        .message-input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }
        
        .error-message {
          padding: 1rem;
          background-color: #fee;
          border: 1px solid #fcc;
          border-radius: 0.5rem;
          color: #c00;
        }
        
        .error-message button {
          margin-left: 0.5rem;
          padding: 0.25rem 0.5rem;
          background-color: #c00;
          color: white;
          border: none;
          border-radius: 0.25rem;
          cursor: pointer;
        }
        
        .send-button {
          padding: 0.75rem 1.5rem;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .send-button:hover:not(:disabled) {
          background-color: #0051cc;
        }
        
        .send-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}
