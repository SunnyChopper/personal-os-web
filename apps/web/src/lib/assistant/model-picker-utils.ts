import type { AssistantModelCatalogEntry } from '@/types/chatbot';

export type ManualModelSortKey =
  | 'default'
  | 'speed'
  | 'cost'
  | 'intelligence'
  | 'balanced'
  | 'value';

function balancedKey(m: AssistantModelCatalogEntry): number {
  return 0.4 * m.qualityScore + 0.3 * m.speedScore + 0.3 * m.costScore;
}

function valueKey(m: AssistantModelCatalogEntry): number {
  if (m.costScore <= 0) return m.qualityScore;
  return m.qualityScore * (m.costScore / 10);
}

export function sortAssistantModels(
  models: AssistantModelCatalogEntry[],
  sortBy: ManualModelSortKey
): AssistantModelCatalogEntry[] {
  if (sortBy === 'default') {
    return [...models];
  }
  if (sortBy === 'speed') {
    return [...models].sort((a, b) => {
      const ttA = a.timeToFirstTokenSec ?? 99;
      const ttB = b.timeToFirstTokenSec ?? 99;
      return (
        b.speedScore - a.speedScore ||
        ttA - ttB ||
        b.qualityScore - a.qualityScore ||
        a.label.localeCompare(b.label)
      );
    });
  }
  if (sortBy === 'cost') {
    return [...models].sort(
      (a, b) =>
        b.costScore - a.costScore ||
        b.qualityScore - a.qualityScore ||
        a.label.localeCompare(b.label)
    );
  }
  if (sortBy === 'balanced') {
    return [...models].sort(
      (a, b) =>
        balancedKey(b) - balancedKey(a) ||
        b.qualityScore - a.qualityScore ||
        a.label.localeCompare(b.label)
    );
  }
  if (sortBy === 'value') {
    return [...models].sort(
      (a, b) =>
        valueKey(b) - valueKey(a) ||
        b.qualityScore - a.qualityScore ||
        a.label.localeCompare(b.label)
    );
  }
  return [...models].sort(
    (a, b) =>
      b.qualityScore - a.qualityScore ||
      b.speedScore - a.speedScore ||
      a.label.localeCompare(b.label)
  );
}

/** Public path under `public/` for a monochrome provider mark (falls back to generic). */
export function providerLogoSrc(provider: string): string {
  const p = provider.toLowerCase();
  const map: Record<string, string> = {
    groq: '/images/providers/groq.svg',
    openai: '/images/providers/openai.svg',
    anthropic: '/images/providers/anthropic.svg',
    gemini: '/images/providers/gemini.svg',
    deepseek: '/images/providers/deepseek.svg',
    cerebras: '/images/providers/cerebras.svg',
    xai: '/images/providers/xai.svg',
    openrouter: '/images/providers/openrouter.svg',
  };
  return map[p] ?? '/images/providers/generic.svg';
}
