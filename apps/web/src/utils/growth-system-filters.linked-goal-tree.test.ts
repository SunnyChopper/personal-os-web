import { describe, expect, it } from 'vitest';
import type { Goal } from '@/types/growth-system';
import { buildLinkedGoalTree } from './growth-system-filters';

function mockGoal(overrides: Partial<Goal> & Pick<Goal, 'id' | 'title' | 'timeHorizon'>): Goal {
  return {
    description: null,
    area: 'Health',
    subCategory: null,
    priority: 'P1',
    status: 'Active',
    startDate: null,
    targetDate: null,
    completedDate: null,
    successCriteria: [],
    progressConfig: null,
    parentGoalId: null,
    lastActivityAt: null,
    notes: null,
    userId: 'u1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('buildLinkedGoalTree', () => {
  it('embeds child under linked parent', () => {
    const yearly = mockGoal({ id: 'y1', title: 'Yearly', timeHorizon: 'Yearly' });
    const quarterly = mockGoal({
      id: 'q1',
      title: 'Quarterly',
      timeHorizon: 'Quarterly',
      parentGoalId: 'y1',
    });
    const tree = buildLinkedGoalTree(['y1', 'q1'], [yearly, quarterly]);

    expect(tree).toHaveLength(1);
    expect(tree[0].goal.id).toBe('y1');
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].goal.id).toBe('q1');
    expect(tree[0].children[0].children).toHaveLength(0);
  });

  it('keeps child as root when parent is not linked', () => {
    const yearly = mockGoal({ id: 'y1', title: 'Yearly', timeHorizon: 'Yearly' });
    const quarterly = mockGoal({
      id: 'q1',
      title: 'Quarterly',
      timeHorizon: 'Quarterly',
      parentGoalId: 'y1',
    });
    const tree = buildLinkedGoalTree(['q1'], [yearly, quarterly]);

    expect(tree).toHaveLength(1);
    expect(tree[0].goal.id).toBe('q1');
    expect(tree[0].children).toHaveLength(0);
  });

  it('nests multi-level chains recursively', () => {
    const yearly = mockGoal({ id: 'y1', title: 'Yearly', timeHorizon: 'Yearly' });
    const quarterly = mockGoal({
      id: 'q1',
      title: 'Quarterly',
      timeHorizon: 'Quarterly',
      parentGoalId: 'y1',
    });
    const monthly = mockGoal({
      id: 'm1',
      title: 'Monthly',
      timeHorizon: 'Monthly',
      parentGoalId: 'q1',
    });
    const tree = buildLinkedGoalTree(['y1', 'q1', 'm1'], [yearly, quarterly, monthly]);

    expect(tree).toHaveLength(1);
    expect(tree[0].goal.id).toBe('y1');
    expect(tree[0].children[0].goal.id).toBe('q1');
    expect(tree[0].children[0].children[0].goal.id).toBe('m1');
  });

  it('collapses gaps to nearest linked ancestor', () => {
    const yearly = mockGoal({ id: 'y1', title: 'Yearly', timeHorizon: 'Yearly' });
    const quarterly = mockGoal({
      id: 'q1',
      title: 'Quarterly',
      timeHorizon: 'Quarterly',
      parentGoalId: 'y1',
    });
    const monthly = mockGoal({
      id: 'm1',
      title: 'Monthly',
      timeHorizon: 'Monthly',
      parentGoalId: 'q1',
    });
    const tree = buildLinkedGoalTree(['y1', 'm1'], [yearly, quarterly, monthly]);

    expect(tree).toHaveLength(1);
    expect(tree[0].goal.id).toBe('y1');
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].goal.id).toBe('m1');
  });

  it('returns multiple roots when ancestors are not linked', () => {
    const g1 = mockGoal({ id: 'a', title: 'A', timeHorizon: 'Yearly' });
    const g2 = mockGoal({ id: 'b', title: 'B', timeHorizon: 'Yearly' });
    const tree = buildLinkedGoalTree(['a', 'b'], [g1, g2]);

    expect(tree).toHaveLength(2);
    expect(tree.map((n) => n.goal.id)).toEqual(['a', 'b']);
  });

  it('handles parent cycle without infinite loop', () => {
    const a = mockGoal({ id: 'a', title: 'A', timeHorizon: 'Weekly', parentGoalId: 'b' });
    const b = mockGoal({ id: 'b', title: 'B', timeHorizon: 'Weekly', parentGoalId: 'a' });
    const tree = buildLinkedGoalTree(['a', 'b'], [a, b]);

    expect(tree).toHaveLength(2);
    expect(tree[0].children).toHaveLength(0);
    expect(tree[1].children).toHaveLength(0);
  });

  it('ignores unknown linked ids', () => {
    const yearly = mockGoal({ id: 'y1', title: 'Yearly', timeHorizon: 'Yearly' });
    const tree = buildLinkedGoalTree(['y1', 'missing'], [yearly]);

    expect(tree).toHaveLength(1);
    expect(tree[0].goal.id).toBe('y1');
  });
});
