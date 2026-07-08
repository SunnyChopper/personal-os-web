import { useState } from 'react';
import { ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { FormCheckbox } from '@/components/atoms/FormCheckbox';
import Button from '@/components/atoms/Button';
import { cn } from '@/lib/utils';
import { linkAccentClassName } from '../personal-branding-ui';
import { useToast } from '@/hooks/use-toast';
import {
  useSignalRadarItems,
  useSignalRadarRunDetail,
  useSignalRadarRuns,
} from '@/hooks/useSignalRadar';
import { RADAR_ITEM_TYPE_LABELS, type RadarItem } from '@/types/api/personal-branding.dto';
import RunDetailDrawer from './RunDetailDrawer';
import {
  PageCard,
  emptyStateCardClassName,
  gridItemCardClassName,
} from '../PersonalBrandingPageTemplate';

function formatDate(value?: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function capitalizeLabel(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatSourcesSuccessPercent(succeeded: number, total: number): string {
  if (total <= 0) return '—';
  return `${Math.round((succeeded / total) * 100)}%`;
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

function RadarItemCard({ item }: { item: RadarItem }) {
  const link = item.url ?? item.repositoryUrl;
  return (
    <article className={cn(gridItemCardClassName, 'flex flex-col')}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
        <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
          {RADAR_ITEM_TYPE_LABELS[item.itemType]}
        </span>
      </div>
      {item.summary ? (
        <p className="mt-2 flex-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-4">
          {item.summary}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
        {item.sourceName ? <span>{item.sourceName}</span> : null}
        {item.publishedAt ? <span>{formatDate(item.publishedAt)}</span> : null}
        <span>{(item.relevanceScore * 100).toFixed(0)}% relevance</span>
        {typeof item.aiRelevanceScore === 'number' ? (
          <span
            className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200"
            title={item.aiRationale ?? undefined}
          >
            AI {(item.aiRelevanceScore * 100).toFixed(0)}%
          </span>
        ) : null}
      </div>
      {item.matchedPillars.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {item.matchedPillars.map((pillar) => (
            <span key={pillar} className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800">
              {pillar}
            </span>
          ))}
        </div>
      ) : null}
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className={cn(
            'mt-4 inline-flex items-center gap-1 text-sm font-medium',
            linkAccentClassName
          )}
        >
          Open
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      ) : null}
    </article>
  );
}

export default function TrendStreamTab() {
  const { showToast, ToastContainer } = useToast();
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [itemPage] = useState(1);
  const [includeFiltered, setIncludeFiltered] = useState(false);

  const { runs, startSync } = useSignalRadarRuns({ page: 1, pageSize: 10 });
  const { items } = useSignalRadarItems({
    page: itemPage,
    pageSize: 50,
    includeFiltered,
  });

  const runRows = runs.data?.data ?? [];

  const activeDetail = useSignalRadarRunDetail(selectedRunId);
  const runDetail = activeDetail.detail.data;
  const streamItems = items.data?.data ?? [];

  const handleSyncNow = async () => {
    try {
      const res = await startSync.mutateAsync();
      setSelectedRunId(res.runId);
      showToast({ type: 'success', title: 'Sync started' });
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Sync failed to start',
      });
    }
  };

  const handleRerun = async () => {
    try {
      await startSync.mutateAsync();
      setSelectedRunId(null);
      showToast({ type: 'success', title: 'Sync started' });
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Sync failed to start',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Trend Stream</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Inbound macro-topics from your radar sources.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <FormCheckbox
              checked={includeFiltered}
              onChange={(e) => setIncludeFiltered(e.target.checked)}
            />
            Show AI-filtered noise
          </label>
          <Button
            type="button"
            size="sm"
            onClick={() => void handleSyncNow()}
            disabled={startSync.isPending}
            className="inline-flex items-center gap-2"
          >
            {startSync.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="size-4" aria-hidden />
            )}
            Sync now
          </Button>
        </div>
      </div>

      {startSync.error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
        >
          {startSync.error instanceof Error ? startSync.error.message : String(startSync.error)}
        </div>
      ) : null}

      <PageCard className="space-y-3 p-0">
        <h3 className="px-6 pt-6 text-sm font-medium text-gray-700 dark:text-gray-300">
          Recent ingest runs
        </h3>
        <div className="overflow-x-auto border-t border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-900/60">
              <tr>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Trigger</th>
                <th className="px-3 py-2">Sources</th>
                <th className="px-3 py-2">Items</th>
                <th className="px-3 py-2">Started</th>
              </tr>
            </thead>
            <tbody>
              {runs.isLoading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                    Loading runs…
                  </td>
                </tr>
              ) : runRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                    No ingest runs yet. Use Sync now to pull from enabled sources.
                  </td>
                </tr>
              ) : (
                runRows.map((run) => (
                  <tr
                    key={run.id}
                    className={`cursor-pointer border-t border-gray-100 hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-gray-900/30 ${
                      selectedRunId === run.id ? 'bg-blue-50/60 dark:bg-blue-950/20' : ''
                    }`}
                    onClick={() => setSelectedRunId(run.id)}
                  >
                    <td className="px-3 py-2">
                      <RunStatusBadge status={run.status} />
                    </td>
                    <td className="px-3 py-2 capitalize">{capitalizeLabel(run.trigger)}</td>
                    <td className="px-3 py-2">
                      {formatSourcesSuccessPercent(run.sourcesSucceeded, run.sourcesTotal)}
                    </td>
                    <td className="px-3 py-2">{run.itemsCreated}</td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {formatDate(run.startedAt ?? run.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </PageCard>

      <RunDetailDrawer
        open={Boolean(selectedRunId)}
        run={runDetail}
        isLoading={activeDetail.detail.isLoading}
        isRerunning={startSync.isPending}
        onClose={() => setSelectedRunId(null)}
        onRerun={handleRerun}
      />

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Stream cards</h3>
        {items.isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center text-gray-500">
            <Loader2 className="mr-2 size-5 animate-spin" />
            Loading items…
          </div>
        ) : streamItems.length === 0 ? (
          <PageCard className={cn(emptyStateCardClassName, 'p-10')}>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">No items yet</h4>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Configure sources and run a sync to populate the Trend Stream.
            </p>
          </PageCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {streamItems.map((item) => (
              <RadarItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      <ToastContainer />
    </div>
  );
}
