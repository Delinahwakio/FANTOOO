import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils/cn';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface ToastProps {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onClose: (id: string) => void;
  position?: ToastPosition;
}

/**
 * Toast Component
 * 
 * A notification toast component with multiple variants and auto-dismiss functionality.
 * 
 * @param id - Unique identifier for the toast
 * @param message - Toast message content
 * @param variant - Visual style: 'success', 'error', 'warning', or 'info'
 * @param duration - Auto-dismiss duration in milliseconds (0 = no auto-dismiss)
 * @param onClose - Callback when toast is closed
 * @param position - Toast position on screen
 * 
 * @example
 * ```tsx
 * <Toast
 *   id="toast-1"
 *   message="Profile updated successfully!"
 *   variant="success"
 *   duration={3000}
 *   onClose={handleClose}
 * />
 * ```
 */
export const Toast: React.FC<ToastProps> = ({
  id,
  message,
  variant = 'info',
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    setIsVisible(true);

    // Auto-dismiss
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Match animation duration
  };

  const variantConfig: Record<ToastVariant, { icon: React.ReactNode; classes: string }> = {
    success: {
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      classes: 'bg-green-500 text-white shadow-lg',
    },
    error: {
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      classes: 'bg-passion-500 text-white shadow-passion',
    },
    warning: {
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
      classes: 'bg-yellow-500 text-white shadow-lg',
    },
    info: {
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      classes: 'bg-trust-500 text-white shadow-trust',
    },
  };

  const config = variantConfig[variant];

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl min-w-[300px] max-w-md',
        'transition-all duration-300 ease-out',
        config.classes,
        isVisible && !isExiting && 'animate-slide-in-right',
        isExiting && 'animate-slide-out-right opacity-0'
      )}
      role="alert"
    >
      <div className="flex-shrink-0">{config.icon}</div>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={handleClose}
        className="flex-shrink-0 hover:opacity-75 transition-opacity focus-ring rounded p-1"
        aria-label="Close notification"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};

Toast.displayName = 'Toast';

/**
 * ToastContainer Component
 * 
 * Container for managing multiple toast notifications.
 * 
 * @param toasts - Array of toast configurations
 * @param position - Position of toast container
 * @param onClose - Callback when a toast is closed
 * 
 * @example
 * ```tsx
 * <ToastContainer
 *   toasts={toasts}
 *   position="top-right"
 *   onClose={removeToast}
 * />
 * ```
 */
export interface ToastContainerProps {
  toasts: Array<Omit<ToastProps, 'onClose'>>;
  position?: ToastPosition;
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  position = 'top-right',
  onClose,
}) => {
  const positionClasses: Record<ToastPosition, string> = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-3',
        positionClasses[position]
      )}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
};

ToastContainer.displayName = 'ToastContainer';
