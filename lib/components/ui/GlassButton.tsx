import React from 'react';
import { cn } from '@/lib/utils/cn';

export type GlassButtonVariant = 'passion' | 'luxury' | 'trust' | 'outline' | 'ghost';
export type GlassButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GlassButtonVariant;
  size?: GlassButtonSize;
  children: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
}

/**
 * GlassButton Component
 * 
 * A styled button component with glassmorphism effects and multiple variants.
 * 
 * @param variant - The visual style: 'passion', 'luxury', 'trust', 'outline', or 'ghost'
 * @param size - Button size: 'sm', 'md', 'lg', or 'xl'
 * @param isLoading - Show loading state
 * @param fullWidth - Make button full width
 * @param disabled - Disable button
 * @param className - Additional CSS classes
 * @param children - Button content
 * 
 * @example
 * ```tsx
 * <GlassButton variant="passion" size="lg">
 *   Click Me
 * </GlassButton>
 * ```
 */
export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      variant = 'passion',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      disabled = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const variantClasses: Record<GlassButtonVariant, string> = {
      passion:
        'bg-gradient-passion text-white shadow-passion hover:shadow-lg hover:scale-105',
      luxury:
        'bg-gradient-luxury text-white shadow-luxury hover:shadow-lg hover:scale-105',
      trust:
        'bg-gradient-trust text-white shadow-trust hover:shadow-lg hover:scale-105',
      outline:
        'glass border-2 border-passion-500 text-passion-600 hover:bg-passion-50 hover:border-passion-600',
      ghost:
        'bg-transparent text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900',
    };

    const sizeClasses: Record<GlassButtonSize, string> = {
      sm: 'px-3 py-1.5 text-sm rounded-lg',
      md: 'px-4 py-2 text-base rounded-xl',
      lg: 'px-6 py-3 text-lg rounded-xl',
      xl: 'px-8 py-4 text-xl rounded-2xl',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'font-semibold transition-smooth',
          'focus-ring',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

GlassButton.displayName = 'GlassButton';
