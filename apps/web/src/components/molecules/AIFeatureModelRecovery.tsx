import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { ModelPicker } from '@/components/molecules/ModelPicker';
import Button from '@/components/atoms/Button';
import { type AIFeature, AI_FEATURE_DISPLAY_NAMES, setFeatureConfig } from '@/lib/llm';
import { PROVIDER_DISPLAY_NAMES, type LLMProvider } from '@/lib/llm/config/provider-types';
import { queryKeys } from '@/lib/react-query/query-keys';
import { chatbotService } from '@/services/chatbot.service';
import { Select } from '@/components/atoms/Select';

function isLLMProvider(p: string): p is LLMProvider {
  return p in PROVIDER_DISPLAY_NAMES;
}

export type AIFeatureModelRecoveryProps = {
  feature: AIFeature;
  failedModel?: string;
  onRetry: () => void | Promise<void>;
  onDismiss?: () => void;
};

export function AIFeatureModelRecovery({
  feature,
  failedModel,
  onRetry,
  onDismiss,
}: AIFeatureModelRecoveryProps) {
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>('anthropic');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const catalogQuery = useQuery({
    queryKey: queryKeys.chatbot.modelCatalog(),
    queryFn: () => chatbotService.getAssistantModelCatalog(),
    staleTime: 5 * 60_000,
  });

  const catalog = catalogQuery.data;

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

  useEffect(() => {
    if (!catalog || configuredProviders.length === 0) return;
    const preferred = configuredProviders.includes('anthropic')
      ? 'anthropic'
      : configuredProviders[0];
    setSelectedProvider(preferred);
    const models = catalog.models.filter((m) => m.provider === preferred);
    const pick =
      models.find((m) => m.apiModelId === 'claude-sonnet-4-6') ??
      models.find((m) => m.apiModelId !== failedModel) ??
      models[0];
    if (pick) {
      setSelectedModelId(pick.apiModelId);
    }
  }, [catalog, configuredProviders, failedModel]);

  useEffect(() => {
    if (
      !modelsForProvider.length ||
      modelsForProvider.some((m) => m.apiModelId === selectedModelId)
    ) {
      return;
    }
    setSelectedModelId(modelsForProvider[0].apiModelId);
  }, [modelsForProvider, selectedModelId]);

  const handleSaveAndRetry = async () => {
    if (!selectedModelId) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await setFeatureConfig(feature, selectedProvider, selectedModelId);
      await onRetry();
      onDismiss?.();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save model');
    } finally {
      setIsSaving(false);
    }
  };

  const featureLabel = AI_FEATURE_DISPLAY_NAMES[feature];

  if (catalogQuery.isLoading) {
    return <p className="text-sm text-red-700 dark:text-red-300">Loading model catalog…</p>;
  }

  if (!catalog?.models.length || configuredProviders.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-red-700 dark:text-red-300">
          Model <span className="font-mono">{failedModel ?? 'unknown'}</span> is unavailable.
          Configure an LLM provider in Settings, then retry.
        </p>
        <Button type="button" size="sm" variant="secondary" onClick={() => void onRetry()}>
          <RefreshCw className="w-4 h-4 mr-1" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            Model unavailable for {featureLabel}
          </p>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
            {failedModel ? (
              <>
                <span className="font-mono">{failedModel}</span> was not found. Choose a current
                model — it will be saved as the default for this tool.
              </>
            ) : (
              <>The configured model was not found. Choose a replacement below.</>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Provider
          </label>
          <Select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value as LLMProvider)}
            disabled={isSaving}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          >
            {configuredProviders.map((p) => (
              <option key={p} value={p}>
                {PROVIDER_DISPLAY_NAMES[p]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Model
          </label>
          <ModelPicker
            models={modelsForProvider}
            valueApiModelId={selectedModelId}
            onChange={setSelectedModelId}
            disabled={isSaving}
            showProviderBadge
          />
        </div>
      </div>

      {saveError ? <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="primary"
          disabled={isSaving || !selectedModelId}
          onClick={() => void handleSaveAndRetry()}
          className="bg-amber-600 hover:bg-amber-700"
        >
          {isSaving ? 'Saving…' : 'Update model & retry'}
        </Button>
        {onDismiss ? (
          <Button type="button" size="sm" variant="ghost" disabled={isSaving} onClick={onDismiss}>
            Dismiss
          </Button>
        ) : null}
      </div>
    </div>
  );
}
