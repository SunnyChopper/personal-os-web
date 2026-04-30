import { useState, useRef, useEffect } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImpactScoreSelectorProps {
  value: number; // 1-5
  onChange: (value: number) => void;
  disabled?: boolean;
  label?: string;
}

const IMPACT_LABELS: Record<number, string> = {
  1: 'Very Low Impact',
  2: 'Low Impact',
  3: 'Medium Impact',
  4: 'High Impact',
  5: 'Very High Impact',
};

export function ImpactScoreSelector({
  value,
  onChange,
  disabled = false,
  label,
}: ImpactScoreSelectorProps) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const starRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Clamp value to valid range
  const currentValue = Math.max(1, Math.min(5, value || 1));
  const displayValue = hoveredValue ?? currentValue;

  const handleStarClick = (starValue: number) => {
    if (disabled) return;
    onChange(starValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent, starValue: number) => {
    if (disabled) return;

    const currentIndex = starValue - 1;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        if (currentIndex < 4) {
          const nextIndex = currentIndex + 1;
          setFocusedIndex(nextIndex);
          starRefs.current[nextIndex]?.focus();
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (currentIndex > 0) {
          const prevIndex = currentIndex - 1;
          setFocusedIndex(prevIndex);
          starRefs.current[prevIndex]?.focus();
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onChange(starValue);
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        starRefs.current[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(4);
        starRefs.current[4]?.focus();
        break;
    }
  };

  // Reset focused index when component loses focus
  useEffect(() => {
    const handleBlur = () => {
      // Use setTimeout to check if focus moved to another star
      setTimeout(() => {
        const hasFocus = starRefs.current.includes(
          document.activeElement as HTMLButtonElement | null
        );
        if (!hasFocus) {
          setFocusedIndex(null);
        }
      }, 0);
    };

    const refs = starRefs.current;
    refs.forEach((ref) => {
      ref?.addEventListener('blur', handleBlur);
    });

    return () => {
      refs.forEach((ref) => {
        ref?.removeEventListener('blur', handleBlur);
      });
    };
  }, []);

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div
        role="radiogroup"
        aria-label={label || 'Impact score'}
        className="flex items-center gap-2"
      >
        {[1, 2, 3, 4, 5].map((starValue) => {
          const isFilled = starValue <= displayValue;
          const isFocused = focusedIndex === starValue - 1;

          return (
            <button
              key={starValue}
              type="button"
              ref={(el) => {
                starRefs.current[starValue - 1] = el;
              }}
              role="radio"
              aria-checked={starValue === currentValue}
              aria-label={`Impact score ${starValue}: ${IMPACT_LABELS[starValue]}`}
              disabled={disabled}
              onClick={() => handleStarClick(starValue)}
              onMouseEnter={() => !disabled && setHoveredValue(starValue)}
              onMouseLeave={() => setHoveredValue(null)}
              onKeyDown={(e) => handleKeyDown(e, starValue)}
              onFocus={() => setFocusedIndex(starValue - 1)}
              className={cn(
                'p-1 rounded-md transition-all',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'hover:bg-gray-100 dark:hover:bg-gray-700',
                isFocused && 'ring-2 ring-blue-500 ring-offset-2'
              )}
            >
              <Star
                className={cn(
                  'w-6 h-6 transition-colors',
                  isFilled
                    ? 'fill-yellow-500 text-yellow-500 dark:fill-yellow-400 dark:text-yellow-400'
                    : 'fill-none text-gray-300 dark:text-gray-600',
                  !disabled && 'cursor-pointer'
                )}
              />
            </button>
          );
        })}
      </div>
      <div
        className="text-sm text-gray-600 dark:text-gray-400"
        aria-live="polite"
        aria-atomic="true"
      >
        {IMPACT_LABELS[displayValue]}
      </div>
    </div>
  );
}
