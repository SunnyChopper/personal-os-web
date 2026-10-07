import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PlannerDayFocusPanel } from '@/components/organisms/planner/PlannerDayFocusPanel';
import type { PlanDay, PlanDaySuggestion } from '@/types/planner';

const killSwitchMutateMock = vi.fn();
const commitMutateMock = vi.fn();
const showToastMock = vi.fn();

let planData: PlanDay | undefined;
let planLoading = false;
let planError: Error | null = null;

const suggestion = (
  overrides: Partial<PlanDaySuggestion> & Pick<PlanDaySuggestion, 'taskId' | 'title'>
): PlanDaySuggestion => ({
  score: 50,
  priority: 'P2',
  storyPoints: 3,
  reason: 'test',
  contextMatch: false,
  ...overrides,
});

const basePlan = (): PlanDay => ({
  prediction: {
    date: '2026-07-29',
    dayOfWeek: 2,
    predictedCapacityPoints: 4.3,
    confidence: 'medium',
    todayActualPoints: 0,
    trailingDailyAverage: 1.55,
    dayOfWeekHistory: Array.from({ length: 7 }).map((_, dayOfWeek) => ({
      dayOfWeek,
      averagePoints: dayOfWeek === 2 ? 6.5 : 0,
      medianPoints: dayOfWeek === 2 ? 6 : 0,
      samples: dayOfWeek === 2 ? 2 : 0,
    })),
  },
  suggestions: [],
  existingBlocks: [],
});

vi.mock('@/hooks/usePlanner', () => ({
  usePlanDay: () => ({
    data: planData,
    isLoading: planLoading,
    error: planError,
    refetch: vi.fn(),
  }),
  useCommitPlanDay: () => ({
    mutate: commitMutateMock,
    isPending: false,
  }),
  usePlannerKillSwitch: () => ({
    mutate: killSwitchMutateMock,
    isPending: false,
  }),
  usePlannerRolloverDecision: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    showToast: showToastMock,
  }),
}));

vi.mock('@/lib/planner/week', () => ({
  todayISOLocal: () => '2026-07-28',
  addDaysISO: (_date: string, days: number) => {
    if (days === 1) return '2026-07-29';
    return _date;
  },
  mondayISOForDate: () => '2026-07-27',
}));

describe('PlannerDayFocusPanel', () => {
  beforeEach(() => {
    planData = basePlan();
    planLoading = false;
    planError = null;
    killSwitchMutateMock.mockReset();
    commitMutateMock.mockReset();
    showToastMock.mockReset();
  });

  it('shows Kill Switch with behavior-accurate helper copy', () => {
    render(<PlannerDayFocusPanel focusDateISO="2026-07-29" onFocusDateChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Kill Switch/i })).toBeInTheDocument();
    expect(
      screen.getByText('Drops non-essentials to backlog (One Thing + P1 stay).')
    ).toBeInTheDocument();
    expect(screen.queryByText(/0 capacity/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Mark day unavailable/i)).not.toBeInTheDocument();
  });

  it('uses an aria-label aligned with the helper copy', () => {
    render(<PlannerDayFocusPanel focusDateISO="2026-07-29" onFocusDateChange={vi.fn()} />);

    expect(
      screen.getByRole('button', {
        name: 'Kill Switch — drops non-essentials to backlog; keeps One Thing and P1',
      })
    ).toBeInTheDocument();
  });

  it('soft-fails Generate plan when over capacity with Adjusted to fit toast', async () => {
    const user = userEvent.setup();
    planData = {
      ...basePlan(),
      suggestions: [
        suggestion({ taskId: 't1', title: 'Keep me', priority: 'P1', storyPoints: 3, score: 90 }),
        suggestion({ taskId: 't2', title: 'Drop me', priority: 'P3', storyPoints: 3, score: 10 }),
      ],
    };

    render(<PlannerDayFocusPanel focusDateISO="2026-07-29" onFocusDateChange={vi.fn()} />);

    const generate = await screen.findByRole('button', { name: /Generate plan/i });
    expect(generate).toBeEnabled();
    await user.click(generate);

    expect(showToastMock).toHaveBeenCalledWith({
      type: 'info',
      title: 'Adjusted to fit',
      message: '1 task left in backlog',
    });
    await waitFor(() => {
      expect(commitMutateMock).toHaveBeenCalledWith(
        { taskIds: ['t1'], useLlm: false },
        expect.any(Object)
      );
    });
  });
});
