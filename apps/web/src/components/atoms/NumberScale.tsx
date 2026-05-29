import { cn } from '@/lib/utils';

export interface NumberScaleProps {
  min: number;
  max: number;
  value: number | null;
  onChange: (value: number) => void;
  /** Accessible name for the scale group */
  'aria-label': string;
  className?: string;
  disabled?: boolean;
}

/**
 * Clickable 1–N pill scale for subjective ratings (sleep quality, energy, etc.).
 */
export function NumberScale({
  min,
  max,
  value,
  onChange,
  'aria-label': ariaLabel,
  className,
  disabled = false,
}: NumberScaleProps) {
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div role="group" aria-label={ariaLabel} className={cn('flex flex-wrap gap-1.5', className)}>
      {options.map((n) => {
        const selected = value === n;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            aria-label={`${n}`}
            onClick={() => onChange(n)}
            className={cn(
              'flex h-9 min-w-[2.25rem] flex-1 items-center justify-center rounded-lg border text-sm font-medium transition-colors sm:flex-none sm:min-w-[2.5rem]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40',
              'disabled:pointer-events-none disabled:opacity-50',
              selected
                ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500'
                : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-200 dark:hover:border-blue-500 dark:hover:bg-blue-950/40'
            )}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
