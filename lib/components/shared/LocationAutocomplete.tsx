import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';
import { GlassInput } from '@/lib/components/ui/GlassInput';

export interface LocationSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface LocationDetails {
  address: string;
  latitude: number;
  longitude: number;
  placeId: string;
}

export interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onLocationSelect: (location: LocationDetails) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  apiKey?: string;
}

/**
 * LocationAutocomplete Component
 * 
 * A location search component with Google Maps Places Autocomplete integration.
 * Provides real-time location suggestions and geocoding.
 * 
 * @param value - Current input value
 * @param onChange - Callback when input value changes
 * @param onLocationSelect - Callback when a location is selected with full details
 * @param label - Input label
 * @param placeholder - Input placeholder
 * @param error - Error message
 * @param helperText - Helper text
 * @param disabled - Disable input
 * @param fullWidth - Make input full width
 * @param apiKey - Google Maps API key (optional, can use env variable)
 * 
 * @example
 * ```tsx
 * <LocationAutocomplete
 *   value={location}
 *   onChange={setLocation}
 *   onLocationSelect={(details) => {
 *     console.log('Selected:', details);
 *   }}
 *   label="Location"
 *   placeholder="Enter your location"
 * />
 * ```
 */
export const LocationAutocomplete = React.forwardRef<HTMLInputElement, LocationAutocompleteProps>(
  (
    {
      value,
      onChange,
      onLocationSelect,
      label,
      placeholder = 'Enter location...',
      error,
      helperText,
      disabled = false,
      fullWidth = true,
      className,
      apiKey,
      ...props
    },
    ref
  ) => {
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const debounceTimerRef = useRef<NodeJS.Timeout>();
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close suggestions when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
          setShowSuggestions(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch location suggestions
    const fetchSuggestions = useCallback(async (input: string) => {
      if (!input || input.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);

      try {
        // In production, this would call Google Places Autocomplete API
        // For now, we'll use a mock implementation
        const mockSuggestions: LocationSuggestion[] = [
          {
            placeId: '1',
            description: `${input}, Nairobi, Kenya`,
            mainText: input,
            secondaryText: 'Nairobi, Kenya',
          },
          {
            placeId: '2',
            description: `${input}, Mombasa, Kenya`,
            mainText: input,
            secondaryText: 'Mombasa, Kenya',
          },
          {
            placeId: '3',
            description: `${input}, Kisumu, Kenya`,
            mainText: input,
            secondaryText: 'Kisumu, Kenya',
          },
        ];

        setSuggestions(mockSuggestions);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Error fetching location suggestions:', err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, []);

    // Debounced input handler
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(newValue);
      }, 300);
    };

    // Geocode selected location
    const geocodeLocation = async (placeId: string, description: string) => {
      try {
        // In production, this would call Google Geocoding API
        // For now, we'll use mock coordinates
        const mockLocation: LocationDetails = {
          address: description,
          latitude: -1.286389 + Math.random() * 0.1,
          longitude: 36.817223 + Math.random() * 0.1,
          placeId,
        };

        onLocationSelect(mockLocation);
      } catch (err) {
        console.error('Error geocoding location:', err);
      }
    };

    // Handle suggestion selection
    const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
      onChange(suggestion.description);
      setShowSuggestions(false);
      setSuggestions([]);
      setSelectedIndex(-1);
      geocodeLocation(suggestion.placeId, suggestion.description);
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestions || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            handleSelectSuggestion(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          setSelectedIndex(-1);
          break;
      }
    };

    return (
      <div ref={wrapperRef} className={cn('relative', className)}>
        <GlassInput
          ref={ref}
          label={label}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          disabled={disabled}
          fullWidth={fullWidth}
          leftIcon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          }
          rightIcon={
            isLoading ? (
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
            ) : null
          }
          {...props}
        />

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-2 glass-elevated rounded-xl shadow-lg max-h-60 overflow-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.placeId}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className={cn(
                  'w-full px-4 py-3 text-left transition-smooth',
                  'hover:bg-white/20 focus:bg-white/20',
                  'first:rounded-t-xl last:rounded-b-xl',
                  'focus:outline-none',
                  index === selectedIndex && 'bg-white/20'
                )}
              >
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-neutral-500 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-neutral-900 truncate">
                      {suggestion.mainText}
                    </div>
                    <div className="text-sm text-neutral-600 truncate">
                      {suggestion.secondaryText}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

LocationAutocomplete.displayName = 'LocationAutocomplete';
