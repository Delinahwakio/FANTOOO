import { useState, useCallback } from 'react'
import type { ToastVariant } from '@/lib/components/ui/Toast'

export interface Toast {
  id: string
  message: string
  variant: ToastVariant
  duration?: number
}

let toastCounter = 0

/**
 * Hook for managing toast notifications
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, variant: ToastVariant = 'info', duration = 5000) => {
    const id = `toast-${++toastCounter}`
    const toast: Toast = { id, message, variant, duration }
    
    setToasts((prev) => [...prev, toast])
    
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const success = useCallback((message: string, duration?: number) => {
    return addToast(message, 'success', duration)
  }, [addToast])

  const error = useCallback((message: string, duration?: number) => {
    return addToast(message, 'error', duration)
  }, [addToast])

  const warning = useCallback((message: string, duration?: number) => {
    return addToast(message, 'warning', duration)
  }, [addToast])

  const info = useCallback((message: string, duration?: number) => {
    return addToast(message, 'info', duration)
  }, [addToast])

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  }
}

// Create a simple toast API similar to react-hot-toast
export const toast = {
  success: (message: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { message, variant: 'success' } 
      }))
    }
  },
  error: (message: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { message, variant: 'error' } 
      }))
    }
  },
  warning: (message: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { message, variant: 'warning' } 
      }))
    }
  },
  info: (message: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { message, variant: 'info' } 
      }))
    }
  },
}
