import { Ban, CirclePause, Loader2, Play, RefreshCw } from 'lucide-react';

import Button from '@/components/atoms/Button';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import SlideDrawer from '@/components/molecules/SlideDrawer';
import EngagementRationale from '@/components/molecules/personal-branding/EngagementRationale';
import { cn } from '@/lib/utils';
import type { ReconRunActivityEntry, ReconRunSummary } from '@/types/api/personal-branding.dto';

function formatDate(value?: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatDuration(startedAt?: string | null, finishedAt?: string | null): string {
  if (!startedAt) return '—';
  const start = new Date(startedAt).getTime();
  const end = finishedAt ? new Date(finishedAt).getTime() : Date.now();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return '—';
  const seconds = Math.round((end - start) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return rem > 0 ? `${minutes}m ${rem}s` : `${minutes}m`;
}

function ProgressLine({
  label,
  completed,
  total,
}: {
  label: string;
  completed: number;
  total: number;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
        <span>{label}</span>
        <span>
          {completed} / {total}
        </span>
      </div>
      <progress
        className="h-2 w-full overflow-hidden rounded-full accent-blue-600"
        value={Math.min(completed, total)}
        max={Math.max(total, 1)}
      />
    </div>
  );
}

function ActivityEntry({ entry }: { entry: ReconRunActivityEntry }) {
  return (
    <li className="border-b border-gray-100 pb-2 last:border-0 dark:border-gray-800">
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="font-mono">{entry.kind}</span>
        <span>{formatDate(entry.at)}</span>
        {entry.handle ? <span>@{entry.handle}</span> : null}
        {entry.score !== null && entry.score !== undefined ? (
          <span>{(entry.score * 100).toFixed(0)}%</span>
        ) : null}
      </div>
      {entry.rationale || entry.rationaleBullets?.length ? (
        <EngagementRationale
          lead={entry.rationale}
          bullets={entry.rationaleBullets}
          className="mt-1"
          leadClassName="text-sm text-gray-700 dark:text-gray-300"
          bulletClassName="text-sm text-gray-600 dark:text-gray-400"
        />
      ) : entry.message ? (
        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{entry.message}</p>
      ) : null}
    </li>
  );
}

export interface ReconRunDetailDrawerProps {
  open: boolean;
  run: ReconRunSummary | null | undefined;
  isLoading?: boolean;
  isStartingRun?: boolean;
  pendingAction?: 'pause' | 'resume' | 'cancel' | null;
  onClose: () => void;
  onStartRun?: () => void | Promise<void>;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
}

export default function ReconRunDetailDrawer({
  open,
  run,
  isLoading = false,
  isStartingRun = false,
  pendingAction = null,
  onClose,
  onStartRun,
  onPause,
  onResume,
  onCancel,
}: ReconRunDetailDrawerProps) {
  const activityLog = run?.activityLog ?? [];
  const isActive =
    run && ['queued', 'running', 'pausing', 'paused', 'cancelling'].includes(run.status);
  const canCancel = run && ['queued', 'running', 'paused', 'pausing'].includes(run.status);
  const showStartNew =
    run && ['failed', 'cancelled', 'completed'].includes(run.status) && onStartRun;

  return (
    <SlideDrawer
      open={open}
      onClose={onClose}
      ariaLabel="Recon run details"
      maxWidth="lg"
      header={
        <div className="flex min-w-0 flex-1 flex-col gap-1 pr-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              Recon run
            </h2>
            {run ? <StatusBadge status={run.status} size="sm" /> : null}
          </div>
          {run ? (
            <p className="truncate font-mono text-xs text-gray-500 dark:text-gray-400">{run.id}</p>
          ) : null}
        </div>
      }
    >
      {isLoading && !run ? (
        <div className="flex min-h-[200px] items-center justify-center text-gray-500">
          <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />
          Loading run details…
        </div>
      ) : run ? (
        <div className="space-y-6">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Trigger</dt>
              <dd className="font-medium capitalize text-gray-900 dark:text-white">
                {run.trigger}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Duration</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {formatDuration(run.startedAt ?? run.createdAt, run.finishedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Started</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {formatDate(run.startedAt ?? run.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Finished</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {formatDate(run.finishedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Phase</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{run.phase || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Last activity</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {run.currentActivity || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Heartbeat</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {formatDate(run.heartbeatAt)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Paused</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {formatDate(run.pausedAt)}
              </dd>
            </div>
          </dl>

          <div className="grid gap-4 sm:grid-cols-2">
            <ProgressLine
              label="Connections"
              completed={run.connectionsSucceeded + run.connectionsFailed}
              total={run.connectionsTotal}
            />
            <ProgressLine
              label="Posts scored"
              completed={run.postsScored}
              total={run.postsDiscovered}
            />
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              ['Connections OK', run.connectionsSucceeded],
              ['Connections failed', run.connectionsFailed],
              ['Posts discovered', run.postsDiscovered],
              ['Posts scored', run.postsScored],
              ['Suggestions', run.followSuggestionsCreated],
              ['API calls', run.apiCallsUsed],
              ['Resume cursor', run.cursorConnectionIndex ?? 0],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900/60">
                <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
                <dd className="mt-1 font-semibold text-gray-900 dark:text-white">{value}</dd>
              </div>
            ))}
          </dl>

          <section className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Content digest</h3>
            {run.emailSentAt ? (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Sent {formatDate(run.emailSentAt)}
                {run.emailDigestItemCount != null
                  ? ` · ${run.emailDigestItemCount} item${run.emailDigestItemCount === 1 ? '' : 's'}`
                  : ''}
              </p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Not sent for this run.</p>
            )}
          </section>

          {run.errorSummary ? (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
            >
              {run.errorSummary}
            </div>
          ) : null}

          {activityLog.length > 0 ? (
            <section>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Activity log</h3>
              <ul
                className={cn(
                  'mt-2 max-h-80 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700'
                )}
              >
                {[...activityLog].reverse().map((entry, index) => (
                  <ActivityEntry key={`${entry.at}-${entry.kind}-${index}`} entry={entry} />
                ))}
              </ul>
            </section>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No activity entries recorded for this run.
            </p>
          )}

          <div className="flex flex-wrap gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            {isActive && run.status === 'running' && onPause ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={onPause}
                disabled={Boolean(pendingAction)}
                className="gap-1.5"
              >
                <CirclePause className="size-4" aria-hidden />
                {pendingAction === 'pause' ? 'Pausing…' : 'Pause'}
              </Button>
            ) : null}
            {isActive && run.status === 'paused' && onResume ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={onResume}
                disabled={Boolean(pendingAction)}
                className="gap-1.5"
              >
                <Play className="size-4" aria-hidden />
                {pendingAction === 'resume' ? 'Continuing…' : 'Continue'}
              </Button>
            ) : null}
            {isActive && canCancel && onCancel ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onCancel}
                disabled={Boolean(pendingAction) || run.status === 'cancelling'}
                className="gap-1.5 text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
              >
                <Ban className="size-4" aria-hidden />
                {pendingAction === 'cancel' || run.status === 'cancelling'
                  ? 'Cancelling…'
                  : 'Cancel'}
              </Button>
            ) : null}
            {showStartNew ? (
              <Button
                type="button"
                size="sm"
                onClick={() => void onStartRun()}
                disabled={isStartingRun}
                className="inline-flex items-center gap-2"
              >
                {isStartingRun ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="size-4" aria-hidden />
                )}
                Start new run
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">Run details unavailable.</p>
      )}
    </SlideDrawer>
  );
}
