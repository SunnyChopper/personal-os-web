import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formFieldClassName } from '@/components/atoms/FormInput';

export interface IconSelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

export interface IconSelectProps {
  value: string;
  onChange: (next: string) => void;
  options: IconSelectOption[];
  disabled?: boolean;
  className?: string;
  /** Accessible name for the trigger when no visible label is associated. */
  'aria-label'?: string;
}

/**
 * Custom single-select dropdown that renders icons alongside option labels.
 * Native `<select>` cannot render SVG icons inside `<option>` elements.
 */
export default function IconSelect({
  value,
  onChange,
  options,
  disabled = false,
  className,
  'aria-label': ariaLabel,
}: IconSelectProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId().replace(/:/g, '');

  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? options[0],
    [options, value]
  );

  useEffect(() => {
    const selectedIndex = options.findIndex((option) => option.value === value);
    setHighlight(selectedIndex >= 0 ? selectedIndex : 0);
  }, [open, options, value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const selectIndex = useCallback(
    (index: number) => {
      const option = options[index];
      if (!option) return;
      onChange(option.value);
      setOpen(false);
    },
    [onChange, options]
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) setOpen(true);
      else setHighlight((current) => Math.min(options.length - 1, current + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (open) setHighlight((current) => Math.max(0, current - 1));
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open) selectIndex(highlight);
      else setOpen(true);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className={cn('relative w-full', className)}>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`icon-select-list-${listId}`}
        className={cn(
          formFieldClassName,
          'flex w-full items-center justify-between gap-2 text-left',
          disabled && 'cursor-not-allowed opacity-60'
        )}
        onClick={() => !disabled && setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.icon}
          <span className="truncate">{selected?.label ?? 'Select…'}</span>
        </span>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-gray-500 transition-transform dark:text-gray-400',
            open && 'rotate-180'
          )}
          aria-hidden
        />
      </button>

      {open && options.length > 0 ? (
        <div
          id={`icon-select-list-${listId}`}
          role="listbox"
          className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800"
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={value === option.value}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-sm',
                highlight === index
                  ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100'
                  : 'text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
              )}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectIndex(index)}
              onMouseEnter={() => setHighlight(index)}
            >
              {option.icon}
              <span className="truncate">{option.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
