import { ChevronLeft, ChevronRight, Loader2, Sparkles, Trash2 } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { Card, CardBody, CardHeader } from '@/components/atoms/Card';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { TERMINAL_RADAR_DISCOVERY_STATUSES } from '@/hooks/useSignalRadar';
import { radarDiscoveryDisplayCounts } from '@/lib/personal-branding/radar-discovery';
import { cn } from '@/lib/utils';
import type {
  PaginatedPersonalBranding,
  RadarDiscoveryRun,
} from '@/types/api/personal-branding.dto';

interface RadarDiscoveryHistoryProps {
  history?: PaginatedPersonalBranding<RadarDiscoveryRun>;
  selectedRunId: string | null;
  isLoading?: boolean;
  deletingRunId?: string | null;
  page: number;
  onPageChange: (page: number) => void;
  onSelect: (runId: string) => void;
  onDelete: (run: RadarDiscoveryRun) => void;
  canRunDiscovery: boolean;
  onRunDiscovery: () => void;
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export default function RadarDiscoveryHistory({
  history,
  selectedRunId,
  isLoading = false,
  deletingRunId = null,
  page,
  onPageChange,
  onSelect,
  onDelete,
  canRunDiscovery,
  onRunDiscovery,
}: RadarDiscoveryHistoryProps) {
  const runs = history?.data ?? [];
  const totalPages = Math.max(1, Math.ceil((history?.total ?? 0) / (history?.pageSize ?? 10)));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3
              id="discovery-history-heading"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              Discovery history
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Open a run to inspect progress and candidates.
            </p>
            {!canRunDiscovery ? (
              <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                Add a Tavily API key in Sync settings before starting discovery.
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            size="sm"
            onClick={onRunDiscovery}
            disabled={!canRunDiscovery}
            className="inline-flex shrink-0 items-center gap-1.5"
          >
            <Sparkles className="size-4" aria-hidden />
            Run discovery
          </Button>
        </div>
      </CardHeader>
      <CardBody className="p-0 sm:p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-900/60 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Profiles</th>
                <th className="px-4 py-3">Topics</th>
                <th className="px-4 py-3">Candidates</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading && runs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    <Loader2 className="mr-2 inline size-4 animate-spin" aria-hidden />
                    Loading history…
                  </td>
                </tr>
              ) : runs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No discovery runs yet.
                  </td>
                </tr>
              ) : (
                runs.map((run) => {
                  const counts = radarDiscoveryDisplayCounts(run.progress);
                  const startedLabel = formatDate(run.startedAt ?? run.createdAt);
                  const canDelete = TERMINAL_RADAR_DISCOVERY_STATUSES.has(run.status);
                  const isDeleting = deletingRunId === run.runId;
                  return (
                    <tr
                      key={run.runId}
                      className={cn(
                        'cursor-pointer transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 dark:hover:bg-gray-900/40 dark:focus-visible:bg-gray-900/40',
                        selectedRunId === run.runId && 'bg-blue-50/70 dark:bg-blue-950/20'
                      )}
                      onClick={() => onSelect(run.runId)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onSelect(run.runId);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Open discovery run from ${startedLabel}`}
                    >
                      <td className="px-4 py-3">
                        <StatusBadge status={run.status} size="sm" />
                      </td>
                      <td className="max-w-48 px-4 py-3 text-gray-700 dark:text-gray-200">
                        <span className="line-clamp-2">{run.profileNames.join(', ') || '—'}</span>
                      </td>
                      <td className="max-w-56 px-4 py-3 text-gray-600 dark:text-gray-300">
                        <span className="line-clamp-2">
                          {run.effectiveTopics.join(', ') || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                        {counts.candidatesTotal}
                        <span className="ml-1 text-xs text-gray-500">
                          ({counts.relevantCount} relevant)
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        {startedLabel}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          {canDelete ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                onDelete(run);
                              }}
                              disabled={isDeleting}
                              className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/30"
                              aria-label={`Remove discovery run from ${startedLabel}`}
                            >
                              {isDeleting ? (
                                <Loader2 className="size-4 animate-spin" aria-hidden />
                              ) : (
                                <Trash2 className="size-4" aria-hidden />
                              )}
                            </button>
                          ) : (
                            <span className="px-2 text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {history && history.total > history.pageSize ? (
          <nav
            className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700"
            aria-label="Discovery history pagination"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Page {page} of {totalPages} · {history.total} runs
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1 || isLoading}
                aria-label="Previous discovery history page"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onPageChange(page + 1)}
                disabled={!history.hasMore || isLoading}
                aria-label="Next discovery history page"
              >
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          </nav>
        ) : null}
      </CardBody>
    </Card>
  );
}
