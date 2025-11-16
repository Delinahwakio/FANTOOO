import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { GlassCard } from '@/lib/components/ui/GlassCard';
import { GlassButton } from '@/lib/components/ui/GlassButton';

export interface ProfileNotesProps {
  title: string;
  notes: string;
  onSave: (notes: string) => Promise<void>;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

/**
 * ProfileNotes Component
 * 
 * Editable notes component for operators to save information about users or fictional profiles.
 * Features auto-save indication and character count.
 * 
 * @param title - Title for the notes section
 * @param notes - Current notes content
 * @param onSave - Callback to save notes
 * @param placeholder - Placeholder text for empty notes
 * @param maxLength - Maximum character length (default: 2000)
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <ProfileNotes
 *   title="Notes about User"
 *   notes={userNotes}
 *   onSave={handleSaveNotes}
 *   placeholder="Add notes about this user..."
 * />
 * ```
 */
export const ProfileNotes = React.forwardRef<HTMLDivElement, ProfileNotesProps>(
  (
    {
      title,
      notes,
      onSave,
      placeholder = 'Add notes...',
      maxLength = 2000,
      className,
    },
    ref
  ) => {
    const [localNotes, setLocalNotes] = useState(notes);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [isEditing, setIsEditing] = useState(false);

    // Update local notes when prop changes
    useEffect(() => {
      setLocalNotes(notes);
    }, [notes]);

    const handleSave = async () => {
      if (localNotes === notes) {
        setIsEditing(false);
        return;
      }

      setIsSaving(true);
      setSaveStatus('saving');

      try {
        await onSave(localNotes);
        setSaveStatus('saved');
        setIsEditing(false);
        
        // Reset status after 2 seconds
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      } catch (error) {
        console.error('Failed to save notes:', error);
        setSaveStatus('error');
        
        // Reset error status after 3 seconds
        setTimeout(() => {
          setSaveStatus('idle');
        }, 3000);
      } finally {
        setIsSaving(false);
      }
    };

    const handleCancel = () => {
      setLocalNotes(notes);
      setIsEditing(false);
      setSaveStatus('idle');
    };

    const hasChanges = localNotes !== notes;
    const remainingChars = maxLength - localNotes.length;

    return (
      <GlassCard
        ref={ref}
        variant="default"
        className={cn('flex flex-col', className)}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {title}
          </h3>
          
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Saved
            </span>
          )}
          
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Error
            </span>
          )}
        </div>

        <textarea
          value={localNotes}
          onChange={(e) => {
            setLocalNotes(e.target.value);
            setIsEditing(true);
            setSaveStatus('idle');
          }}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(
            'w-full min-h-[120px] p-3 rounded-lg',
            'bg-white/50 border border-neutral-200',
            'text-sm text-neutral-700 placeholder:text-neutral-400',
            'focus:outline-none focus:ring-2 focus:ring-passion-300 focus:border-transparent',
            'resize-y transition-smooth',
            'scrollbar-thin'
          )}
          rows={6}
        />

        <div className="flex items-center justify-between mt-3">
          <span className={cn(
            'text-xs',
            remainingChars < 100 ? 'text-orange-600 font-medium' : 'text-neutral-400'
          )}>
            {remainingChars} characters remaining
          </span>

          {isEditing && hasChanges && (
            <div className="flex items-center gap-2">
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="passion"
                size="sm"
                onClick={handleSave}
                isLoading={isSaving}
                disabled={isSaving || localNotes.length > maxLength}
              >
                {isSaving ? 'Saving...' : 'Save Notes'}
              </GlassButton>
            </div>
          )}
        </div>
      </GlassCard>
    );
  }
);

ProfileNotes.displayName = 'ProfileNotes';
