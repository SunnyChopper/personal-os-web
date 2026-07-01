import type { AssistantMemoryIngestionFactCriteria } from '@/types/api-contracts';

export const MAX_FACT_CRITERIA_ITEMS = 20;
export const MAX_FACT_CRITERIA_ITEM_CHARS = 200;

export function emptyFactCriteria(): AssistantMemoryIngestionFactCriteria {
  return { alwaysCapture: [], neverCapture: [] };
}

function normalizeItem(value: string): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, MAX_FACT_CRITERIA_ITEM_CHARS);
}

function normalizeList(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    if (out.length >= MAX_FACT_CRITERIA_ITEMS) break;
    const text = normalizeItem(raw);
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

export function normalizeFactCriteria(
  criteria: AssistantMemoryIngestionFactCriteria
): AssistantMemoryIngestionFactCriteria {
  return {
    alwaysCapture: normalizeList(criteria.alwaysCapture),
    neverCapture: normalizeList(criteria.neverCapture),
  };
}

export function withFactCriteriaFromApi(
  raw: Partial<AssistantMemoryIngestionFactCriteria> | undefined | null
): AssistantMemoryIngestionFactCriteria {
  return normalizeFactCriteria({
    alwaysCapture: raw?.alwaysCapture ?? [],
    neverCapture: raw?.neverCapture ?? [],
  });
}
