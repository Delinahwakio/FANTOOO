import React from 'react';
import { cn } from '@/lib/utils/cn';

export type LoadingSpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type LoadingSpinnerVariant = 'passion' | 'luxury' | 'trust' | 'neutral';

export interface LoadingSpinnerProps {
  size?: LoadingSpinnerSize;
  variant?: LoadingSpinnerVariant;
  className?: string;
  label?: string;
}

/**
 * LoadingSpinner Component
 * 
 * A customizable loading spinner with multiple sizes and color variants.
 * 
 * @param size - Spinner size: 'xs', 'sm', 'md', 'lg', or 'xl'
 * @param variant - Color variant: 'passion', 'luxury', 'trust', or 'neutral'
 * @param label - Optional loading text label
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <LoadingSpinner size="lg" variant="passion" label="Loading..." />
 * ```
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'passion',
  label,
  className,
}) => {
  const sizeClasses: Record<LoadingSpinnerSize, string> = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const variantClasses: Record<LoadingSpinnerVariant, string> = {
    passion: 'text-passion-500',
    luxury: 'text-luxury-500',
    trust: 'text-trust-500',
    neutral: 'text-neutral-500',
  };

  const labelSizeClasses: Record<LoadingSpinnerSize, string> = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <svg
        className={cn(
          'animate-spin',
          sizeClasses[size],
          variantClasses[variant]
        )}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-label={label || 'Loading'}
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

      {label && (
        <p
          className={cn(
            'font-medium',
            labelSizeClasses[size],
            variantClasses[variant]
          )}
        >
          {label}
        </p>
      )}
    </div>
  );
};

LoadingSpinner.displayName = 'LoadingSpinner';
