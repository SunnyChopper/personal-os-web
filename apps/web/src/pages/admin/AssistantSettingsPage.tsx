import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AssistantDefaultModelsForm } from '@/components/settings/AssistantDefaultModelsForm';
import { AssistantMemoryIngestionForm } from '@/components/settings/AssistantMemoryIngestionForm';
import { AssistantToolApprovalForm } from '@/components/settings/AssistantToolApprovalForm';
import { apiClient } from '@/lib/api-client';
import {
  assistantDefaultModelsPayloadFromDraft,
  defaultModelsDraftFromSettings,
  type DefaultModelsDraft,
} from '@/lib/assistant/run-config-picker-draft';
import { queryKeys } from '@/lib/react-query/query-keys';
import type {
  AssistantSettingsConfig,
  AssistantToolApprovalMode,
  AssistantToolRegistryEntry,
} from '@/types/api-contracts';
import type { AssistantModelCatalogData } from '@/types/chatbot';

export default function AssistantSettingsPage() {
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<AssistantToolApprovalMode>('dangerousOnly');
  const [dangerousSet, setDangerousSet] = useState<Set<string>>(() => new Set());
  const [memProvider, setMemProvider] = useState('groq');
  const [memModel, setMemModel] = useState('');
  const [memIsCustom, setMemIsCustom] = useState(false);

  const [dmDraft, setDmDraft] = useState<DefaultModelsDraft>({
    mode: 'auto',
    reasoningModelId: '',
    responseModelId: '',
    optimizeFor: 'intelligence',
  });
  const [dmIsCustom, setDmIsCustom] = useState(false);

  const [registry, setRegistry] = useState<AssistantToolRegistryEntry[]>([]);
  const [catalog, setCatalog] = useState<AssistantModelCatalogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resettingMemory, setResettingMemory] = useState(false);
  const [resettingDefaultModels, setResettingDefaultModels] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  const applyLoadedSettings = useCallback(
    (data: AssistantSettingsConfig, cat: AssistantModelCatalogData | null) => {
      setMode(data.toolApproval.mode);
      setDangerousSet(new Set(data.toolApproval.dangerousTools));
      setMemProvider(data.memoryIngestion.provider);
      setMemModel(data.memoryIngestion.model);
      setMemIsCustom(data.memoryIngestionIsCustom);
      setDmIsCustom(data.defaultModelsIsCustom);
      setDmDraft(defaultModelsDraftFromSettings(data.defaultModels, cat));
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

  const handleMemProviderChange = useCallback(
    (p: string) => {
      setMemProvider(p);
      const first = pickFirstModelForProvider(p, catalog);
      if (first) {
        setMemModel(first);
      }
    },
    [catalog, pickFirstModelForProvider]
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSavedOk(false);
    const res = await apiClient.setAssistantSettings({
      toolApproval: {
        mode,
        dangerousTools: Array.from(dangerousSet),
      },
      memoryIngestion: {
        provider: memProvider,
        model: memModel,
      },
      defaultModels: assistantDefaultModelsPayloadFromDraft(dmDraft),
    });
    setSaving(false);
    if (res.success && res.data) {
      applyLoadedSettings(res.data, catalog);
      setSavedOk(true);
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.chatbot.all, 'assistant-settings-preferences'],
      });
    } else {
      setError(res.error?.message ?? 'Save failed');
    }
  }, [
    applyLoadedSettings,
    catalog,
    dangerousSet,
    dmDraft,
    memModel,
    memProvider,
    mode,
    queryClient,
  ]);

  const handleResetMemory = useCallback(async () => {
    setResettingMemory(true);
    setError(null);
    setSavedOk(false);
    const res = await apiClient.resetAssistantMemoryIngestion();
    setResettingMemory(false);
    if (res.success && res.data) {
      applyLoadedSettings(res.data, catalog);
      setSavedOk(true);
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.chatbot.all, 'assistant-settings-preferences'],
      });
    } else {
      setError(res.error?.message ?? 'Reset failed');
    }
  }, [applyLoadedSettings, catalog, queryClient]);

  const handleResetDefaultModels = useCallback(async () => {
    setResettingDefaultModels(true);
    setError(null);
    setSavedOk(false);
    const res = await apiClient.resetAssistantDefaultModels();
    setResettingDefaultModels(false);
    if (res.success && res.data) {
      applyLoadedSettings(res.data, catalog);
      setSavedOk(true);
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.chatbot.all, 'assistant-settings-preferences'],
      });
    } else {
      setError(res.error?.message ?? 'Reset failed');
    }
  }, [applyLoadedSettings, catalog, queryClient]);

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
            Configure tool confirmations, default models for Assistant Chat, and background models
            for memory ingestion (short-term notes and thread summarization).
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
              Default models (Assistant Chat)
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              New chats and branches without a saved model pick use these defaults. You can still
              change models per message from the chat header.
            </p>
            <AssistantDefaultModelsForm
              catalog={catalog}
              isLoading={false}
              draft={dmDraft}
              onDraftChange={(patch) => {
                setDmDraft((d) => ({ ...d, ...patch }));
                setSavedOk(false);
              }}
              disabled={saving}
              isCustom={dmIsCustom}
              onResetToImplicitDefaults={handleResetDefaultModels}
              resetting={resettingDefaultModels}
            />
          </section>

          <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Memory ingestion
            </h2>
            <AssistantMemoryIngestionForm
              catalog={catalog}
              provider={memProvider}
              model={memModel}
              isCustom={memIsCustom}
              onProviderChange={(p) => {
                handleMemProviderChange(p);
                setSavedOk(false);
              }}
              onModelChange={(m) => {
                setMemModel(m);
                setSavedOk(false);
              }}
              onResetToServerDefaults={handleResetMemory}
              resetting={resettingMemory}
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
