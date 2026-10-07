import { describe, expect, it } from 'vitest';
import type { GoalProgressBreakdown } from '@/types/growth-system';
import { buildGoalProgressOverview } from '@/utils/goal-progress-overview';

function baseProgress(overrides: Partial<GoalProgressBreakdown> = {}): GoalProgressBreakdown {
  return {
    overall: 52,
    criteria: { completed: 0, total: 3, percentage: 0 },
    tasks: { completed: 4, total: 5, percentage: 80 },
    metrics: { atTarget: 0, total: 0, percentage: 0 },
    habits: { streakDays: 0, consistency: 0 },
    projects: {
      linkedCount: 2,
      percentage: 38.7,
      items: [
        {
          projectId: 'p1',
          title: 'UND - Intro to Linear Algebra',
          completionPercentage: 27.3,
          contributionWeight: 1,
          normalizedShare: 0.5,
        },
        {
          projectId: 'p2',
          title: 'GRE Exam - Quant',
          completionPercentage: 50,
          contributionWeight: 1,
          normalizedShare: 0.5,
        },
      ],
    },
    weights: {
      criteriaWeight: 35,
      tasksWeight: 50,
      metricsWeight: 0,
      habitsWeight: 0,
      projectsWeight: 15,
      manualOverride: null,
    },
    ...overrides,
  };
}

describe('buildGoalProgressOverview', () => {
  it('omits factors with zero weight', () => {
    const overview = buildGoalProgressOverview(baseProgress());
    const keys = overview.factors.map((f) => f.key);
    expect(keys).toEqual(['criteria', 'tasks', 'projects']);
    expect(keys).not.toContain('metrics');
    expect(keys).not.toContain('habits');
  });

  it('computes weighted contribution points', () => {
    const overview = buildGoalProgressOverview(baseProgress());
    const criteria = overview.factors.find((f) => f.key === 'criteria');
    const tasks = overview.factors.find((f) => f.key === 'tasks');
    const projects = overview.factors.find((f) => f.key === 'projects');
    expect(criteria?.contributionPts).toBe(0);
    expect(tasks?.contributionPts).toBe(40);
    expect(projects?.contributionPts).toBe(5.8);
    expect(overview.computedOverall).toBe(45.8);
  });

  it('builds formula label from visible factors', () => {
    const overview = buildGoalProgressOverview(baseProgress());
    expect(overview.formulaLabel).toBe('(0% × 35 + 80% × 50 + 38.7% × 15) / 100');
  });

  it('uses manual override for computed overall', () => {
    const overview = buildGoalProgressOverview(
      baseProgress({
        weights: {
          criteriaWeight: 35,
          tasksWeight: 50,
          metricsWeight: 0,
          habitsWeight: 0,
          projectsWeight: 15,
          manualOverride: 52,
        },
      })
    );
    expect(overview.manualOverride).toBe(52);
    expect(overview.computedOverall).toBe(52);
  });

  it('lists source items when provided', () => {
    const overview = buildGoalProgressOverview(baseProgress(), {
      criteria: [
        { id: 'c1', description: 'GRE Quant score', isCompleted: false },
        { id: 'c2', description: 'Linear Algebra A', isCompleted: false },
      ],
      tasks: [{ id: 't1', title: 'Study chapter 1', status: 'Done' }],
    });
    const criteria = overview.factors.find((f) => f.key === 'criteria');
    const tasks = overview.factors.find((f) => f.key === 'tasks');
    expect(criteria?.items).toHaveLength(2);
    expect(criteria?.items[0].title).toBe('GRE Quant score');
    expect(tasks?.items[0].title).toBe('Study chapter 1');
    expect(tasks?.items[0].detail).toBe('Done');
  });

  it('falls back to project items from progress when no sourceItems', () => {
    const overview = buildGoalProgressOverview(baseProgress());
    const projects = overview.factors.find((f) => f.key === 'projects');
    expect(projects?.items).toHaveLength(2);
    expect(projects?.items[0].title).toBe('UND - Intro to Linear Algebra');
  });
});
