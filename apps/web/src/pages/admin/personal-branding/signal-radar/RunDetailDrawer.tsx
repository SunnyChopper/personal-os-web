import { ArrowLeft, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { useState } from 'react';

import Button from '@/components/atoms/Button';
import SlideDrawer from '@/components/molecules/SlideDrawer';
import { useToast } from '@/hooks/use-toast';
import { usePromoteRadarItem, useSignalRadarRunOutcomes } from '@/hooks/useSignalRadar';
import { cn } from '@/lib/utils';
import { selectableChipClassName } from '@/pages/admin/personal-branding/personal-branding-ui';
import type {
  RadarRunDetail,
  RadarRunOutcome,
  RadarRunOutcomeDropReason,
} from '@/types/api/personal-branding.dto';

type OutcomeDropReasonFilter = 'all' | RadarRunOutcomeDropReason;

const DROP_REASON_FILTERS: { value: OutcomeDropReasonFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'aiFiltered', label: 'AI filtered' },
  { value: 'alreadyAdded', label: 'Already in Trend Stream' },
];

function formatDate(value?: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatScore(score?: number | null): string {
  if (score == null) return '—';
  return `${Math.round(score * 100)}%`;
}

function formatDropReason(reason: string): string {
  if (reason === 'aiFiltered') return 'AI filtered';
  if (reason === 'alreadyAdded') return 'Already in Trend Stream';
  return reason;
}

function recordedCountForFilter(run: RadarRunDetail, filter: OutcomeDropReasonFilter): number {
  if (filter === 'aiFiltered') return run.itemsFiltered;
  if (filter === 'alreadyAdded') return run.itemsAlreadyAdded;
  return run.itemsFiltered + run.itemsAlreadyAdded;
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

function MetricButton({
  label,
  value,
  onClick,
}: {
  label: string;
  value: number;
  onClick?: () => void;
}) {
  const interactive = value > 0 && onClick;
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900 dark:text-white">
        {interactive ? (
          <button
            type="button"
            onClick={onClick}
            className="rounded px-0.5 text-left underline decoration-dotted underline-offset-4 transition hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:text-indigo-300"
          >
            {value}
          </button>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function OutcomeRow({
  outcome,
  isPromoted,
  isPromoting,
  onPromote,
}: {
  outcome: RadarRunOutcome;
  isPromoted: boolean;
  isPromoting: boolean;
  onPromote?: () => void;
}) {
  const showPromote =
    outcome.disposition === 'filtered' && outcome.dropReason === 'aiFiltered' && outcome.itemId;

  return (
    <li className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-900/50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-gray-900 dark:text-white">
            {outcome.title || 'Untitled item'}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {outcome.sourceName || outcome.sourceId}
            {outcome.itemType ? ` · ${outcome.itemType}` : ''}
          </p>
        </div>
        {outcome.url ? (
          <a
            href={outcome.url}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-300"
            aria-label="Open item URL"
          >
            <ExternalLink className="size-4" aria-hidden />
          </a>
        ) : null}
      </div>
      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt className="text-gray-500">Drop reason</dt>
          <dd className="font-medium text-gray-900 dark:text-white">
            {formatDropReason(outcome.dropReason)}
          </dd>
        </div>
        {outcome.disposition === 'filtered' ? (
          <div>
            <dt className="text-gray-500">AI filter score</dt>
            <dd className="font-medium text-gray-900 dark:text-white">
              {formatScore(outcome.aiRelevanceScore)}
            </dd>
          </div>
        ) : null}
        <div className={outcome.disposition === 'filtered' ? 'sm:col-span-2' : undefined}>
          <dt className="text-gray-500">Pillar keyword match</dt>
          <dd
            className={
              outcome.disposition === 'filtered'
                ? 'text-gray-500 dark:text-gray-400'
                : 'font-medium text-gray-900 dark:text-white'
            }
          >
            {formatScore(outcome.relevanceScore)}
          </dd>
          {outcome.disposition === 'filtered' ? (
            <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
              Does not decide the drop
            </p>
          ) : null}
        </div>
        {outcome.disposition === 'filtered' && outcome.aiRationale ? (
          <div className="sm:col-span-2">
            <dt className="text-gray-500">AI rationale</dt>
            <dd className="mt-1 text-gray-800 dark:text-gray-200">{outcome.aiRationale}</dd>
          </div>
        ) : null}
      </dl>
      {showPromote ? (
        <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
          {isPromoted ? (
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
              Added to Trend Stream
            </p>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={isPromoting}
              onClick={onPromote}
              className="inline-flex items-center gap-2"
            >
              {isPromoting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              This should have been kept
            </Button>
          )}
        </div>
      ) : null}
    </li>
  );
}

function OutcomeListView({
  run,
  dropReasonFilter,
  onDropReasonFilterChange,
  onBack,
}: {
  run: RadarRunDetail;
  dropReasonFilter: OutcomeDropReasonFilter;
  onDropReasonFilterChange: (filter: OutcomeDropReasonFilter) => void;
  onBack: () => void;
}) {
  const { showToast } = useToast();
  const promoteItem = usePromoteRadarItem();
  const [promotedItemIds, setPromotedItemIds] = useState<Set<string>>(() => new Set());
  const { outcomes } = useSignalRadarRunOutcomes(run.id, {
    dropReason: dropReasonFilter === 'all' ? null : dropReasonFilter,
  });
  const recordedCount = recordedCountForFilter(run, dropReasonFilter);
  const matchingCount = outcomes.data?.total ?? 0;

  const handlePromote = async (itemId: string) => {
    try {
      await promoteItem.mutateAsync(itemId);
      setPromotedItemIds((current) => new Set(current).add(itemId));
      showToast({
        type: 'success',
        title: 'Added to Trend Stream',
        message: 'This item will appear in your default stream and help train relevance.',
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Could not add item',
        message: error instanceof Error ? error.message : 'Promotion failed',
      });
    }
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to run summary
      </button>

      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Dropped items</h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {matchingCount} matching
          {dropReasonFilter !== 'all' ? ` · ${recordedCount} recorded for this run` : ''}
          {run.outcomesTruncated ? ' · showing the first 200 outcomes only' : ''}
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by drop reason">
        {DROP_REASON_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => onDropReasonFilterChange(filter.value)}
            className={selectableChipClassName(
              dropReasonFilter === filter.value,
              'px-2.5 py-1 text-xs'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {run.outcomesTruncated ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          This run dropped more items than we store for inspection. Counts remain accurate, but the
          list is capped at 200 rows.
        </p>
      ) : null}

      {outcomes.isLoading ? (
        <div className="flex min-h-[120px] items-center justify-center text-gray-500">
          <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />
          Loading dropped items…
        </div>
      ) : outcomes.isError ? (
        <p className="text-sm text-red-600 dark:text-red-300">Could not load dropped items.</p>
      ) : (outcomes.data?.data.length ?? 0) > 0 ? (
        <ul className="space-y-2">
          {outcomes.data?.data.map((outcome) => (
            <OutcomeRow
              key={outcome.id}
              outcome={outcome}
              isPromoted={Boolean(outcome.itemId && promotedItemIds.has(outcome.itemId))}
              isPromoting={promoteItem.isPending && promoteItem.variables === outcome.itemId}
              onPromote={
                outcome.itemId
                  ? () => {
                      void handlePromote(outcome.itemId!);
                    }
                  : undefined
              }
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {recordedCount > 0
            ? 'Outcome details were not recorded for this run.'
            : 'No dropped items for this filter.'}
        </p>
      )}
    </div>
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
  const [dropReasonFilter, setDropReasonFilter] = useState<OutcomeDropReasonFilter | null>(null);
  const sourceResults = run?.sourceResults ?? [];

  const handleClose = () => {
    setDropReasonFilter(null);
    onClose();
  };

  return (
    <SlideDrawer
      open={open}
      onClose={handleClose}
      ariaLabel="Ingest run details"
      header={
        <div className="flex min-w-0 flex-1 items-center gap-2 pr-2">
          <h2 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
            {dropReasonFilter ? 'Dropped items' : 'Ingest run'}
          </h2>
          {run && !dropReasonFilter ? <RunStatusBadge status={run.status} /> : null}
        </div>
      }
    >
      {isLoading && !run ? (
        <div className="flex min-h-[200px] items-center justify-center text-gray-500">
          <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />
          Loading run details…
        </div>
      ) : run && dropReasonFilter ? (
        <OutcomeListView
          run={run}
          dropReasonFilter={dropReasonFilter}
          onDropReasonFilterChange={setDropReasonFilter}
          onBack={() => setDropReasonFilter(null)}
        />
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
            <MetricButton
              label="Already added"
              value={run.itemsAlreadyAdded}
              onClick={() => setDropReasonFilter('alreadyAdded')}
            />
            <div>
              <dt className="text-gray-500">Created</dt>
              <dd className="font-medium text-gray-900 dark:text-white">{run.itemsCreated}</dd>
            </div>
            <MetricButton
              label="Filtered"
              value={run.itemsFiltered}
              onClick={() => setDropReasonFilter('aiFiltered')}
            />
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
                          {source.itemsDiscovered} discovered · {source.itemsAlreadyAdded} already
                          added · {source.itemsCreated} created · {source.itemsFiltered} filtered
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
