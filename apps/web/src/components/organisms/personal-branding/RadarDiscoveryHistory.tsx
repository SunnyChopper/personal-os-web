import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/atoms/Card';
import { StatusBadge } from '@/components/atoms/StatusBadge';
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
  page: number;
  onPageChange: (page: number) => void;
  onSelect: (runId: string) => void;
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export default function RadarDiscoveryHistory({
  history,
  selectedRunId,
  isLoading = false,
  page,
  onPageChange,
  onSelect,
}: RadarDiscoveryHistoryProps) {
  const runs = history?.data ?? [];
  const totalPages = Math.max(1, Math.ceil((history?.total ?? 0) / (history?.pageSize ?? 10)));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Discovery history</CardTitle>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Select a run to inspect its durable backend state and candidates.
        </p>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading && runs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    <Loader2 className="mr-2 inline size-4 animate-spin" aria-hidden />
                    Loading history…
                  </td>
                </tr>
              ) : runs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No discovery runs yet.
                  </td>
                </tr>
              ) : (
                runs.map((run) => {
                  const counts = radarDiscoveryDisplayCounts(run.progress);
                  return (
                    <tr
                      key={run.runId}
                      className={cn(
                        'transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/40',
                        selectedRunId === run.runId && 'bg-blue-50/70 dark:bg-blue-950/20'
                      )}
                    >
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          onClick={() => onSelect(run.runId)}
                          aria-label={`Select discovery run from ${formatDate(run.createdAt)}`}
                        >
                          <StatusBadge status={run.status} size="sm" />
                        </button>
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
                        {formatDate(run.startedAt ?? run.createdAt)}
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
