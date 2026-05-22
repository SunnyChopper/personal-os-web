import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AccumulatedTechDebt } from '@/components/organisms/AccumulatedTechDebt';
import type {
  WeeklyReviewTechDebtCandidate,
  WeeklyReviewTechDebtDecision,
} from '@/types/growth-system';

const candidates: WeeklyReviewTechDebtCandidate[] = [
  {
    taskId: 't1',
    title: 'Stale API migration',
    status: 'In Progress',
    scheduledDate: '2026-04-14T00:00:00Z',
    rolloverCount: 3,
    dueDate: null,
  },
  {
    taskId: 't2',
    title: 'Docs cleanup',
    status: 'Not Started',
    scheduledDate: '2026-04-15T00:00:00Z',
    rolloverCount: 1,
    dueDate: '2026-04-16T00:00:00Z',
  },
];

describe('AccumulatedTechDebt', () => {
  it('renders empty state when no candidates', () => {
    render(<AccumulatedTechDebt candidates={[]} decisions={[]} onChange={vi.fn()} />);
    expect(screen.getByText(/No accumulated debt/i)).toBeInTheDocument();
  });

  it('renders rollover badges and task titles', () => {
    render(<AccumulatedTechDebt candidates={candidates} decisions={[]} onChange={vi.fn()} />);
    expect(screen.getByText('Stale API migration')).toBeInTheDocument();
    expect(screen.getByText('Rolled 3x')).toBeInTheDocument();
    expect(screen.getByText('Rolled 1x')).toBeInTheDocument();
  });

  it('toggles purge and refactor decisions', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AccumulatedTechDebt candidates={candidates} decisions={[]} onChange={onChange} />);

    await user.click(screen.getAllByRole('button', { name: /Purge task/i })[0]);
    expect(onChange).toHaveBeenLastCalledWith([{ taskId: 't1', action: 'purge' }]);

    const decisions: WeeklyReviewTechDebtDecision[] = [{ taskId: 't1', action: 'purge' }];
    onChange.mockClear();
    render(
      <AccumulatedTechDebt candidates={candidates} decisions={decisions} onChange={onChange} />
    );
    await user.click(screen.getAllByRole('button', { name: /Refactor to next week/i })[0]);
    expect(onChange).toHaveBeenLastCalledWith([{ taskId: 't1', action: 'refactor' }]);
  });

  it('does not change decisions when readOnly', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AccumulatedTechDebt candidates={candidates} decisions={[]} onChange={onChange} readOnly />
    );
    await user.click(screen.getAllByRole('button', { name: /Purge task/i })[0]);
    expect(onChange).not.toHaveBeenCalled();
  });
});
