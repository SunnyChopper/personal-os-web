import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, ChevronRight, ExternalLink, Loader2, MoreHorizontal } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { Skeleton } from '@/components/atoms/Skeleton';
import DropdownMenuButton from '@/components/molecules/DropdownMenuButton';
import { EmptyState } from '@/components/molecules/EmptyState';
import { EyebrowLabel } from '@/components/molecules/personal-branding/EyebrowLabel';
import RejectWithFeedbackModal from '@/components/molecules/personal-branding/RejectWithFeedbackModal';
import EventDiscoveryRunMonitor from '@/components/organisms/personal-branding/EventDiscoveryRunMonitor';
import { useToast } from '@/hooks/use-toast';
import { isLiveDiscoveryRunStatus } from '@/hooks/useInPersonEvents';
import type { useInPersonEvents } from '@/hooks/useInPersonEvents';
import {
  formatEventDiscoveryCadenceLine,
  formatLastSuccessfulRunLine,
} from '@/lib/personal-branding/event-discovery-cadence';
import { formatEventDiscoverySuccessToast } from '@/lib/personal-branding/event-discovery-outcome';
import {
  buildEventFitScoreEmptyPresentation,
  resolveEventFitScoreEmpty,
} from '@/lib/personal-branding/event-fit-score-filter';
import {
  buildUpcomingEventsEmptyPresentation,
  pastEventsEmptyCopy,
  resolvePastEventsEmptyKind,
  resolveUpcomingEventsEmptyKind,
} from '@/lib/personal-branding/in-person-events-empty-state';
import {
  emptyStateCardClassName,
  gridItemCardClassName,
  eventFitScoreLegendPanelClassName,
} from '@/lib/personal-branding/personal-branding-surfaces';
import {
  EVENT_FIT_SCORE_LEGEND_COPY,
  eventFitScoreChipAriaLabel,
} from '@/lib/personal-branding/event-fit-score-legend';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/routes';
import type {
  EventDiscoveryRun,
  InPersonEvent,
  InPersonEventIrrelevanceReason,
} from '@/types/api/personal-branding.dto';
import {
  pbDenseListStackClassName,
  pbFieldGroupStackClassName,
  pbFocusVisibleRingClassName,
  pbNestedSectionTitleClassName,
  statusPillClassName,
  type StatusPillTone,
} from '../personal-branding-ui';
import { EVENT_IRRELEVANCE_REASON_OPTIONS } from './event-irrelevance-reasons';

const UPCOMING_DISCOVERY_SKELETON_COUNT = 2;
const DISCOVERY_SUCCESS_FLASH_MS = 1250;
const DISCOVERY_HEADER_BUTTON_MIN_WIDTH_CLASS = 'min-w-[11rem]';

const EVENT_RSVP_ACTIONS: {
  status: Extract<InPersonEvent['status'], 'INTERESTED' | 'REGISTERED' | 'ATTENDED'>;
  label: string;
}[] = [
  { status: 'INTERESTED', label: 'Interested' },
  { status: 'REGISTERED', label: 'Registered' },
  { status: 'ATTENDED', label: 'Attended' },
];

function eventRsvpLabel(status: InPersonEvent['status']): string | null {
  return EVENT_RSVP_ACTIONS.find((action) => action.status === status)?.label ?? null;
}

function eventRsvpPillTone(status: InPersonEvent['status']): StatusPillTone {
  switch (status) {
    case 'REGISTERED':
      return 'success';
    case 'INTERESTED':
      return 'info';
    case 'ATTENDED':
      return 'muted';
    default:
      return 'neutral';
  }
}

type Props = {
  events: ReturnType<typeof useInPersonEvents>;
};

function formatEventDate(event: InPersonEvent): string {
  if (!event.startsAt) return 'No date found';
  const date = event.startsAt.slice(0, 10);
  if (event.dateConfidence === 'approx') return `~${date}`;
  return date;
}

function latestCompletedDiscoveryRun(runs: EventDiscoveryRun[]): EventDiscoveryRun | null {
  const completed = runs.filter((run) => run.status === 'completed');
  if (completed.length === 0) return null;
  return [...completed].sort((a, b) =>
    (b.finishedAt ?? b.createdAt).localeCompare(a.finishedAt ?? a.createdAt)
  )[0];
}

function EventCardSkeleton() {
  return (
    <article
      role="status"
      aria-label="Discovering events"
      data-testid="event-discovery-upcoming-skeleton"
      className={cn(gridItemCardClassName, 'space-y-3 p-4')}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton variant="rectangular" className="h-5 w-14 rounded-full" />
          <Skeleton variant="circular" className="size-9" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </article>
  );
}

function EventCard({
  event,
  onStatus,
  onNotInterested,
}: {
  event: InPersonEvent;
  onStatus: (status: InPersonEvent['status']) => void;
  onNotInterested: () => void;
}) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const hasFitScore = event.aiFitScore != null;
  const hasUnknownDate = !event.startsAt || event.dateConfidence === 'unknown';
  const rsvpLabel = eventRsvpLabel(event.status);

  return (
    <article className={cn(gridItemCardClassName, 'relative space-y-3 p-4', actionsOpen && 'z-20')}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-medium text-gray-900 dark:text-white">{event.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {[event.city, event.region].filter(Boolean).join(', ') || 'Location TBD'} ·{' '}
            {formatEventDate(event)}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {rsvpLabel ? (
            <span className={statusPillClassName(eventRsvpPillTone(event.status))}>
              {rsvpLabel}
            </span>
          ) : null}
          {hasUnknownDate ? (
            <span
              className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
              aria-label="No date found; discovery could not confirm an event date"
              data-testid="event-no-date-badge"
            >
              No date
            </span>
          ) : null}
          {hasFitScore ? (
            <div className="group/fit-score relative shrink-0">
              <span
                className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
                aria-label={eventFitScoreChipAriaLabel(event.aiFitScore!)}
              >
                Fit {event.aiFitScore}
              </span>
              <div
                className={eventFitScoreLegendPanelClassName}
                role="tooltip"
                data-testid="event-fit-score-legend"
              >
                {EVENT_FIT_SCORE_LEGEND_COPY}
              </div>
            </div>
          ) : null}
          <DropdownMenuButton
            icon={MoreHorizontal}
            ariaLabel={`Actions for ${event.title}`}
            align="end"
            open={actionsOpen}
            onOpenChange={setActionsOpen}
            items={[
              ...EVENT_RSVP_ACTIONS.map((action) => ({
                key: action.status,
                label: action.label,
                icon: event.status === action.status ? Check : undefined,
                onClick: () => onStatus(action.status),
              })),
              {
                key: 'not-interested',
                label: 'Not interested',
                onClick: onNotInterested,
              },
            ]}
          />
        </div>
      </div>
      {event.summary ? (
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">{event.summary}</p>
      ) : null}
      {event.url || event.growthTaskId ? (
        <div className="flex flex-wrap gap-2">
          {event.url ? (
            <a
              href={event.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-700 hover:underline dark:text-blue-300"
            >
              View / Register <ExternalLink className="size-3.5" />
            </a>
          ) : null}
          {event.growthTaskId ? (
            <a
              href={`${ROUTES.admin.tasks}?highlight=${encodeURIComponent(event.growthTaskId)}`}
              className="inline-flex items-center gap-1 text-sm text-blue-700 hover:underline dark:text-blue-300"
            >
              Open task
            </a>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export default function EventsListTab({ events }: Props) {
  const { showToast } = useToast();
  const [, setSearchParams] = useSearchParams();
  const [rejectEventId, setRejectEventId] = useState<string | null>(null);
  const [undatedOpen, setUndatedOpen] = useState(false);
  const undatedHeadingId = useId();
  const undatedPanelId = `${undatedHeadingId}-panel`;
  const [showDiscoverySuccess, setShowDiscoverySuccess] = useState(false);
  const wasDiscoveryBusyRef = useRef(events.isDiscoveryBusy);
  const discoverySuccessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const discoveryOutcomeToastedRunIdRef = useRef<string | null>(null);
  const run = events.discoveryRunDetail.data;
  const isRunning = run && isLiveDiscoveryRunStatus(run.status);
  const cadenceLine = useMemo(() => {
    if (events.settings.isError) return null;
    return formatEventDiscoveryCadenceLine(events.settings.data ?? null);
  }, [events.settings.data, events.settings.isError]);

  const lastSuccessfulRunLine = useMemo(() => {
    if (events.settings.isError) return null;
    return formatLastSuccessfulRunLine(events.settings.data ?? null);
  }, [events.settings.data, events.settings.isError]);

  const discoveryRuns = events.discoveryRuns.data?.data ?? [];
  const settingsRow = events.settings.data;
  const persistedEventCount = events.events.data?.data?.length ?? 0;
  const hasStints = (events.locations.data?.data?.length ?? 0) > 0;
  const isEmptyStateReady =
    !events.settings.isPending && !events.events.isPending && !events.discoveryRuns.isPending;

  const latestCompletedRun = useMemo(
    () => latestCompletedDiscoveryRun(discoveryRuns),
    [discoveryRuns]
  );

  const latestRun = discoveryRuns[0] ?? null;

  const latestDiscoveryRunStatus =
    events.discoveryRunDetail.data?.status ?? latestRun?.status ?? null;

  useEffect(() => {
    const clearDiscoverySuccessTimeout = () => {
      if (discoverySuccessTimeoutRef.current) {
        clearTimeout(discoverySuccessTimeoutRef.current);
        discoverySuccessTimeoutRef.current = null;
      }
    };

    if (events.isDiscoveryBusy) {
      clearDiscoverySuccessTimeout();
      setShowDiscoverySuccess(false);
      wasDiscoveryBusyRef.current = true;
      return;
    }

    const wasBusy = wasDiscoveryBusyRef.current;
    wasDiscoveryBusyRef.current = false;

    if (wasBusy && latestDiscoveryRunStatus === 'completed') {
      const completedRun = events.discoveryRunDetail.data;
      if (
        completedRun?.status === 'completed' &&
        discoveryOutcomeToastedRunIdRef.current !== completedRun.id
      ) {
        discoveryOutcomeToastedRunIdRef.current = completedRun.id;
        const outcomeToast = formatEventDiscoverySuccessToast(completedRun, events.minFitScore);
        showToast({
          type: 'success',
          title: outcomeToast.title,
          message: outcomeToast.message,
        });
      }

      setShowDiscoverySuccess(true);
      clearDiscoverySuccessTimeout();
      discoverySuccessTimeoutRef.current = setTimeout(() => {
        discoverySuccessTimeoutRef.current = null;
        setShowDiscoverySuccess(false);
      }, DISCOVERY_SUCCESS_FLASH_MS);
    }
  }, [
    events.discoveryRunDetail.data,
    events.isDiscoveryBusy,
    events.minFitScore,
    latestDiscoveryRunStatus,
    showToast,
  ]);

  useEffect(
    () => () => {
      if (discoverySuccessTimeoutRef.current) {
        clearTimeout(discoverySuccessTimeoutRef.current);
      }
    },
    []
  );

  const isDiscoverySuccessFlash = showDiscoverySuccess && !events.isDiscoveryBusy;

  const minFitScore = events.minFitScore;

  const upcomingThresholdEmpty = useMemo(() => {
    if (!isEmptyStateReady || events.isDiscoveryBusy || events.upcomingEvents.length > 0) {
      return null;
    }
    if (
      resolveEventFitScoreEmpty({
        rawCount: events.rawUpcomingEvents.length,
        filteredCount: events.upcomingEvents.length,
        minFitScore,
      }) !== 'threshold'
    ) {
      return null;
    }
    return buildEventFitScoreEmptyPresentation({
      minFitScore,
      hiddenCount: events.rawUpcomingEvents.length,
      section: 'upcoming',
    });
  }, [
    events.isDiscoveryBusy,
    events.rawUpcomingEvents.length,
    events.upcomingEvents.length,
    isEmptyStateReady,
    minFitScore,
  ]);

  const pastThresholdEmpty = useMemo(() => {
    if (!isEmptyStateReady || events.pastEvents.length > 0) return null;
    if (
      resolveEventFitScoreEmpty({
        rawCount: events.rawPastEvents.length,
        filteredCount: events.pastEvents.length,
        minFitScore,
      }) !== 'threshold'
    ) {
      return null;
    }
    return buildEventFitScoreEmptyPresentation({
      minFitScore,
      hiddenCount: events.rawPastEvents.length,
      section: 'past',
    });
  }, [events.pastEvents.length, events.rawPastEvents.length, isEmptyStateReady, minFitScore]);

  const upcomingEmptyKind = useMemo(() => {
    if (!isEmptyStateReady || events.upcomingEvents.length > 0 || events.isDiscoveryBusy) {
      return null;
    }
    if (upcomingThresholdEmpty) return null;
    return resolveUpcomingEventsEmptyKind({
      lastRunAt: settingsRow?.lastRunAt,
      lastRunStatus: settingsRow?.lastRunStatus,
      lastSuccessfulRunAt: settingsRow?.lastSuccessfulRunAt,
      latestRunStatus: latestRun?.status,
      runCount: discoveryRuns.length,
      eventsFiltered: latestCompletedRun?.eventsFiltered ?? 0,
      persistedEventCount,
      hasCompletedRun: latestCompletedRun != null,
    });
  }, [
    discoveryRuns.length,
    events.isDiscoveryBusy,
    events.upcomingEvents.length,
    isEmptyStateReady,
    latestCompletedRun,
    latestRun?.status,
    persistedEventCount,
    settingsRow?.lastRunAt,
    settingsRow?.lastRunStatus,
    settingsRow?.lastSuccessfulRunAt,
    upcomingThresholdEmpty,
  ]);

  const upcomingEmptyPresentation = useMemo(() => {
    if (!upcomingEmptyKind) return null;
    return buildUpcomingEventsEmptyPresentation({
      kind: upcomingEmptyKind,
      minFitScore: settingsRow?.minFitScore ?? 40,
      eventsFiltered: latestCompletedRun?.eventsFiltered ?? 0,
      hasStints,
      lastErrorSummary: settingsRow?.lastErrorSummary,
    });
  }, [
    upcomingEmptyKind,
    settingsRow?.minFitScore,
    settingsRow?.lastErrorSummary,
    latestCompletedRun?.eventsFiltered,
    hasStints,
  ]);

  const pastEmptyCopy = useMemo(() => {
    if (!isEmptyStateReady) return null;
    const kind = resolvePastEventsEmptyKind({
      lastRunAt: settingsRow?.lastRunAt,
      runCount: discoveryRuns.length,
    });
    return pastEventsEmptyCopy(kind);
  }, [discoveryRuns.length, isEmptyStateReady, settingsRow?.lastRunAt]);

  const openSettingsTab = () => {
    setSearchParams({ tab: 'settings' }, { replace: true });
  };

  const handleUpcomingEmptyAction = () => {
    if (!upcomingEmptyPresentation?.action) return;
    if (upcomingEmptyPresentation.action === 'openSettings') {
      openSettingsTab();
      return;
    }
    void handleStartDiscovery();
  };

  const handleLowerMinFitScore = async (target: number) => {
    try {
      await events.updateSettings.mutateAsync({ minFitScore: target });
      showToast({ type: 'success', title: `Min fit score lowered to ${target}` });
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Failed to update min fit score',
      });
    }
  };

  const handleStartDiscovery = async () => {
    try {
      await events.startDiscovery.mutateAsync();
      showToast({ type: 'success', title: 'Discovery run started' });
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Failed to start discovery',
      });
    }
  };

  const handleCancelDiscovery = async () => {
    if (!run || !isLiveDiscoveryRunStatus(run.status)) return;
    try {
      await events.cancelDiscovery.mutateAsync(run.id);
      showToast({ type: 'success', title: 'Discovery cancellation requested' });
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Failed to cancel discovery',
      });
    }
  };

  const handleStatus = async (eventId: string, status: InPersonEvent['status']) => {
    try {
      await events.updateEvent.mutateAsync({ eventId, body: { status } });
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Update failed',
      });
    }
  };

  const handleReject = async (_feedbackText: string | null, feedbackCategory?: string | null) => {
    if (!rejectEventId) return;
    try {
      await events.updateRelevance.mutateAsync({
        eventId: rejectEventId,
        relevant: false,
        reason: (feedbackCategory as InPersonEventIrrelevanceReason) ?? 'other',
      });
      setRejectEventId(null);
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Feedback failed',
      });
    }
  };

  const renderEventList = (items: InPersonEvent[]) => (
    <div className="grid gap-3">
      {items.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onStatus={(status) => void handleStatus(event.id, status)}
          onNotInterested={() => setRejectEventId(event.id)}
        />
      ))}
    </div>
  );

  const renderUpcomingEmpty = () => {
    if (events.isDiscoveryBusy) {
      return (
        <div className="grid gap-3" aria-busy="true">
          {Array.from({ length: UPCOMING_DISCOVERY_SKELETON_COUNT }, (_, index) => (
            <EventCardSkeleton key={`event-discovery-skeleton-${index}`} />
          ))}
        </div>
      );
    }

    if (!isEmptyStateReady) {
      return (
        <div
          className={cn(emptyStateCardClassName, 'p-6 text-sm text-gray-600 dark:text-gray-400')}
          aria-busy="true"
        >
          Loading events…
        </div>
      );
    }

    if (upcomingThresholdEmpty) {
      return (
        <EmptyState
          scene={upcomingThresholdEmpty.scene}
          density="compact"
          title={upcomingThresholdEmpty.title}
          description={upcomingThresholdEmpty.description}
          actionLabel={upcomingThresholdEmpty.actionLabel}
          onAction={() => void handleLowerMinFitScore(upcomingThresholdEmpty.lowerTo)}
          actionDisabled={events.updateSettings.isPending}
          className={cn(emptyStateCardClassName, 'px-6')}
        />
      );
    }

    if (upcomingEmptyPresentation) {
      return (
        <EmptyState
          scene={upcomingEmptyPresentation.scene}
          density="compact"
          title={upcomingEmptyPresentation.title}
          description={upcomingEmptyPresentation.description}
          actionLabel={upcomingEmptyPresentation.actionLabel}
          onAction={upcomingEmptyPresentation.action ? handleUpcomingEmptyAction : undefined}
          className={cn(emptyStateCardClassName, 'px-6')}
        />
      );
    }

    return (
      <div className={cn(emptyStateCardClassName, 'p-6 text-sm text-gray-600 dark:text-gray-400')}>
        No upcoming events right now.
      </div>
    );
  };

  const renderPastEmpty = () => {
    if (!isEmptyStateReady) {
      return (
        <div
          className={cn(emptyStateCardClassName, 'p-6 text-sm text-gray-600 dark:text-gray-400')}
          aria-busy="true"
        >
          Loading events…
        </div>
      );
    }

    if (pastThresholdEmpty) {
      return (
        <EmptyState
          scene={pastThresholdEmpty.scene}
          density="compact"
          title={pastThresholdEmpty.title}
          description={pastThresholdEmpty.description}
          actionLabel={pastThresholdEmpty.actionLabel}
          onAction={() => void handleLowerMinFitScore(pastThresholdEmpty.lowerTo)}
          actionDisabled={events.updateSettings.isPending}
          className={cn(emptyStateCardClassName, 'px-6')}
        />
      );
    }

    return (
      <div className={cn(emptyStateCardClassName, 'p-6 text-sm text-gray-600 dark:text-gray-400')}>
        {pastEmptyCopy}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Discover in-person events grounded in your location stints and interests.
          </p>
          {cadenceLine ? (
            <p
              className="mt-1 text-xs text-gray-500 dark:text-gray-400"
              title={cadenceLine.title || undefined}
            >
              {cadenceLine.text}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button
            variant={isDiscoverySuccessFlash ? 'success' : 'primary'}
            onClick={() => void handleStartDiscovery()}
            disabled={events.isDiscoveryBusy}
            aria-busy={events.isDiscoveryBusy}
            disableSound={isDiscoverySuccessFlash}
            className={cn(
              'inline-flex items-center gap-2 motion-reduce:transition-none',
              DISCOVERY_HEADER_BUTTON_MIN_WIDTH_CLASS
            )}
          >
            {events.isDiscoveryBusy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : isDiscoverySuccessFlash ? (
              <Check className="size-4" aria-hidden />
            ) : null}
            {events.startDiscovery.isPending
              ? 'Starting…'
              : events.isDiscoveryBusy
                ? 'Running…'
                : isDiscoverySuccessFlash
                  ? 'Done'
                  : 'Run discovery now'}
          </Button>
          {isDiscoverySuccessFlash ? (
            <span className="sr-only" role="status" aria-live="polite">
              Discovery complete
            </span>
          ) : null}
          {lastSuccessfulRunLine ? (
            <p
              className="text-xs text-gray-500 dark:text-gray-400"
              title={lastSuccessfulRunLine.title || undefined}
              data-testid="event-discovery-last-run"
            >
              {settingsRow?.lastRunId ? (
                <Link
                  to={`?tab=runs&runId=${encodeURIComponent(settingsRow.lastRunId)}`}
                  className="hover:underline"
                >
                  {lastSuccessfulRunLine.text}
                </Link>
              ) : (
                lastSuccessfulRunLine.text
              )}
            </p>
          ) : null}
        </div>
      </div>

      {isRunning && run ? (
        <EventDiscoveryRunMonitor
          run={run}
          cancelPending={events.cancelDiscovery.isPending}
          onCancel={() => void handleCancelDiscovery()}
        />
      ) : null}

      <section className={pbFieldGroupStackClassName}>
        <h2 className={pbNestedSectionTitleClassName}>Upcoming</h2>
        {events.isDiscoveryBusy ? (
          <div className="grid gap-3" aria-busy="true">
            {Array.from({ length: UPCOMING_DISCOVERY_SKELETON_COUNT }, (_, index) => (
              <EventCardSkeleton key={`event-discovery-skeleton-${index}`} />
            ))}
            {events.upcomingEvents.length > 0 ? renderEventList(events.upcomingEvents) : null}
          </div>
        ) : events.upcomingEvents.length === 0 ? (
          renderUpcomingEmpty()
        ) : (
          renderEventList(events.upcomingEvents)
        )}
      </section>

      {events.undatedEvents.length > 0 ? (
        <section className={pbDenseListStackClassName} data-testid="undated-events-section">
          <button
            type="button"
            onClick={() => setUndatedOpen((prev) => !prev)}
            className={cn(
              'flex w-full items-center gap-2 text-left hover:bg-gray-100/80 dark:hover:bg-gray-800/60',
              pbFocusVisibleRingClassName
            )}
            aria-expanded={undatedOpen}
            aria-controls={undatedPanelId}
          >
            <ChevronRight
              className={cn(
                'h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ease-out',
                undatedOpen && 'rotate-90'
              )}
              aria-hidden
            />
            <h2
              id={undatedHeadingId}
              className="min-w-0 flex-1 text-lg font-semibold text-gray-900 dark:text-white"
            >
              Undated
            </h2>
            <span
              className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium tabular-nums text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              aria-hidden
            >
              {events.undatedEvents.length}
            </span>
            <span className="sr-only">
              {events.undatedEvents.length} events without identifiable dates
            </span>
          </button>
          {undatedOpen ? (
            <div id={undatedPanelId} role="region" aria-labelledby={undatedHeadingId}>
              {renderEventList(events.undatedEvents)}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className={pbDenseListStackClassName}>
        <EyebrowLabel as="h2">Past</EyebrowLabel>
        {events.pastEvents.length === 0 ? renderPastEmpty() : renderEventList(events.pastEvents)}
      </section>

      <RejectWithFeedbackModal
        isOpen={rejectEventId != null}
        title="Not interested"
        promptText="Help the discovery pipeline learn what to skip."
        categories={[...EVENT_IRRELEVANCE_REASON_OPTIONS]}
        categoryRequired
        submitLabel="Submit feedback"
        isSubmitting={events.updateRelevance.isPending}
        onClose={() => setRejectEventId(null)}
        onSubmit={(text, category) => void handleReject(text, category)}
      />
    </div>
  );
}
