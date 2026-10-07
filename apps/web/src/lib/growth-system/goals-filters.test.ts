import { describe, expect, it } from 'vitest';
import type { Goal, GoalStatus, TimeHorizon } from '@/types/growth-system';
import { childGoalsForParent, filterGoalsForTimeline } from '@/lib/growth-system/goals-filters';

function makeGoal(id: string, status: GoalStatus, overrides: Partial<Goal> = {}): Goal {
  return {
    id,
    title: id,
    description: null,
    area: 'Operations',
    subCategory: null,
    timeHorizon: 'Yearly',
    priority: 'P3',
    status,
    startDate: null,
    targetDate: '2026-06-01',
    completedDate: null,
    successCriteria: [],
    progressConfig: null,
    parentGoalId: null,
    lastActivityAt: null,
    notes: null,
    userId: 'u1',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  };
}

describe('filterGoalsForTimeline', () => {
  const goals = [
    makeGoal('active', 'Active'),
    makeGoal('achieved', 'Achieved'),
    makeGoal('abandoned', 'Abandoned'),
  ];

  it('hides Abandoned by default', () => {
    const result = filterGoalsForTimeline(goals);
    expect(result.map((g) => g.id)).toEqual(['active', 'achieved']);
  });

  it('keeps Achieved goals visible', () => {
    expect(filterGoalsForTimeline(goals).some((g) => g.status === 'Achieved')).toBe(true);
  });

  it('shows Abandoned when status filter is Abandoned', () => {
    const abandonedOnly = [makeGoal('abandoned', 'Abandoned')];
    expect(filterGoalsForTimeline(abandonedOnly, 'Abandoned')).toEqual(abandonedOnly);
  });
});

describe('childGoalsForParent', () => {
  it('returns only goals with matching parentGoalId', () => {
    const goals = [
      makeGoal('parent', 'Active'),
      makeGoal('child-a', 'Active', { parentGoalId: 'parent', timeHorizon: 'Quarterly' }),
      makeGoal('child-b', 'Active', { parentGoalId: 'parent', timeHorizon: 'Monthly' }),
      makeGoal('other', 'Active', { parentGoalId: 'elsewhere' }),
    ];
    expect(childGoalsForParent(goals, 'parent').map((g) => g.id)).toEqual(['child-b', 'child-a']);
  });

  it('sorts by time horizon Daily → Yearly then title', () => {
    const horizons: TimeHorizon[] = ['Yearly', 'Weekly', 'Monthly'];
    const goals = horizons.map((horizon, index) =>
      makeGoal(`g-${index}`, 'Active', {
        parentGoalId: 'parent',
        timeHorizon: horizon,
        title: `Goal ${horizon}`,
      })
    );
    goals.push(makeGoal('parent', 'Active'));
    expect(childGoalsForParent(goals, 'parent').map((g) => g.timeHorizon)).toEqual([
      'Weekly',
      'Monthly',
      'Yearly',
    ]);
  });

  it('returns empty array when no children exist', () => {
    const goals = [makeGoal('solo', 'Active')];
    expect(childGoalsForParent(goals, 'solo')).toEqual([]);
  });
});
