import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';

export interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
  buttonClassName?: string;
  position?: 'top' | 'bottom';
}

// Common emoji categories
const EMOJI_CATEGORIES = {
  smileys: {
    label: 'Smileys & Emotion',
    icon: '😊',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
      '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
      '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
      '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
      '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
      '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕',
    ],
  },
  hearts: {
    label: 'Hearts & Love',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
      '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
      '💘', '💝', '💟', '💌', '💋', '😻', '😽', '🥰',
    ],
  },
  gestures: {
    label: 'Gestures',
    icon: '👋',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️',
      '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕',
      '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜',
      '👏', '🙌', '👐', '🤲', '🤝', '🙏', '💪', '🦾',
    ],
  },
  activities: {
    label: 'Activities',
    icon: '⚽',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉',
      '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍',
      '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊',
      '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿',
    ],
  },
  food: {
    label: 'Food & Drink',
    icon: '🍕',
    emojis: [
      '🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥓', '🥚',
      '🍳', '🧇', '🥞', '🧈', '🍞', '🥐', '🥨', '🥯',
      '🥖', '🧀', '🥗', '🥙', '🥪', '🌮', '🌯', '🥘',
      '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🍤',
    ],
  },
  travel: {
    label: 'Travel & Places',
    icon: '✈️',
    emojis: [
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑',
      '🚒', '🚐', '🚚', '🚛', '🚜', '🛴', '🚲', '🛵',
      '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡',
      '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅',
    ],
  },
};

/**
 * EmojiPicker Component
 * 
 * A lightweight emoji picker with common emoji categories.
 * Displays a button that opens a popover with emoji selection.
 * 
 * @param onEmojiSelect - Callback when emoji is selected
 * @param className - Additional CSS classes for container
 * @param buttonClassName - Additional CSS classes for button
 * @param position - Position of picker relative to button ('top' or 'bottom')
 * 
 * @example
 * ```tsx
 * <EmojiPicker
 *   onEmojiSelect={(emoji) => setMessage(prev => prev + emoji)}
 *   position="top"
 * />
 * ```
 */
export const EmojiPicker = React.forwardRef<HTMLDivElement, EmojiPickerProps>(
  (
    {
      onEmojiSelect,
      className,
      buttonClassName,
      position = 'top',
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES>('smileys');
    const pickerRef = useRef<HTMLDivElement>(null);

    // Close picker when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

    const handleEmojiClick = (emoji: string) => {
      onEmojiSelect(emoji);
      setIsOpen(false);
    };

    return (
      <div ref={ref} className={cn('relative', className)}>
        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'p-2 rounded-lg transition-smooth',
            'hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900',
            'focus-ring',
            buttonClassName
          )}
          aria-label="Open emoji picker"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>

        {/* Emoji Picker Popover */}
        {isOpen && (
          <div
            ref={pickerRef}
            className={cn(
              'absolute z-50 w-80',
              position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
              'glass-elevated rounded-2xl shadow-lg',
              'animate-scale-in'
            )}
          >
            {/* Category Tabs */}
            <div className="flex gap-1 p-2 border-b border-neutral-200">
              {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveCategory(key as keyof typeof EMOJI_CATEGORIES)}
                  className={cn(
                    'p-2 rounded-lg text-xl transition-smooth',
                    'hover:bg-neutral-100',
                    activeCategory === key
                      ? 'bg-passion-100 ring-2 ring-passion-500'
                      : 'bg-transparent'
                  )}
                  title={category.label}
                >
                  {category.icon}
                </button>
              ))}
            </div>

            {/* Emoji Grid */}
            <div className="p-3 max-h-64 overflow-y-auto scrollbar-thin">
              <div className="grid grid-cols-8 gap-1">
                {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji, index) => (
                  <button
                    key={`${emoji}-${index}`}
                    type="button"
                    onClick={() => handleEmojiClick(emoji)}
                    className={cn(
                      'p-2 text-2xl rounded-lg transition-smooth',
                      'hover:bg-neutral-100 hover:scale-125',
                      'focus-ring'
                    )}
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Label */}
            <div className="px-3 py-2 border-t border-neutral-200 text-xs text-neutral-600 font-medium">
              {EMOJI_CATEGORIES[activeCategory].label}
            </div>
          </div>
        )}
      </div>
    );
  }
);

EmojiPicker.displayName = 'EmojiPicker';
