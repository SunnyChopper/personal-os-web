import type { RadarItem } from '@/types/api/personal-branding.dto';

export const MAX_PROJECT_RADAR_SELECTION = 10;

export function isRadarItemCreatedOnLocalDay(createdAt: string, now: Date = new Date()): boolean {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;
  return (
    created.getFullYear() === now.getFullYear() &&
    created.getMonth() === now.getMonth() &&
    created.getDate() === now.getDate()
  );
}

export function todaysRadarItems(items: readonly RadarItem[], now: Date = new Date()): RadarItem[] {
  return items.filter((item) => isRadarItemCreatedOnLocalDay(item.createdAt, now));
}

function signalRank(item: RadarItem): [number, number] {
  const ai = typeof item.aiRelevanceScore === 'number' ? item.aiRelevanceScore : -1;
  const relevance = typeof item.relevanceScore === 'number' ? item.relevanceScore : 0;
  return [ai, relevance];
}

/** Today's cards, highest signal first, capped at 10. Mirrors the worker's top-signal precheck. */
export function precheckedRadarItemIds(
  items: readonly RadarItem[],
  now: Date = new Date(),
  max: number = MAX_PROJECT_RADAR_SELECTION
): string[] {
  return todaysRadarItems(items, now)
    .slice()
    .sort((a, b) => {
      const [aiA, relA] = signalRank(a);
      const [aiB, relB] = signalRank(b);
      if (aiB !== aiA) return aiB - aiA;
      return relB - relA;
    })
    .slice(0, max)
    .map((item) => item.id);
}

export function toggleProjectRadarSelection(
  current: readonly string[],
  itemId: string,
  max: number = MAX_PROJECT_RADAR_SELECTION
): string[] {
  if (current.includes(itemId)) return current.filter((id) => id !== itemId);
  if (current.length >= max) return [...current];
  return [...current, itemId];
}
