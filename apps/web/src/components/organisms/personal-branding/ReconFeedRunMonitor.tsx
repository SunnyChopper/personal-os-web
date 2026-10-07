import { useCallback, useEffect, useId, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Ban, ChevronDown, CirclePause, Loader2, Play, X } from 'lucide-react';
import Button from '@/components/atoms/Button';
import LinearProgressBar from '@/components/atoms/LinearProgressBar';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import EngagementRationale from '@/components/molecules/personal-branding/EngagementRationale';
import {
  linkAccentClassName,
  pbQuietControlClassName,
} from '@/pages/admin/personal-branding/personal-branding-ui';
import { cn } from '@/lib/utils';
import type { ReconRunSummary } from '@/types/api/personal-branding.dto';

interface ReconFeedRunMonitorProps {
  run?: ReconRunSummary;
  isLoading?: boolean;
  pendingAction?: 'pause' | 'resume' | 'cancel' | null;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

function connectionProgressPercent(run: ReconRunSummary): number {
  const total = run.connectionsTotal;
  if (total <= 0) return 0;
  const completed = run.connectionsSucceeded + run.connectionsFailed;
  return Math.min(100, Math.round((completed / total) * 100));
}

function statusLine(run: ReconRunSummary): string {
  if (run.status === 'queued') {
    return 'Waiting for the background worker.';
  }
  return run.currentActivity || run.phase || 'Waiting for the next status update.';
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
      <LinearProgressBar
        value={Math.min(completed, total)}
        max={Math.max(total, 1)}
        label={label}
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
  const shouldReduceMotion = useReducedMotion();
  const panelId = useId();
  const [stickyExpanded, setStickyExpanded] = useState(false);
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const [dismissedRunId, setDismissedRunId] = useState<string | null>(null);

  const runId = run?.id;

  useEffect(() => {
    setStickyExpanded(false);
    setHoverExpanded(false);
    setDismissedRunId(null);
  }, [runId]);

  const isExpanded = stickyExpanded || hoverExpanded;
  const isDismissed = runId != null && dismissedRunId === runId;

  const handlePointerEnter = useCallback(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches
    ) {
      setHoverExpanded(true);
    }
  }, []);

  const handlePointerLeave = useCallback(() => {
    setHoverExpanded(false);
  }, []);

  const toggleStickyExpanded = useCallback(() => {
    setStickyExpanded((prev) => !prev);
  }, []);

  if (isLoading && !run) {
    return (
      <div
        className="min-w-0 rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800/40"
        role="status"
        aria-busy="true"
        aria-label="Loading recon run"
      >
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
          Loading recon run…
        </div>
        <LinearProgressBar value={0} max={100} label="Recon run progress" className="mt-2.5" />
      </div>
    );
  }

  if (!run) return null;

  if (isDismissed) {
    return (
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setDismissedRunId(null)}
          className={cn('text-sm', linkAccentClassName)}
        >
          Show run progress
        </button>
      </div>
    );
  }

  const isTransitioning = run.status === 'pausing' || run.status === 'cancelling';
  const canCancel = ['queued', 'running', 'paused', 'pausing'].includes(run.status);
  const activityLog = run.activityLog ?? [];
  const progressPercent = connectionProgressPercent(run);

  return (
    <div
      className={cn(
        'min-w-0 rounded-lg border border-gray-200 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-800/40',
        isTransitioning && 'border-amber-200/80 dark:border-amber-900/50'
      )}
      role="region"
      aria-label="Recon run progress"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <div className="px-3 py-2.5">
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={toggleStickyExpanded}
            className={cn(
              'mt-0.5 shrink-0 p-0.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
              pbQuietControlClassName
            )}
            aria-expanded={isExpanded}
            aria-controls={panelId}
            aria-label={isExpanded ? 'Collapse run details' : 'Expand run details'}
          >
            <ChevronDown
              className={cn('size-4 transition-transform', isExpanded && 'rotate-180')}
              aria-hidden
            />
          </button>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <StatusBadge status={run.status} size="sm" />
              <p className="min-w-0 truncate text-sm font-medium text-gray-900 dark:text-white">
                {statusLine(run)}
              </p>
              <span className="shrink-0 text-xs tabular-nums text-gray-500 dark:text-gray-400">
                {progressPercent}%
              </span>
            </div>
            <LinearProgressBar
              value={progressPercent}
              max={100}
              label="Recon connection progress"
              disableTransition={shouldReduceMotion ?? false}
            />
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {run.status === 'running' ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={onPause}
                disabled={Boolean(pendingAction)}
                className="gap-1.5"
                aria-label={pendingAction === 'pause' ? 'Pausing' : 'Pause'}
              >
                <CirclePause className="size-4" aria-hidden />
                <span className="hidden sm:inline">
                  {pendingAction === 'pause' ? 'Pausing…' : 'Pause'}
                </span>
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
                aria-label={pendingAction === 'resume' ? 'Continuing' : 'Continue'}
              >
                <Play className="size-4" aria-hidden />
                <span className="hidden sm:inline">
                  {pendingAction === 'resume' ? 'Continuing…' : 'Continue'}
                </span>
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
                aria-label={
                  pendingAction === 'cancel' || run.status === 'cancelling'
                    ? 'Cancelling'
                    : 'Cancel'
                }
              >
                <Ban className="size-4" aria-hidden />
                <span className="hidden sm:inline">
                  {pendingAction === 'cancel' || run.status === 'cancelling'
                    ? 'Cancelling…'
                    : 'Cancel'}
                </span>
              </Button>
            ) : null}
            <button
              type="button"
              onClick={() => setDismissedRunId(run.id)}
              className={cn(
                'p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                pbQuietControlClassName
              )}
              aria-label="Hide run progress"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded ? (
          <motion.div
            id={panelId}
            role="region"
            aria-label="Recon run details"
            initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={
              shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
            }
            className="overflow-hidden"
          >
            <div className="space-y-5 border-t border-gray-200 px-3 pb-3 pt-3 dark:border-gray-700">
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
                  <div key={label} className="rounded-lg bg-white/60 p-3 dark:bg-gray-900/60">
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
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
