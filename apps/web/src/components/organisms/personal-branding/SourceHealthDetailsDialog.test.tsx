import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SourceHealthDetailsDialog from '@/components/organisms/personal-branding/SourceHealthDetailsDialog';
import { personalBrandingService } from '@/services/personal-branding.service';
import type { RadarSource, RadarSourceHealthDetails } from '@/types/api/personal-branding.dto';

const mockDetails: RadarSourceHealthDetails = {
  sourceId: 'src-1',
  sourceName: 'Tech RSS',
  health: 'healthy',
  healthReason: 'Last success 2h ago',
  enabled: true,
  cadence: 'DAILY',
  cadenceIntervalHours: null,
  windows: {
    last7Days: { itemsIngested: 4, itemsRelevant: 3 },
    last30Days: { itemsIngested: 12, itemsRelevant: 9 },
  },
  userFeedback: { last7Days: 2, last30Days: 5 },
  averageAiRelevance: { score: 0.72, sampleSize: 8 },
  failureRate: { rate: 0.1, failed: 1, attempted: 10 },
  brainstormContribution: {
    windowSize: 10,
    sessionsConsidered: 5,
    sessionsContributed: 2,
    ideasFromSource: 3,
  },
  yield: 'high',
  suggestedCadence: {
    sourceId: 'src-1',
    sourceName: 'Tech RSS',
    enoughData: true,
    sampleSize: 6,
    medianGapHours: 14,
    suggestedCadence: 'EVERY_N_HOURS',
    suggestedIntervalHours: 12,
    message: 'Suggest every 12 hour(s).',
  },
  proposedCadenceBump: {
    cadence: 'EVERY_N_HOURS',
    cadenceIntervalHours: 12,
  },
};

const source: RadarSource = {
  id: 'src-1',
  name: 'Tech RSS',
  sourceType: 'RSS',
  endpoint: 'https://example.com/feed',
  httpMethod: 'GET',
  requestParams: {},
  headers: {},
  authScheme: 'NONE',
  hasSecret: false,
  enabled: true,
  userId: 'user-1',
  createdAt: '2026-07-01T00:00:00Z',
  updatedAt: '2026-07-01T00:00:00Z',
};

describe('SourceHealthDetailsDialog', () => {
  it('renders health metrics when details load', async () => {
    vi.spyOn(personalBrandingService, 'getRadarSourceHealthDetails').mockResolvedValue(mockDetails);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const signalRadar = {
      updateSource: { isPending: false, mutateAsync: vi.fn() },
    } as never;

    render(
      <QueryClientProvider client={queryClient}>
        <SourceHealthDetailsDialog
          isOpen
          onClose={vi.fn()}
          source={source}
          signalRadar={signalRadar}
        />
      </QueryClientProvider>
    );

    expect(await screen.findByText('3 relevant')).toBeInTheDocument();
    expect(screen.getByText('2 this week')).toBeInTheDocument();
    expect(screen.getByText('72%')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
    expect(screen.getByText(/2 of 5/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /increase cadence on high-yield source/i })
    ).toBeInTheDocument();
  });

  it('shows clarifying line for one-off zero-create scrape with neutral yield', async () => {
    vi.spyOn(personalBrandingService, 'getRadarSourceHealthDetails').mockResolvedValue({
      ...mockDetails,
      health: 'degraded',
      healthReason: 'Last scrape created no Trend Stream cards',
      yield: 'neutral',
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const signalRadar = {
      updateSource: { isPending: false, mutateAsync: vi.fn() },
    } as never;

    render(
      <QueryClientProvider client={queryClient}>
        <SourceHealthDetailsDialog
          isOpen
          onClose={vi.fn()}
          source={source}
          signalRadar={signalRadar}
        />
      </QueryClientProvider>
    );

    expect(
      await screen.findByText('One scrape only — rolling yield is still neutral.')
    ).toBeInTheDocument();
  });

  it('shows clarifying line for sustained low yield reason', async () => {
    vi.spyOn(personalBrandingService, 'getRadarSourceHealthDetails').mockResolvedValue({
      ...mockDetails,
      health: 'degraded',
      healthReason: 'Low yield over recent window',
      yield: 'low',
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const signalRadar = {
      updateSource: { isPending: false, mutateAsync: vi.fn() },
    } as never;

    render(
      <QueryClientProvider client={queryClient}>
        <SourceHealthDetailsDialog
          isOpen
          onClose={vi.fn()}
          source={source}
          signalRadar={signalRadar}
        />
      </QueryClientProvider>
    );

    expect(
      await screen.findByText('Based on rolling windows (7d/30d), not only the last scrape.')
    ).toBeInTheDocument();
  });

  it('shows one decimal for average AI relevance when precision warrants it', async () => {
    vi.spyOn(personalBrandingService, 'getRadarSourceHealthDetails').mockResolvedValue({
      ...mockDetails,
      averageAiRelevance: { score: 0.725, sampleSize: 4 },
      failureRate: { rate: 0, failed: 0, attempted: 0 },
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const signalRadar = {
      updateSource: { isPending: false, mutateAsync: vi.fn() },
    } as never;

    render(
      <QueryClientProvider client={queryClient}>
        <SourceHealthDetailsDialog
          isOpen
          onClose={vi.fn()}
          source={source}
          signalRadar={signalRadar}
        />
      </QueryClientProvider>
    );

    expect(await screen.findByText('72.5%')).toBeInTheDocument();
  });
});
