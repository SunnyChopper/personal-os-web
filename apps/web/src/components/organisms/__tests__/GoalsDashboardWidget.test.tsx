import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GoalsDashboardWidget } from '@/components/organisms/GoalsDashboardWidget';
import type { Goal } from '@/types/growth-system';

function makeGoal(
  partial: Pick<Goal, 'id' | 'title' | 'timeHorizon' | 'priority' | 'status'> &
    Partial<Omit<Goal, 'id' | 'title' | 'timeHorizon' | 'priority' | 'status'>>
): Goal {
  return {
    id: partial.id,
    title: partial.title,
    description: null,
    area: 'Health',
    subCategory: null,
    timeHorizon: partial.timeHorizon,
    priority: partial.priority,
    status: partial.status,
    targetDate: partial.targetDate ?? null,
    completedDate: partial.completedDate ?? null,
    successCriteria: partial.successCriteria ?? [],
    progressConfig: partial.progressConfig ?? null,
    parentGoalId: partial.parentGoalId ?? null,
    lastActivityAt: partial.lastActivityAt ?? null,
    notes: partial.notes ?? null,
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function renderWidget(goals: Goal[], goalsProgress?: Map<string, number>) {
  return render(
    <MemoryRouter>
      <GoalsDashboardWidget goals={goals} goalsProgress={goalsProgress ?? new Map()} />
    </MemoryRouter>
  );
}

describe('GoalsDashboardWidget', () => {
  it('shows only the goal at the lowest (most granular) time horizon', () => {
    const goals = [
      makeGoal({
        id: 'y1',
        title: 'Year goal',
        timeHorizon: 'Yearly',
        priority: 'P1',
        status: 'Active',
      }),
      makeGoal({
        id: 'q1',
        title: 'Quarter goal',
        timeHorizon: 'Quarterly',
        priority: 'P1',
        status: 'Active',
      }),
      makeGoal({
        id: 'm1',
        title: 'Monthly goal',
        timeHorizon: 'Monthly',
        priority: 'P1',
        status: 'Active',
      }),
      makeGoal({
        id: 'w1',
        title: 'Sleep & System Bootup',
        timeHorizon: 'Weekly',
        priority: 'P1',
        status: 'Active',
      }),
    ];
    const progress = new Map<string, number>(goals.map((g) => [g.id, 0]));

    renderWidget(goals, progress);

    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('Sleep & System Bootup');
    expect(screen.queryByText('Monthly goal')).not.toBeInTheDocument();
    expect(screen.queryByText('Quarter goal')).not.toBeInTheDocument();
  });

  it('when several goals share the lowest horizon, picks higher priority first', () => {
    const goals = [
      makeGoal({
        id: 'w1',
        title: 'Lower priority weekly',
        timeHorizon: 'Weekly',
        priority: 'P2',
        status: 'Active',
      }),
      makeGoal({
        id: 'w2',
        title: 'Focus weekly',
        timeHorizon: 'Weekly',
        priority: 'P1',
        status: 'Active',
      }),
    ];
    const progress = new Map<string, number>([
      ['w1', 0],
      ['w2', 0],
    ]);

    renderWidget(goals, progress);

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Focus weekly');
  });

  it('when priority matches, prefers lower progress', () => {
    const goals = [
      makeGoal({
        id: 'w1',
        title: 'More complete',
        timeHorizon: 'Weekly',
        priority: 'P1',
        status: 'Active',
      }),
      makeGoal({
        id: 'w2',
        title: 'Needs focus',
        timeHorizon: 'Weekly',
        priority: 'P1',
        status: 'Active',
      }),
    ];
    const progress = new Map<string, number>([
      ['w1', 50],
      ['w2', 10],
    ]);

    renderWidget(goals, progress);

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Needs focus');
  });

  it('when priority and progress match, prefers earliest target date', () => {
    const goals = [
      makeGoal({
        id: 'w1',
        title: 'Later target',
        timeHorizon: 'Weekly',
        priority: 'P1',
        status: 'Active',
        targetDate: '2026-12-01',
      }),
      makeGoal({
        id: 'w2',
        title: 'Sooner target',
        timeHorizon: 'Weekly',
        priority: 'P1',
        status: 'Active',
        targetDate: '2026-06-01',
      }),
    ];
    const progress = new Map<string, number>([
      ['w1', 0],
      ['w2', 0],
    ]);

    renderWidget(goals, progress);

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Sooner target');
  });

  it('shows empty state when no Active, On Track, or At Risk goals', () => {
    const goals: Goal[] = [
      makeGoal({
        id: 'g1',
        title: 'Planning only',
        timeHorizon: 'Weekly',
        priority: 'P1',
        status: 'Planning',
      }),
      makeGoal({
        id: 'g2',
        title: 'Done',
        timeHorizon: 'Weekly',
        priority: 'P1',
        status: 'Achieved',
      }),
    ];

    renderWidget(goals);

    expect(
      screen.getByText('No active goals. Create your first goal to get started!')
    ).toBeInTheDocument();
  });
});
