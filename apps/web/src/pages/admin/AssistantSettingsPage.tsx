import { useCallback, useEffect, useState } from 'react';
import { AssistantRunConfigPickerForm } from '@/components/assistant/AssistantRunConfigPickerForm';
import { AssistantMemoryIngestionForm } from '@/components/settings/AssistantMemoryIngestionForm';
import {
  emptyFactCriteria,
  normalizeFactCriteria,
  withFactCriteriaFromApi,
} from '@/components/settings/assistantMemoryIngestionFactCriteria';
import { AssistantToolApprovalForm } from '@/components/settings/AssistantToolApprovalForm';
import {
  defaultModelsFromDraft,
  draftFromDefaultModels,
  type ModelPickerDraft,
} from '@/lib/assistant/run-config-picker-draft';
import { apiClient } from '@/lib/api-client';
import type {
  AssistantDefaultModelsConfig,
  AssistantMemoryIngestionFactCriteria,
  AssistantToolApprovalMode,
  AssistantToolRegistryEntry,
} from '@/types/api-contracts';
import type { AssistantModelCatalogData } from '@/types/chatbot';

export default function AssistantSettingsPage() {
  const [mode, setMode] = useState<AssistantToolApprovalMode>('dangerousOnly');
  const [dangerousSet, setDangerousSet] = useState<Set<string>>(() => new Set());
  const [memProvider, setMemProvider] = useState('groq');
  const [memModel, setMemModel] = useState('');
  const [memFactCriteria, setMemFactCriteria] =
    useState<AssistantMemoryIngestionFactCriteria>(emptyFactCriteria);
  const [memIsCustom, setMemIsCustom] = useState(false);
  const [defaultModelsDraft, setDefaultModelsDraft] = useState<ModelPickerDraft>({
    mode: 'auto',
    reasoningModelId: '',
    responseModelId: '',
    optimizeFor: 'intelligence',
    compactionMode: 'auto',
  });
  const [defaultModelsIsCustom, setDefaultModelsIsCustom] = useState(false);

  const [registry, setRegistry] = useState<AssistantToolRegistryEntry[]>([]);
  const [catalog, setCatalog] = useState<AssistantModelCatalogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resettingDefaultModels, setResettingDefaultModels] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  const applyLoadedSettings = useCallback(
    (
      data: {
        toolApproval: { mode: AssistantToolApprovalMode; dangerousTools: string[] };
        memoryIngestion: {
          provider: string;
          model: string;
          factCriteria?: AssistantMemoryIngestionFactCriteria;
        };
        memoryIngestionIsCustom: boolean;
        defaultModels: AssistantDefaultModelsConfig;
        defaultModelsIsCustom: boolean;
      },
      cat: AssistantModelCatalogData | null
    ) => {
      setMode(data.toolApproval.mode);
      setDangerousSet(new Set(data.toolApproval.dangerousTools));
      setMemProvider(data.memoryIngestion.provider);
      setMemModel(data.memoryIngestion.model);
      setMemFactCriteria(withFactCriteriaFromApi(data.memoryIngestion.factCriteria));
      setMemIsCustom(data.memoryIngestionIsCustom);
      setDefaultModelsDraft(draftFromDefaultModels(data.defaultModels, cat));
      setDefaultModelsIsCustom(data.defaultModelsIsCustom);
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      const [settingsRes, regRes, catRes] = await Promise.all([
        apiClient.getAssistantSettings(),
        apiClient.getAssistantToolRegistry(),
        apiClient.getAssistantModelCatalog(),
      ]);
      if (cancelled) return;
      if (!settingsRes.success || !settingsRes.data) {
        setError(settingsRes.error?.message ?? 'Failed to load assistant settings');
        setLoading(false);
        return;
      }
      if (!regRes.success || !regRes.data) {
        setError(regRes.error?.message ?? 'Failed to load tool list');
        setLoading(false);
        return;
      }
      if (!catRes.success || !catRes.data) {
        setError(catRes.error?.message ?? 'Failed to load model catalog');
        setLoading(false);
        return;
      }
      applyLoadedSettings(settingsRes.data, catRes.data);
      setRegistry(regRes.data);
      setCatalog(catRes.data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [applyLoadedSettings]);

  const pickFirstModelForProvider = useCallback(
    (p: string, cat: AssistantModelCatalogData | null) => {
      const list = (cat?.models ?? []).filter((m) => m.provider === p);
      list.sort((a, b) => a.label.localeCompare(b.label));
      return list[0]?.apiModelId ?? '';
    },
    []
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSavedOk(false);
    const defaultModels = defaultModelsFromDraft(defaultModelsDraft, catalog);
    const res = await apiClient.setAssistantSettings({
      toolApproval: {
        mode,
        dangerousTools: Array.from(dangerousSet),
      },
      memoryIngestion: {
        provider: memProvider,
        model: memModel,
        factCriteria: normalizeFactCriteria(memFactCriteria),
      },
      ...(defaultModels ? { defaultModels } : {}),
    });
    setSaving(false);
    if (res.success && res.data) {
      applyLoadedSettings(res.data, catalog);
      setSavedOk(true);
    } else {
      setError(res.error?.message ?? 'Save failed');
    }
  }, [
    applyLoadedSettings,
    catalog,
    dangerousSet,
    defaultModelsDraft,
    memFactCriteria,
    memModel,
    memProvider,
    mode,
  ]);

  const handleResetMemory = useCallback(async () => {
    setResetting(true);
    setError(null);
    setSavedOk(false);
    const res = await apiClient.resetAssistantMemoryIngestion();
    setResetting(false);
    if (res.success && res.data) {
      applyLoadedSettings(res.data, catalog);
      setSavedOk(true);
    } else {
      setError(res.error?.message ?? 'Reset failed');
    }
  }, [applyLoadedSettings, catalog]);

  const handleResetDefaultModels = useCallback(async () => {
    setResettingDefaultModels(true);
    setError(null);
    setSavedOk(false);
    const res = await apiClient.resetAssistantDefaultModels();
    setResettingDefaultModels(false);
    if (res.success && res.data) {
      applyLoadedSettings(res.data, catalog);
      setSavedOk(true);
    } else {
      setError(res.error?.message ?? 'Reset failed');
    }
  }, [applyLoadedSettings, catalog]);

  if (loading) {
    return (
      <div className="h-full min-h-0 overflow-y-auto overscroll-contain">
        <div className="max-w-3xl mx-auto px-4 pt-16 pb-12 lg:pt-8">
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading assistant settings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain">
      <div className="max-w-3xl mx-auto px-4 pt-16 pb-12 lg:pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Assistant Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure tool confirmations, default chat models, and background models for memory
            ingestion (short-term notes and thread summarization).
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        )}

        {savedOk && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-100">
            Settings saved.
          </div>
        )}

        <div className="space-y-8">
          <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Tool safety
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Control when the assistant must ask you to approve a tool before it runs. Approvals
              appear in the chat execution trace while a reply is streaming.
            </p>
            <AssistantToolApprovalForm
              mode={mode}
              dangerousSet={dangerousSet}
              registry={registry}
              onModeChange={(m) => {
                setMode(m);
                setSavedOk(false);
              }}
              onDangerousSetChange={(s) => {
                setDangerousSet(s);
                setSavedOk(false);
              }}
            />
          </section>

          <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Default models
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Choose the models new chats start with. You can still change models within any chat
              from the Models button on the Assistant page.
            </p>
            <AssistantRunConfigPickerForm
              catalog={catalog}
              isLoading={false}
              draft={defaultModelsDraft}
              showCompaction={false}
              disabled={saving}
              manualHelpText="New chats start with these models. You can still switch models within any chat."
              onDraftChange={(patch) => {
                setDefaultModelsDraft((prev) => ({ ...prev, ...patch }));
                setSavedOk(false);
              }}
            />
            <div className="mt-4">
              <button
                type="button"
                onClick={() => void handleResetDefaultModels()}
                disabled={!defaultModelsIsCustom || resettingDefaultModels || saving}
                className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                {resettingDefaultModels ? 'Resetting…' : 'Reset to Auto (server default)'}
              </button>
            </div>
          </section>

          <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Memory ingestion
            </h2>
            <AssistantMemoryIngestionForm
              catalog={catalog}
              provider={memProvider}
              model={memModel}
              factCriteria={memFactCriteria}
              isCustom={memIsCustom}
              onProviderChange={(p) => {
                setMemProvider(p);
                const first = pickFirstModelForProvider(p, catalog);
                if (first) {
                  setMemModel(first);
                }
                setSavedOk(false);
              }}
              onModelChange={(m) => {
                setMemModel(m);
                setSavedOk(false);
              }}
              onFactCriteriaChange={(criteria) => {
                setMemFactCriteria(criteria);
                setSavedOk(false);
              }}
              onResetToServerDefaults={handleResetMemory}
              resetting={resetting}
              disabled={saving}
            />
          </section>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            {saving ? 'Saving…' : 'Save all settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
