import type {
  AssistantCompactionMode,
  AssistantModelCatalogData,
  AssistantOptimizeFor,
  AssistantRunConfig,
} from '@/types/chatbot';
import type { AssistantDefaultModelsConfig } from '@/types/api-contracts';

export type ModelPickerDraft = {
  mode: 'manual' | 'auto';
  reasoningModelId: string;
  responseModelId: string;
  optimizeFor: AssistantOptimizeFor;
  /** Thread context compaction for the next send (and proactive automations when saved). */
  compactionMode: AssistantCompactionMode;
};

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

function catalogDefaultIds(catalog: AssistantModelCatalogData | null): {
  reasoningModelId: string;
  responseModelId: string;
} {
  return {
    reasoningModelId: catalog?.defaults.defaultReasoningModelId ?? '',
    responseModelId: catalog?.defaults.defaultResponseModelId ?? '',
  };
}

/** Hydrate picker draft from saved Assistant settings defaultModels. */
export function draftFromDefaultModels(
  cfg: AssistantDefaultModelsConfig | null | undefined,
  catalog: AssistantModelCatalogData | null
): ModelPickerDraft {
  const { reasoningModelId: dr, responseModelId: dresp } = catalogDefaultIds(catalog);
  if (!cfg) {
    return {
      mode: 'auto',
      reasoningModelId: dr,
      responseModelId: dresp,
      optimizeFor: 'intelligence',
      compactionMode: 'auto',
    };
  }
  if (cfg.mode === 'manual') {
    return {
      mode: 'manual',
      reasoningModelId: cfg.manual.reasoningModelId || dr,
      responseModelId: cfg.manual.responseModelId || dresp,
      optimizeFor: 'intelligence',
      compactionMode: 'auto',
    };
  }
  return {
    mode: 'auto',
    reasoningModelId: dr,
    responseModelId: dresp,
    optimizeFor: cfg.auto.optimizeFor,
    compactionMode: 'auto',
  };
}

/** Build saved defaultModels payload from picker draft (no compaction / webSearch). */
export function defaultModelsFromDraft(
  draft: ModelPickerDraft,
  catalog: AssistantModelCatalogData | null
): AssistantDefaultModelsConfig | undefined {
  if (!catalog?.models?.length) {
    return undefined;
  }
  if (draft.mode === 'auto') {
    return {
      mode: 'auto',
      auto: { optimizeFor: draft.optimizeFor },
    };
  }
  const reasoningModelId = draft.reasoningModelId || catalog.defaults.defaultReasoningModelId;
  const responseModelId = draft.responseModelId || catalog.defaults.defaultResponseModelId;
  if (!reasoningModelId || !responseModelId) {
    return undefined;
  }
  return {
    mode: 'manual',
    manual: { reasoningModelId, responseModelId },
  };
}
