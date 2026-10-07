import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Goal } from '@/types/growth-system';
import { GoalDetailView } from '@/components/organisms/GoalDetailView';
import { goalDetailDeleteButtonClassName } from '@/lib/growth-system/goal-detail-surfaces';

vi.mock('@/services/growth-system/goals.service', () => ({
  goalsService: {
    getMemoryThread: vi.fn().mockResolvedValue({
      entityType: 'goal',
      entityId: 'goal-1',
      entityName: 'Parent Goal',
      items: [],
      totalItems: 0,
    }),
  },
}));

vi.mock('@/services/growth-system/goal-progress.service', () => ({
  goalProgressService: {
    computeProgress: vi.fn().mockResolvedValue({
      overall: 50,
      criteria: { completed: 1, total: 2, percentage: 50 },
      tasks: { completed: 0, total: 0, percentage: 0 },
      metrics: { atTarget: 0, total: 0, percentage: 0 },
      habits: { streakDays: 0, consistency: 0 },
    }),
    calculateCriteriaProgress: vi.fn().mockReturnValue({ completed: 0, total: 0, percentage: 0 }),
  },
}));

vi.mock('@/lib/growth-system/logbook-entity-links', () => ({
  useEntityLogbookLinkPicker: () => ({
    isLogbookPickerOpen: false,
    setIsLogbookPickerOpen: vi.fn(),
    openLogbookPicker: vi.fn(),
    logbookPickerEntities: [],
    selectedLogbookIds: [],
    setSelectedLogbookIds: vi.fn(),
    handleLogbookSave: vi.fn(),
    isLogbookSaving: false,
    isLogbookLoading: false,
    logbookSaveError: null,
    setLogbookSaveError: vi.fn(),
    memoryReloadKey: 0,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const baseGoal: Goal = {
  id: 'goal-1',
  title: 'Secure Top-Tier MSAI Admission',
  description: 'Graduate school application goal.',
  area: 'Wealth',
  subCategory: 'Income',
  timeHorizon: 'Yearly',
  priority: 'P1',
  status: 'Active',
  health: null,
  startDate: '2026-01-15',
  targetDate: '2027-03-15',
  completedDate: null,
  successCriteria: [
    {
      id: 'c1',
      description: 'Submit application',
      isCompleted: false,
      completedAt: null,
      linkedMetricId: null,
      linkedTaskId: null,
      targetDate: null,
      order: 0,
    },
  ],
  progressConfig: null,
  parentGoalId: null,
  lastActivityAt: null,
  notes: 'Priority notes for the admissions cycle.',
  userId: 'user-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const childGoal: Goal = {
  ...baseGoal,
  id: 'goal-child',
  title: 'GRE Quant Prep',
  timeHorizon: 'Quarterly',
  parentGoalId: 'goal-1',
  notes: null,
  successCriteria: [],
};

function renderGoalDetailView(
  goal: Goal = baseGoal,
  extraProps: Partial<ComponentProps<typeof GoalDetailView>> = {}
) {
  return render(
    <MemoryRouter>
      <GoalDetailView
        goal={goal}
        childGoals={extraProps.childGoals ?? []}
        tasks={[]}
        metrics={[]}
        habits={[]}
        projects={[]}
        onBack={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        {...extraProps}
      />
    </MemoryRouter>
  );
}

describe('GoalDetailView', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1280,
    });
  });

  it('renders formatted start date and em dash when start date is missing', async () => {
    renderGoalDetailView({ ...baseGoal, startDate: null });

    await waitFor(() => {
      expect(screen.getByText('Start Date')).toBeInTheDocument();
    });
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders formatted start date when present', async () => {
    renderGoalDetailView();

    await waitFor(() => {
      expect(screen.getByText('January 15, 2026')).toBeInTheDocument();
    });
  });

  it('shows child goals and calls onChildGoalClick when a row is clicked', async () => {
    const onChildGoalClick = vi.fn();
    const user = userEvent.setup();

    renderGoalDetailView(baseGoal, {
      childGoals: [childGoal],
      onChildGoalClick,
    });

    await waitFor(() => {
      expect(screen.getByText('Child goals (1)')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /GRE Quant Prep/i }));
    expect(onChildGoalClick).toHaveBeenCalledWith(childGoal);
  });

  it('omits child goals section when there are no children', async () => {
    renderGoalDetailView();

    await waitFor(() => {
      expect(screen.getByText('Secure Top-Tier MSAI Admission')).toBeInTheDocument();
    });
    expect(screen.queryByText(/Child goals/i)).not.toBeInTheDocument();
  });

  it('renders notes collapsed by default', async () => {
    renderGoalDetailView();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Notes' })).toBeInTheDocument();
    });

    const notesToggle = screen.getByRole('button', { name: 'Notes' });
    expect(notesToggle).toHaveAttribute('aria-expanded', 'false');
    const notesPanelId = notesToggle.getAttribute('aria-controls');
    expect(notesPanelId).toBeTruthy();
    const notesPanel = document.getElementById(notesPanelId!);
    expect(notesPanel).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders memory thread collapsed by default', async () => {
    renderGoalDetailView();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /memory thread \(0\)/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /memory thread \(0\)/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('uses solid red delete button classes', async () => {
    renderGoalDetailView();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    goalDetailDeleteButtonClassName.split(' ').forEach((token) => {
      if (token.startsWith('!')) {
        expect(deleteButton.className).toContain(token.replace('!', ''));
      }
    });
  });

  it('does not use auto-rows-fr on the linked entity grid', async () => {
    const { container } = renderGoalDetailView();

    await waitFor(() => {
      expect(screen.getByTestId('goal-detail-linked-grid')).toBeInTheDocument();
    });

    const grid = container.querySelector('[data-testid="goal-detail-linked-grid"]');
    expect(grid?.className).not.toContain('auto-rows-fr');
    expect(grid?.className).toContain('items-start');
  });

  it('renders custom backLabel when opened from a project', async () => {
    renderGoalDetailView(baseGoal, { backLabel: 'Back to Synthicate Ops' });

    expect(screen.getByRole('button', { name: 'Back to Synthicate Ops' })).toBeInTheDocument();
    expect(screen.getByText('Back to Synthicate Ops')).toBeInTheDocument();
  });
});
