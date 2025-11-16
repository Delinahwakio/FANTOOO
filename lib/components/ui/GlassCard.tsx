import React from 'react';
import { cn } from '@/lib/utils/cn';

export type GlassCardVariant = 'default' | 'elevated' | 'subtle';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GlassCardVariant;
  children: React.ReactNode;
  hover?: boolean;
}

/**
 * GlassCard Component
 * 
 * A glassmorphism card component with multiple variants.
 * 
 * @param variant - The visual style variant: 'default', 'elevated', or 'subtle'
 * @param hover - Enable hover lift effect
 * @param className - Additional CSS classes
 * @param children - Card content
 * 
 * @example
 * ```tsx
 * <GlassCard variant="elevated" hover>
 *   <h3>Card Title</h3>
 *   <p>Card content</p>
 * </GlassCard>
 * ```
 */
export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ variant = 'default', hover = false, className, children, ...props }, ref) => {
    const variantClasses: Record<GlassCardVariant, string> = {
      default: 'glass',
      elevated: 'glass-elevated',
      subtle: 'glass-subtle',
    };

    return (
      <div
        ref={ref}
        className={cn(
          variantClasses[variant],
          'rounded-2xl p-6',
          hover && 'hover-lift cursor-pointer',
          'transition-smooth',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
