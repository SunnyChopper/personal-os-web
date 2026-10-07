import { useState } from 'react';
import { Ban, Loader2 } from 'lucide-react';

import Button from '@/components/atoms/Button';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { useToast } from '@/hooks/use-toast';
import SlideDrawer from '@/components/molecules/SlideDrawer';
import { personalBrandingService } from '@/services/personal-branding.service';
import { formatPersonalBrandingDateTime, pbMetaClassName } from '../personal-branding-ui';
import { useEventDiscoveryRunDetail } from '@/hooks/useInPersonEvents';
import type { EventDiscoveryRun } from '@/types/api/personal-branding.dto';

function formatDuration(startedAt?: string | null, finishedAt?: string | null): string {
  if (!startedAt) return '—';
  const start = new Date(startedAt).getTime();
  const end = finishedAt ? new Date(finishedAt).getTime() : Date.now();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return '—';
  const seconds = Math.round((end - start) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

function formatPhase(phase: string): string {
  return phase.replaceAll('_', ' ');
}

export interface EventDiscoveryRunDetailDrawerProps {
  open: boolean;
  runId: string | null;
  run?: EventDiscoveryRun | null;
  onClose: () => void;
}

export default function EventDiscoveryRunDetailDrawer({
  open,
  runId,
  run,
  onClose,
}: EventDiscoveryRunDetailDrawerProps) {
  const { showToast } = useToast();
  const [cancelPending, setCancelPending] = useState(false);
  const detail = useEventDiscoveryRunDetail(runId);
  const displayRun = detail.data ?? run;
  const activityLog = displayRun?.activityLog ?? [];
  const isCancelling = displayRun?.status === 'cancelling';
  const canCancel =
    displayRun != null && (displayRun.status === 'queued' || displayRun.status === 'running');
  const handleCancel = async () => {
    if (!displayRun || cancelPending || isCancelling) return;
    setCancelPending(true);
    try {
      await personalBrandingService.cancelEventDiscoveryRun(displayRun.id);
      showToast({ type: 'success', title: 'Discovery cancellation requested' });
    } catch (error) {
      showToast({
        type: 'error',
        title: error instanceof Error ? error.message : 'Failed to cancel discovery',
      });
    } finally {
      setCancelPending(false);
    }
  };

  return (
    <SlideDrawer
      open={open}
      onClose={onClose}
      ariaLabel="Event discovery run details"
      maxWidth="lg"
      header={
        <div className="flex min-w-0 flex-1 flex-col gap-1 pr-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              Event discovery run
            </h2>
            {displayRun ? <StatusBadge status={displayRun.status} size="sm" /> : null}
          </div>
          {displayRun ? (
            <p className="truncate font-mono text-xs text-gray-500 dark:text-gray-400">
              {displayRun.id}
            </p>
          ) : null}
        </div>
      }
    >
      {detail.isLoading && !displayRun ? (
        <div className="flex min-h-[200px] items-center justify-center text-gray-500 dark:text-gray-400">
          <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />
          Loading run details…
        </div>
      ) : displayRun ? (
        <div className="space-y-6">
          {canCancel || isCancelling ? (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/60">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isCancelling
                  ? 'Cancellation requested. The worker is stopping safely.'
                  : 'This run is still active.'}
              </p>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => void handleCancel()}
                disabled={cancelPending || isCancelling}
                className="shrink-0 gap-1.5 text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
              >
                <Ban className="size-4" aria-hidden />
                {cancelPending || isCancelling ? 'Cancelling…' : 'Cancel'}
              </Button>
            </div>
          ) : null}

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Trigger</dt>
              <dd className="font-medium capitalize text-gray-900 dark:text-white">
                {displayRun.triggerKind}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Duration</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {formatDuration(
                  displayRun.startedAt ?? displayRun.createdAt,
                  displayRun.finishedAt
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Deadline</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {formatPersonalBrandingDateTime(displayRun.deadlineAt)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Started</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {formatPersonalBrandingDateTime(displayRun.startedAt ?? displayRun.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Finished</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {formatPersonalBrandingDateTime(displayRun.finishedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Phase</dt>
              <dd className="font-medium capitalize text-gray-900 dark:text-white">
                {formatPhase(displayRun.phase)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Last heartbeat</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {formatPersonalBrandingDateTime(displayRun.heartbeatAt)}
              </dd>
            </div>
          </dl>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              ['Queries generated', displayRun.queriesGenerated],
              ['Results fetched', displayRun.resultsFetched],
              ['Candidates extracted', displayRun.candidatesExtracted],
              ['Events created', displayRun.eventsCreated],
              ['Duplicates', displayRun.eventsDuplicate],
              ['Filtered', displayRun.eventsFiltered],
              ['Scoring failures', displayRun.scoringFailures ?? 0],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900/60">
                <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
                <dd className="mt-1 font-semibold tabular-nums text-gray-900 dark:text-white">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          {displayRun.inferenceSource ||
          displayRun.inferredInterests?.length ||
          displayRun.inferredEventTypes?.length ? (
            <section>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Inferred discovery inputs
              </h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {displayRun.inferenceSource === 'brandProfilePillars'
                  ? 'Derived from Brand Profile pillars for this run only.'
                  : 'No Brand Profile pillar inputs were available for this run.'}
              </p>
              {displayRun.inferredInterests?.length || displayRun.inferredEventTypes?.length ? (
                <div className="mt-2 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900/60">
                    <dt className="text-xs text-gray-500 dark:text-gray-400">Interests</dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">
                      {displayRun.inferredInterests?.join(', ') || '—'}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900/60">
                    <dt className="text-xs text-gray-500 dark:text-gray-400">Event types</dt>
                    <dd className="mt-1 text-gray-900 dark:text-white">
                      {displayRun.inferredEventTypes?.join(', ') || '—'}
                    </dd>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          <section>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Extracted events ({displayRun.extractedEvents?.length ?? 0})
            </h3>
            {displayRun.extractedEvents?.length ? (
              <ul className="mt-2 max-h-80 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
                {displayRun.extractedEvents.map((candidate, index) => (
                  <li
                    key={`${candidate.sourceUrl}-${candidate.title}-${index}`}
                    className="rounded-lg bg-gray-50 p-2.5 dark:bg-gray-900/60"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {candidate.title || 'Untitled event'}
                      </span>
                      <StatusBadge
                        status={
                          candidate.outcome === 'created'
                            ? 'completed'
                            : candidate.outcome === 'duplicate'
                              ? 'Duplicate'
                              : 'failed'
                        }
                        size="sm"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      {[
                        candidate.city,
                        candidate.startsAt?.slice(0, 10),
                        candidate.fitScore != null ? `Fit ${candidate.fitScore}` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'No event details'}
                      {candidate.reason ? ` · ${candidate.reason}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No extracted candidates were recorded for this run.
              </p>
            )}
          </section>

          {displayRun.errorSummary ? (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
            >
              {displayRun.errorSummary}
            </div>
          ) : null}

          <details className="rounded-lg border border-gray-200 dark:border-gray-700">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Generated queries ({displayRun.generatedQueries.length})
            </summary>
            {displayRun.generatedQueries.length > 0 ? (
              <ul className="max-h-64 space-y-2 overflow-y-auto border-t border-gray-200 px-3 py-3 text-sm dark:border-gray-700">
                {displayRun.generatedQueries.map((query, index) => (
                  <li
                    key={`${query}-${index}`}
                    className="rounded bg-gray-50 px-2 py-1.5 text-gray-700 dark:bg-gray-900/60 dark:text-gray-300"
                  >
                    {query}
                  </li>
                ))}
              </ul>
            ) : (
              <p
                className={`${pbMetaClassName} border-t border-gray-200 px-3 py-3 dark:border-gray-700`}
              >
                No queries were generated.
              </p>
            )}
          </details>

          <section>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Activity log</h3>
            {activityLog.length > 0 ? (
              <ol className="mt-2 max-h-80 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                {[...activityLog].reverse().map((entry, index) => (
                  <li
                    key={`${entry.at}-${index}`}
                    className="border-b border-gray-100 pb-2 last:border-0 dark:border-gray-800"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium capitalize">
                        {entry.phase ? formatPhase(entry.phase) : 'Update'}
                      </span>
                      <time dateTime={entry.at}>{formatPersonalBrandingDateTime(entry.at)}</time>
                    </div>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{entry.message}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No activity entries recorded for this run.
              </p>
            )}
          </section>
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">Run details unavailable.</p>
      )}
    </SlideDrawer>
  );
}
