'use client'

import { useEffect } from 'react'
import { ToastContainer } from './Toast'
import { useToast } from '@/lib/hooks/useToast'

/**
 * ToastProvider Component
 * 
 * Provides toast notification functionality throughout the app.
 * Listens for custom toast events and displays notifications.
 */
export function ToastProvider() {
  const { toasts, removeToast, addToast } = useToast()

  useEffect(() => {
    const handleToast = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string; variant: 'success' | 'error' | 'warning' | 'info' }>
      const { message, variant } = customEvent.detail
      addToast(message, variant)
    }

    window.addEventListener('toast', handleToast)
    return () => window.removeEventListener('toast', handleToast)
  }, [addToast])

  return (
    <ToastContainer
      toasts={toasts}
      position="top-right"
      onClose={removeToast}
    />
  )
}
