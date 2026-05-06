import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CategoryComboboxProps {
  value: string;
  onChange: (next: string) => void;
  options: string[];
  disabled?: boolean;
  placeholder?: string;
}

type Row = { kind: 'opt'; label: string } | { kind: 'create'; label: string; createValue: string };

/**
 * Text input with dropdown of known categories; supports creating a new value.
 */
export default function CategoryCombobox({
  value,
  onChange,
  options,
  disabled = false,
  placeholder = 'Enter or select a category',
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId().replace(/:/g, '');

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, value]);

  const rows = useMemo((): Row[] => {
    const opts: Row[] = filtered.slice(0, 50).map((o) => ({ kind: 'opt', label: o }));
    const exact = options.some((o) => o.toLowerCase() === value.trim().toLowerCase());
    const t = value.trim();
    if (t && !exact) {
      opts.push({
        kind: 'create',
        label: `Create "${t}"`,
        createValue: t,
      });
    }
    return opts;
  }, [filtered, options, value]);

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
      if (row.kind === 'create') {
        onChange(row.createValue);
      } else {
        onChange(row.label);
      }
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
    <div ref={wrapRef} className="relative">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => !disabled && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          aria-expanded={open}
          aria-controls={`category-list-${listId}`}
          aria-haspopup="listbox"
          role="combobox"
          className={cn(
            'w-full pl-3 pr-10 py-2 rounded-lg border bg-white dark:bg-gray-700',
            'border-gray-300 dark:border-gray-600',
            'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white'
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          className="absolute right-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500"
          aria-label="Toggle categories"
        >
          <ChevronDown size={18} className={cn('transition-transform', open && 'rotate-180')} />
        </button>
      </div>

      {open && rows.length > 0 && (
        <div
          id={`category-list-${listId}`}
          role="listbox"
          className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg py-1"
        >
          {rows.map((row, i) => (
            <button
              key={row.kind === 'opt' ? `opt-${row.label}` : `create-${row.createValue}`}
              type="button"
              role="option"
              aria-selected={highlight === i}
              className={cn(
                'w-full px-3 py-2 text-left text-sm',
                row.kind === 'create' && 'border-t border-gray-100 dark:border-gray-700 italic',
                highlight === i
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
              )}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectIndex(i)}
              onMouseEnter={() => setHighlight(i)}
            >
              {row.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
