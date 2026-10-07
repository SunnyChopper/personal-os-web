import { describe, expect, it } from 'vitest';
import type { RadarItem } from '@/types/api/personal-branding.dto';
import {
  MAX_PROJECT_RADAR_SELECTION,
  precheckedRadarItemIds,
  todaysRadarItems,
  toggleProjectRadarSelection,
} from './generate-projects-picker';

const now = new Date(2026, 9, 5, 18, 0, 0);

function item(overrides: Partial<RadarItem> & Pick<RadarItem, 'id'>): RadarItem {
  return {
    itemType: 'ARTICLE',
    title: overrides.id,
    relevanceScore: 0,
    matchedPillars: [],
    userId: 'user-1',
    createdAt: new Date(2026, 9, 5, 12, 0, 0).toISOString(),
    ...overrides,
  };
}

describe('precheckedRadarItemIds', () => {
  it('prechecks today cards by signal score and caps at 10', () => {
    const items = [
      item({
        id: 'yesterday',
        createdAt: new Date(2026, 9, 4, 12).toISOString(),
        aiRelevanceScore: 1,
      }),
      item({ id: 'low', aiRelevanceScore: 0.2, relevanceScore: 0.9 }),
      item({ id: 'high', aiRelevanceScore: 0.9, relevanceScore: 0.1 }),
      item({ id: 'tie-weaker', aiRelevanceScore: 0.5, relevanceScore: 0.1 }),
      item({ id: 'tie-stronger', aiRelevanceScore: 0.5, relevanceScore: 0.8 }),
      item({ id: 'unscored', relevanceScore: 0.4 }),
      ...Array.from({ length: 8 }, (_, index) =>
        item({ id: `extra-${index}`, aiRelevanceScore: 0.3 + index / 100 })
      ),
    ];

    expect(todaysRadarItems(items, now).some((row) => row.id === 'yesterday')).toBe(false);
    expect(precheckedRadarItemIds(items, now)).toEqual([
      'high',
      'tie-stronger',
      'tie-weaker',
      'extra-7',
      'extra-6',
      'extra-5',
      'extra-4',
      'extra-3',
      'extra-2',
      'extra-1',
    ]);
    expect(precheckedRadarItemIds(items, now)).toHaveLength(MAX_PROJECT_RADAR_SELECTION);
    expect(precheckedRadarItemIds(items, now)).not.toContain('low');
    expect(precheckedRadarItemIds(items, now)).not.toContain('unscored');
    expect(precheckedRadarItemIds(items, now)).not.toContain('yesterday');
  });
});

describe('toggleProjectRadarSelection', () => {
  it('removes a selected id and refuses an eleventh add', () => {
    expect(toggleProjectRadarSelection(['a', 'b'], 'a')).toEqual(['b']);
    const full = Array.from({ length: MAX_PROJECT_RADAR_SELECTION }, (_, index) => `id-${index}`);
    expect(toggleProjectRadarSelection(full, 'extra')).toEqual(full);
    expect(toggleProjectRadarSelection(full, 'id-0')).toEqual(full.slice(1));
  });
});
