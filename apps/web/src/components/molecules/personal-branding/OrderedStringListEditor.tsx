import { useState } from 'react';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { FormInput } from '@/components/atoms/FormInput';

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
  const atMax = values.length >= maxItems;

  const addItem = () => {
    const trimmed = draft.trim();
    if (!trimmed || atMax || values.includes(trimmed)) return;
    onChange([...values, trimmed]);
    setDraft('');
  };

  const updateAt = (index: number, nextValue: string) => {
    onChange(values.map((item, i) => (i === index ? nextValue : item)));
  };

  const removeAt = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const moveUp = (index: number) => {
    onChange(moveItem(values, index, index - 1));
  };

  const moveDown = (index: number) => {
    onChange(moveItem(values, index, index + 1));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">{label}</label>
      <div className="flex gap-2">
        <FormInput
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || atMax}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addItem();
            }
          }}
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
      {atMax ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">Maximum {maxItems} items.</p>
      ) : null}
      {values.length > 0 ? (
        <ul className="space-y-2">
          {values.map((item, index) => (
            <li key={`${index}-${item}`} className="flex items-center gap-2">
              <FormInput
                value={item}
                onChange={(e) => updateAt(index, e.target.value)}
                disabled={disabled}
                aria-label={`${label} item ${index + 1}`}
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
    </div>
  );
}
