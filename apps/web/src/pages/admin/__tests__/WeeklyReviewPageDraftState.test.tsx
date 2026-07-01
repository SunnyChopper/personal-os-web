import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

import WeeklyReviewPage from '@/pages/admin/WeeklyReviewPage';
import type { WeeklyReview, WeeklyReviewCurrentDashboard } from '@/types/growth-system';
import { DEFAULT_WEEKLY_DASHBOARD_CONFIG } from '@/types/weekly-dashboard';

const WEEK_START = '2026-05-19';

const sampleStats = {
  tasksCompleted: 3,
  tasksPlanned: 5,
  totalStoryPoints: 10,
  completedStoryPoints: 8,
  habitCompletions: 4,
  habitTargets: 7,
  metricsLogged: 2,
  goalsActive: 1,
  goalsAtRisk: 0,
  journalEntries: 1,
};

const sampleAiAnalysis = {
  tasksSummary: 'Good week',
  overdueTasks: [],
  velocityTrend: 'up',
  habitsSummary: 'Solid',
  habitsOnTarget: true,
  habitsAiMessage: 'Keep going',
  metricsSummary: 'Logged',
  metricDeltas: [],
  goalsSummary: 'On track',
  atRiskAlerts: [],
  logbookSummary: 'Quiet',
  quarantineCandidates: [],
  techDebtCandidates: [
    {
      taskId: 'debt-1',
      title: 'Lagging task',
      status: 'In Progress',
      scheduledDate: '2026-05-20T00:00:00Z',
      rolloverCount: 2,
    },
  ],
  suggestedTasks: [],
  hypeSummary: 'Nice work',
};

function makeDraftSnapshot(overrides?: Partial<WeeklyReview>): WeeklyReview {
  return {
    id: 'wr-1',
    weekStart: WEEK_START,
    weekEnd: '2026-05-25',
    status: 'generated',
    stats: sampleStats,
    velocityData: [{ weekStart: WEEK_START, storyPointsCompleted: 8, tasksCompleted: 3 }],
    aiAnalysis: sampleAiAnalysis,
    planActions: null,
    completionSummary: null,
    createdAt: '2026-05-19T12:00:00Z',
    updatedAt: '2026-05-19T12:00:00Z',
    ...overrides,
  };
}

const midWeekCurrent: WeeklyReviewCurrentDashboard = {
  weekStart: WEEK_START,
  weekEnd: '2026-05-25',
  isMidWeek: true,
  hasGeneratedReview: false,
  pendingReview: false,
  statsPartial: sampleStats,
  velocityData: [{ weekStart: WEEK_START, storyPointsCompleted: 8, tasksCompleted: 3 }],
  trailingAverageStoryPoints: 6,
  currentWeekStoryPoints: 8,
  rollingAverageStoryPoints: [5, 6, 7],
};

const mockGenerateMutateAsync = vi.fn();
const mockSavePlanMutateAsync = vi.fn();
const mockCompleteMutateAsync = vi.fn();
const mockDiscardMutateAsync = vi.fn();
const mockRefetchCurrent = vi.fn();
const mockRefetchSnapshot = vi.fn();

let snapshotData: WeeklyReview | null = null;
let currentData: WeeklyReviewCurrentDashboard = midWeekCurrent;

vi.mock('@/hooks/useGrowthSystemDashboard', () => ({
  useGrowthSystemDashboard: () => ({ tasks: [] }),
}));

vi.mock('@/hooks/useWeeklyDashboardConfig', () => ({
  useWeeklyDashboardConfig: () => ({ data: DEFAULT_WEEKLY_DASHBOARD_CONFIG }),
}));

vi.mock('@/components/organisms/WeeklyDashboardGrid', () => ({
  WeeklyDashboardGrid: () => <div data-testid="weekly-dashboard-grid" />,
}));

vi.mock('@/components/organisms/WeeklyDashboardSettingsDrawer', () => ({
  WeeklyDashboardSettingsDrawer: () => null,
}));

vi.mock('@/components/organisms/widgets/weekly/LeverageRoiRetrospectiveWidget', () => ({
  LeverageRoiRetrospectiveWidget: () => null,
}));

vi.mock('@/components/molecules/VelocityChart', () => ({
  VelocityChart: () => <div data-testid="velocity-chart" />,
}));

vi.mock('@/components/organisms/QuarantineZone', () => ({
  QuarantineZone: () => null,
}));

vi.mock('@/components/organisms/AccumulatedTechDebt', () => ({
  AccumulatedTechDebt: () => <div data-testid="accumulated-tech-debt" />,
}));

vi.mock('@/components/organisms/BlockerResolution', () => ({
  BlockerResolution: () => null,
}));

vi.mock('@/components/organisms/AISuggestedTasks', () => ({
  AISuggestedTasks: () => null,
}));

vi.mock('@/hooks/useWeeklyReview', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useWeeklyReview')>();
  return {
    ...actual,
    useWeeklyReviewCurrent: () => ({
      data: currentData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetchCurrent,
    }),
    useWeeklyReviewList: () => ({
      data: { reviews: [], page: 1, pageSize: 30, total: 0, hasMore: false },
    }),
    useWeeklyReviewSnapshot: () => ({
      data: snapshotData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetchSnapshot,
    }),
    useWeeklyReviewLeverageRoi: () => ({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    }),
    useWeeklyReviewMutations: () => ({
      generate: { mutateAsync: mockGenerateMutateAsync, isPending: false },
      savePlan: { mutateAsync: mockSavePlanMutateAsync, isPending: false },
      complete: { mutateAsync: mockCompleteMutateAsync, isPending: false },
      suggestTasks: { mutateAsync: vi.fn(), isPending: false },
      discard: { mutateAsync: mockDiscardMutateAsync, isPending: false },
    }),
    useSendWeeklyReviewEmail: () => ({ mutateAsync: vi.fn(), isPending: false }),
  };
});

function renderPage(initialEntry = '/admin/weekly-review') {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <QueryClientProvider client={qc}>
        <WeeklyReviewPage />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('WeeklyReviewPage draft state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    snapshotData = null;
    currentData = { ...midWeekCurrent };
    mockGenerateMutateAsync.mockImplementation(async () => {
      const draft = makeDraftSnapshot();
      snapshotData = draft;
      currentData = { ...midWeekCurrent, hasGeneratedReview: true };
      return draft;
    });
    mockCompleteMutateAsync.mockResolvedValue(makeDraftSnapshot({ status: 'completed' }));
    mockDiscardMutateAsync.mockResolvedValue(undefined);
    mockRefetchCurrent.mockResolvedValue({ data: midWeekCurrent });
    mockRefetchSnapshot.mockResolvedValue({ data: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows draft banner and discard control for live draft snapshot', () => {
    snapshotData = makeDraftSnapshot();
    currentData = { ...midWeekCurrent, hasGeneratedReview: true };
    renderPage(`/admin/weekly-review?week=${WEEK_START}`);

    expect(screen.getByRole('status', { name: /weekly review draft/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Unsaved changes will not affect your historical metrics/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Discard Draft \/ Re-open Week/i })
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Finalize & Lock Week/i })).not.toBeInTheDocument();
  });

  it('calls generate (not complete) when Run weekly review now is clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Run weekly review now/i }));

    await waitFor(() => {
      expect(mockGenerateMutateAsync).toHaveBeenCalledTimes(1);
    });
    expect(mockCompleteMutateAsync).not.toHaveBeenCalled();
  });

  it('opens early closeout modal when eligible and does not generate immediately', async () => {
    const user = userEvent.setup();
    currentData = {
      ...midWeekCurrent,
      localDate: '2026-05-22',
      earlyCloseoutEligible: true,
      oooStandbySuggestion: {
        protectedStartDate: '2026-05-23',
        protectedEndDate: '2026-05-25',
        protectedDates: ['2026-05-23', '2026-05-24', '2026-05-25'],
      },
      activeOooStandby: null,
    };
    renderPage();

    await user.click(screen.getByRole('button', { name: /Run weekly review now/i }));

    expect(
      screen.getByText(/Going off-grid early\? Let's protect your streaks/i)
    ).toBeInTheDocument();
    expect(mockGenerateMutateAsync).not.toHaveBeenCalled();
  });

  it('activates OOO standby when primary modal action is clicked', async () => {
    const user = userEvent.setup();
    currentData = {
      ...midWeekCurrent,
      localDate: '2026-05-22',
      earlyCloseoutEligible: true,
      oooStandbySuggestion: {
        protectedStartDate: '2026-05-23',
        protectedEndDate: '2026-05-25',
        protectedDates: ['2026-05-23', '2026-05-24', '2026-05-25'],
      },
      activeOooStandby: null,
    };
    renderPage();
    await user.click(screen.getByRole('button', { name: /Run weekly review now/i }));
    await user.click(screen.getByRole('button', { name: /Activate OOO Standby & start review/i }));

    await waitFor(() => {
      expect(mockGenerateMutateAsync).toHaveBeenCalledWith({
        weekStart: WEEK_START,
        closeoutDate: '2026-05-22',
        activateOooStandby: true,
      });
    });
  });

  it('generates without standby when secondary modal action is clicked', async () => {
    const user = userEvent.setup();
    currentData = {
      ...midWeekCurrent,
      localDate: '2026-05-22',
      earlyCloseoutEligible: true,
      oooStandbySuggestion: {
        protectedStartDate: '2026-05-23',
        protectedEndDate: '2026-05-25',
        protectedDates: ['2026-05-23', '2026-05-24', '2026-05-25'],
      },
      activeOooStandby: null,
    };
    renderPage();
    await user.click(screen.getByRole('button', { name: /Run weekly review now/i }));
    await user.click(screen.getByRole('button', { name: /Start review without standby/i }));

    await waitFor(() => {
      expect(mockGenerateMutateAsync).toHaveBeenCalledWith({
        weekStart: WEEK_START,
        closeoutDate: '2026-05-22',
      });
    });
  });

  it('discards draft and refetches current week dashboard', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    snapshotData = makeDraftSnapshot();
    currentData = { ...midWeekCurrent, hasGeneratedReview: true };

    renderPage(`/admin/weekly-review?week=${WEEK_START}`);

    await user.click(screen.getByRole('button', { name: /Discard Draft \/ Re-open Week/i }));

    await waitFor(() => {
      expect(mockDiscardMutateAsync).toHaveBeenCalledWith(WEEK_START);
      expect(mockRefetchCurrent).toHaveBeenCalled();
    });
    confirmSpy.mockRestore();
  });

  it('shows accumulated technical debt on plan step and saves techDebtDecisions', async () => {
    const user = userEvent.setup();
    snapshotData = makeDraftSnapshot({ status: 'generated' });
    currentData = { ...midWeekCurrent, hasGeneratedReview: true };
    mockSavePlanMutateAsync.mockResolvedValue(
      makeDraftSnapshot({
        status: 'planned',
        planActions: {
          quarantineDecisions: [],
          blockerResolutions: [],
          techDebtDecisions: [{ taskId: 'debt-1', action: 'purge' }],
          suggestedTasksAccepted: [],
        },
      })
    );

    renderPage(`/admin/weekly-review?week=${WEEK_START}`);

    await user.click(screen.getByRole('button', { name: /Continue to planning/i }));
    expect(await screen.findByTestId('accumulated-tech-debt')).toBeInTheDocument();
    expect(screen.getByText(/Accumulated Technical Debt/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Save plan & continue/i }));

    await waitFor(() => {
      expect(mockSavePlanMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          techDebtDecisions: [],
        })
      );
    });
  });

  it('calls complete only from Finalize & Lock Week on the complete step', async () => {
    const user = userEvent.setup();
    snapshotData = makeDraftSnapshot({ status: 'planned' });
    currentData = { ...midWeekCurrent, hasGeneratedReview: true };

    renderPage(`/admin/weekly-review?week=${WEEK_START}`);

    await user.click(screen.getByRole('button', { name: /^Complete$/i }));

    const finalizeBtn = await screen.findByRole('button', { name: /Finalize & Lock Week/i });
    await user.click(finalizeBtn);

    await waitFor(() => {
      expect(mockCompleteMutateAsync).toHaveBeenCalledTimes(1);
    });
    expect(mockGenerateMutateAsync).not.toHaveBeenCalled();
  });
});
