import { describe, expect, it } from 'vitest';
import type { ContentNode } from '@/types/api/personal-branding.dto';
import {
  filterSourceNodesByPillars,
  hasActiveSourcePillarFilter,
  matchesSourcePillarFilter,
  sourcePillarFilterOptions,
} from './source-content-pillar-filters';

function node(id: string, pillars: string[]): ContentNode {
  return {
    id,
    title: id,
    status: 'PUBLISHED',
    sourceType: 'MANUAL',
    tags: [],
    pillars,
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

describe('source-content-pillar-filters', () => {
  it('matches any selected pillar with OR semantics', () => {
    const draft = node('a', ['AI Systems', 'Leadership']);
    expect(matchesSourcePillarFilter(draft, [])).toBe(true);
    expect(matchesSourcePillarFilter(draft, ['AI Systems'])).toBe(true);
    expect(matchesSourcePillarFilter(draft, ['Ops'])).toBe(false);
    expect(matchesSourcePillarFilter(draft, ['Ops', 'Leadership'])).toBe(true);
  });

  it('filters source nodes and builds option list from active profile universe', () => {
    const sources = [node('a', ['AI Systems']), node('b', ['Leadership']), node('c', [])];
    const filtered = filterSourceNodesByPillars(sources, ['AI Systems']);
    expect(filtered.map((item) => item.id)).toEqual(['a']);

    const options = sourcePillarFilterOptions(
      sources,
      ['AI Systems', 'Leadership', 'Ops'],
      ['Ops']
    );
    expect(options).toEqual(['AI Systems', 'Leadership', 'Ops']);
  });

  it('tracks active filter state', () => {
    expect(hasActiveSourcePillarFilter([])).toBe(false);
    expect(hasActiveSourcePillarFilter(['AI Systems'])).toBe(true);
  });
});
