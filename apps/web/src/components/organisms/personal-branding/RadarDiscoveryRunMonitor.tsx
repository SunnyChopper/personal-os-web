import { Ban, CirclePause, Loader2, Play } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/atoms/Card';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { radarDiscoveryDisplayCounts } from '@/lib/personal-branding/radar-discovery';
import type { RadarDiscoveryRun } from '@/types/api/personal-branding.dto';

interface RadarDiscoveryRunMonitorProps {
  run?: RadarDiscoveryRun;
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

export default function RadarDiscoveryRunMonitor({
  run,
  isLoading = false,
  pendingAction = null,
  onPause,
  onResume,
  onCancel,
}: RadarDiscoveryRunMonitorProps) {
  if (isLoading && !run) {
    return (
      <Card>
        <CardBody className="flex min-h-40 items-center justify-center text-gray-500 dark:text-gray-400">
          <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />
          Loading discovery run…
        </CardBody>
      </Card>
    );
  }
  if (!run) return null;

  const isTransitioning = run.status === 'pausing' || run.status === 'cancelling';
  const canCancel = ['queued', 'running', 'paused', 'pausing'].includes(run.status);
  const counts = radarDiscoveryDisplayCounts(run.progress);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Discovery monitor</CardTitle>
            <StatusBadge status={run.status} size="sm" />
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {run.status === 'queued'
              ? 'The request was accepted. The background discovery job has not completed yet.'
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
            {run.currentActivity || `Discovery is ${run.status}.`}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <ProgressLine
            label="Queries"
            completed={counts.queriesCompleted}
            total={counts.queriesTotal}
          />
          <ProgressLine
            label="Candidates evaluated"
            completed={counts.candidatesEvaluated}
            total={counts.candidatesTotal}
          />
        </div>

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            ['Candidates', counts.candidatesTotal],
            ['Relevant', counts.relevantCount],
            ['Not relevant', counts.irrelevantCount],
            ['Errors', counts.errorCount],
            ['Phase', run.phase || '—'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900/60">
              <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
              <dd className="mt-1 font-semibold text-gray-900 dark:text-white">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <h4 className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
              Grounded profiles
            </h4>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">
              {run.profileNames.length > 0 ? run.profileNames.join(', ') : 'No profile names'}
            </p>
          </div>
          <div>
            <h4 className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
              Effective topics
            </h4>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {run.effectiveTopics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-950/50 dark:text-blue-200"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>

        {run.error ? (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
          >
            {run.error}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
