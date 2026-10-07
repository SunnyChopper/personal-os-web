import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { DailyRecoveryCard } from '@/components/organisms/fitness/DailyRecoveryCard';

const TODAY = '2026-07-29';
const YESTERDAY = '2026-07-28';

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    useReducedMotion: () => true,
  };
});

vi.mock('@/lib/date/local-calendar', () => ({
  localCalendarDate: () => TODAY,
  addCalendarDays: (iso: string, delta: number) => {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + delta);
    const ny = dt.getFullYear();
    const nm = String(dt.getMonth() + 1).padStart(2, '0');
    const nd = String(dt.getDate()).padStart(2, '0');
    return `${ny}-${nm}-${nd}`;
  },
}));

vi.mock('@/hooks/useFitness', () => ({
  useFitnessRecoveryRange: vi.fn(),
  useRecoveryMetricLinks: vi.fn(),
  useSetRecoveryMetricLinksMutation: vi.fn(),
  useUpsertRecoveryMutation: vi.fn(),
}));

vi.mock('@/hooks/useGrowthSystem', () => ({
  useMetrics: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

import {
  useFitnessRecoveryRange,
  useRecoveryMetricLinks,
  useSetRecoveryMetricLinksMutation,
  useUpsertRecoveryMutation,
} from '@/hooks/useFitness';
import { useMetrics } from '@/hooks/useGrowthSystem';

function mockRecoveryQueries({
  recoveryData = [] as unknown[],
  yesterdayRecoveryData = [] as unknown[],
  isLoading = false,
  yesterdayLoading = false,
  links = {},
}: {
  recoveryData?: unknown[];
  yesterdayRecoveryData?: unknown[];
  isLoading?: boolean;
  yesterdayLoading?: boolean;
  links?: Record<string, string>;
}) {
  vi.mocked(useFitnessRecoveryRange).mockImplementation((startDate) => {
    const isYesterday = startDate === YESTERDAY;
    const data = isYesterday ? yesterdayRecoveryData : recoveryData;
    const loading = isYesterday ? yesterdayLoading : isLoading;

    return {
      data: {
        success: true,
        data: {
          data,
          total: data.length,
          page: 1,
          pageSize: 50,
        },
      },
      isLoading: loading,
    } as ReturnType<typeof useFitnessRecoveryRange>;
  });

  vi.mocked(useRecoveryMetricLinks).mockReturnValue({
    data: { success: true, data: { links } },
  } as ReturnType<typeof useRecoveryMetricLinks>);

  vi.mocked(useSetRecoveryMetricLinksMutation).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useSetRecoveryMetricLinksMutation>);

  vi.mocked(useUpsertRecoveryMutation).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useUpsertRecoveryMutation>);

  vi.mocked(useMetrics).mockReturnValue({
    metrics: [],
    isLoading: false,
    isError: false,
    error: undefined,
    createMetric: vi.fn(),
    updateMetric: vi.fn(),
    deleteMetric: vi.fn(),
    logValue: vi.fn(),
    deleteLog: vi.fn(),
  } as ReturnType<typeof useMetrics>);
}

function renderCard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DailyRecoveryCard />
    </QueryClientProvider>
  );
}

describe('DailyRecoveryCard empty state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecoveryQueries({ recoveryData: [] });
  });

  it('shows empty state title and CTA when no recovery row exists', () => {
    renderCard();

    expect(
      screen.getByRole('heading', { name: "Log today's recovery in <30 s" })
    ).toBeInTheDocument();
    expect(screen.getByText('Under 30 seconds · powers Aura and coaching')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log recovery' })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('e.g. 7.5')).not.toBeInTheDocument();
  });

  it('reveals form and focuses sleep hours after CTA', async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole('button', { name: 'Log recovery' }));

    const sleepInput = screen.getByPlaceholderText('e.g. 7.5');
    expect(sleepInput).toBeInTheDocument();
    await waitFor(() => {
      expect(sleepInput).toHaveFocus();
    });
  });

  it('shows form directly when a recovery row exists', () => {
    mockRecoveryQueries({
      recoveryData: [
        {
          date: TODAY,
          userId: 'u1',
          sleepHours: 7,
          sleepQuality: 8,
          energyLevel: 7,
          restingHeartRate: null,
          sorenessLevel: 2,
          stressLevel: 3,
          bodyWeight: null,
          notes: null,
          recoveryScore: 72,
          createdAt: '2026-07-29T08:00:00Z',
          updatedAt: '2026-07-29T08:00:00Z',
        },
      ],
    });

    renderCard();

    expect(screen.queryByRole('button', { name: 'Log recovery' })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. 7.5')).toHaveValue(7);
  });

  it('returns empty state when navigating to another day with no row', async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole('button', { name: 'Log recovery' }));
    expect(screen.getByPlaceholderText('e.g. 7.5')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Previous day' }));

    expect(
      screen.getByRole('heading', { name: /Log recovery for .* in <30 s/ })
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('e.g. 7.5')).not.toBeInTheDocument();
    });
  });

  it('returns to empty state when focus leaves an empty form', async () => {
    const user = userEvent.setup();
    renderCard();

    const outside = document.createElement('button');
    outside.type = 'button';
    outside.textContent = 'Outside';
    document.body.appendChild(outside);

    await user.click(screen.getByRole('button', { name: 'Log recovery' }));
    const sleepInput = screen.getByPlaceholderText('e.g. 7.5');
    await waitFor(() => {
      expect(sleepInput).toHaveFocus();
    });

    await user.click(outside);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Log recovery' })).toBeInTheDocument();
    });
    expect(screen.queryByPlaceholderText('e.g. 7.5')).not.toBeInTheDocument();
    outside.remove();
  });

  it('keeps the form when focus leaves but a field has a value', async () => {
    const user = userEvent.setup();
    renderCard();

    const outside = document.createElement('button');
    outside.type = 'button';
    outside.textContent = 'Outside';
    document.body.appendChild(outside);

    await user.click(screen.getByRole('button', { name: 'Log recovery' }));
    const sleepInput = screen.getByPlaceholderText('e.g. 7.5');
    await user.type(sleepInput, '7');

    await user.click(outside);

    expect(screen.getByPlaceholderText('e.g. 7.5')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Log recovery' })).not.toBeInTheDocument();
    outside.remove();
  });

  it('disables sleep hours when metric-resolved', () => {
    mockRecoveryQueries({
      recoveryData: [
        {
          date: TODAY,
          userId: 'u1',
          sleepHours: 8,
          sleepQuality: null,
          energyLevel: null,
          restingHeartRate: null,
          sorenessLevel: null,
          stressLevel: null,
          bodyWeight: null,
          notes: null,
          recoveryScore: null,
          linkedFields: { sleepHours: 'metric-sleep' },
          metricResolvedFields: ['sleepHours'],
          isPersisted: false,
          createdAt: '2026-07-29T08:00:00Z',
          updatedAt: '2026-07-29T08:00:00Z',
        },
      ],
      links: { sleepHours: 'metric-sleep' },
    });

    renderCard();

    expect(screen.getByPlaceholderText('e.g. 7.5')).toBeDisabled();
    expect(screen.getByPlaceholderText('e.g. 7.5')).toHaveValue(8);
  });

  it('shows inline Link metric affordance on each field', () => {
    mockRecoveryQueries({
      recoveryData: [
        {
          date: TODAY,
          userId: 'u1',
          sleepHours: null,
          sleepQuality: null,
          energyLevel: null,
          restingHeartRate: null,
          sorenessLevel: null,
          stressLevel: null,
          bodyWeight: null,
          notes: null,
          recoveryScore: null,
          isPersisted: true,
          createdAt: '2026-07-29T08:00:00Z',
          updatedAt: '2026-07-29T08:00:00Z',
        },
      ],
    });

    renderCard();

    expect(screen.getAllByRole('button', { name: /Link metric/i }).length).toBeGreaterThan(0);
  });

  it('shows Log yesterday instead when today and yesterday are both empty', () => {
    mockRecoveryQueries({ recoveryData: [], yesterdayRecoveryData: [] });

    renderCard();

    expect(screen.getByRole('button', { name: 'Log yesterday instead' })).toBeInTheDocument();
  });

  it('hides Log yesterday instead when yesterday has a persisted log', () => {
    mockRecoveryQueries({
      recoveryData: [],
      yesterdayRecoveryData: [
        {
          date: YESTERDAY,
          userId: 'u1',
          sleepHours: 7,
          sleepQuality: 8,
          energyLevel: 7,
          restingHeartRate: null,
          sorenessLevel: 2,
          stressLevel: 3,
          bodyWeight: null,
          notes: null,
          recoveryScore: 72,
          isPersisted: true,
          createdAt: '2026-07-28T08:00:00Z',
          updatedAt: '2026-07-28T08:00:00Z',
        },
      ],
    });

    renderCard();

    expect(screen.queryByRole('button', { name: 'Log yesterday instead' })).not.toBeInTheDocument();
  });

  it('selects yesterday and opens the form when Log yesterday instead is clicked', async () => {
    const user = userEvent.setup();
    mockRecoveryQueries({ recoveryData: [], yesterdayRecoveryData: [] });

    renderCard();

    await user.click(screen.getByRole('button', { name: 'Log yesterday instead' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Select date/i })).toHaveTextContent('Yesterday');
    });
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Log recovery' })).not.toBeInTheDocument();
    });
    const sleepInput = screen.getByPlaceholderText('e.g. 7.5');
    expect(sleepInput).toBeInTheDocument();
    await waitFor(() => {
      expect(sleepInput).toHaveFocus();
    });
  });

  it('hides Log yesterday instead when viewing a non-today empty day', async () => {
    const user = userEvent.setup();
    mockRecoveryQueries({ recoveryData: [], yesterdayRecoveryData: [] });

    renderCard();

    await user.click(screen.getByRole('button', { name: 'Previous day' }));

    expect(screen.queryByRole('button', { name: 'Log yesterday instead' })).not.toBeInTheDocument();
  });
});

describe('DailyRecoveryCard form layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecoveryQueries({
      recoveryData: [
        {
          date: TODAY,
          userId: 'u1',
          sleepHours: null,
          sleepQuality: null,
          energyLevel: null,
          restingHeartRate: null,
          sorenessLevel: null,
          stressLevel: null,
          bodyWeight: null,
          notes: null,
          recoveryScore: null,
          isPersisted: true,
          createdAt: '2026-07-29T08:00:00Z',
          updatedAt: '2026-07-29T08:00:00Z',
        },
      ],
    });
  });

  it('shows Subjective state cluster with Energy, Soreness, and Stress scales', () => {
    renderCard();

    expect(screen.getByText('Subjective state')).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Energy level from 1 to 10' })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Soreness level from 1 to 10' })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Stress level from 1 to 10' })).toBeInTheDocument();
  });

  it('orders fields: sleep quality before subjective cluster before resting heart rate', () => {
    renderCard();

    const sleepQuality = screen.getByRole('slider', { name: 'Sleep quality from 1 to 10' });
    const energy = screen.getByRole('slider', { name: 'Energy level from 1 to 10' });
    const soreness = screen.getByRole('slider', { name: 'Soreness level from 1 to 10' });
    const stress = screen.getByRole('slider', { name: 'Stress level from 1 to 10' });
    const restingHr = screen.getByPlaceholderText('e.g. 58');

    const position = (el: HTMLElement) => Array.from(document.querySelectorAll('*')).indexOf(el);

    expect(position(sleepQuality)).toBeLessThan(position(energy));
    expect(position(energy)).toBeLessThan(position(soreness));
    expect(position(soreness)).toBeLessThan(position(stress));
    expect(position(stress)).toBeLessThan(position(restingHr));
  });
});

describe('DailyRecoveryCard live recovery score ring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecoveryQueries({
      recoveryData: [
        {
          date: TODAY,
          userId: 'u1',
          sleepHours: null,
          sleepQuality: null,
          energyLevel: null,
          restingHeartRate: null,
          sorenessLevel: null,
          stressLevel: null,
          bodyWeight: null,
          notes: null,
          recoveryScore: null,
          isPersisted: true,
          createdAt: '2026-07-29T08:00:00Z',
          updatedAt: '2026-07-29T08:00:00Z',
        },
      ],
    });
  });

  it('does not show a score ring when no score-contributing fields are set', () => {
    renderCard();

    expect(screen.queryByRole('img', { name: /Recovery score/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Recovery score:/i)).not.toBeInTheDocument();
  });

  it('shows the score ring beside the title after setting energy', async () => {
    renderCard();

    const energySlider = screen.getByRole('slider', { name: 'Energy level from 1 to 10' });
    energySlider.focus();
    for (let i = 0; i < 5; i += 1) {
      fireEvent.keyDown(energySlider, { key: 'ArrowRight' });
    }

    expect(screen.getByRole('img', { name: 'Recovery score 60' })).toBeInTheDocument();
  });

  it('removes the score ring when all score-contributing fields are cleared', async () => {
    const user = userEvent.setup();
    renderCard();

    const sleepInput = screen.getByPlaceholderText('e.g. 7.5');
    await user.type(sleepInput, '7');
    expect(screen.getByRole('img', { name: 'Recovery score 88' })).toBeInTheDocument();

    await user.clear(sleepInput);
    expect(screen.queryByRole('img', { name: /Recovery score/i })).not.toBeInTheDocument();
  });

  it('shows live score from populated form instead of footer text', () => {
    mockRecoveryQueries({
      recoveryData: [
        {
          date: TODAY,
          userId: 'u1',
          sleepHours: 7,
          sleepQuality: 8,
          energyLevel: 7,
          restingHeartRate: null,
          sorenessLevel: 2,
          stressLevel: 3,
          bodyWeight: null,
          notes: null,
          recoveryScore: 72,
          isPersisted: true,
          createdAt: '2026-07-29T08:00:00Z',
          updatedAt: '2026-07-29T08:00:00Z',
        },
      ],
    });

    renderCard();

    expect(screen.getByRole('img', { name: 'Recovery score 79' })).toBeInTheDocument();
    expect(screen.queryByText(/Recovery score:/i)).not.toBeInTheDocument();
  });
});
