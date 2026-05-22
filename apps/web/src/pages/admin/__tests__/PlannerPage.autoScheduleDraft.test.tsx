import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

import PlannerPage from '@/pages/admin/PlannerPage';
import type { PlannerAutoSchedulePreview, PlannerWeek } from '@/types/planner';

const mockPreviewMutateAsync = vi.fn();
const mockCommitMutateAsync = vi.fn();

const sampleWeek: PlannerWeek = {
  weekStart: '2026-05-18',
  weekEnd: '2026-05-24',
  timeZone: 'UTC',
  velocity: {
    dailyCapacityStoryPoints: 3,
    trailingWeeklyAverageStoryPoints: 10,
    dailyBurnRate: 2,
    confidence: 'high',
  },
  days: [
    {
      date: '2026-05-19',
      capacityStoryPoints: 3,
      scheduledStoryPoints: 0,
      scheduledMinutes: 0,
      loadRatio: 0,
      capacityState: 'healthy',
      oneThingTaskId: null,
      calendarBusyMinutes: 0,
      calendarFreeMinutes: 0,
      lastGeneratedAt: null,
      blocks: [],
    },
  ],
};

const samplePreview: PlannerAutoSchedulePreview = {
  weekStart: '2026-05-18',
  weekEnd: '2026-05-24',
  timeZone: 'UTC',
  velocity: sampleWeek.velocity,
  proposedBlocks: [
    {
      tempId: 'prop_test_1',
      date: '2026-05-19',
      startAt: '2026-05-19T10:00:00',
      endAt: '2026-05-19T11:00:00',
      taskId: 'task-1',
      taskTitleSnapshot: 'Draft task',
      storyPointsLoad: 3,
      reason: 'test',
    },
  ],
};

vi.mock('@/hooks/useGrowthSystemDashboard', () => ({
  useGrowthSystemDashboard: () => ({ tasks: [] }),
}));

vi.mock('@/components/organisms/planner/PlannerOneThingPanel', () => ({
  PlannerOneThingPanel: () => null,
}));

vi.mock('@/components/organisms/planner/PlannerDayDrawer', () => ({
  PlannerDayDrawer: () => null,
}));

vi.mock('@/hooks/usePlanner', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/usePlanner')>();
  return {
    ...actual,
    usePlannerWeek: () => ({
      data: sampleWeek,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    }),
    usePlannerAutoSchedulePreview: () => ({
      mutateAsync: mockPreviewMutateAsync,
      isPending: false,
    }),
    usePlannerAutoScheduleCommit: () => ({
      mutateAsync: mockCommitMutateAsync,
      isPending: false,
    }),
    usePatchPlannerBlock: () => ({
      mutate: vi.fn(),
      isPending: false,
    }),
  };
});

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <MemoryRouter initialEntries={['/admin/planner?date=2026-05-19']}>
      <QueryClientProvider client={qc}>
        <PlannerPage />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('PlannerPage auto-schedule draft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPreviewMutateAsync.mockResolvedValue(samplePreview);
    mockCommitMutateAsync.mockResolvedValue(sampleWeek);
  });

  it('shows draft banner and ghost block after preview', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /auto-schedule/i }));
    expect(await screen.findByRole('region', { name: /draft confirmation/i })).toBeInTheDocument();
    expect(screen.getByText('Draft task')).toBeInTheDocument();
    expect(screen.getAllByText('Draft').length).toBeGreaterThan(0);
    expect(mockPreviewMutateAsync).toHaveBeenCalled();
  });

  it('clears draft on cancel', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /auto-schedule/i }));
    await screen.findByRole('region', { name: /draft confirmation/i });
    await user.click(screen.getByRole('button', { name: /^cancel$/i }));
    await waitFor(() => {
      expect(screen.queryByRole('region', { name: /draft confirmation/i })).not.toBeInTheDocument();
    });
    expect(mockCommitMutateAsync).not.toHaveBeenCalled();
  });

  it('commits draft blocks', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /auto-schedule/i }));
    await screen.findByRole('region', { name: /draft confirmation/i });
    await user.click(screen.getByRole('button', { name: /commit schedule/i }));
    await waitFor(() => {
      expect(mockCommitMutateAsync).toHaveBeenCalledWith({
        blocks: samplePreview.proposedBlocks,
      });
    });
    await waitFor(() => {
      expect(screen.queryByRole('region', { name: /draft confirmation/i })).not.toBeInTheDocument();
    });
  });
});
