import { useState, useCallback } from 'react';
import type { ToastVariant } from '@/lib/components/ui/Toast';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

/**
 * useToast Hook
 * 
 * A custom hook for managing toast notifications throughout the application.
 * 
 * @returns Object with toasts array and helper functions
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { toasts, addToast, removeToast } = useToast();
 * 
 *   const handleSuccess = () => {
 *     addToast('Operation successful!', 'success');
 *   };
 * 
 *   return (
 *     <>
 *       <button onClick={handleSuccess}>Do Something</button>
 *       <ToastContainer toasts={toasts} onClose={removeToast} />
 *     </>
 *   );
 * }
 * ```
 */
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  /**
   * Add a new toast notification
   * 
   * @param message - Toast message content
   * @param variant - Toast variant: 'success', 'error', 'warning', or 'info'
   * @param duration - Auto-dismiss duration in milliseconds (default: 5000)
   * @returns Toast ID
   */
  const addToast = useCallback(
    (message: string, variant: ToastVariant = 'info', duration: number = 5000): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: Toast = { id, message, variant, duration };
      
      setToasts((prev) => [...prev, newToast]);
      
      return id;
    },
    []
  );

  /**
   * Remove a toast notification by ID
   * 
   * @param id - Toast ID to remove
   */
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  /**
   * Remove all toast notifications
   */
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  /**
   * Convenience method for success toasts
   */
  const success = useCallback(
    (message: string, duration?: number) => addToast(message, 'success', duration),
    [addToast]
  );

  /**
   * Convenience method for error toasts
   */
  const error = useCallback(
    (message: string, duration?: number) => addToast(message, 'error', duration),
    [addToast]
  );

  /**
   * Convenience method for warning toasts
   */
  const warning = useCallback(
    (message: string, duration?: number) => addToast(message, 'warning', duration),
    [addToast]
  );

  /**
   * Convenience method for info toasts
   */
  const info = useCallback(
    (message: string, duration?: number) => addToast(message, 'info', duration),
    [addToast]
  );

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    warning,
    info,
  };
};
