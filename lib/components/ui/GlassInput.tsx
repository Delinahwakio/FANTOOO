import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * GlassInput Component
 * 
 * A styled input component with glassmorphism effects, labels, icons, and error states.
 * 
 * @param label - Input label text
 * @param error - Error message to display
 * @param helperText - Helper text below input
 * @param leftIcon - Icon to display on the left side
 * @param rightIcon - Icon to display on the right side
 * @param fullWidth - Make input full width
 * @param disabled - Disable input
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <GlassInput
 *   label="Email"
 *   placeholder="Enter your email"
 *   error="Invalid email"
 *   leftIcon={<EmailIcon />}
 * />
 * ```
 */
export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled = false,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'text-sm font-medium text-neutral-700',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              'glass px-4 py-3 rounded-lg',
              'text-neutral-900 placeholder:text-neutral-400',
              'focus-ring transition-smooth',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              hasError && 'border-2 border-passion-500 focus:outline-passion-600',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              fullWidth && 'w-full',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
              {rightIcon}
            </div>
          )}
        </div>

        {(error || helperText) && (
          <div
            className={cn(
              'text-sm',
              hasError ? 'text-passion-600' : 'text-neutral-500'
            )}
          >
            {error || helperText}
          </div>
        )}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';
