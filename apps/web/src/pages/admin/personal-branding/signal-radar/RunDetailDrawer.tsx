import { Loader2, RefreshCw } from 'lucide-react';

import Button from '@/components/atoms/Button';
import SlideDrawer from '@/components/molecules/SlideDrawer';
import { cn } from '@/lib/utils';
import type { RadarRunDetail } from '@/types/api/personal-branding.dto';

function formatDate(value?: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function RunStatusBadge({ status }: { status: string }) {
  const tone =
    status === 'completed'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
      : status === 'failed'
        ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
        : status === 'running' || status === 'queued'
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize', tone)}>
      {status}
    </span>
  );
}

function SourceStatusBadge({ status }: { status: 'succeeded' | 'failed' }) {
  const tone =
    status === 'succeeded'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
      : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200';
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize', tone)}>
      {status}
    </span>
  );
}

export interface RunDetailDrawerProps {
  open: boolean;
  run: RadarRunDetail | null | undefined;
  isLoading?: boolean;
  isRerunning?: boolean;
  onClose: () => void;
  onRerun: () => void | Promise<void>;
}

export default function RunDetailDrawer({
  open,
  run,
  isLoading = false,
  isRerunning = false,
  onClose,
  onRerun,
}: RunDetailDrawerProps) {
  const sourceResults = run?.sourceResults ?? [];

  return (
    <SlideDrawer
      open={open}
      onClose={onClose}
      ariaLabel="Ingest run details"
      header={
        <div className="flex min-w-0 flex-1 items-center gap-2 pr-2">
          <h2 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
            Ingest run
          </h2>
          {run ? <RunStatusBadge status={run.status} /> : null}
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
              <dt className="text-gray-500">Trigger</dt>
              <dd className="font-medium capitalize text-gray-900 dark:text-white">
                {run.trigger}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Started</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {formatDate(run.startedAt ?? run.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Finished</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {formatDate(run.finishedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Sources</dt>
              <dd className="font-medium text-gray-900 dark:text-white">
                {run.sourcesTotal > 0
                  ? `${Math.round((run.sourcesSucceeded / run.sourcesTotal) * 100)}% succeeded`
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Discovered</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{run.itemsDiscovered}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Created</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{run.itemsCreated}</dd>
            </div>
          </dl>

          <section className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Sources</h3>
            {sourceResults.length > 0 ? (
              <ul className="space-y-2">
                {sourceResults.map((source) => (
                  <li
                    key={source.sourceId}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-900/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {source.sourceName || source.sourceId}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {source.itemsDiscovered} discovered · {source.itemsCreated} created
                        </p>
                      </div>
                      <SourceStatusBadge status={source.status} />
                    </div>
                    {source.error ? (
                      <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                        {source.error}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : run.errorSummary ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                {run.errorSummary}
              </p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No per-source breakdown available for this run.
              </p>
            )}
          </section>

          {run.status === 'failed' ? (
            <Button
              type="button"
              size="sm"
              onClick={() => void onRerun()}
              disabled={isRerunning}
              className="inline-flex items-center gap-2"
            >
              {isRerunning ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="size-4" aria-hidden />
              )}
              Re-run
            </Button>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">Run details unavailable.</p>
      )}
    </SlideDrawer>
  );
}
