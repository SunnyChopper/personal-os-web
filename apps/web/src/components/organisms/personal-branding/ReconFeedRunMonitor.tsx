import { Ban, CirclePause, Loader2, Play } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/atoms/Card';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import EngagementRationale from '@/components/molecules/personal-branding/EngagementRationale';
import type { ReconRunSummary } from '@/types/api/personal-branding.dto';

interface ReconFeedRunMonitorProps {
  run?: ReconRunSummary;
  isLoading?: boolean;
  pendingAction?: 'pause' | 'resume' | 'cancel' | null;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
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

export default function ReconFeedRunMonitor({
  run,
  isLoading = false,
  pendingAction = null,
  onPause,
  onResume,
  onCancel,
}: ReconFeedRunMonitorProps) {
  if (isLoading && !run) {
    return (
      <Card>
        <CardBody className="flex min-h-40 items-center justify-center text-gray-500 dark:text-gray-400">
          <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />
          Loading recon run…
        </CardBody>
      </Card>
    );
  }
  if (!run) return null;

  const isTransitioning = run.status === 'pausing' || run.status === 'cancelling';
  const canCancel = ['queued', 'running', 'paused', 'pausing'].includes(run.status);
  const activityLog = run.activityLog ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Recon run monitor</CardTitle>
            <StatusBadge status={run.status} size="sm" />
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {run.status === 'queued'
              ? 'The request was accepted. Waiting for the background worker.'
              : run.currentActivity || run.phase || 'Waiting for the next status update.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {run.status === 'running' ? (
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
          {run.status === 'paused' ? (
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
          {canCancel ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onCancel}
              disabled={Boolean(pendingAction) || run.status === 'cancelling'}
              className="gap-1.5 text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
            >
              <Ban className="size-4" aria-hidden />
              {pendingAction === 'cancel' || run.status === 'cancelling' ? 'Cancelling…' : 'Cancel'}
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardBody className="space-y-5">
        {isTransitioning ? (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {run.currentActivity || `Recon ingest is ${run.status}.`}
          </div>
        ) : null}

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

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Posts discovered', run.postsDiscovered],
            ['Posts scored', run.postsScored],
            ['API calls', run.apiCallsUsed],
            ['Phase', run.phase || '—'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900/60">
              <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
              <dd className="mt-1 font-semibold text-gray-900 dark:text-white">{value}</dd>
            </div>
          ))}
        </dl>

        {activityLog.length > 0 ? (
          <div>
            <h4 className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
              Live activity
            </h4>
            <ul className="mt-2 max-h-56 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700">
              {[...activityLog].reverse().map((entry, index) => (
                <li
                  key={`${entry.at}-${index}`}
                  className="border-b border-gray-100 pb-2 last:border-0 dark:border-gray-800"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span>{entry.kind}</span>
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
                      leadClassName="text-gray-700 dark:text-gray-300"
                      bulletClassName="text-gray-600 dark:text-gray-400"
                    />
                  ) : entry.message ? (
                    <p className="mt-1 text-gray-700 dark:text-gray-300">{entry.message}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {run.errorSummary ? (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
          >
            {run.errorSummary}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
