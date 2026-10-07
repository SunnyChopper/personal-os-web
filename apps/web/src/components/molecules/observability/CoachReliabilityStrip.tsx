import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { queryKeys } from '@/lib/react-query/query-keys';
import {
  COACH_RELIABILITY_EXECUTION_FILTERS,
  coachReliabilityObservabilityUrl,
} from '@/lib/observability/coach-reliability';
import { formatExecutionPreview } from '@/lib/observability/execution-log-filters';
import { formatObservabilityDateTime } from '@/lib/observability-formatters';
import { observabilityService } from '@/services/observability.service';
import { ROUTES } from '@/routes';
import { cn } from '@/lib/utils';

const RELIABILITY_FILTERS = {
  page: 1,
  pageSize: 10,
  module: COACH_RELIABILITY_EXECUTION_FILTERS.module,
  feature: COACH_RELIABILITY_EXECUTION_FILTERS.feature,
} as const;

export type CoachReliabilityStripProps = {
  className?: string;
};

export default function CoachReliabilityStrip({ className }: CoachReliabilityStripProps) {
  const navigate = useNavigate();
  const listQ = useQuery({
    queryKey: queryKeys.observability.executions(RELIABILITY_FILTERS),
    queryFn: () => observabilityService.listExecutions(RELIABILITY_FILTERS),
    staleTime: 60_000,
  });

  const rows = listQ.data?.data ?? [];

  return (
    <section
      className={cn(
        'rounded-xl border border-amber-200/80 bg-amber-50/60 p-4 dark:border-amber-900/50 dark:bg-amber-950/20',
        className
      )}
      aria-labelledby="coach-reliability-heading"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2
            id="coach-reliability-heading"
            className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-100"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
            Recent Coach reliability
          </h2>
          <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-200/80">
            Zero-tool turns, gap-confession replies, and partial-list finalize events indexed from
            assistant chat. Open the thread to inspect execution steps and tool traces.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => navigate(coachReliabilityObservabilityUrl())}
        >
          View in Observability
        </Button>
      </div>

      {listQ.isLoading ? (
        <p className="text-xs text-amber-800/80 dark:text-amber-200/70">
          Loading reliability rows…
        </p>
      ) : listQ.isError ? (
        <p className="text-xs text-amber-800/80 dark:text-amber-200/70">
          Could not load Coach reliability markers.
        </p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-amber-800/80 dark:text-amber-200/70">
          No recent zero-tool, gap-confession, or partial-list finalize turns in the execution log.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-2 rounded-lg border border-amber-200/60 bg-white/70 px-3 py-2 text-xs dark:border-amber-900/40 dark:bg-gray-900/40 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {formatObservabilityDateTime(row.occurredAt)}
                </p>
                <p className="mt-0.5 line-clamp-2 text-gray-600 dark:text-gray-400">
                  {formatExecutionPreview(row.responsePreview)}
                </p>
                {row.threadId ? (
                  <p className="mt-1 font-mono text-[11px] text-gray-500 dark:text-gray-500">
                    {row.threadId}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {row.threadId ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(`${ROUTES.admin.assistant}/${row.threadId}`)}
                  >
                    Open thread
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="gap-1"
                  onClick={() =>
                    navigate(
                      `${ROUTES.admin.assistantObservability}?tab=executions&threadId=${encodeURIComponent(row.threadId ?? '')}&runId=${encodeURIComponent(row.runId ?? '')}`
                    )
                  }
                >
                  Investigate
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
