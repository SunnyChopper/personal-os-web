import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { MorningLaunchpad } from '@/components/organisms/MorningLaunchpad';
import type { Task } from '@/types/growth-system';
import { ROUTES } from '@/routes';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/hooks/useGrowthSystem', () => ({
  useTasks: () => ({
    tasks: [],
    updateTask: vi.fn(),
    completeTask: vi.fn(),
  }),
  useHabits: () => ({ habits: [] }),
  useGoals: () => ({ goals: [] }),
}));

vi.mock('@/hooks/useFitness', () => ({
  useFitnessRecoveryRange: () => ({ data: undefined }),
  useUpsertRecoveryMutation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

function makeTask(id: string, title: string): Task {
  return {
    id,
    title,
    description: null,
    extendedDescription: null,
    area: 'Operations',
    subCategory: null,
    priority: 'P1',
    status: 'Not Started',
    size: 5,
    dueDate: '2026-07-09',
    scheduledDate: null,
    completedDate: null,
    notes: null,
    isRecurring: false,
    recurrenceRule: null,
    pointValue: null,
    pointsAwarded: null,
    projectIds: [],
    goalIds: [],
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

describe('MorningLaunchpad topTasks handoff', () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it('renders only seeded top tasks and passes them to focus mode on engage', () => {
    vi.useFakeTimers();

    const topTasks = [
      makeTask('top-1', 'Read Textbook Lesson 3'),
      makeTask('top-2', 'Polish Personal Branding Module'),
      makeTask('top-3', 'Evaluate App Store API'),
    ];

    render(
      <MemoryRouter>
        <MorningLaunchpad isOpen topTasks={topTasks} onClose={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText('Read Textbook Lesson 3')).toBeInTheDocument();
    expect(screen.getByText('Polish Personal Branding Module')).toBeInTheDocument();
    expect(screen.getByText('Evaluate App Store API')).toBeInTheDocument();
    expect(screen.queryByText('Job Applications Tracking System')).not.toBeInTheDocument();

    const engageButton = screen.getByRole('button', { name: /engage - enter focus mode/i });
    expect(engageButton).toBeEnabled();

    fireEvent.click(engageButton);
    vi.advanceTimersByTime(300);

    expect(navigateMock).toHaveBeenCalledWith(
      ROUTES.admin.focus,
      expect.objectContaining({
        state: {
          sessionTasks: expect.arrayContaining([
            expect.objectContaining({ id: 'top-1' }),
            expect.objectContaining({ id: 'top-2' }),
            expect.objectContaining({ id: 'top-3' }),
          ]),
        },
      })
    );
    expect(navigateMock.mock.calls[0]?.[1]?.state.sessionTasks).toHaveLength(3);

    vi.useRealTimers();
  });

  it('disables engage when top tasks are empty', () => {
    render(
      <MemoryRouter>
        <MorningLaunchpad isOpen topTasks={[]} onClose={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /engage - enter focus mode/i })).toBeDisabled();
  });
});
