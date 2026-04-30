import { useMemo } from 'react';
import {
  formatModelDisplayLabel,
  formatProviderDisplay,
} from '@/components/settings/assistantMemoryIngestionDisplay';
import type { AssistantModelCatalogData, AssistantModelCatalogEntry } from '@/types/chatbot';

function formatUsdPerMtok(n: number): string {
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(3)}`;
  return `$${n.toFixed(4)}`;
}

export type AssistantMemoryIngestionFormProps = {
  catalog: AssistantModelCatalogData | null;
  provider: string;
  model: string;
  isCustom: boolean;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
  onResetToServerDefaults: () => void;
  resetting: boolean;
  disabled?: boolean;
};

export function AssistantMemoryIngestionForm({
  catalog,
  provider,
  model,
  isCustom,
  onProviderChange,
  onModelChange,
  onResetToServerDefaults,
  resetting,
  disabled,
}: AssistantMemoryIngestionFormProps) {
  const providerOptions = useMemo(() => {
    if (!catalog?.models.length) return [];
    const set = new Set<string>();
    for (const m of catalog.models) {
      set.add(m.provider);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [catalog]);

  const modelsForProvider = useMemo(() => {
    if (!catalog) return [];
    return catalog.models
      .filter((m) => m.provider === provider)
      .sort((a, b) =>
        formatModelDisplayLabel(a.label, a.provider).localeCompare(
          formatModelDisplayLabel(b.label, b.provider)
        )
      );
  }, [catalog, provider]);

  const selectedEntry = useMemo((): AssistantModelCatalogEntry | null => {
    if (!catalog?.models.length) return null;
    return catalog.models.find((m) => m.apiModelId === model) ?? null;
  }, [catalog, model]);

  const selectClass =
    'mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100';

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Used after each assistant reply for short-term memory notes and for condensing long threads
        when context limits require it. Choose a small, fast model unless you need higher quality
        extractions.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="mem-ingest-provider"
            className="text-sm font-medium text-gray-900 dark:text-gray-100"
          >
            Provider
          </label>
          <select
            id="mem-ingest-provider"
            className={selectClass}
            value={provider}
            disabled={disabled || !catalog}
            onChange={(e) => onProviderChange(e.target.value)}
          >
            {!catalog ? (
              <option value="">Loading…</option>
            ) : providerOptions.length === 0 ? (
              <option value={provider}>{formatProviderDisplay(provider || '') || '—'}</option>
            ) : (
              providerOptions.map((p) => {
                const configured = catalog.providersConfigured[p] !== false;
                return (
                  <option key={p} value={p} disabled={!configured}>
                    {formatProviderDisplay(p)}
                    {!configured ? ' (not configured)' : ''}
                  </option>
                );
              })
            )}
          </select>
        </div>
        <div>
          <label
            htmlFor="mem-ingest-model"
            className="text-sm font-medium text-gray-900 dark:text-gray-100"
          >
            Model
          </label>
          {modelsForProvider.length > 0 && modelsForProvider.some((m) => m.apiModelId === model) ? (
            <select
              id="mem-ingest-model"
              className={selectClass}
              value={model}
              disabled={disabled || !catalog}
              onChange={(e) => onModelChange(e.target.value)}
            >
              {modelsForProvider.map((m) => (
                <option key={m.id} value={m.apiModelId}>
                  {formatModelDisplayLabel(m.label, m.provider)}
                </option>
              ))}
            </select>
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
      </div>

      {selectedEntry ? (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 px-4 py-3 space-y-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Selected model
            </h3>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5">
              {formatProviderDisplay(selectedEntry.provider)} ·{' '}
              {formatModelDisplayLabel(selectedEntry.label, selectedEntry.provider)}
            </p>
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

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {isCustom
            ? 'You have saved a custom model. Server defaults apply when you reset.'
            : 'Using server default from deployment config (or your last reset).'}
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
