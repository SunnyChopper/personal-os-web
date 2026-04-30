import type {
  AssistantModelCatalogEntry,
  AssistantOptimizeFor,
  AssistantRunConfig,
  ChatMessage,
} from '@/types/chatbot';

/** Resolve the run config that produced (or will produce) the assistant reply for the selected leaf. */
export function extractAssistantRunConfigForLeaf(
  leafId: string | null | undefined,
  nodes: ChatMessage[] | undefined
): AssistantRunConfig | null {
  if (!leafId || !nodes?.length) {
    return null;
  }
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const leaf = nodeById.get(leafId);
  if (!leaf) {
    return null;
  }
  if (leaf.role === 'user') {
    return leaf.metadata?.assistantModelConfig ?? null;
  }
  const parentId = leaf.parentId;
  if (!parentId) {
    return null;
  }
  const parent = nodeById.get(parentId);
  if (!parent || parent.role !== 'user') {
    return null;
  }
  return parent.metadata?.assistantModelConfig ?? null;
}

export function optimizeForShortLabel(of: AssistantOptimizeFor): string {
  if (of === 'speed') return 'Speed';
  if (of === 'cost') return 'Cost';
  if (of === 'balanced') return 'Balanced';
  if (of === 'value') return 'Value';
  return 'Intelligence';
}

/** Plan/reply labels matching the chat header (same wording as next-send display). */
export function headerLabelsFromAssistantRunConfig(
  cfg: AssistantRunConfig,
  catalogModels: AssistantModelCatalogEntry[],
  defaults: { defaultReasoningModelId: string; defaultResponseModelId: string }
): { reasoningLabel: string; responseLabel: string; modelMode: 'manual' | 'auto' } {
  const labelFor = (id: string) => catalogModels.find((m) => m.id === id)?.label ?? id;
  if (cfg.mode === 'auto') {
    const ofLabel = optimizeForShortLabel(cfg.auto.optimizeFor);
    return {
      reasoningLabel: 'Auto router',
      responseLabel: `Optimize: ${ofLabel}`,
      modelMode: 'auto',
    };
  }
  const r = cfg.manual.reasoningModelId || defaults.defaultReasoningModelId;
  const resp = cfg.manual.responseModelId || defaults.defaultResponseModelId;
  return {
    reasoningLabel: labelFor(r),
    responseLabel: labelFor(resp),
    modelMode: 'manual',
  };
}
