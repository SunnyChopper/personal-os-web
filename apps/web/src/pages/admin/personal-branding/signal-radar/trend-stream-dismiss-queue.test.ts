import { describe, expect, it } from 'vitest';
import type { RadarItem } from '@/types/api/personal-branding.dto';
import {
  getTrendStreamDismissPhase,
  isTrendStreamCardDismissing,
  mergeTrendStreamDisplayItems,
  type TrendStreamDismissMap,
} from './trend-stream-dismiss-queue';

function makeItem(id: string, title = id): RadarItem {
  return {
    id,
    itemType: 'ARTICLE',
    title,
    relevanceScore: 0.5,
    matchedPillars: [],
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('mergeTrendStreamDisplayItems', () => {
  it('returns stream items unchanged when no dismiss entries', () => {
    const items = [makeItem('a'), makeItem('b')];
    expect(mergeTrendStreamDisplayItems(items, {})).toEqual(items);
  });

  it('appends held cards missing from the query list', () => {
    const streamItems = [makeItem('a')];
    const dismissing: TrendStreamDismissMap = {
      b: { item: makeItem('b', 'held'), phase: 'pending' },
    };
    const merged = mergeTrendStreamDisplayItems(streamItems, dismissing);
    expect(merged.map((item) => item.id)).toEqual(['a', 'b']);
    expect(merged[1]?.title).toBe('held');
  });

  it('overlays dismiss snapshot onto an existing stream item', () => {
    const streamItems = [makeItem('a', 'before')];
    const dismissing: TrendStreamDismissMap = {
      a: {
        item: { ...makeItem('a', 'after'), userRelevant: false, userRelevanceReason: 'offBrand' },
        phase: 'pending',
      },
    };
    const merged = mergeTrendStreamDisplayItems(streamItems, dismissing);
    expect(merged[0]?.title).toBe('after');
    expect(merged[0]?.userRelevant).toBe(false);
    expect(merged[0]?.userRelevanceReason).toBe('offBrand');
  });
});

describe('dismiss helpers', () => {
  const dismissing: TrendStreamDismissMap = {
    x: { item: makeItem('x'), phase: 'exiting' },
  };

  it('detects dismissing cards', () => {
    expect(isTrendStreamCardDismissing('x', dismissing)).toBe(true);
    expect(isTrendStreamCardDismissing('y', dismissing)).toBe(false);
  });

  it('returns dismiss phase', () => {
    expect(getTrendStreamDismissPhase('x', dismissing)).toBe('exiting');
    expect(getTrendStreamDismissPhase('y', dismissing)).toBeNull();
  });
});
