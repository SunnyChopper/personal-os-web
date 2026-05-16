import type { AssistantDefaultModelsConfig } from '@/types/api-contracts';
import type {
  AssistantCompactionMode,
  AssistantModelCatalogData,
  AssistantOptimizeFor,
  AssistantRunConfig,
} from '@/types/chatbot';

export type ModelPickerDraft = {
  mode: 'manual' | 'auto';
  reasoningModelId: string;
  responseModelId: string;
  optimizeFor: AssistantOptimizeFor;
  /** Thread context compaction for the next send (and proactive automations when saved). */
  compactionMode: AssistantCompactionMode;
};

/** Model routing only (used by Assistant Settings “default models”; no compaction). */
export type DefaultModelsDraft = Pick<
  ModelPickerDraft,
  'mode' | 'reasoningModelId' | 'responseModelId' | 'optimizeFor'
>;

/** Build chat/API run config from draft + catalog (matches useAssistantChatPage.getRunConfig). */
export function runConfigFromModelPickerDraft(
  draft: ModelPickerDraft,
  catalog: AssistantModelCatalogData | null
): AssistantRunConfig | undefined {
  if (!catalog?.models?.length) return undefined;
  const compaction = { compactionMode: draft.compactionMode };
  if (draft.mode === 'auto') {
    return {
      mode: 'auto',
      auto: { optimizeFor: draft.optimizeFor },
      ...compaction,
    };
  }
  const r = draft.reasoningModelId || catalog.defaults.defaultReasoningModelId;
  const resp = draft.responseModelId || catalog.defaults.defaultResponseModelId;
  if (!r || !resp) return undefined;
  return {
    mode: 'manual',
    manual: { reasoningModelId: r, responseModelId: resp },
    ...compaction,
  };
}

/** Hydrate draft from stored run config or catalog defaults. */
export function modelPickerDraftFromRunConfig(
  cfg: AssistantRunConfig | null | undefined,
  catalog: AssistantModelCatalogData | null
): ModelPickerDraft {
  const dr = catalog?.defaults.defaultReasoningModelId ?? '';
  const dresp = catalog?.defaults.defaultResponseModelId ?? '';
  if (!cfg) {
    return {
      mode: 'auto',
      reasoningModelId: dr,
      responseModelId: dresp,
      optimizeFor: 'intelligence',
      compactionMode: 'auto',
    };
  }
  const compactionMode: AssistantCompactionMode =
    cfg.compactionMode === 'manual' ? 'manual' : 'auto';
  if (cfg.mode === 'auto') {
    return {
      mode: 'auto',
      reasoningModelId: dr,
      responseModelId: dresp,
      optimizeFor: cfg.auto.optimizeFor,
      compactionMode,
    };
  }
  return {
    mode: 'manual',
    reasoningModelId: cfg.manual.reasoningModelId,
    responseModelId: cfg.manual.responseModelId,
    optimizeFor: 'intelligence',
    compactionMode,
  };
}

/** Hydrate Default models draft from saved Assistant settings (+ catalog fallbacks). */
export function defaultModelsDraftFromSettings(
  cfg: AssistantDefaultModelsConfig | null | undefined,
  catalog: AssistantModelCatalogData | null
): DefaultModelsDraft {
  const dr = catalog?.defaults.defaultReasoningModelId ?? '';
  const dresp = catalog?.defaults.defaultResponseModelId ?? '';
  if (!cfg) {
    return {
      mode: 'auto',
      reasoningModelId: dr,
      responseModelId: dresp,
      optimizeFor: 'intelligence',
    };
  }
  if (cfg.mode === 'auto') {
    return {
      mode: 'auto',
      reasoningModelId: dr,
      responseModelId: dresp,
      optimizeFor: cfg.auto.optimizeFor,
    };
  }
  return {
    mode: 'manual',
    reasoningModelId: cfg.manual.reasoningModelId,
    responseModelId: cfg.manual.responseModelId,
    optimizeFor: 'intelligence',
  };
}

/** Saved Assistant Chat default models (`PUT /preferences/assistant-settings`). */
export function assistantDefaultModelsPayloadFromDraft(
  draft: DefaultModelsDraft
): AssistantDefaultModelsConfig {
  if (draft.mode === 'auto') {
    return { mode: 'auto', auto: { optimizeFor: draft.optimizeFor } };
  }
  return {
    mode: 'manual',
    manual: {
      reasoningModelId: draft.reasoningModelId,
      responseModelId: draft.responseModelId,
    },
  };
}
