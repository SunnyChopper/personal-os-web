import type { RadarItem } from '@/types/api/personal-branding.dto';

export const TREND_STREAM_IRRELEVANT_UNDO_MS = 3500;
export const TREND_STREAM_IRRELEVANT_EXIT_MS = 280;

export type TrendStreamDismissPhase = 'pending' | 'exiting';

export interface TrendStreamDismissEntry {
  item: RadarItem;
  phase: TrendStreamDismissPhase;
}

export type TrendStreamDismissMap = Record<string, TrendStreamDismissEntry>;

/** Merge query items with held dismissing cards so exit animation can finish after invalidate. */
export function mergeTrendStreamDisplayItems(
  streamItems: RadarItem[],
  dismissingById: TrendStreamDismissMap
): RadarItem[] {
  if (Object.keys(dismissingById).length === 0) {
    return streamItems;
  }

  const byId = new Map(streamItems.map((item) => [item.id, item]));

  for (const [id, entry] of Object.entries(dismissingById)) {
    const existing = byId.get(id);
    byId.set(id, existing ? { ...existing, ...entry.item } : entry.item);
  }

  const streamOrder = streamItems.map((item) => item.id);
  const heldOnlyIds = Object.keys(dismissingById).filter((id) => !streamOrder.includes(id));

  return [...streamOrder.map((id) => byId.get(id)!), ...heldOnlyIds.map((id) => byId.get(id)!)];
}

export function isTrendStreamCardDismissing(
  itemId: string,
  dismissingById: TrendStreamDismissMap
): boolean {
  return itemId in dismissingById;
}

export function getTrendStreamDismissPhase(
  itemId: string,
  dismissingById: TrendStreamDismissMap
): TrendStreamDismissPhase | null {
  return dismissingById[itemId]?.phase ?? null;
}
