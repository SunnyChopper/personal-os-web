import { useState } from 'react';
import { X } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { FormInput } from '@/components/atoms/FormInput';
import { selectableChipClassName } from '@/pages/admin/personal-branding/personal-branding-ui';
import { cn } from '@/lib/utils';

export interface PresetMultiSelectChipsProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  presets: readonly string[];
  maxItems?: number;
  disabled?: boolean;
  addCustomLabel?: string;
  placeholder?: string;
}

function resolveCustomTag(trimmed: string, presets: readonly string[]): string {
  const matchingPreset = presets.find((preset) => preset === trimmed);
  return matchingPreset ?? trimmed;
}

export default function PresetMultiSelectChips({
  label,
  value,
  onChange,
  presets,
  maxItems = 30,
  disabled = false,
  addCustomLabel = 'Add custom',
  placeholder = 'Add a custom tag…',
}: PresetMultiSelectChipsProps) {
  const [draft, setDraft] = useState('');
  const atMax = value.length >= maxItems;
  const presetSet = new Set(presets);
  const customTags = value.filter((tag) => !presetSet.has(tag));

  const togglePreset = (preset: string) => {
    if (disabled) return;
    if (value.includes(preset)) {
      onChange(value.filter((tag) => tag !== preset));
      return;
    }
    if (atMax) return;
    onChange([...value, preset]);
  };

  const addCustomTag = () => {
    const trimmed = draft.trim();
    if (!trimmed || disabled || atMax) return;

    const resolved = resolveCustomTag(trimmed, presets);
    if (value.includes(resolved)) {
      setDraft('');
      return;
    }

    onChange([...value, resolved]);
    setDraft('');
  };

  const removeCustomTag = (tag: string) => {
    if (disabled) return;
    onChange(value.filter((item) => item !== tag));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">{label}</label>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label={`${label} presets`}>
        {presets.map((preset) => {
          const isActive = value.includes(preset);
          return (
            <button
              key={preset}
              type="button"
              onClick={() => togglePreset(preset)}
              className={cn(
                selectableChipClassName(isActive, 'rounded-full px-2.5 py-1 text-xs', disabled)
              )}
              aria-pressed={isActive}
              disabled={disabled || (!isActive && atMax)}
            >
              {preset}
            </button>
          );
        })}
      </div>

      {customTags.length > 0 ? (
        <div className="flex flex-wrap gap-2" aria-label={`${label} custom`}>
          {customTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs text-violet-900 dark:bg-violet-900/40 dark:text-violet-100"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeCustomTag(tag)}
                className="rounded p-0.5 hover:bg-violet-200 dark:hover:bg-violet-800"
                aria-label={`Remove ${tag}`}
                disabled={disabled}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <FormInput
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addCustomTag();
            }
          }}
          placeholder={placeholder}
          disabled={disabled || atMax}
          className="min-w-0 flex-1"
          aria-label={`${label} custom draft`}
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={addCustomTag}
          disabled={disabled || atMax || !draft.trim()}
        >
          {addCustomLabel}
        </Button>
      </div>

      {atMax ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">Maximum {maxItems} tags.</p>
      ) : null}
    </div>
  );
}
