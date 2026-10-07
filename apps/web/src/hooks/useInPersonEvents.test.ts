import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  patchEventLocationsCache,
  useEventDiscoveryRunsPage,
  useInPersonEvents,
} from '@/hooks/useInPersonEvents';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import { proactiveService } from '@/services/proactive.service';
import type {
  EventDiscoveryRun,
  EventDiscoverySettings,
  EventLocationStint,
  InPersonEvent,
  PaginatedPersonalBranding,
} from '@/types/api/personal-branding.dto';

vi.mock('@/services/personal-branding.service', () => ({
  personalBrandingService: {
    getEventDiscoverySettings: vi.fn(),
    listEventLocations: vi.fn(),
    listEventDiscoveryRuns: vi.fn(),
    getEventDiscoveryRun: vi.fn(),
    listInPersonEvents: vi.fn(),
  },
}));

vi.mock('@/services/proactive.service', () => ({
  proactiveService: {
    getTimeZone: vi.fn(),
  },
}));

const stint = (id: string): EventLocationStint => ({
  id,
  label: `Trip ${id}`,
  city: 'Austin',
  timezone: 'UTC',
  startDate: '2026-09-01',
  endDate: '2026-09-15',
  radiusMiles: 25,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
});

const run = (status: EventDiscoveryRun['status'] = 'completed'): EventDiscoveryRun => ({
  id: 'run-1',
  status,
  triggerKind: 'manual',
  phase: status,
  heartbeatAt: '2026-08-20T12:00:00.000Z',
  queuedAt: '2026-08-20T11:59:00.000Z',
  startedAt: '2026-08-20T11:59:10.000Z',
  finishedAt: status === 'completed' ? '2026-08-20T12:00:00.000Z' : null,
  queriesGenerated: 1,
  resultsFetched: 1,
  candidatesExtracted: 1,
  eventsCreated: 1,
  eventsDuplicate: 0,
  eventsFiltered: 0,
  generatedQueries: [],
  activityLog: [],
  extractedEvents: [],
  errorSummary: null,
  pollAfterMs: null,
  createdAt: '2026-08-20T11:59:00.000Z',
  updatedAt: '2026-08-20T12:00:00.000Z',
});

const runPage = (
  page: number,
  data: EventDiscoveryRun[] = [run()]
): PaginatedPersonalBranding<EventDiscoveryRun> => ({
  data,
  total: 21,
  page,
  pageSize: 20,
  hasMore: page === 1,
});

const settings: EventDiscoverySettings = {
  syncCadence: 'WEEKLY',
  syncStartTime: '08:00',
  syncTimezone: 'UTC',
  hasTavilyKey: true,
  interests: [],
  eventTypes: [],
  excludeKeywords: [],
  lookaheadDays: 60,
  minFitScore: 40,
  createGrowthTaskEnabled: false,
  createTaskMinFitScore: 80,
  brandProfileIds: [],
  digestEmailEnabled: false,
};

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('patchEventLocationsCache', () => {
  it('prepends a created stint when cache was empty', () => {
    const created = stint('new');
    const next = patchEventLocationsCache(undefined, (rows) => [created, ...rows]);

    expect(next.data).toEqual([created]);
    expect(next.total).toBe(1);
  });

  it('replaces a stint on update', () => {
    const original = stint('a');
    const updated = { ...original, city: 'Dallas' };
    const prev = {
      data: [original],
      total: 1,
      page: 1,
      pageSize: 50,
      hasMore: false,
    };

    const next = patchEventLocationsCache(prev, (rows) =>
      rows.map((row) => (row.id === updated.id ? updated : row))
    );

    expect(next.data[0]?.city).toBe('Dallas');
  });

  it('removes a stint on delete', () => {
    const prev = {
      data: [stint('a'), stint('b')],
      total: 2,
      page: 1,
      pageSize: 50,
      hasMore: false,
    };

    const next = patchEventLocationsCache(prev, (rows) => rows.filter((row) => row.id !== 'a'));

    expect(next.data.map((row) => row.id)).toEqual(['b']);
  });
});

describe('event discovery run queries', () => {
  it('stores requested history pages under their paginated query key', async () => {
    const history = runPage(2, [run()]);
    vi.mocked(personalBrandingService.listEventDiscoveryRuns).mockResolvedValue(history);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { result } = renderHook(() => useEventDiscoveryRunsPage(2), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(personalBrandingService.listEventDiscoveryRuns).toHaveBeenCalledWith(
      2,
      20,
      expect.any(AbortSignal)
    );
    expect(
      client.getQueryData(queryKeys.personalBranding.inPersonEvents.discoveryRuns(2, 20))
    ).toEqual(history);
  });

  it('keeps page 1 as the live-run source for the main events hook', async () => {
    const liveRun = run('running');
    vi.mocked(personalBrandingService.getEventDiscoverySettings).mockResolvedValue(settings);
    vi.mocked(personalBrandingService.listEventLocations).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });
    vi.mocked(personalBrandingService.listEventDiscoveryRuns).mockResolvedValue(
      runPage(1, [liveRun])
    );
    vi.mocked(personalBrandingService.getEventDiscoveryRun).mockResolvedValue(liveRun);
    vi.mocked(personalBrandingService.listInPersonEvents).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      pageSize: 100,
      hasMore: false,
    });
    vi.mocked(proactiveService.getTimeZone).mockResolvedValue({
      success: true,
      data: { timeZone: 'UTC' },
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { result } = renderHook(() => useInPersonEvents(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.discoveryRuns.isSuccess).toBe(true));
    await waitFor(() => expect(result.current.isDiscoveryBusy).toBe(true));

    expect(personalBrandingService.listEventDiscoveryRuns).toHaveBeenCalledWith(
      1,
      20,
      expect.any(AbortSignal)
    );
    expect(result.current.discoveryRunDetail.data?.id).toBe('run-1');
  });
});

describe('event date buckets', () => {
  it('keeps undated events out of upcoming and past', async () => {
    const event = (
      id: string,
      startsAt: string | null,
      dateConfidence: InPersonEvent['dateConfidence']
    ): InPersonEvent => ({
      id,
      title: id,
      startsAt,
      dateConfidence,
      eventType: 'meetup',
      topicTags: [],
      status: 'NEW',
      aiFitScore: 80,
      manuallyAdded: false,
      createdAt: '2026-08-20T00:00:00.000Z',
      updatedAt: '2026-08-20T00:00:00.000Z',
    });
    vi.mocked(personalBrandingService.getEventDiscoverySettings).mockResolvedValue(settings);
    vi.mocked(personalBrandingService.listEventLocations).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });
    vi.mocked(personalBrandingService.listEventDiscoveryRuns).mockResolvedValue(runPage(1, []));
    vi.mocked(personalBrandingService.listInPersonEvents).mockResolvedValue({
      data: [
        event('future', '9999-12-31', 'exact'),
        event('past', '2000-01-01', 'exact'),
        event('undated', null, 'unknown'),
      ],
      total: 3,
      page: 1,
      pageSize: 100,
      hasMore: false,
    });
    vi.mocked(proactiveService.getTimeZone).mockResolvedValue({
      success: true,
      data: { timeZone: 'UTC' },
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { result } = renderHook(() => useInPersonEvents(), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.events.isSuccess).toBe(true));

    expect(result.current.upcomingEvents.map((row) => row.id)).toEqual(['future']);
    expect(result.current.pastEvents.map((row) => row.id)).toEqual(['past']);
    expect(result.current.undatedEvents.map((row) => row.id)).toEqual(['undated']);
  });
});
