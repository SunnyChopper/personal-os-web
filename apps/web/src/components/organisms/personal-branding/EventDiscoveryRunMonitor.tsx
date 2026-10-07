import { Ban, Loader2 } from 'lucide-react';

import Button from '@/components/atoms/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/atoms/Card';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import type {
  EventDiscoveryRun,
  EventDiscoveryRunCandidate,
} from '@/types/api/personal-branding.dto';

const REASON_LABELS: Record<string, string> = {
  excludedKeyword: 'Excluded keyword',
  noStintMatch: 'No location stint match',
  belowFitScore: 'Below minimum fit score',
  outsideLookahead: 'Outside lookahead window',
  missingTitle: 'Missing event title',
};

function formatPhase(phase: string): string {
  return phase.replaceAll('_', ' ');
}

function outcomeStatus(outcome: EventDiscoveryRunCandidate['outcome']): string {
  if (outcome === 'created') return 'completed';
  if (outcome === 'duplicate') return 'Duplicate';
  return 'failed';
}

function CandidateRow({ candidate }: { candidate: EventDiscoveryRunCandidate }) {
  const location = candidate.city || 'Location TBD';
  const date = candidate.startsAt?.slice(0, 10) || 'Date TBD';

  return (
    <li
      className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/60"
      data-testid="event-discovery-candidate"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-gray-900 dark:text-white">
            {candidate.title || 'Untitled event'}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {location} · {date}
            {candidate.eventType ? ` · ${candidate.eventType}` : ''}
          </p>
        </div>
        <StatusBadge status={outcomeStatus(candidate.outcome)} size="sm" />
      </div>
      <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
        {candidate.fitScore != null ? `Fit ${candidate.fitScore}` : 'No fit score'}
        {candidate.reason ? ` · ${REASON_LABELS[candidate.reason] ?? candidate.reason}` : ''}
      </p>
      {candidate.sourceUrl ? (
        <a
          className="mt-1 block truncate text-xs text-blue-700 hover:underline dark:text-blue-300"
          href={candidate.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          {candidate.sourceUrl}
        </a>
      ) : null}
    </li>
  );
}

export interface EventDiscoveryRunMonitorProps {
  run?: EventDiscoveryRun | null;
  cancelPending?: boolean;
  onCancel: () => void;
}

export default function EventDiscoveryRunMonitor({
  run,
  cancelPending = false,
  onCancel,
}: EventDiscoveryRunMonitorProps) {
  if (!run) return null;

  const canCancel = run.status === 'queued' || run.status === 'running';
  const isCancelling = run.status === 'cancelling';
  const latestActivity = run.activityLog.at(-1)?.message;

  return (
    <Card data-testid="event-discovery-run-monitor">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Discovery monitor</CardTitle>
            <StatusBadge status={run.status} size="sm" />
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {latestActivity || `Discovery is ${formatPhase(run.phase)}.`}
          </p>
        </div>
        {canCancel || isCancelling ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onCancel}
            disabled={cancelPending || isCancelling}
            aria-label="Cancel event discovery run"
            className="gap-1.5 text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
          >
            <Ban className="size-4" aria-hidden />
            {cancelPending || isCancelling ? 'Cancelling…' : 'Cancel'}
          </Button>
        ) : null}
      </CardHeader>
      <CardBody className="space-y-4">
        {isCancelling ? (
          <div
            className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
            role="status"
          >
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Stopping discovery at the next safe boundary…
          </div>
        ) : null}

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ['Phase', formatPhase(run.phase)],
            ['Queries', run.queriesGenerated],
            ['Results', run.resultsFetched],
            ['Extracted', run.candidatesExtracted],
            ['Kept', run.eventsCreated],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900/60">
              <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
              <dd className="mt-1 font-semibold tabular-nums text-gray-900 dark:text-white">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <details open className="rounded-lg border border-gray-200 dark:border-gray-700">
          <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Generated queries ({run.generatedQueries.length})
          </summary>
          <div className="border-t border-gray-200 px-3 py-3 dark:border-gray-700">
            {run.generatedQueries.length > 0 ? (
              <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                {run.generatedQueries.map((query, index) => (
                  <li
                    key={`${query}-${index}`}
                    className="rounded bg-gray-50 px-2 py-1.5 dark:bg-gray-900/60"
                  >
                    {query}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Waiting for generated queries.
              </p>
            )}
          </div>
        </details>

        <details open className="rounded-lg border border-gray-200 dark:border-gray-700">
          <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Extracted events ({run.extractedEvents?.length ?? 0})
          </summary>
          <div className="border-t border-gray-200 px-3 py-3 dark:border-gray-700">
            {run.extractedEvents?.length ? (
              <ul className="max-h-80 space-y-2 overflow-y-auto">
                {run.extractedEvents.map((candidate, index) => (
                  <CandidateRow
                    key={`${candidate.sourceUrl}-${candidate.title}-${index}`}
                    candidate={candidate}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Extracted candidates will appear here as pages are scored.
              </p>
            )}
          </div>
        </details>
      </CardBody>
    </Card>
  );
}
