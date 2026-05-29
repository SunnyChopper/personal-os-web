import { describe, expect, it } from 'vitest';
import type { Goal } from '@/types/growth-system';
import {
  buildPipelineSubtree,
  collectAncestorChain,
  collectMatchingSubtreeGoals,
  listPipelineLeafGoals,
  listTopMatchingRootGoals,
  pruneSubtreeOrphans,
  retainGoalsWithMatchingAncestors,
} from '@/components/molecules/goal-mindmap-utils';

function makeGoal(id: string, overrides: Partial<Goal> & { title: string }): Goal {
  return {
    id,
    description: null,
    area: 'Day Job',
    subCategory: null,
    timeHorizon: 'Quarterly',
    priority: 'P3',
    status: 'Active',
    targetDate: null,
    completedDate: null,
    successCriteria: [],
    progressConfig: null,
    parentGoalId: null,
    lastActivityAt: null,
    notes: null,
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
    title: overrides.title,
    startDate: overrides.startDate ?? null,
  };
}

describe('retainGoalsWithMatchingAncestors', () => {
  it('drops a matching child when its parent is not in the matching set', () => {
    const all = [
      makeGoal('root', { title: 'Root' }),
      makeGoal('parent', { title: 'Parent', parentGoalId: 'root' }),
      makeGoal('child', { title: 'Child', parentGoalId: 'parent' }),
    ];
    const matching = [all[2]!];
    expect(retainGoalsWithMatchingAncestors(matching, all)).toEqual([]);
  });
});

describe('collectMatchingSubtreeGoals', () => {
  const all = [
    makeGoal('root', { title: 'Root' }),
    makeGoal('parent', { title: 'Parent', parentGoalId: 'root', status: 'Abandoned' }),
    makeGoal('active-child', { title: 'Active child', parentGoalId: 'parent' }),
    makeGoal('dormant-child', { title: 'Dormant child', parentGoalId: 'parent' }),
  ];

  it('does not include active-momentum children under archived/inactive parents', () => {
    const matchingIds = new Set(['root', 'parent', 'active-child', 'dormant-child']);
    const goalsHealth = new Map([
      ['parent', { momentum: 'dormant' as const, status: 'dormant' as const }],
      ['active-child', { momentum: 'active' as const, status: 'onTrack' as const }],
      ['dormant-child', { momentum: 'dormant' as const, status: 'dormant' as const }],
    ]);

    const subtree = collectMatchingSubtreeGoals('root', all, matchingIds, goalsHealth);
    expect(subtree.map((g) => g.id)).toEqual(['root', 'parent', 'dormant-child']);
  });

  it('stops traversal when an intermediate ancestor does not match the filter', () => {
    const matchingIds = new Set(['root', 'dormant-child']);
    const subtree = collectMatchingSubtreeGoals('root', all, matchingIds);
    expect(subtree.map((g) => g.id)).toEqual(['root']);
  });
});

describe('listTopMatchingRootGoals', () => {
  it('returns the highest matching goals in the hierarchy', () => {
    const all = [
      makeGoal('root', { title: 'Root' }),
      makeGoal('child', { title: 'Child', parentGoalId: 'root' }),
    ];
    const matchingIds = new Set(['child']);
    expect(listTopMatchingRootGoals(all, matchingIds).map((g) => g.id)).toEqual(['child']);
  });
});

describe('pruneSubtreeOrphans', () => {
  it('removes nodes whose parent is absent from the subtree', () => {
    const parent = makeGoal('parent', { title: 'Parent' });
    const child = makeGoal('child', { title: 'Child', parentGoalId: 'missing' });
    expect(pruneSubtreeOrphans([parent, child]).map((g) => g.id)).toEqual(['parent']);
  });
});

describe('collectAncestorChain', () => {
  const all = [
    makeGoal('root', { title: 'Root', timeHorizon: 'Yearly' }),
    makeGoal('mid', { title: 'Mid', parentGoalId: 'root', timeHorizon: 'Quarterly' }),
    makeGoal('leaf', { title: 'Leaf', parentGoalId: 'mid', timeHorizon: 'Daily' }),
    makeGoal('sibling', { title: 'Sibling', parentGoalId: 'mid', timeHorizon: 'Weekly' }),
  ];

  it('returns chain ordered root to leaf', () => {
    expect(collectAncestorChain('leaf', all).map((g) => g.id)).toEqual(['root', 'mid', 'leaf']);
  });

  it('returns single node for a root leaf', () => {
    expect(collectAncestorChain('root', all).map((g) => g.id)).toEqual(['root']);
  });

  it('returns empty for unknown id', () => {
    expect(collectAncestorChain('missing', all)).toEqual([]);
  });

  it('stops on cycles', () => {
    const cyclic = [
      makeGoal('a', { title: 'A' }),
      makeGoal('b', { title: 'B', parentGoalId: 'a' }),
    ];
    cyclic[0] = { ...cyclic[0]!, parentGoalId: 'b' };
    expect(collectAncestorChain('b', cyclic).map((g) => g.id)).toEqual(['a', 'b']);
  });
});

describe('buildPipelineSubtree', () => {
  const all = [
    makeGoal('root', { title: 'Root', timeHorizon: 'Yearly' }),
    makeGoal('mid', { title: 'Mid', parentGoalId: 'root', timeHorizon: 'Quarterly' }),
    makeGoal('leaf', { title: 'Leaf', parentGoalId: 'mid', timeHorizon: 'Daily' }),
    makeGoal('sibling', { title: 'Sibling', parentGoalId: 'mid', timeHorizon: 'Weekly' }),
    makeGoal('cousin', { title: 'Cousin', parentGoalId: 'root', timeHorizon: 'Monthly' }),
  ];

  it('returns ancestors plus leaf without siblings or cousins', () => {
    const result = buildPipelineSubtree('leaf', all);
    expect(result.subtree.map((g) => g.id)).toEqual(['root', 'mid', 'leaf']);
    expect(result.rootId).toBe('root');
    expect([...result.ancestorIds]).toEqual(['root', 'mid']);
    expect(result.leafId).toBe('leaf');
  });

  it('returns single-node subtree for a root focus', () => {
    const result = buildPipelineSubtree('root', all);
    expect(result.subtree.map((g) => g.id)).toEqual(['root']);
    expect(result.rootId).toBe('root');
    expect(result.ancestorIds.size).toBe(0);
  });

  it('returns empty result for unknown leaf', () => {
    const result = buildPipelineSubtree('missing', all);
    expect(result.subtree).toEqual([]);
    expect(result.rootId).toBeNull();
    expect(result.ancestorIds.size).toBe(0);
  });
});

describe('listPipelineLeafGoals', () => {
  it('lists only goals with no children, sorted by timeframe', () => {
    const all = [
      makeGoal('root', { title: 'Root', timeHorizon: 'Yearly' }),
      makeGoal('weekly', {
        title: 'Weekly leaf',
        parentGoalId: 'root',
        timeHorizon: 'Weekly',
      }),
      makeGoal('daily', {
        title: 'Daily leaf',
        parentGoalId: 'root',
        timeHorizon: 'Daily',
      }),
    ];
    expect(listPipelineLeafGoals(all).map((g) => g.id)).toEqual(['daily', 'weekly']);
  });
});
