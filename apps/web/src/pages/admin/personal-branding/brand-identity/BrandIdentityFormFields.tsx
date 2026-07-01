import { useState } from 'react';
import Button from '@/components/atoms/Button';
import { FormInput } from '@/components/atoms/FormInput';
import { FormTextarea } from '../PersonalBrandingFormFields';

export { FormTextarea };

interface StringListEditorProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function StringListEditor({
  label,
  values,
  onChange,
  placeholder = 'Add item',
  disabled = false,
}: StringListEditorProps) {
  const [draft, setDraft] = useState('');

  const addItem = () => {
    const trimmed = draft.trim();
    if (!trimmed || values.includes(trimmed)) return;
    onChange([...values, trimmed]);
    setDraft('');
  };

  const removeAt = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <div className="flex gap-2">
        <FormInput
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addItem();
            }
          }}
        />
        <Button type="button" size="sm" onClick={addItem} disabled={disabled || !draft.trim()}>
          Add
        </Button>
      </div>
      {values.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {values.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800"
            >
              <span>{item}</span>
              {!disabled && (
                <button
                  type="button"
                  aria-label={`Remove ${item}`}
                  onClick={() => removeAt(index)}
                  className="text-gray-500 hover:text-red-600"
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface ToneMetricsEditorProps {
  values: Record<string, number | unknown>;
  onChange: (values: Record<string, number>) => void;
  disabled?: boolean;
}

function clampToneMetric(value: number): number {
  return Math.min(1, Math.max(0, Math.round(value * 100) / 100));
}

function ToneMetricSlider({
  label,
  value,
  onChange,
  disabled,
  onRemove,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  onRemove?: () => void;
}) {
  return (
    <li className="space-y-2 rounded-lg border-2 border-gray-200 bg-white px-3 py-3 dark:border-gray-700 dark:bg-gray-950/40">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium capitalize text-gray-900 dark:text-white">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span className="tabular-nums text-xs font-semibold text-gray-600 dark:text-gray-300">
            {value.toFixed(2)}
          </span>
          {!disabled && onRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500">0</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={value}
          disabled={disabled}
          aria-label={`${label} tone metric`}
          onChange={(e) => onChange(clampToneMetric(Number(e.target.value)))}
          className="h-2 flex-1 cursor-pointer accent-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <span className="text-xs text-gray-500">1</span>
      </div>
    </li>
  );
}

export function ToneMetricsEditor({ values, onChange, disabled = false }: ToneMetricsEditorProps) {
  const [keyDraft, setKeyDraft] = useState('');
  const [valueDraft, setValueDraft] = useState(0.5);

  const entries = Object.entries(values).filter(([, v]) => typeof v === 'number') as [
    string,
    number,
  ][];

  const addMetric = () => {
    const key = keyDraft.trim();
    if (!key || entries.some(([existing]) => existing.toLowerCase() === key.toLowerCase())) return;
    onChange({ ...Object.fromEntries(entries), [key]: clampToneMetric(valueDraft) });
    setKeyDraft('');
    setValueDraft(0.5);
  };

  const removeKey = (key: string) => {
    const next = { ...Object.fromEntries(entries) };
    delete next[key];
    onChange(next);
  };

  const updateMetric = (key: string, nextValue: number) => {
    onChange({ ...Object.fromEntries(entries), [key]: clampToneMetric(nextValue) });
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Tone metrics
      </label>
      <div className="space-y-3 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/60 p-3 dark:border-gray-700 dark:bg-gray-900/30">
        <div className="flex flex-wrap items-end gap-2">
          <FormInput
            value={keyDraft}
            onChange={(e) => setKeyDraft(e.target.value)}
            placeholder="Metric name (e.g. formal, witty)"
            disabled={disabled}
            className="min-w-[160px] flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addMetric();
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addMetric}
            disabled={disabled || !keyDraft.trim()}
          >
            Add metric
          </Button>
        </div>
        <ToneMetricSlider
          label="Preview level"
          value={valueDraft}
          disabled={disabled}
          onChange={setValueDraft}
        />
      </div>
      {entries.length > 0 ? (
        <ul className="space-y-2">
          {entries.map(([key, val]) => (
            <ToneMetricSlider
              key={key}
              label={key}
              value={val}
              disabled={disabled}
              onChange={(nextValue) => updateMetric(key, nextValue)}
              onRemove={() => removeKey(key)}
            />
          ))}
        </ul>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Add dimensions like &quot;formal&quot;, &quot;technical&quot;, or &quot;playful&quot; and
          drag sliders from 0 to 1.
        </p>
      )}
    </div>
  );
}
