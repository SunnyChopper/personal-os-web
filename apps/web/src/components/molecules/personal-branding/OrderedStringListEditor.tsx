import { useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { Textarea } from '@/components/atoms/Textarea';

export interface OrderedStringListEditorProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxItems?: number;
  addLabel?: string;
}

function moveItem(values: string[], fromIndex: number, toIndex: number): string[] {
  if (toIndex < 0 || toIndex >= values.length) return values;
  const next = [...values];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export default function OrderedStringListEditor({
  label,
  values,
  onChange,
  placeholder = 'Add item',
  disabled = false,
  maxItems = 20,
  addLabel = 'Add',
}: OrderedStringListEditorProps) {
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState<string | null>(null);
  const draftRef = useRef<HTMLTextAreaElement>(null);
  const atMax = values.length >= maxItems;
  const duplicateCount = values.reduce<Record<string, number>>((counts, value) => {
    const key = value.trim().toLocaleLowerCase();
    if (key) counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});

  const addItem = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setDraftError('Enter a requirement before adding it.');
      return;
    }
    if (atMax) return;
    if (trimmed.length > 500) {
      setDraftError('Keep each requirement to 500 characters or fewer.');
      return;
    }
    if (values.some((item) => item.trim().toLocaleLowerCase() === trimmed.toLocaleLowerCase())) {
      setDraftError('That requirement is already in the list.');
      return;
    }
    onChange([...values, trimmed]);
    setDraft('');
    setDraftError(null);
  };

  const updateAt = (index: number, nextValue: string) => {
    onChange(values.map((item, i) => (i === index ? nextValue : item)));
  };

  const removeAt = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
    requestAnimationFrame(() => draftRef.current?.focus());
  };

  const moveUp = (index: number) => {
    onChange(moveItem(values, index, index - 1));
  };

  const moveDown = (index: number) => {
    onChange(moveItem(values, index, index + 1));
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor={`${label.toLocaleLowerCase().replace(/\s+/g, '-')}-new-item`}
        className="block text-sm font-medium text-gray-900 dark:text-gray-100"
      >
        {label}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Textarea
          ref={draftRef}
          id={`${label.toLocaleLowerCase().replace(/\s+/g, '-')}-new-item`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          aria-label={`${label} new item`}
          rows={2}
          disabled={disabled || atMax}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              addItem();
            }
          }}
          className="min-h-0 flex-1"
        />
        <Button
          type="button"
          size="sm"
          onClick={addItem}
          disabled={disabled || atMax || !draft.trim()}
        >
          {addLabel}
        </Button>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Add one item per row. Use Ctrl+Enter (Cmd+Enter on macOS) to add.
      </p>
      {draftError ? (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {draftError}
        </p>
      ) : null}
      {atMax ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">Maximum {maxItems} items.</p>
      ) : null}
      {values.length > 0 ? (
        <ul className="space-y-2">
          {values.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <span
                className="mt-2 w-6 shrink-0 text-right text-xs font-medium tabular-nums text-gray-500 dark:text-gray-400"
                aria-hidden="true"
              >
                {index + 1}.
              </span>
              <Textarea
                value={item}
                onChange={(e) => updateAt(index, e.target.value)}
                disabled={disabled}
                aria-label={`${label} item ${index + 1}`}
                rows={2}
                aria-invalid={
                  !item.trim() || duplicateCount[item.trim().toLocaleLowerCase()] > 1
                    ? true
                    : undefined
                }
                className="min-w-0 flex-1"
              />
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveUp(index)}
                  disabled={disabled || index === 0}
                  aria-label={`Move ${item || 'item'} up`}
                  className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                >
                  <ArrowUp className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(index)}
                  disabled={disabled || index === values.length - 1}
                  aria-label={`Move ${item || 'item'} down`}
                  className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                >
                  <ArrowDown className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  disabled={disabled}
                  aria-label={`Remove ${item || 'item'}`}
                  className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">No items yet.</p>
      )}
      {values.some(
        (item) => !item.trim() || duplicateCount[item.trim().toLocaleLowerCase()] > 1
      ) ? (
        <p className="text-xs text-red-600 dark:text-red-400" role="status">
          Remove blank rows and duplicate requirements before saving.
        </p>
      ) : null}
    </div>
  );
}
