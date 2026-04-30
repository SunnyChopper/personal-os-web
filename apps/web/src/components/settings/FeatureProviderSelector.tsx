import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Gauge, Save, Sparkles, Zap } from 'lucide-react';
import {
  type AIFeature,
  type LLMProvider,
  AI_FEATURE_DISPLAY_NAMES,
  AI_FEATURE_GROUPS,
  setFeatureConfig,
  getFeatureConfig,
  getFeatureConfigSync,
} from '@/lib/llm';
import { PROVIDER_DISPLAY_NAMES } from '@/lib/llm/config/provider-types';
import { queryKeys } from '@/lib/react-query/query-keys';
import { chatbotService } from '@/services/chatbot.service';
import type { AssistantModelCatalogEntry } from '@/types/chatbot';
import { cn } from '@/lib/utils';

function isLLMProvider(p: string): p is LLMProvider {
  return p in PROVIDER_DISPLAY_NAMES;
}

function ModelPicker({
  models,
  valueApiModelId,
  onChange,
  disabled,
}: {
  models: AssistantModelCatalogEntry[];
  valueApiModelId: string;
  onChange: (apiModelId: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = models.find((m) => m.apiModelId === valueApiModelId) ?? models[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (!models.length) {
    return (
      <p className="text-sm text-amber-700 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800 px-3 py-2">
        No models in catalog for this provider.
      </p>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-left text-sm',
          'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
          'hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="font-medium truncate">{selected?.label ?? valueApiModelId}</div>
          {selected ? (
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              <span className="inline-flex items-center gap-0.5">
                <Sparkles className="w-3 h-3" />
                Quality {selected.qualityScore}/10
              </span>
              <span className="inline-flex items-center gap-0.5">
                <Zap className="w-3 h-3" />
                Speed {selected.speedScore}/10
              </span>
              <span className="inline-flex items-center gap-0.5">
                <Gauge className="w-3 h-3" />
                Cost {selected.costScore}/10
              </span>
              {selected.contextTokens ? (
                <span>{(selected.contextTokens / 1000).toFixed(0)}k ctx</span>
              ) : null}
            </div>
          ) : null}
        </div>
        <ChevronDown className={cn('w-4 h-4 shrink-0 opacity-60', open && 'rotate-180')} />
      </button>
      {open ? (
        <div
          className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-lg"
          role="listbox"
        >
          {models.map((m) => (
            <button
              key={m.id}
              type="button"
              role="option"
              aria-selected={m.apiModelId === valueApiModelId}
              onClick={() => {
                onChange(m.apiModelId);
                setOpen(false);
              }}
              className={cn(
                'w-full text-left px-3 py-2.5 text-sm border-b border-gray-100 dark:border-gray-800 last:border-0',
                'hover:bg-gray-50 dark:hover:bg-gray-800/80',
                m.apiModelId === valueApiModelId && 'bg-blue-50 dark:bg-blue-950/40'
              )}
            >
              <div className="font-medium text-gray-900 dark:text-gray-100">{m.label}</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Quality {m.qualityScore} · Speed {m.speedScore} · Cost {m.costScore}
                {m.contextTokens ? ` · ${(m.contextTokens / 1000).toFixed(0)}k ctx` : ''}
              </div>
              {m.bestFor?.length ? (
                <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                  {m.bestFor.slice(0, 3).join(' · ')}
                </div>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function FeatureProviderSelector() {
  const [selectedFeature, setSelectedFeature] = useState<AIFeature>('parseTask');
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>('anthropic');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const catalogQuery = useQuery({
    queryKey: queryKeys.chatbot.modelCatalog(),
    queryFn: () => chatbotService.getAssistantModelCatalog(),
    staleTime: 5 * 60_000,
  });

  const catalog = catalogQuery.data;
  const catalogError = catalogQuery.isError;

  const configuredProviders = useMemo(() => {
    if (!catalog?.providersConfigured) return [] as LLMProvider[];
    return (Object.keys(catalog.providersConfigured) as string[])
      .filter((k) => catalog.providersConfigured[k] && isLLMProvider(k))
      .sort((a, b) =>
        (PROVIDER_DISPLAY_NAMES[a as LLMProvider] || a).localeCompare(
          PROVIDER_DISPLAY_NAMES[b as LLMProvider] || b
        )
      ) as LLMProvider[];
  }, [catalog]);

  const modelsForProvider = useMemo(() => {
    if (!catalog?.models.length) return [];
    return catalog.models
      .filter((m) => m.provider === selectedProvider)
      .slice()
      .sort((a, b) => b.qualityScore - a.qualityScore || a.label.localeCompare(b.label));
  }, [catalog, selectedProvider]);

  const syncFromFeatureConfig = useCallback(async () => {
    if (!catalog || configuredProviders.length === 0) return;
    const config = await getFeatureConfig(selectedFeature);
    let prov = config.provider;
    if (!isLLMProvider(prov) || !configuredProviders.includes(prov)) {
      prov = configuredProviders[0];
    }
    setSelectedProvider(prov);
    const models = catalog.models.filter((m) => m.provider === prov);
    const match = models.find((m) => m.apiModelId === config.model);
    if (match) {
      setSelectedModelId(match.apiModelId);
    } else if (models.length) {
      setSelectedModelId(models[0].apiModelId);
    } else {
      setSelectedModelId(config.model);
    }
  }, [catalog, configuredProviders, selectedFeature]);

  useEffect(() => {
    void syncFromFeatureConfig();
  }, [syncFromFeatureConfig]);

  useEffect(() => {
    if (
      !modelsForProvider.length ||
      modelsForProvider.some((m) => m.apiModelId === selectedModelId)
    )
      return;
    setSelectedModelId(modelsForProvider[0].apiModelId);
  }, [modelsForProvider, selectedModelId]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await setFeatureConfig(selectedFeature, selectedProvider, selectedModelId);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to save feature config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (catalogQuery.isLoading) {
    return (
      <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading model catalog…</p>
      </div>
    );
  }

  if (catalogError || !catalog?.models.length) {
    return (
      <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">
          Model catalog unavailable
        </h3>
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Could not load models from the server. Check your connection and try again. Feature picks
          fall back to the bundled static list only after a successful catalog load.
        </p>
      </div>
    );
  }

  if (configuredProviders.length === 0) {
    return (
      <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
          No providers configured
        </h3>
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          Enable at least one LLM provider on the backend (API keys / secrets) so the catalog lists
          available models.
        </p>
      </div>
    );
  }

  const allFeatures = AI_FEATURE_GROUPS.flatMap((g) => g.features);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Feature provider configuration
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose provider and model per feature using the live catalog from{' '}
          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
            GET /assistant/model-catalog
          </code>
          . Scores are hints for quality, latency, and cost-efficiency.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            AI feature
          </label>
          <select
            value={selectedFeature}
            onChange={(e) => setSelectedFeature(e.target.value as AIFeature)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          >
            {AI_FEATURE_GROUPS.map((group) => (
              <optgroup key={group.id} label={group.label}>
                {group.features.map((feature) => (
                  <option key={feature} value={feature}>
                    {AI_FEATURE_DISPLAY_NAMES[feature]}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Provider
          </label>
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value as LLMProvider)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          >
            {configuredProviders.map((provider) => (
              <option key={provider} value={provider}>
                {PROVIDER_DISPLAY_NAMES[provider]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Model
          </label>
          <ModelPicker
            models={modelsForProvider}
            valueApiModelId={selectedModelId}
            onChange={setSelectedModelId}
          />
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSaving || !selectedModelId}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving…' : 'Save configuration'}
        </button>
        {saveSuccess ? (
          <span className="text-sm text-green-600 dark:text-green-400">Saved.</span>
        ) : null}
      </div>

      <details className="p-4 bg-gray-50 dark:bg-gray-800/80 rounded-lg border border-gray-200 dark:border-gray-700">
        <summary className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
          Current configuration summary ({allFeatures.length} features)
        </summary>
        <div className="mt-3 max-h-56 overflow-y-auto space-y-1 text-sm text-gray-600 dark:text-gray-400">
          {allFeatures.map((feature) => {
            const config = getFeatureConfigSync(feature);
            return (
              <div key={feature} className="flex justify-between gap-2">
                <span className="truncate">{AI_FEATURE_DISPLAY_NAMES[feature]}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100 shrink-0 text-right">
                  {PROVIDER_DISPLAY_NAMES[config.provider] ?? config.provider} — {config.model}
                </span>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}
