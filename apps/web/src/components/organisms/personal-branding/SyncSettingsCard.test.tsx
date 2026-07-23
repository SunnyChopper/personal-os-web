import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SyncSettingsCard from './SyncSettingsCard';
import type { RadarSource, RadarSourceCadenceSuggestion } from '@/types/api/personal-branding.dto';

const mockShowToast = vi.fn();

vi.mock('@/hooks/useProactive', () => ({
  useProactiveSettings: () => ({
    timeZone: { data: { timeZone: 'America/Chicago' } },
  }),
}));

function makeSource(id: string, name: string, cadence?: string | null): RadarSource {
  return {
    id,
    name,
    sourceType: 'RSS',
    endpoint: 'https://example.com/feed',
    httpMethod: 'GET',
    requestParams: {},
    headers: {},
    authScheme: 'NONE',
    hasSecret: false,
    enabled: true,
    cadence: cadence ?? null,
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function makeSuggestion(
  partial: Partial<RadarSourceCadenceSuggestion> & Pick<RadarSourceCadenceSuggestion, 'sourceId'>
): RadarSourceCadenceSuggestion {
  return {
    sourceName: 'Source',
    enoughData: false,
    sampleSize: 0,
    message: 'Need more data',
    ...partial,
  };
}

function makeSignalRadarHook(
  sources: RadarSource[],
  suggestions: RadarSourceCadenceSuggestion[] = []
) {
  const refetch = vi.fn();
  return {
    settings: {
      data: {
        syncCadence: 'DAILY' as const,
        syncStartTime: '08:00',
        syncTimezone: 'America/Chicago',
        hasTavilyKey: false,
        scheduledSyncEligible: true,
        lastRunAt: null,
        nextDueAt: null,
        autoIdeationEnabled: false,
        autoIdeationTopN: 5,
        autoIdeationStartTime: '21:00',
        autoIdeationCount: 6,
        autoIdeationTemplateIds: [],
        autoIdeationNotifyEmail: false,
        userId: 'user-1',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    },
    sources: { data: { data: sources } },
    suggestedCadences: {
      data: { suggestions },
      isFetching: false,
      refetch,
    },
    updateSettings: { mutateAsync: vi.fn(), isPending: false },
    updateSource: { mutateAsync: vi.fn() },
  };
}

describe('SyncSettingsCard', () => {
  beforeEach(() => {
    mockShowToast.mockReset();
  });

  it('groups sources under global vs override headings', () => {
    const sources = [
      makeSource('global-1', 'Global Feed'),
      makeSource('override-1', 'Override Feed', 'WEEKLY'),
    ];
    const signalRadar = makeSignalRadarHook(sources);

    render(<SyncSettingsCard signalRadar={signalRadar as never} showToast={mockShowToast} />);

    expect(screen.getByText('Using global cadence (1)')).toBeInTheDocument();
    expect(screen.getByText('Custom overrides (1)')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Apply suggestion' })).not.toBeInTheDocument();
  });

  it('shows why line and cadence chip when suggestion has enough data', () => {
    const sources = [makeSource('global-1', 'Global Feed')];
    const suggestions = [
      makeSuggestion({
        sourceId: 'global-1',
        enoughData: true,
        sampleSize: 8,
        medianGapHours: 12.4,
        suggestedCadence: 'DAILY',
      }),
    ];
    const signalRadar = makeSignalRadarHook(sources, suggestions);

    render(<SyncSettingsCard signalRadar={signalRadar as never} showToast={mockShowToast} />);

    expect(screen.getByText('Why: median arrival 12.4h across 8 gaps')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Daily' })).toBeInTheDocument();
  });

  it('applies suggestion when cadence chip is clicked', async () => {
    const user = userEvent.setup();
    const sources = [makeSource('global-1', 'Global Feed')];
    const suggestions = [
      makeSuggestion({
        sourceId: 'global-1',
        enoughData: true,
        sampleSize: 8,
        medianGapHours: 6,
        suggestedCadence: 'EVERY_N_HOURS',
        suggestedIntervalHours: 6,
      }),
    ];
    const updateSource = vi.fn().mockResolvedValue({});
    const signalRadar = {
      ...makeSignalRadarHook(sources, suggestions),
      updateSource: { mutateAsync: updateSource },
    };

    render(<SyncSettingsCard signalRadar={signalRadar as never} showToast={mockShowToast} />);

    await user.click(screen.getByRole('button', { name: 'Every 6h' }));

    expect(updateSource).toHaveBeenCalledWith({
      id: 'global-1',
      body: { cadence: 'EVERY_N_HOURS', cadenceIntervalHours: 6 },
    });
  });
});
