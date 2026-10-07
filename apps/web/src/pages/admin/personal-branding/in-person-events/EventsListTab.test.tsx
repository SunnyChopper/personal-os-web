import { act } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EventsListTab from './EventsListTab';
import { EVENT_FIT_SCORE_LEGEND_COPY } from '@/lib/personal-branding/event-fit-score-legend';
import type { useInPersonEvents } from '@/hooks/useInPersonEvents';
import type {
  EventDiscoveryRun,
  EventDiscoverySettings,
  InPersonEvent,
} from '@/types/api/personal-branding.dto';

const showToast = vi.fn();

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ showToast }),
}));

type InPersonEventsHook = ReturnType<typeof useInPersonEvents>;

const baseSettings: EventDiscoverySettings = {
  syncCadence: 'MANUAL_ONLY',
  syncStartTime: '09:00',
  syncTimezone: 'UTC',
  hasTavilyKey: true,
  interests: ['AI'],
  eventTypes: ['conference'],
  excludeKeywords: [],
  lookaheadDays: 60,
  minFitScore: 55,
  createGrowthTaskEnabled: false,
  createTaskMinFitScore: 80,
  brandProfileIds: [],
  digestEmailEnabled: false,
};

function completedRun(eventsFiltered: number): EventDiscoveryRun {
  return {
    id: 'run-1',
    status: 'completed',
    triggerKind: 'manual',
    phase: 'completed',
    queriesGenerated: 2,
    resultsFetched: 4,
    candidatesExtracted: 3,
    eventsCreated: 0,
    eventsDuplicate: 0,
    eventsFiltered,
    generatedQueries: [],
    activityLog: [],
    extractedEvents: [],
    createdAt: '2026-08-10T00:00:00.000Z',
    updatedAt: '2026-08-10T00:05:00.000Z',
    finishedAt: '2026-08-10T00:05:00.000Z',
  };
}

function sampleEvent(overrides: Partial<InPersonEvent> = {}): InPersonEvent {
  return {
    id: 'evt-1',
    title: 'Sample Event',
    dateConfidence: 'exact',
    eventType: 'conference',
    topicTags: [],
    status: 'NEW',
    startsAt: '2026-12-01T18:00:00.000Z',
    aiFitScore: 35,
    manuallyAdded: false,
    createdAt: '2026-08-13T00:00:00.000Z',
    updatedAt: '2026-08-13T00:00:00.000Z',
    ...overrides,
  };
}

type EventHookTestOverrides = Record<string, unknown>;

function createEventsMock(overrides: EventHookTestOverrides = {}): InPersonEventsHook {
  const upcomingEvents = (overrides.upcomingEvents as InPersonEvent[] | undefined) ?? [];
  const pastEvents = (overrides.pastEvents as InPersonEvent[] | undefined) ?? [];
  const rawUpcomingEvents =
    (overrides.rawUpcomingEvents as InPersonEvent[] | undefined) ?? upcomingEvents;
  const rawPastEvents = (overrides.rawPastEvents as InPersonEvent[] | undefined) ?? pastEvents;
  const undatedEvents = (overrides.undatedEvents as InPersonEvent[] | undefined) ?? [];
  const rawUndatedEvents =
    (overrides.rawUndatedEvents as InPersonEvent[] | undefined) ?? undatedEvents;
  const minFitScore = (overrides.minFitScore as number | undefined) ?? baseSettings.minFitScore;
  const operatorToday = (overrides.operatorToday as string | undefined) ?? '2026-08-13';
  const settings = overrides.settings as InPersonEventsHook['settings'] | undefined;
  const locations = overrides.locations as InPersonEventsHook['locations'] | undefined;
  const events = overrides.events as InPersonEventsHook['events'] | undefined;
  const discoveryRuns = overrides.discoveryRuns as InPersonEventsHook['discoveryRuns'] | undefined;
  const discoveryRunDetail = overrides.discoveryRunDetail as
    | InPersonEventsHook['discoveryRunDetail']
    | undefined;
  const startDiscovery = overrides.startDiscovery as
    | InPersonEventsHook['startDiscovery']
    | undefined;
  const cancelDiscovery = overrides.cancelDiscovery as
    | InPersonEventsHook['cancelDiscovery']
    | undefined;
  const updateSettings = overrides.updateSettings as
    | InPersonEventsHook['updateSettings']
    | undefined;
  const updateEvent = overrides.updateEvent as InPersonEventsHook['updateEvent'] | undefined;
  const updateRelevance = overrides.updateRelevance as
    | InPersonEventsHook['updateRelevance']
    | undefined;

  return {
    settings: settings ?? {
      data: { ...baseSettings, lastRunAt: null, minFitScore },
      isPending: false,
      isError: false,
    },
    locations: locations ?? {
      data: { data: [], total: 0, page: 1, pageSize: 50, hasMore: false },
      isPending: false,
      isError: false,
    },
    events: events ?? {
      data: { data: [], total: 0, page: 1, pageSize: 100, hasMore: false },
      isPending: false,
      isError: false,
    },
    discoveryRuns: discoveryRuns ?? {
      data: { data: [], total: 0, page: 1, pageSize: 20, hasMore: false },
      isPending: false,
      isError: false,
    },
    discoveryRunDetail: discoveryRunDetail ?? { data: undefined, isPending: false, isError: false },
    startDiscovery: startDiscovery ?? { mutateAsync: vi.fn(), isPending: false },
    cancelDiscovery: cancelDiscovery ?? { mutateAsync: vi.fn(), isPending: false },
    updateSettings: updateSettings ?? { mutateAsync: vi.fn(), isPending: false },
    updateEvent: updateEvent ?? { mutateAsync: vi.fn(), isPending: false },
    updateRelevance: updateRelevance ?? { mutateAsync: vi.fn(), isPending: false },
    isDiscoveryBusy: false,
    isLoading: false,
    ...overrides,
    operatorToday,
    minFitScore,
    rawUpcomingEvents,
    rawPastEvents,
    rawUndatedEvents,
    upcomingEvents,
    pastEvents,
    undatedEvents,
    filteredAllEvents: [...upcomingEvents, ...pastEvents, ...undatedEvents],
  } as unknown as InPersonEventsHook;
}

function renderTab(events: InPersonEventsHook) {
  return render(
    <MemoryRouter>
      <EventsListTab events={events} />
    </MemoryRouter>
  );
}

describe('EventsListTab empty states', () => {
  it('shows never-run upcoming empty state with settings CTA when no stints exist', () => {
    renderTab(createEventsMock());

    expect(screen.getByText('Discovery has not run yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add a location stint' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Past events show here after discovery finds dates that have already passed.'
      )
    ).toBeInTheDocument();
  });

  it('shows zero-match upcoming empty state after a completed run with no kept events', () => {
    renderTab(
      createEventsMock({
        settings: {
          data: {
            ...baseSettings,
            lastRunAt: '2026-08-10T00:05:00.000Z',
            lastSuccessfulRunAt: '2026-08-10T00:05:00.000Z',
          },
          isPending: false,
          isError: false,
        },
        discoveryRuns: {
          data: {
            data: [completedRun(0)],
            total: 1,
            page: 1,
            pageSize: 20,
            hasMore: false,
          },
          isPending: false,
          isError: false,
        },
      })
    );

    expect(screen.getByText('No events matched your stints and interests')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Settings' })).toBeInTheDocument();
    expect(screen.getByText('No past events yet.')).toBeInTheDocument();
  });

  it('shows min-fit upcoming empty state without a primary CTA', () => {
    renderTab(
      createEventsMock({
        settings: {
          data: { ...baseSettings, lastRunAt: '2026-08-10T00:05:00.000Z', minFitScore: 55 },
          isPending: false,
          isError: false,
        },
        discoveryRuns: {
          data: {
            data: [completedRun(2)],
            total: 1,
            page: 1,
            pageSize: 20,
            hasMore: false,
          },
          isPending: false,
          isError: false,
        },
      })
    );

    expect(screen.getByText('Events were found but none were kept')).toBeInTheDocument();
    expect(
      screen.getByText(/2 candidates were filtered during discovery \(min fit score 55/)
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open Settings' })).not.toBeInTheDocument();
  });

  it('shows threshold empty state with lower-to-20 action when persisted events are hidden', async () => {
    const user = userEvent.setup();
    const updateSettings = vi.fn().mockResolvedValue(undefined);
    const hidden = sampleEvent({ id: 'evt-hidden', aiFitScore: 35 });

    renderTab(
      createEventsMock({
        settings: {
          data: { ...baseSettings, lastRunAt: '2026-08-10T00:05:00.000Z', minFitScore: 55 },
          isPending: false,
          isError: false,
        },
        minFitScore: 55,
        rawUpcomingEvents: [hidden],
        upcomingEvents: [],
        filteredAllEvents: [],
        updateSettings: { mutateAsync: updateSettings, isPending: false },
      })
    );

    expect(screen.getByText('No events meet your min fit score')).toBeInTheDocument();
    expect(screen.getByText(/1 upcoming event is hidden by min fit score 55/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Lower threshold to 20' }));

    expect(updateSettings).toHaveBeenCalledWith({ minFitScore: 20 });
  });

  it('starts discovery from never-run CTA when stints exist', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    renderTab(
      createEventsMock({
        locations: {
          data: {
            data: [
              {
                id: 'stint-1',
                label: 'SF',
                city: 'San Francisco',
                timezone: 'UTC',
                startDate: '2026-09-01',
                endDate: '2026-09-15',
                radiusMiles: 25,
                createdAt: '2026-08-01T00:00:00.000Z',
                updatedAt: '2026-08-01T00:00:00.000Z',
              },
            ],
            total: 1,
            page: 1,
            pageSize: 50,
            hasMore: false,
          },
          isPending: false,
          isError: false,
        },
        startDiscovery: { mutateAsync, isPending: false },
      })
    );

    await user.click(screen.getAllByRole('button', { name: 'Run discovery now' })[1]!);

    expect(mutateAsync).toHaveBeenCalledTimes(1);
  });
});

describe('EventsListTab discovery loading', () => {
  it('renders an enabled Run discovery now button when idle', () => {
    renderTab(createEventsMock());

    const button = screen.getByRole('button', { name: 'Run discovery now' });
    expect(button).toBeEnabled();
    expect(button).toHaveAttribute('aria-busy', 'false');
    expect(screen.queryAllByTestId('event-discovery-upcoming-skeleton')).toHaveLength(0);
  });

  it('shows Never run beside Run when lastSuccessfulRunAt is absent and lists are empty', () => {
    renderTab(
      createEventsMock({
        settings: {
          data: { ...baseSettings, lastRunAt: null, lastSuccessfulRunAt: null },
          isPending: false,
          isError: false,
        },
      })
    );

    expect(screen.getByTestId('event-discovery-last-run')).toHaveTextContent('Never run');
    expect(screen.getByRole('button', { name: 'Run discovery now' })).toBeInTheDocument();
  });

  it('shows failed empty state and Last run failed when discovery failed', () => {
    renderTab(
      createEventsMock({
        settings: {
          data: {
            ...baseSettings,
            lastRunAt: '2026-08-10T00:00:00.000Z',
            lastSuccessfulRunAt: null,
            lastRunStatus: 'failed',
            lastErrorSummary: 'Query generation failed',
          },
          isPending: false,
          isError: false,
        },
        discoveryRuns: {
          data: {
            data: [
              {
                id: 'run-failed',
                status: 'failed',
                triggerKind: 'manual',
                phase: 'failed',
                queriesGenerated: 0,
                resultsFetched: 0,
                candidatesExtracted: 0,
                eventsCreated: 0,
                eventsDuplicate: 0,
                eventsFiltered: 0,
                generatedQueries: [],
                activityLog: [],
                extractedEvents: [],
                errorSummary: 'Query generation failed',
                createdAt: '2026-08-10T00:00:00.000Z',
                updatedAt: '2026-08-10T00:01:00.000Z',
                finishedAt: '2026-08-10T00:01:00.000Z',
              },
            ],
            total: 1,
            page: 1,
            pageSize: 20,
            hasMore: false,
          },
          isPending: false,
          isError: false,
        },
      })
    );

    expect(screen.getByTestId('event-discovery-last-run')).toHaveTextContent('Last run failed');
    expect(screen.getByText(/did not finish successfully/i)).toBeInTheDocument();
    expect(screen.getByText('Query generation failed')).toBeInTheDocument();
    expect(
      screen.queryByText(/Last run finished without keeping any events/i)
    ).not.toBeInTheDocument();
  });

  it('shows relative Last run beside Run when lastSuccessfulRunAt is set', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-10T12:00:00.000Z'));

    renderTab(
      createEventsMock({
        settings: {
          data: {
            ...baseSettings,
            lastRunAt: '2026-08-10T00:05:00.000Z',
            lastSuccessfulRunAt: '2026-08-10T00:05:00.000Z',
          },
          isPending: false,
          isError: false,
        },
      })
    );

    expect(screen.getByTestId('event-discovery-last-run')).toHaveTextContent(/Last run \d+h ago/);

    vi.useRealTimers();
  });

  it('omits last-run label when settings query failed', () => {
    renderTab(
      createEventsMock({
        settings: {
          data: undefined,
          isPending: false,
          isError: true,
        },
      })
    );

    expect(screen.queryByTestId('event-discovery-last-run')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run discovery now' })).toBeInTheDocument();
  });

  it('disables the header button and shows skeletons while discovery is busy', () => {
    renderTab(
      createEventsMock({
        isDiscoveryBusy: true,
        startDiscovery: { mutateAsync: vi.fn(), isPending: true },
      })
    );

    expect(screen.getByRole('button', { name: 'Starting…' })).toBeDisabled();
    expect(screen.getAllByTestId('event-discovery-upcoming-skeleton')).toHaveLength(2);
    expect(screen.queryByText('Discovery has not run yet')).not.toBeInTheDocument();
  });

  it('shows Running… and phase line while a live run detail is available', () => {
    renderTab(
      createEventsMock({
        isDiscoveryBusy: true,
        discoveryRunDetail: {
          data: {
            id: 'run-live',
            status: 'running',
            triggerKind: 'manual',
            phase: 'extracting_candidates',
            queriesGenerated: 1,
            resultsFetched: 2,
            candidatesExtracted: 1,
            eventsCreated: 1,
            eventsDuplicate: 0,
            eventsFiltered: 0,
            generatedQueries: [],
            activityLog: [],
            extractedEvents: [],
            createdAt: '2026-08-13T00:00:00.000Z',
            updatedAt: '2026-08-13T00:00:01.000Z',
          },
          isPending: false,
          isError: false,
        },
      })
    );

    expect(screen.getByRole('button', { name: 'Running…' })).toBeDisabled();
    expect(screen.getByTestId('event-discovery-run-monitor')).toBeInTheDocument();
    expect(screen.getByText('Extracted')).toBeInTheDocument();
  });

  it('cancels the active discovery run from the live monitor', async () => {
    const user = userEvent.setup();
    const cancel = vi.fn().mockResolvedValue(undefined);
    renderTab(
      createEventsMock({
        isDiscoveryBusy: true,
        cancelDiscovery: { mutateAsync: cancel, isPending: false },
        discoveryRunDetail: {
          data: {
            id: 'run-live',
            status: 'running',
            triggerKind: 'manual',
            phase: 'searching',
            queriesGenerated: 1,
            resultsFetched: 0,
            candidatesExtracted: 0,
            eventsCreated: 0,
            eventsDuplicate: 0,
            eventsFiltered: 0,
            generatedQueries: ['AI meetup Austin'],
            activityLog: [],
            extractedEvents: [],
            createdAt: '2026-08-13T00:00:00.000Z',
            updatedAt: '2026-08-13T00:00:01.000Z',
          },
          isPending: false,
          isError: false,
        },
      })
    );

    await user.click(screen.getByRole('button', { name: 'Cancel event discovery run' }));

    expect(cancel).toHaveBeenCalledWith('run-live');
  });
});

describe('EventsListTab section hierarchy', () => {
  it('renders Upcoming as primary h2 and Past as eyebrow h2', () => {
    renderTab(createEventsMock());

    const upcomingHeading = screen.getByRole('heading', { name: 'Upcoming', level: 2 });
    const pastHeading = screen.getByRole('heading', { name: 'Past', level: 2 });

    expect(upcomingHeading).toHaveClass('text-base', 'font-semibold');
    expect(upcomingHeading).not.toHaveClass('uppercase');

    expect(pastHeading).toHaveClass('uppercase');
    expect(pastHeading).not.toHaveClass('text-base');
  });
});

describe('EventsListTab undated events', () => {
  it('renders a collapsed undated section and reveals its no-date badge on expand', async () => {
    const user = userEvent.setup();
    const undated = sampleEvent({
      id: 'evt-undated',
      title: 'Undated Meetup',
      startsAt: null,
      dateConfidence: 'unknown',
    });

    renderTab(
      createEventsMock({
        undatedEvents: [undated],
        rawUndatedEvents: [undated],
        events: {
          data: { data: [undated], total: 1, page: 1, pageSize: 100, hasMore: false },
          isPending: false,
          isError: false,
        },
      })
    );

    expect(screen.queryByText('Undated Meetup')).not.toBeInTheDocument();
    expect(screen.getByTestId('undated-events-section')).toBeInTheDocument();
    const undatedToggle = screen.getByRole('button', {
      name: /events without identifiable dates/,
    });
    expect(undatedToggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(undatedToggle);

    expect(screen.getByText('Undated Meetup')).toBeInTheDocument();
    expect(undatedToggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('event-no-date-badge')).toHaveAccessibleName(
      'No date found; discovery could not confirm an event date'
    );
    expect(screen.getByText(/No date found/)).toBeInTheDocument();
  });

  it('omits the undated section when there are no undated events', () => {
    renderTab(createEventsMock());

    expect(screen.queryByTestId('undated-events-section')).not.toBeInTheDocument();
  });
});

function runningRun(): EventDiscoveryRun {
  return {
    id: 'run-live',
    status: 'running',
    triggerKind: 'manual',
    phase: 'extracting_candidates',
    queriesGenerated: 1,
    resultsFetched: 2,
    candidatesExtracted: 1,
    eventsCreated: 1,
    eventsDuplicate: 0,
    eventsFiltered: 0,
    generatedQueries: [],
    activityLog: [],
    extractedEvents: [],
    createdAt: '2026-08-13T00:00:00.000Z',
    updatedAt: '2026-08-13T00:00:01.000Z',
  };
}

function renderTabWithRerender(events: InPersonEventsHook) {
  const view = render(
    <MemoryRouter>
      <EventsListTab events={events} />
    </MemoryRouter>
  );
  return {
    rerender: (next: InPersonEventsHook) =>
      view.rerender(
        <MemoryRouter>
          <EventsListTab events={next} />
        </MemoryRouter>
      ),
  };
}

describe('EventsListTab discovery success morph', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    showToast.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not flash Done on idle mount when a completed run already exists', () => {
    renderTab(
      createEventsMock({
        settings: {
          data: { ...baseSettings, lastRunAt: '2026-08-10T00:05:00.000Z' },
          isPending: false,
          isError: false,
        },
        discoveryRuns: {
          data: {
            data: [completedRun(0)],
            total: 1,
            page: 1,
            pageSize: 20,
            hasMore: false,
          },
          isPending: false,
          isError: false,
        },
        discoveryRunDetail: {
          data: completedRun(0),
          isPending: false,
          isError: false,
        },
      })
    );

    expect(screen.getByRole('button', { name: 'Run discovery now' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Done' })).not.toBeInTheDocument();
    expect(showToast).not.toHaveBeenCalled();
  });

  it('morphs header button to Done after a completed run, then returns to idle', () => {
    const busy = createEventsMock({
      isDiscoveryBusy: true,
      startDiscovery: { mutateAsync: vi.fn(), isPending: false },
      discoveryRunDetail: {
        data: runningRun(),
        isPending: false,
        isError: false,
      },
    });
    const idleCompleted = createEventsMock({
      isDiscoveryBusy: false,
      startDiscovery: { mutateAsync: vi.fn(), isPending: false },
      discoveryRuns: {
        data: {
          data: [completedRun(0)],
          total: 1,
          page: 1,
          pageSize: 20,
          hasMore: false,
        },
        isPending: false,
        isError: false,
      },
      discoveryRunDetail: {
        data: completedRun(0),
        isPending: false,
        isError: false,
      },
    });

    const { rerender } = renderTabWithRerender(busy);
    rerender(idleCompleted);

    const doneButton = screen.getByRole('button', { name: 'Done' });
    expect(doneButton).toHaveClass('bg-green-600');
    expect(screen.getByText('Discovery complete')).toBeInTheDocument();
    expect(showToast).toHaveBeenCalledWith({
      type: 'success',
      title: 'Discovery finished',
      message: 'Scored 0 events; 0 kept (filters: min fit 55, exclude keywords, lookahead).',
    });

    act(() => {
      vi.advanceTimersByTime(1250);
    });

    expect(screen.getByRole('button', { name: 'Run discovery now' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Done' })).not.toBeInTheDocument();
  });

  it('does not morph to Done when the run ends failed or cancelled', () => {
    const failedRun: EventDiscoveryRun = {
      ...completedRun(0),
      id: 'run-failed',
      status: 'failed',
      phase: 'failed',
      finishedAt: '2026-08-10T00:05:00.000Z',
    };
    const cancelledRun: EventDiscoveryRun = {
      ...completedRun(0),
      id: 'run-cancelled',
      status: 'cancelled',
      phase: 'cancelled',
      finishedAt: '2026-08-10T00:05:00.000Z',
    };

    const busy = createEventsMock({
      isDiscoveryBusy: true,
      discoveryRunDetail: {
        data: runningRun(),
        isPending: false,
        isError: false,
      },
    });

    const { rerender } = renderTabWithRerender(busy);
    rerender(
      createEventsMock({
        isDiscoveryBusy: false,
        discoveryRunDetail: {
          data: failedRun,
          isPending: false,
          isError: false,
        },
      })
    );

    expect(screen.getByRole('button', { name: 'Run discovery now' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Done' })).not.toBeInTheDocument();
    expect(showToast).not.toHaveBeenCalled();

    rerender(busy);
    rerender(
      createEventsMock({
        isDiscoveryBusy: false,
        discoveryRunDetail: {
          data: cancelledRun,
          isPending: false,
          isError: false,
        },
      })
    );

    expect(screen.getByRole('button', { name: 'Run discovery now' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Done' })).not.toBeInTheDocument();
  });

  it('cancels the success flash when a new run starts', () => {
    const busy = createEventsMock({
      isDiscoveryBusy: true,
      discoveryRunDetail: {
        data: runningRun(),
        isPending: false,
        isError: false,
      },
    });
    const idleCompleted = createEventsMock({
      isDiscoveryBusy: false,
      discoveryRunDetail: {
        data: completedRun(0),
        isPending: false,
        isError: false,
      },
    });

    const { rerender } = renderTabWithRerender(busy);
    rerender(idleCompleted);

    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();

    rerender(
      createEventsMock({
        isDiscoveryBusy: true,
        startDiscovery: { mutateAsync: vi.fn(), isPending: true },
        discoveryRunDetail: {
          data: runningRun(),
          isPending: false,
          isError: false,
        },
      })
    );

    expect(screen.getByRole('button', { name: 'Starting…' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Done' })).not.toBeInTheDocument();
  });

  it('shows one outcome toast with scored counts when a run completes with counters', () => {
    const completedWithCounts: EventDiscoveryRun = {
      ...completedRun(8),
      eventsCreated: 3,
      eventsDuplicate: 1,
      eventsFiltered: 8,
    };
    const busy = createEventsMock({
      isDiscoveryBusy: true,
      discoveryRunDetail: {
        data: runningRun(),
        isPending: false,
        isError: false,
      },
    });
    const idleCompleted = createEventsMock({
      isDiscoveryBusy: false,
      discoveryRunDetail: {
        data: completedWithCounts,
        isPending: false,
        isError: false,
      },
    });

    const { rerender } = renderTabWithRerender(busy);
    rerender(idleCompleted);

    expect(showToast).toHaveBeenCalledTimes(1);
    expect(showToast).toHaveBeenCalledWith({
      type: 'success',
      title: 'Discovery finished',
      message: 'Scored 12 events; 4 kept (filters: min fit 55, exclude keywords, lookahead).',
    });
  });
});

describe('EventsListTab fit-score legend', () => {
  it('mounts hidden legend panel with hover/focus-within classes scoped to the fit score', () => {
    const visible = sampleEvent({ id: 'evt-visible', aiFitScore: 72, title: 'AI Summit' });

    renderTab(
      createEventsMock({
        upcomingEvents: [visible],
        rawUpcomingEvents: [visible],
        filteredAllEvents: [visible],
        events: {
          data: { data: [visible], total: 1, page: 1, pageSize: 100, hasMore: false },
          isPending: false,
          isError: false,
        },
      })
    );

    const legend = screen.getByTestId('event-fit-score-legend');
    expect(legend).toHaveTextContent(EVENT_FIT_SCORE_LEGEND_COPY);
    expect(legend.className).toContain('group-hover/fit-score:block');
    expect(legend.className).toContain('group-focus-within/fit-score:block');
    expect(legend.className).toContain('hidden');
    expect(screen.getByLabelText('Fit 72. AI match score from 0 to 100.')).toBeInTheDocument();
    expect(legend.parentElement).toHaveClass('group/fit-score');
    expect(screen.getByRole('heading', { name: 'AI Summit' }).closest('article')).not.toHaveClass(
      'group/event-card'
    );
  });

  it('does not render legend on empty states or discovery skeletons', () => {
    renderTab(createEventsMock());
    expect(screen.queryByTestId('event-fit-score-legend')).not.toBeInTheDocument();

    renderTab(
      createEventsMock({
        isDiscoveryBusy: true,
        startDiscovery: { mutateAsync: vi.fn(), isPending: true },
      })
    );
    expect(screen.queryByTestId('event-fit-score-legend')).not.toBeInTheDocument();
  });

  it('does not render legend when aiFitScore is null', () => {
    const noScore = sampleEvent({ id: 'evt-noscore', aiFitScore: null, title: 'Open Meetup' });

    renderTab(
      createEventsMock({
        upcomingEvents: [noScore],
        rawUpcomingEvents: [noScore],
        filteredAllEvents: [noScore],
        events: {
          data: { data: [noScore], total: 1, page: 1, pageSize: 100, hasMore: false },
          isPending: false,
          isError: false,
        },
      })
    );

    expect(screen.queryByTestId('event-fit-score-legend')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Fit \d/)).not.toBeInTheDocument();
  });
});

describe('EventsListTab growth task link', () => {
  it('shows Open task link when growthTaskId is set', () => {
    const linked = sampleEvent({
      id: 'evt-linked',
      growthTaskId: 'task-99',
      title: 'Linked Summit',
    });

    renderTab(
      createEventsMock({
        upcomingEvents: [linked],
        rawUpcomingEvents: [linked],
        filteredAllEvents: [linked],
        events: {
          data: { data: [linked], total: 1, page: 1, pageSize: 100, hasMore: false },
          isPending: false,
          isError: false,
        },
      })
    );

    const link = screen.getByRole('link', { name: 'Open task' });
    expect(link).toHaveAttribute('href', expect.stringContaining('highlight=task-99'));
  });
});

describe('EventsListTab event card actions', () => {
  function renderUpcomingEvent(event: InPersonEvent, extra: EventHookTestOverrides = {}) {
    renderTab(
      createEventsMock({
        upcomingEvents: [event],
        rawUpcomingEvents: [event],
        filteredAllEvents: [event],
        events: {
          data: { data: [event], total: 1, page: 1, pageSize: 100, hasMore: false },
          isPending: false,
          isError: false,
        },
        ...extra,
      })
    );
  }

  it('hides status actions behind a three-dot menu', async () => {
    const user = userEvent.setup();
    renderUpcomingEvent(sampleEvent({ title: 'Sample Event' }));

    expect(screen.getByRole('button', { name: 'Actions for Sample Event' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Interested' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Registered' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Attended' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Not interested' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Actions for Sample Event' }));

    expect(screen.getByRole('menuitem', { name: 'Interested' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Registered' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Attended' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Not interested' })).toBeInTheDocument();
  });

  it('marks an event as registered from the menu', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue({});
    renderUpcomingEvent(sampleEvent({ id: 'evt-1', title: 'Sample Event' }), {
      updateEvent: { mutateAsync, isPending: false },
    });

    await user.click(screen.getByRole('button', { name: 'Actions for Sample Event' }));
    await user.click(screen.getByRole('menuitem', { name: 'Registered' }));

    expect(mutateAsync).toHaveBeenCalledWith({
      eventId: 'evt-1',
      body: { status: 'REGISTERED' },
    });
  });

  it('opens not-interested feedback from the menu', async () => {
    const user = userEvent.setup();
    renderUpcomingEvent(sampleEvent({ title: 'Sample Event' }));

    await user.click(screen.getByRole('button', { name: 'Actions for Sample Event' }));
    await user.click(screen.getByRole('menuitem', { name: 'Not interested' }));

    expect(screen.getByRole('dialog', { name: 'Not interested' })).toBeInTheDocument();
  });

  it('shows a status pill for the current RSVP without exposing action buttons', () => {
    renderUpcomingEvent(sampleEvent({ title: 'Sample Event', status: 'INTERESTED' }));

    expect(screen.getByText('Interested')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Interested' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actions for Sample Event' })).toBeInTheDocument();
  });
});
