import React, { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { GlassCard } from '@/lib/components/ui/GlassCard';
import { GlassButton } from '@/lib/components/ui/GlassButton';

export interface ResponseTemplatesProps {
  templates: Record<string, string>;
  onSelect: (template: string) => void;
  className?: string;
}

/**
 * ResponseTemplates Component
 * 
 * Quick reply templates for operators to use common responses.
 * Helps maintain character consistency and speed up responses.
 * 
 * @param templates - Object with template names as keys and template text as values
 * @param onSelect - Callback when a template is selected
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <ResponseTemplates
 *   templates={{
 *     greeting: "Hey! How's your day going?",
 *     flirty: "You're making me smile 😊",
 *     goodbye: "Talk to you soon! 💕"
 *   }}
 *   onSelect={handleTemplateSelect}
 * />
 * ```
 */
export const ResponseTemplates = React.forwardRef<HTMLDivElement, ResponseTemplatesProps>(
  (
    {
      templates,
      onSelect,
      className,
    },
    ref
  ) => {
    const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
    const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);

    const templateEntries = Object.entries(templates);

    const handleSelect = (template: string) => {
      onSelect(template);
      // Show feedback
      const templateKey = Object.keys(templates).find(key => templates[key] === template);
      if (templateKey) {
        setCopiedTemplate(templateKey);
        setTimeout(() => setCopiedTemplate(null), 2000);
      }
    };

    const toggleExpand = (key: string) => {
      setExpandedTemplate(expandedTemplate === key ? null : key);
    };

    const formatTemplateName = (key: string) => {
      return key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    if (templateEntries.length === 0) {
      return null;
    }

    return (
      <GlassCard
        ref={ref}
        variant="default"
        className={cn('flex flex-col', className)}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-luxury-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Quick Replies
          </h3>
          <span className="text-xs text-neutral-500">
            {templateEntries.length} templates
          </span>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin">
          {templateEntries.map(([key, template]) => {
            const isExpanded = expandedTemplate === key;
            const isCopied = copiedTemplate === key;
            const isLong = template.length > 60;

            return (
              <div
                key={key}
                className={cn(
                  'p-3 rounded-lg border transition-smooth',
                  'bg-white/50 hover:bg-white/80 border-neutral-200',
                  isCopied && 'border-green-300 bg-green-50/50'
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-semibold text-sm text-neutral-900">
                    {formatTemplateName(key)}
                  </h4>
                  {isCopied && (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Added
                    </span>
                  )}
                </div>

                <p
                  className={cn(
                    'text-sm text-neutral-600 mb-2',
                    !isExpanded && isLong && 'line-clamp-2'
                  )}
                >
                  {template}
                </p>

                <div className="flex items-center gap-2">
                  <GlassButton
                    variant="passion"
                    size="sm"
                    onClick={() => handleSelect(template)}
                    className="flex-1"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Use Template
                  </GlassButton>

                  {isLong && (
                    <button
                      onClick={() => toggleExpand(key)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-smooth',
                        'text-neutral-600 hover:text-neutral-900',
                        'bg-neutral-100 hover:bg-neutral-200'
                      )}
                    >
                      {isExpanded ? (
                        <>
                          <svg className="w-3 h-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          Less
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          More
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 pt-3 border-t border-neutral-200">
          <p className="text-xs text-neutral-500 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Click to add template to message input
          </p>
        </div>
      </GlassCard>
    );
  }
);

ResponseTemplates.displayName = 'ResponseTemplates';
