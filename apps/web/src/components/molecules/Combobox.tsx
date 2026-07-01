import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormInput } from '@/components/atoms/FormInput';

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  value: string;
  onChange: (next: string) => void;
  options: ComboboxOption[] | string[];
  disabled?: boolean;
  placeholder?: string;
  isLoading?: boolean;
  /** When true, allow committing a typed value not in options */
  allowCreate?: boolean;
  className?: string;
}

type Row =
  | { kind: 'opt'; value: string; label: string }
  | { kind: 'create'; value: string; label: string };

function normalizeOptions(options: ComboboxOption[] | string[]): ComboboxOption[] {
  return options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
}

/**
 * Searchable single-select combobox with optional create-from-typed-value.
 */
export default function Combobox({
  value,
  onChange,
  options,
  disabled = false,
  placeholder = 'Search or select…',
  isLoading = false,
  allowCreate = false,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId().replace(/:/g, '');

  const normalized = useMemo(() => normalizeOptions(options), [options]);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return normalized;
    return normalized.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
    );
  }, [normalized, value]);

  const rows = useMemo((): Row[] => {
    const opts: Row[] = filtered.slice(0, 50).map((o) => ({
      kind: 'opt',
      value: o.value,
      label: o.label,
    }));
    if (allowCreate) {
      const exact = normalized.some((o) => o.label.toLowerCase() === value.trim().toLowerCase());
      const t = value.trim();
      if (t && !exact) {
        opts.push({ kind: 'create', value: t, label: `Create "${t}"` });
      }
    }
    return opts;
  }, [filtered, normalized, value, allowCreate]);

  useEffect(() => {
    setHighlight(0);
  }, [open, rows.length, value]);

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

  const selectIndex = useCallback(
    (index: number) => {
      const row = rows[index];
      if (!row) return;
      onChange(row.value);
      setOpen(false);
      inputRef.current?.blur();
    },
    [rows, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      else setHighlight((h) => Math.min(rows.length - 1, h + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (open) setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === 'Enter') {
      if (open && rows.length > 0) {
        e.preventDefault();
        selectIndex(highlight);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <div className="relative flex items-center">
        <FormInput
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => !disabled && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          aria-busy={isLoading}
          aria-expanded={open}
          aria-controls={`combobox-list-${listId}`}
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

      {open && rows.length > 0 ? (
        <div
          id={`combobox-list-${listId}`}
          role="listbox"
          className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800"
        >
          {rows.map((row, i) => (
            <button
              key={row.kind === 'opt' ? `opt-${row.value}` : `create-${row.value}`}
              type="button"
              role="option"
              aria-selected={highlight === i}
              className={cn(
                'w-full px-3 py-2 text-left text-sm',
                row.kind === 'create' && 'border-t border-gray-100 italic dark:border-gray-700',
                highlight === i
                  ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100'
                  : 'text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
              )}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectIndex(i)}
              onMouseEnter={() => setHighlight(i)}
            >
              {row.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
