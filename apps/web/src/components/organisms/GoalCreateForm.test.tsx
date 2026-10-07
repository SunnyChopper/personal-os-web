import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Goal } from '@/types/growth-system';
import { GoalCreateForm } from '@/components/organisms/GoalCreateForm';

const baseParentGoal: Goal = {
  id: 'goal-parent-1',
  title: 'Parent yearly goal',
  description: null,
  area: 'Health',
  subCategory: null,
  timeHorizon: 'Yearly',
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
  userId: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('GoalCreateForm priority', () => {
  const noop = vi.fn();

  it('defaults Priority to P3 on standalone create', () => {
    render(<GoalCreateForm onSubmit={noop} onCancel={noop} />);

    expect(screen.getByLabelText(/^Priority/)).toHaveValue('P3');
  });

  it('inherits parent goal priority when creating a subgoal', () => {
    render(
      <GoalCreateForm
        onSubmit={noop}
        onCancel={noop}
        parentGoal={baseParentGoal}
        allGoals={[baseParentGoal]}
      />
    );

    expect(screen.getByLabelText(/^Priority/)).toHaveValue('P1');
  });

  it('submits selected priority on create', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<GoalCreateForm onSubmit={onSubmit} onCancel={noop} />);

    await user.type(screen.getByLabelText(/^Title/), 'Ship quarterly milestone');
    await user.selectOptions(screen.getByLabelText(/^Priority/), 'P2');
    await user.click(screen.getByRole('button', { name: 'Create Goal' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Ship quarterly milestone',
        priority: 'P2',
      })
    );
  });
});
