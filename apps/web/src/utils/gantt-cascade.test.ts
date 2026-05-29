import { describe, expect, it } from 'vitest';
import type { Goal, GoalDependency } from '@/types/growth-system';
import { buildGoalDateMap, computeCascadeUpdates } from './gantt-cascade';

function mockGoal(id: string, start: string, target: string, createdAt = start): Goal {
  return {
    id,
    title: id,
    description: null,
    area: 'Operations',
    subCategory: null,
    timeHorizon: 'Quarterly',
    priority: 'P3',
    status: 'Active',
    startDate: start,
    targetDate: target,
    completedDate: null,
    successCriteria: [],
    progressConfig: null,
    parentGoalId: null,
    lastActivityAt: null,
    notes: null,
    userId: 'u1',
    createdAt,
    updatedAt: createdAt,
  };
}

describe('computeCascadeUpdates', () => {
  it('pushes successor when predecessor end moves later', () => {
    const goals = [
      mockGoal('a', '2026-01-01', '2026-01-10'),
      mockGoal('b', '2026-01-11', '2026-01-20'),
    ];
    const deps: GoalDependency[] = [
      {
        predecessorGoalId: 'a',
        successorGoalId: 'b',
        lagDays: 1,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];
    const map = buildGoalDateMap(goals);
    map.a.targetDate = '2026-01-15';
    const updates = computeCascadeUpdates(map, deps, ['a']);
    expect(updates).toHaveLength(1);
    expect(updates[0].id).toBe('b');
    expect(updates[0].startDate).toBe('2026-01-16');
    expect(updates[0].targetDate).toBe('2026-01-25');
  });

  it('does not pull successor earlier when predecessor moves earlier', () => {
    const goals = [
      mockGoal('a', '2026-01-01', '2026-01-20'),
      mockGoal('b', '2026-01-25', '2026-02-05'),
    ];
    const deps: GoalDependency[] = [
      {
        predecessorGoalId: 'a',
        successorGoalId: 'b',
        lagDays: 5,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];
    const map = buildGoalDateMap(goals);
    map.a.targetDate = '2026-01-10';
    const updates = computeCascadeUpdates(map, deps, ['a']);
    expect(updates).toHaveLength(0);
  });
});
