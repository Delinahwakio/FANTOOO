import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { GlassInput } from '@/lib/components/ui/GlassInput';

export interface DatePickerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

/**
 * DatePicker Component
 * 
 * A custom date picker component with calendar view and keyboard navigation.
 * 
 * @param value - Selected date
 * @param onChange - Callback when date is selected
 * @param label - Input label
 * @param placeholder - Input placeholder
 * @param error - Error message
 * @param helperText - Helper text
 * @param disabled - Disable picker
 * @param fullWidth - Make picker full width
 * @param minDate - Minimum selectable date
 * @param maxDate - Maximum selectable date
 * 
 * @example
 * ```tsx
 * <DatePicker
 *   value={selectedDate}
 *   onChange={setSelectedDate}
 *   label="Birth Date"
 *   minDate={new Date('1900-01-01')}
 *   maxDate={new Date()}
 * />
 * ```
 */
export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Select date...',
  error,
  helperText,
  disabled = false,
  fullWidth = true,
  minDate,
  maxDate,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const [inputValue, setInputValue] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Format date for display
  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Update input value when value changes
  useEffect(() => {
    setInputValue(formatDate(value || null));
  }, [value]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get days in month
  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday, 6 = Saturday)
  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Check if date is disabled
  const isDateDisabled = (date: Date): boolean => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  // Check if date is selected
  const isDateSelected = (date: Date): boolean => {
    if (!value) return false;
    return (
      date.getDate() === value.getDate() &&
      date.getMonth() === value.getMonth() &&
      date.getFullYear() === value.getFullYear()
    );
  };

  // Check if date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Handle date selection
  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );

    if (!isDateDisabled(selectedDate)) {
      onChange(selectedDate);
      setIsOpen(false);
    }
  };

  // Navigate months
  const handlePreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days: (number | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const monthYear = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      <GlassInput
        label={label}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        error={error}
        helperText={helperText}
        disabled={disabled}
        fullWidth={fullWidth}
        readOnly
        leftIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        }
      />

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 glass-elevated rounded-xl shadow-lg p-4 w-full min-w-[320px]">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-white/20 rounded-lg transition-smooth"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <div className="font-semibold text-neutral-900">{monthYear}</div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 hover:bg-white/20 rounded-lg transition-smooth"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-neutral-600 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} />;
              }

              const date = new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth(),
                day
              );
              const disabled = isDateDisabled(date);
              const selected = isDateSelected(date);
              const today = isToday(date);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  disabled={disabled}
                  className={cn(
                    'aspect-square rounded-lg text-sm font-medium transition-smooth',
                    'hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-passion-500',
                    selected && 'bg-gradient-passion text-white hover:bg-passion-600',
                    !selected && today && 'border-2 border-passion-500 text-passion-600',
                    !selected && !today && 'text-neutral-700',
                    disabled && 'opacity-30 cursor-not-allowed hover:bg-transparent'
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Today Button */}
          <div className="mt-4 pt-4 border-t border-white/20">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                if (!isDateDisabled(today)) {
                  onChange(today);
                  setIsOpen(false);
                }
              }}
              className="w-full py-2 text-sm font-medium text-passion-600 hover:bg-white/20 rounded-lg transition-smooth"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
