import { useMemo } from 'react';
import { ProviderBrandBadge } from '@/components/atoms/ProviderBrandBadge';
import { ModelPicker } from '@/components/molecules/ModelPicker';
import {
  formatModelDisplayLabel,
  formatProviderDisplay,
} from '@/components/settings/assistantMemoryIngestionDisplay';
import {
  MAX_FACT_CRITERIA_ITEMS,
  MAX_FACT_CRITERIA_ITEM_CHARS,
} from '@/components/settings/assistantMemoryIngestionFactCriteria';
import type { AssistantMemoryIngestionFactCriteria } from '@/types/api-contracts';
import type { AssistantModelCatalogData, AssistantModelCatalogEntry } from '@/types/chatbot';

function formatUsdPerMtok(n: number): string {
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(3)}`;
  return `$${n.toFixed(4)}`;
}

type FactCriteriaListProps = {
  idPrefix: string;
  title: string;
  hint?: string;
  items: string[];
  disabled?: boolean;
  onChange: (items: string[]) => void;
};

function FactCriteriaListEditor({
  idPrefix,
  title,
  hint,
  items,
  disabled,
  onChange,
}: FactCriteriaListProps) {
  const inputClass =
    'flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100';

  const updateItem = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const addItem = () => {
    if (items.length >= MAX_FACT_CRITERIA_ITEMS) return;
    onChange([...items, '']);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
          {items.length} / {MAX_FACT_CRITERIA_ITEMS}
        </span>
      </div>
      {hint ? <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p> : null}
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={`${idPrefix}-${index}`} className="flex gap-2">
            <input
              id={`${idPrefix}-${index}`}
              type="text"
              className={inputClass}
              value={item}
              maxLength={MAX_FACT_CRITERIA_ITEM_CHARS}
              disabled={disabled}
              placeholder="Describe a rule…"
              onChange={(e) => updateItem(index, e.target.value)}
            />
            <button
              type="button"
              aria-label="Remove rule"
              disabled={disabled}
              onClick={() => removeItem(index)}
              className="shrink-0 px-2.5 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-50 text-sm"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={disabled || items.length >= MAX_FACT_CRITERIA_ITEMS}
        onClick={addItem}
        className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-50"
      >
        + Add rule
      </button>
    </div>
  );
}

export type AssistantMemoryIngestionFormProps = {
  catalog: AssistantModelCatalogData | null;
  provider: string;
  model: string;
  factCriteria: AssistantMemoryIngestionFactCriteria;
  isCustom: boolean;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
  onFactCriteriaChange: (criteria: AssistantMemoryIngestionFactCriteria) => void;
  onResetToServerDefaults: () => void;
  resetting: boolean;
  disabled?: boolean;
};

export function AssistantMemoryIngestionForm({
  catalog,
  provider,
  model,
  factCriteria,
  isCustom,
  onProviderChange,
  onModelChange,
  onFactCriteriaChange,
  onResetToServerDefaults,
  resetting,
  disabled,
}: AssistantMemoryIngestionFormProps) {
  const catalogModels = useMemo(() => {
    if (!catalog?.models.length) return [];
    return catalog.models.slice().sort((a, b) => {
      const byProvider = formatProviderDisplay(a.provider).localeCompare(
        formatProviderDisplay(b.provider)
      );
      if (byProvider !== 0) return byProvider;
      return (
        b.qualityScore - a.qualityScore ||
        formatModelDisplayLabel(a.label, a.provider).localeCompare(
          formatModelDisplayLabel(b.label, b.provider)
        )
      );
    });
  }, [catalog]);

  const selectedEntry = useMemo((): AssistantModelCatalogEntry | null => {
    if (!catalog?.models.length) return null;
    return (
      catalog.models.find((m) => m.provider === provider && m.apiModelId === model) ??
      catalog.models.find((m) => m.apiModelId === model) ??
      null
    );
  }, [catalog, provider, model]);

  const showCatalogPicker = catalogModels.length > 0 && (selectedEntry != null || !model.trim());

  const selectClass =
    'mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100';

  const handleCatalogModelChange = (apiModelId: string) => {
    const entry =
      catalogModels.find((m) => m.apiModelId === apiModelId && m.provider === provider) ??
      catalogModels.find((m) => m.apiModelId === apiModelId);
    if (entry) {
      onProviderChange(entry.provider);
      onModelChange(entry.apiModelId);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Used after each assistant reply for short-term memory notes (standout facts only — not
        assistant briefings) and for condensing long threads when context limits require it.
      </p>

      <div>
        <label
          htmlFor="mem-ingest-model"
          className="text-sm font-medium text-gray-900 dark:text-gray-100"
        >
          Model
        </label>
        {showCatalogPicker ? (
          <div className="mt-1" id="mem-ingest-model">
            <ModelPicker
              models={catalogModels}
              valueApiModelId={selectedEntry?.apiModelId ?? model}
              onChange={handleCatalogModelChange}
              disabled={disabled || !catalog}
              showProviderBadge
              emptyMessage="No models available — configure at least one LLM provider on the backend."
            />
          </div>
        ) : (
          <input
            id="mem-ingest-model"
            type="text"
            className={selectClass}
            value={model}
            disabled={disabled}
            onChange={(e) => onModelChange(e.target.value)}
            placeholder="e.g. llama-3.1-8b-instant"
            autoComplete="off"
          />
        )}
      </div>

      {selectedEntry ? (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 px-4 py-3 space-y-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Selected model
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <ProviderBrandBadge providerId={selectedEntry.provider} />
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {formatModelDisplayLabel(selectedEntry.label, selectedEntry.provider)}
              </p>
            </div>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Speed</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100 tabular-nums">
                {selectedEntry.speedScore}
                <span className="text-gray-500 dark:text-gray-400 font-normal"> / 10</span>
              </dd>
              <dd className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Higher = faster responses
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Cost</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100 tabular-nums">
                {selectedEntry.costScore}
                <span className="text-gray-500 dark:text-gray-400 font-normal"> / 10</span>
              </dd>
              <dd className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Higher = cheaper to run
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Intelligence</dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100 tabular-nums">
                {selectedEntry.qualityScore}
                <span className="text-gray-500 dark:text-gray-400 font-normal"> / 10</span>
              </dd>
              <dd className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Higher = stronger reasoning / output
              </dd>
            </div>
          </dl>
          {(selectedEntry.inputUsdPerMtok != null || selectedEntry.outputUsdPerMtok != null) && (
            <p className="text-xs text-gray-600 dark:text-gray-300">
              <span className="font-medium text-gray-700 dark:text-gray-200">List price</span>
              {' · '}
              {selectedEntry.inputUsdPerMtok != null && (
                <span>Input {formatUsdPerMtok(selectedEntry.inputUsdPerMtok)} / 1M tok</span>
              )}
              {selectedEntry.inputUsdPerMtok != null &&
                selectedEntry.outputUsdPerMtok != null &&
                ' · '}
              {selectedEntry.outputUsdPerMtok != null && (
                <span>Output {formatUsdPerMtok(selectedEntry.outputUsdPerMtok)} / 1M tok</span>
              )}
            </p>
          )}
          {selectedEntry.publishedTps != null && selectedEntry.publishedTps > 0 && (
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Published throughput ~{selectedEntry.publishedTps.toLocaleString()} tokens/s
            </p>
          )}
          {selectedEntry.pricingNote ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">{selectedEntry.pricingNote}</p>
          ) : null}
        </div>
      ) : model.trim() ? (
        <p className="text-xs text-gray-500 dark:text-gray-400 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-3 py-2">
          No catalog entry for this model id — speed, cost, and intelligence scores are only shown
          when the id matches the assistant model catalog.
        </p>
      ) : null}

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Standout fact filters
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Rules are appended to the extraction and thread-summarization prompts. They do not
            affect long-term memory consolidation (cognitive model). Save settings to apply; reset
            clears filters with the model override.
          </p>
        </div>
        <FactCriteriaListEditor
          idPrefix="mem-ingest-always"
          title="Always capture (examples)"
          hint="e.g. capital changes, technical code adjustments, target dates"
          items={factCriteria.alwaysCapture}
          disabled={disabled}
          onChange={(alwaysCapture) => onFactCriteriaChange({ ...factCriteria, alwaysCapture })}
        />
        <FactCriteriaListEditor
          idPrefix="mem-ingest-never"
          title="Never capture"
          items={factCriteria.neverCapture}
          disabled={disabled}
          onChange={(neverCapture) => onFactCriteriaChange({ ...factCriteria, neverCapture })}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {isCustom
            ? 'You have saved a custom model. Server defaults apply when you reset (model and fact filters).'
            : 'Using server default model from deployment config. Fact filters are saved with your settings.'}
        </p>
        <button
          type="button"
          onClick={() => void onResetToServerDefaults()}
          disabled={resetting || disabled || !isCustom}
          className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-50"
        >
          {resetting ? 'Resetting…' : 'Reset to server defaults'}
        </button>
      </div>
    </div>
  );
}
