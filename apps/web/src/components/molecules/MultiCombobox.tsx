import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormInput } from '@/components/atoms/FormInput';
import type { ComboboxOption } from '@/components/molecules/Combobox';

export interface MultiComboboxProps {
  value: string[];
  onChange: (next: string[]) => void;
  options: ComboboxOption[] | string[];
  disabled?: boolean;
  placeholder?: string;
  isLoading?: boolean;
  minItems?: number;
  maxItems?: number;
  /** Optional map value -> label for selected pills */
  labelLookup?: Record<string, string>;
  className?: string;
}

function normalizeOptions(options: ComboboxOption[] | string[]): ComboboxOption[] {
  return options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
}

/**
 * Searchable multi-select combobox with removable pills.
 */
export default function MultiCombobox({
  value,
  onChange,
  options,
  disabled = false,
  placeholder = 'Search and add…',
  isLoading = false,
  minItems = 0,
  maxItems = Number.POSITIVE_INFINITY,
  labelLookup = {},
  className,
}: MultiComboboxProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId().replace(/:/g, '');

  const normalized = useMemo(() => normalizeOptions(options), [options]);
  const selectedSet = useMemo(() => new Set(value), [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const available = normalized.filter((o) => !selectedSet.has(o.value));
    if (!q) return available;
    return available.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
    );
  }, [normalized, query, selectedSet]);

  useEffect(() => {
    setHighlight(0);
  }, [open, filtered.length, query]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const add = useCallback(
    (opt: ComboboxOption) => {
      if (selectedSet.has(opt.value)) return;
      if (value.length >= maxItems) return;
      onChange([...value, opt.value]);
      setQuery('');
      setOpen(false);
    },
    [selectedSet, value, maxItems, onChange]
  );

  const remove = useCallback(
    (id: string) => {
      if (value.length <= minItems) return;
      onChange(value.filter((v) => v !== id));
    },
    [value, minItems, onChange]
  );

  const selectIndex = useCallback(
    (index: number) => {
      const opt = filtered[index];
      if (!opt) return;
      add(opt);
    },
    [filtered, add]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      else setHighlight((h) => Math.min(filtered.length - 1, h + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (open) setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === 'Enter') {
      if (open && filtered.length > 0) {
        e.preventDefault();
        selectIndex(highlight);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'Backspace' && !query && value.length > minItems) {
      onChange(value.slice(0, -1));
    }
  };

  const labelFor = (id: string) =>
    normalized.find((o) => o.value === id)?.label ?? labelLookup[id] ?? id;

  return (
    <div ref={wrapRef} className={cn('space-y-2', className)}>
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-sm text-blue-900 dark:bg-blue-900/40 dark:text-blue-100"
            >
              {labelFor(id)}
              <button
                type="button"
                onClick={() => remove(id)}
                disabled={disabled || value.length <= minItems}
                className="rounded p-0.5 hover:bg-blue-200 disabled:opacity-40 dark:hover:bg-blue-800"
                aria-label={`Remove ${labelFor(id)}`}
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative">
        <div className="relative flex items-center">
          <FormInput
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => !disabled && setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || value.length >= maxItems}
            autoComplete="off"
            aria-busy={isLoading}
            aria-expanded={open}
            aria-controls={`multicombo-list-${listId}`}
            aria-haspopup="listbox"
            role="combobox"
            className="pr-10"
          />
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => !disabled && setOpen((o) => !o)}
            className={cn(
              'absolute right-2 rounded p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600',
              isLoading && 'animate-pulse opacity-60'
            )}
            aria-label={isLoading ? 'Loading options' : 'Toggle options'}
          >
            <ChevronDown size={18} className={cn('transition-transform', open && 'rotate-180')} />
          </button>
        </div>

        {open && filtered.length > 0 ? (
          <div
            id={`multicombo-list-${listId}`}
            role="listbox"
            className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800"
          >
            {filtered.map((opt, i) => (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={highlight === i}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm',
                  highlight === i
                    ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100'
                    : 'text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => add(opt)}
                onMouseEnter={() => setHighlight(i)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
