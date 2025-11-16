import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { GlassInput } from '@/lib/components/ui/GlassInput';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  debounceMs?: number;
  showClearButton?: boolean;
  autoFocus?: boolean;
  className?: string;
}

/**
 * SearchBar Component
 * 
 * A search input component with debouncing, clear button, and keyboard shortcuts.
 * 
 * @param value - Current search value
 * @param onChange - Callback when value changes (immediate)
 * @param onSearch - Callback when search is triggered (debounced)
 * @param placeholder - Input placeholder
 * @param label - Input label
 * @param helperText - Helper text
 * @param error - Error message
 * @param disabled - Disable input
 * @param fullWidth - Make input full width
 * @param debounceMs - Debounce delay in milliseconds (default: 500)
 * @param showClearButton - Show clear button when input has value
 * @param autoFocus - Auto focus on mount
 * 
 * @example
 * ```tsx
 * <SearchBar
 *   value={searchQuery}
 *   onChange={setSearchQuery}
 *   onSearch={(query) => {
 *     console.log('Searching for:', query);
 *   }}
 *   placeholder="Search profiles..."
 *   debounceMs={300}
 *   showClearButton
 * />
 * ```
 */
export const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  (
    {
      value,
      onChange,
      onSearch,
      placeholder = 'Search...',
      label,
      helperText,
      error,
      disabled = false,
      fullWidth = true,
      debounceMs = 500,
      showClearButton = true,
      autoFocus = false,
      className,
      ...props
    },
    ref
  ) => {
    const [isSearching, setIsSearching] = useState(false);
    const debounceTimerRef = useRef<NodeJS.Timeout>();
    const inputRef = useRef<HTMLInputElement>(null);

    // Combine refs
    useEffect(() => {
      if (ref && inputRef.current) {
        if (typeof ref === 'function') {
          ref(inputRef.current);
        } else {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current =
            inputRef.current;
        }
      }
    }, [ref]);

    // Auto focus
    useEffect(() => {
      if (autoFocus && inputRef.current) {
        inputRef.current.focus();
      }
    }, [autoFocus]);

    // Debounced search
    useEffect(() => {
      if (!onSearch) return;

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set loading state
      if (value) {
        setIsSearching(true);
      }

      // Set new timer
      debounceTimerRef.current = setTimeout(() => {
        onSearch(value);
        setIsSearching(false);
      }, debounceMs);

      // Cleanup
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, [value, onSearch, debounceMs]);

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    };

    // Handle clear
    const handleClear = () => {
      onChange('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    // Handle keyboard shortcuts
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Escape to clear
      if (e.key === 'Escape') {
        handleClear();
      }

      // Enter to search immediately
      if (e.key === 'Enter' && onSearch) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        setIsSearching(false);
        onSearch(value);
      }
    };

    return (
      <div className={cn('relative', className)}>
        <GlassInput
          ref={inputRef}
          label={label}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          helperText={helperText}
          error={error}
          disabled={disabled}
          fullWidth={fullWidth}
          leftIcon={
            <svg
              className={cn(
                'w-5 h-5 transition-smooth',
                isSearching && 'animate-pulse text-passion-500'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          }
          rightIcon={
            showClearButton && value ? (
              <button
                type="button"
                onClick={handleClear}
                className="hover:bg-neutral-200 rounded-full p-1 transition-smooth"
                tabIndex={-1}
              >
                <svg
                  className="w-4 h-4 text-neutral-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            ) : isSearching ? (
              <svg
                className="animate-spin h-5 w-5 text-passion-500"
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
            ) : null
          }
          {...props}
        />

        {/* Keyboard shortcut hint */}
        {!disabled && !value && (
          <div className="absolute right-12 top-1/2 -translate-y-1/2 text-xs text-neutral-400 pointer-events-none">
            <kbd className="px-2 py-1 bg-neutral-100 rounded border border-neutral-300">
              Esc
            </kbd>
            <span className="mx-1">to clear</span>
          </div>
        )}
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';
