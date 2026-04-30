import type { ProactiveAssistantRunConfig } from '@/types/api-contracts';
import type { AssistantModelCatalogData } from '@/types/chatbot';

export function parseProactiveAssistantRunConfigFromUnknown(
  raw: unknown
): ProactiveAssistantRunConfig | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const mode = o.mode;
  if (mode === 'auto') {
    const auto = o.auto;
    if (!auto || typeof auto !== 'object' || Array.isArray(auto)) return null;
    const of = (auto as Record<string, unknown>).optimizeFor;
    if (
      of === 'speed' ||
      of === 'intelligence' ||
      of === 'cost' ||
      of === 'balanced' ||
      of === 'value'
    ) {
      const web = o.webSearchEnabled;
      return {
        mode: 'auto',
        auto: { optimizeFor: of },
        ...(typeof web === 'boolean' ? { webSearchEnabled: web } : {}),
      };
    }
    return null;
  }
  if (mode === 'manual') {
    const manual = o.manual;
    if (!manual || typeof manual !== 'object' || Array.isArray(manual)) return null;
    const m = manual as Record<string, unknown>;
    const r = m.reasoningModelId;
    const resp = m.responseModelId;
    if (typeof r === 'string' && r && typeof resp === 'string' && resp) {
      const web = o.webSearchEnabled;
      return {
        mode: 'manual',
        manual: { reasoningModelId: r, responseModelId: resp },
        ...(typeof web === 'boolean' ? { webSearchEnabled: web } : {}),
      };
    }
    return null;
  }
  return null;
}

const OPT_LABELS: Record<string, string> = {
  speed: 'Speed',
  intelligence: 'Intelligence',
  cost: 'Cost',
  balanced: 'Balanced',
  value: 'Value',
};

/** Human-readable one-line summary for cards and suggestion delivery. */
export function formatProactiveAssistantRunConfigSummary(
  cfg: ProactiveAssistantRunConfig | null | undefined,
  catalog: AssistantModelCatalogData | null | undefined
): string | null {
  if (!cfg) return null;
  if (cfg.mode === 'auto') {
    const of = cfg.auto.optimizeFor;
    return `Auto · ${OPT_LABELS[of] ?? of}`;
  }
  const labelFor = (id: string) => catalog?.models?.find((m) => m.id === id)?.label ?? id;
  return `Manual · ${labelFor(cfg.manual.reasoningModelId)} / ${labelFor(cfg.manual.responseModelId)}`;
}
