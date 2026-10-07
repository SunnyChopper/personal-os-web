import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Goal } from '@/types/growth-system';
import { ProjectLinkedGoalCard } from './ProjectLinkedGoalCard';
import { projectLinkedGoalTitleClassName } from '@/lib/projects/project-linked-goal-card-surfaces';

const baseGoal: Goal = {
  id: 'goal-1',
  title: 'Build a Micro-Application Portfolio Using Synthicate Platform',
  description: 'Short description.',
  area: 'Wealth',
  subCategory: 'Income',
  timeHorizon: 'Yearly',
  priority: 'P1',
  status: 'Planning',
  health: null,
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

describe('ProjectLinkedGoalCard', () => {
  it('renders full title with break-words (no truncate class)', () => {
    render(
      <ProjectLinkedGoalCard
        goal={baseGoal}
        projectName="Synthicate Ops"
        onOpen={vi.fn()}
        onUnlink={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { level: 3 })).toHaveClass(projectLinkedGoalTitleClassName);
    expect(screen.getByText(baseGoal.title)).toBeInTheDocument();
  });

  it('clamps long descriptions at 128 chars with Show More/Less toggle', async () => {
    const user = userEvent.setup();
    const longDescription =
      `${'Build and deploy a high-volume portfolio of AI micro-applications using Synthicate. '.repeat(3)}`.trim();

    render(
      <ProjectLinkedGoalCard
        goal={{ ...baseGoal, description: longDescription }}
        projectName="Synthicate Ops"
        onOpen={vi.fn()}
        onUnlink={vi.fn()}
      />
    );

    expect(screen.getByText(new RegExp(`^${longDescription.slice(0, 128)}…`))).toBeInTheDocument();
    const showMore = screen.getByRole('button', { name: 'Show More' });
    await user.click(showMore);
    expect(screen.getByText(longDescription)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show Less' }));
    expect(screen.getByRole('button', { name: 'Show More' })).toBeInTheDocument();
  });

  it('opens goal detail when card is clicked but not when controls are used', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onUnlink = vi.fn();
    const longGoal = { ...baseGoal, description: `${'x'.repeat(140)}` };

    render(
      <ProjectLinkedGoalCard
        goal={longGoal}
        projectName="Synthicate Ops"
        contributionWeight={2}
        onOpen={onOpen}
        onContributionWeightChange={vi.fn()}
        onUnlink={onUnlink}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Show More' }));
    expect(onOpen).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /Unlink/i }));
    expect(onOpen).not.toHaveBeenCalled();
    expect(onUnlink).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /View goal details/i }));
    expect(onOpen).toHaveBeenCalledWith(longGoal);
  });
});
