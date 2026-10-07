import { useEffect, useMemo, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTerminalJobFailureAlert } from '@/hooks/useTerminalJobFailureAlert';
import { calendarDateInTimeZone } from '@/lib/date/local-calendar';
import {
  DEFAULT_MIN_FIT_SCORE,
  filterEventsByMinFitScore,
} from '@/lib/personal-branding/event-fit-score-filter';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import { proactiveService } from '@/services/proactive.service';
import { unwrapApiData } from '@/lib/api-client/unwrap-api-response';
import type {
  CreateEventLocationStintInput,
  CreateInPersonEventInput,
  EventDiscoveryRun,
  EventDiscoveryRunStatus,
  EventLocationStint,
  InPersonEventIrrelevanceReason,
  InPersonEventStatus,
  PaginatedPersonalBranding,
  UpdateEventDiscoverySettingsInput,
  UpdateEventLocationStintInput,
  UpdateInPersonEventInput,
} from '@/types/api/personal-branding.dto';

const LOCATIONS_PAGE = 1;
const LOCATIONS_PAGE_SIZE = 50;
export const DISCOVERY_RUNS_PAGE_SIZE = 20;

const LIVE_DISCOVERY_STATUSES = new Set<EventDiscoveryRunStatus>([
  'queued',
  'running',
  'cancelling',
]);

export function isLiveDiscoveryRunStatus(status: EventDiscoveryRunStatus): boolean {
  return LIVE_DISCOVERY_STATUSES.has(status);
}

function discoveryPollInterval(
  run?: { status: EventDiscoveryRunStatus; pollAfterMs?: number | null } | null
): number | false {
  if (!run || !LIVE_DISCOVERY_STATUSES.has(run.status)) return false;
  return Math.max(1500, Math.min(run.pollAfterMs ?? 2000, 5000));
}

function findLiveDiscoveryRun(
  runs: EventDiscoveryRun[] | undefined
): EventDiscoveryRun | undefined {
  return runs?.find((run) => LIVE_DISCOVERY_STATUSES.has(run.status));
}

export function useEventDiscoveryRunsPage(page = 1, pageSize = DISCOVERY_RUNS_PAGE_SIZE) {
  return useQuery({
    queryKey: queryKeys.personalBranding.inPersonEvents.discoveryRuns(page, pageSize),
    queryFn: ({ signal }) => personalBrandingService.listEventDiscoveryRuns(page, pageSize, signal),
    refetchInterval: (q) => discoveryPollInterval(findLiveDiscoveryRun(q.state.data?.data)),
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
  });
}

export function useEventDiscoveryRunDetail(runId: string | null) {
  return useQuery({
    queryKey: queryKeys.personalBranding.inPersonEvents.discoveryRunDetail(runId ?? ''),
    queryFn: ({ signal }) => personalBrandingService.getEventDiscoveryRun(runId!, signal),
    enabled: Boolean(runId),
    refetchInterval: (q) => discoveryPollInterval(q.state.data ?? null),
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
  });
}

function locationsQueryKey() {
  return queryKeys.personalBranding.inPersonEvents.locations(LOCATIONS_PAGE, LOCATIONS_PAGE_SIZE);
}

export function patchEventLocationsCache(
  prev: PaginatedPersonalBranding<EventLocationStint> | undefined,
  patch: (data: EventLocationStint[]) => EventLocationStint[]
): PaginatedPersonalBranding<EventLocationStint> {
  const base = prev ?? {
    data: [],
    total: 0,
    page: LOCATIONS_PAGE,
    pageSize: LOCATIONS_PAGE_SIZE,
    hasMore: false,
  };
  const data = patch(base.data);
  return {
    ...base,
    data,
    total: Math.max(base.total, data.length),
    hasMore: data.length > base.pageSize,
  };
}

export function useInPersonEvents(activeRunId: string | null = null) {
  const queryClient = useQueryClient();

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.personalBranding.inPersonEvents.all(),
    });
  };

  const settings = useQuery({
    queryKey: queryKeys.personalBranding.inPersonEvents.settings(),
    queryFn: ({ signal }) => personalBrandingService.getEventDiscoverySettings(signal),
    refetchOnWindowFocus: false,
  });

  const preferencesTimeZone = useQuery({
    queryKey: queryKeys.preferences.timeZone(),
    queryFn: async () => unwrapApiData(await proactiveService.getTimeZone()),
    refetchOnWindowFocus: false,
  });

  const operatorToday = useMemo(
    () => calendarDateInTimeZone(preferencesTimeZone.data?.timeZone ?? 'UTC'),
    [preferencesTimeZone.data?.timeZone]
  );

  const locations = useQuery({
    queryKey: locationsQueryKey(),
    queryFn: ({ signal }) =>
      personalBrandingService.listEventLocations(LOCATIONS_PAGE, LOCATIONS_PAGE_SIZE, signal),
    refetchOnWindowFocus: false,
  });

  const discoveryRuns = useEventDiscoveryRunsPage(1);

  const startDiscovery = useMutation({
    mutationFn: () => personalBrandingService.startEventDiscoveryRun(),
    onSuccess: async (data) => {
      const now = new Date().toISOString();
      const placeholder: EventDiscoveryRun = {
        id: data.runId,
        status: 'queued',
        triggerKind: 'manual',
        phase: 'queued',
        queuedAt: now,
        heartbeatAt: now,
        queriesGenerated: 0,
        resultsFetched: 0,
        candidatesExtracted: 0,
        eventsCreated: 0,
        eventsDuplicate: 0,
        eventsFiltered: 0,
        generatedQueries: [],
        activityLog: [],
        extractedEvents: [],
        pollAfterMs: 2000,
        createdAt: now,
        updatedAt: now,
      };
      queryClient.setQueryData(
        queryKeys.personalBranding.inPersonEvents.discoveryRunDetail(data.runId),
        placeholder
      );
      queryClient.setQueryData<PaginatedPersonalBranding<EventDiscoveryRun>>(
        queryKeys.personalBranding.inPersonEvents.discoveryRuns(),
        (prev) => {
          if (!prev) {
            return {
              data: [placeholder],
              total: 1,
              page: 1,
              pageSize: 20,
              hasMore: false,
            };
          }
          if (prev.data.some((run) => run.id === data.runId)) {
            return prev;
          }
          return {
            ...prev,
            data: [placeholder, ...prev.data],
            total: prev.total + 1,
          };
        }
      );
      await invalidateAll();
    },
  });

  const mutationRunId = startDiscovery.data?.runId;
  const mutationListRun = mutationRunId
    ? discoveryRuns.data?.data?.find((run) => run.id === mutationRunId)
    : undefined;
  const bridgeRunId =
    mutationRunId && (!mutationListRun || LIVE_DISCOVERY_STATUSES.has(mutationListRun.status))
      ? mutationRunId
      : null;

  const resolvedRunId =
    activeRunId ?? findLiveDiscoveryRun(discoveryRuns.data?.data)?.id ?? bridgeRunId ?? null;

  const discoveryRunDetail = useEventDiscoveryRunDetail(resolvedRunId);

  const events = useQuery({
    queryKey: queryKeys.personalBranding.inPersonEvents.events(),
    queryFn: ({ signal }) =>
      personalBrandingService.listInPersonEvents({ pageSize: 100, sortOrder: 'asc' }, signal),
    refetchInterval: () => {
      const runs = queryClient.getQueryData<PaginatedPersonalBranding<EventDiscoveryRun>>(
        queryKeys.personalBranding.inPersonEvents.discoveryRuns()
      );
      const activeFromList = findLiveDiscoveryRun(runs?.data);
      const pollRunId = activeRunId ?? activeFromList?.id ?? bridgeRunId ?? null;
      if (!pollRunId) return false;
      const detail = queryClient.getQueryData<EventDiscoveryRun>(
        queryKeys.personalBranding.inPersonEvents.discoveryRunDetail(pollRunId)
      );
      const pollTarget = activeFromList ?? detail ?? null;
      if (pollTarget) return discoveryPollInterval(pollTarget);
      return 2000;
    },
    refetchOnWindowFocus: false,
  });

  const terminalInvalidatedRunRef = useRef<string | null>(null);

  useEffect(() => {
    const run = discoveryRunDetail.data;
    if (!run?.id || LIVE_DISCOVERY_STATUSES.has(run.status)) return;
    if (terminalInvalidatedRunRef.current === run.id) return;
    terminalInvalidatedRunRef.current = run.id;
    void invalidateAll();
  }, [discoveryRunDetail.data?.id, discoveryRunDetail.data?.status, queryClient]);

  useTerminalJobFailureAlert({
    feature: 'eventDiscovery',
    jobId: resolvedRunId,
    status: discoveryRunDetail.data?.status,
    error: discoveryRunDetail.data?.errorSummary,
  });

  const patchLocationsCache = (patch: (data: EventLocationStint[]) => EventLocationStint[]) => {
    queryClient.setQueryData<PaginatedPersonalBranding<EventLocationStint>>(
      locationsQueryKey(),
      (prev) => patchEventLocationsCache(prev, patch)
    );
  };

  const updateSettings = useMutation({
    mutationFn: (body: UpdateEventDiscoverySettingsInput) =>
      personalBrandingService.updateEventDiscoverySettings(body),
    onSuccess: async () => {
      await invalidateAll();
    },
  });

  const createLocation = useMutation({
    mutationFn: (body: CreateEventLocationStintInput) =>
      personalBrandingService.createEventLocation(body),
    onSuccess: async (created) => {
      patchLocationsCache((rows) => [created, ...rows.filter((row) => row.id !== created.id)]);
      await invalidateAll();
    },
  });

  const updateLocation = useMutation({
    mutationFn: ({
      locationId,
      body,
    }: {
      locationId: string;
      body: UpdateEventLocationStintInput;
    }) => personalBrandingService.updateEventLocation(locationId, body),
    onSuccess: async (updated) => {
      patchLocationsCache((rows) => rows.map((row) => (row.id === updated.id ? updated : row)));
      await invalidateAll();
    },
  });

  const deleteLocation = useMutation({
    mutationFn: (locationId: string) => personalBrandingService.deleteEventLocation(locationId),
    onSuccess: async (_data, locationId) => {
      patchLocationsCache((rows) => rows.filter((row) => row.id !== locationId));
      await invalidateAll();
    },
  });

  const createEvent = useMutation({
    mutationFn: (body: CreateInPersonEventInput) =>
      personalBrandingService.createInPersonEvent(body),
    onSuccess: invalidateAll,
  });

  const updateEvent = useMutation({
    mutationFn: ({ eventId, body }: { eventId: string; body: UpdateInPersonEventInput }) =>
      personalBrandingService.updateInPersonEvent(eventId, body),
    onSuccess: invalidateAll,
  });

  const updateRelevance = useMutation({
    mutationFn: ({
      eventId,
      relevant,
      reason,
    }: {
      eventId: string;
      relevant: boolean;
      reason?: InPersonEventIrrelevanceReason;
    }) =>
      personalBrandingService.updateInPersonEventRelevance(eventId, {
        relevant,
        reason: reason ?? null,
      }),
    onSuccess: invalidateAll,
  });

  const cancelDiscovery = useMutation({
    mutationFn: (runId: string) => personalBrandingService.cancelEventDiscoveryRun(runId),
    onSuccess: invalidateAll,
  });

  const isDiscoveryBusy = useMemo(() => {
    if (startDiscovery.isPending) return true;
    if (findLiveDiscoveryRun(discoveryRuns.data?.data)) return true;
    const detail = discoveryRunDetail.data;
    if (detail && LIVE_DISCOVERY_STATUSES.has(detail.status)) return true;
    if (!mutationRunId) return false;
    if (!mutationListRun && !detail) return true;
    if (detail?.id === mutationRunId && LIVE_DISCOVERY_STATUSES.has(detail.status)) {
      return true;
    }
    return false;
  }, [
    startDiscovery.isPending,
    discoveryRuns.data,
    discoveryRunDetail.data,
    mutationRunId,
    mutationListRun,
  ]);

  const today = operatorToday;
  const minFitScore = settings.data?.minFitScore ?? DEFAULT_MIN_FIT_SCORE;

  const rawUpcomingEvents = useMemo(
    () =>
      (events.data?.data ?? []).filter((event) =>
        Boolean(event.startsAt && event.startsAt.slice(0, 10) >= today)
      ),
    [events.data?.data, today]
  );
  const rawPastEvents = useMemo(
    () =>
      (events.data?.data ?? []).filter((event) =>
        Boolean(event.startsAt && event.startsAt.slice(0, 10) < today)
      ),
    [events.data?.data, today]
  );
  const rawUndatedEvents = useMemo(
    () => (events.data?.data ?? []).filter((event) => !event.startsAt),
    [events.data?.data]
  );

  const upcomingEvents = useMemo(
    () => filterEventsByMinFitScore(rawUpcomingEvents, minFitScore),
    [rawUpcomingEvents, minFitScore]
  );
  const pastEvents = useMemo(
    () => filterEventsByMinFitScore(rawPastEvents, minFitScore),
    [rawPastEvents, minFitScore]
  );
  const undatedEvents = useMemo(
    () => filterEventsByMinFitScore(rawUndatedEvents, minFitScore),
    [rawUndatedEvents, minFitScore]
  );
  const filteredAllEvents = useMemo(
    () => filterEventsByMinFitScore(events.data?.data ?? [], minFitScore),
    [events.data?.data, minFitScore]
  );

  return {
    settings,
    locations,
    events,
    operatorToday,
    minFitScore,
    rawUpcomingEvents,
    rawPastEvents,
    rawUndatedEvents,
    upcomingEvents,
    pastEvents,
    undatedEvents,
    filteredAllEvents,
    discoveryRuns,
    discoveryRunDetail,
    activeRunId: resolvedRunId,
    isDiscoveryBusy,
    updateSettings,
    createLocation,
    updateLocation,
    deleteLocation,
    createEvent,
    updateEvent,
    updateRelevance,
    startDiscovery,
    cancelDiscovery,
    isLoading: settings.isPending || locations.isPending || events.isPending,
  };
}

export function useInPersonEventsUnmountCleanup() {
  const queryClient = useQueryClient();
  useEffect(() => {
    return () => {
      void queryClient.cancelQueries({
        queryKey: queryKeys.personalBranding.inPersonEvents.all(),
      });
    };
  }, [queryClient]);
}

export function setEventStatus(
  updateEvent: ReturnType<typeof useInPersonEvents>['updateEvent'],
  eventId: string,
  status: InPersonEventStatus
) {
  return updateEvent.mutateAsync({ eventId, body: { status } });
}
