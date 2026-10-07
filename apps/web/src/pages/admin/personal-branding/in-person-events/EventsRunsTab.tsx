import { useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import Button from '@/components/atoms/Button';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { DISCOVERY_RUNS_PAGE_SIZE, useEventDiscoveryRunsPage } from '@/hooks/useInPersonEvents';
import {
  DataTableShell,
  PageCard,
  SectionIntro,
  dataTableBodyClassName,
  dataTableHeadClassName,
} from '../PersonalBrandingPageTemplate';
import {
  formatPersonalBrandingDateTime,
  pbFocusVisibleRingClassName,
} from '../personal-branding-ui';
import EventDiscoveryRunDetailDrawer from './EventDiscoveryRunDetailDrawer';

function formatPhase(phase: string): string {
  return phase.replaceAll('_', ' ');
}

export default function EventsRunsTab() {
  const [page, setPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const history = useEventDiscoveryRunsPage(page);
  const runs = history.data?.data ?? [];
  const selectedRunId = searchParams.get('runId');
  const selectedRun = runs.find((run) => run.id === selectedRunId) ?? null;
  const totalPages = Math.max(
    1,
    Math.ceil((history.data?.total ?? 0) / (history.data?.pageSize ?? DISCOVERY_RUNS_PAGE_SIZE))
  );

  const selectRun = (runId: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', 'runs');
    nextParams.set('runId', runId);
    setSearchParams(nextParams);
  };

  const closeDrawer = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('runId');
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <>
      <PageCard className="min-w-0 space-y-4">
        <SectionIntro
          title="Discovery run history"
          description="Open a run to inspect its counters, activity log, generated queries, and exact error."
        />

        {history.isError ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {history.error instanceof Error
              ? history.error.message
              : 'Could not load discovery run history. Try refreshing the page.'}
          </p>
        ) : history.isPending && runs.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading discovery runs…
          </p>
        ) : history.data?.total === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No discovery runs yet.</p>
        ) : (
          <DataTableShell>
            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
              <thead className={dataTableHeadClassName}>
                <tr>
                  {[
                    'Status',
                    'Trigger',
                    'Phase',
                    'Created',
                    'Events created',
                    'Duplicate',
                    'Filtered',
                    'Finished',
                    'Error',
                  ].map((heading, index) => (
                    <th
                      key={`${heading}-${index}`}
                      className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={dataTableBodyClassName}>
                {runs.map((run) => (
                  <tr
                    key={run.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open event discovery run from ${formatPersonalBrandingDateTime(
                      run.createdAt
                    )}`}
                    className={[
                      'cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-900/40',
                      pbFocusVisibleRingClassName,
                      selectedRunId === run.id ? 'bg-blue-50/60 dark:bg-blue-950/20' : '',
                    ].join(' ')}
                    onClick={() => selectRun(run.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        selectRun(run.id);
                      }
                    }}
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={run.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-700 dark:text-gray-200">
                      {run.triggerKind}
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-700 dark:text-gray-200">
                      {formatPhase(run.phase)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {formatPersonalBrandingDateTime(run.createdAt)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-700 dark:text-gray-200">
                      {run.eventsCreated}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-700 dark:text-gray-200">
                      {run.eventsDuplicate}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-700 dark:text-gray-200">
                      {run.eventsFiltered}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {formatPersonalBrandingDateTime(run.finishedAt)}
                    </td>
                    <td
                      className="max-w-xs truncate px-4 py-3 text-xs text-red-600 dark:text-red-300"
                      title={run.errorSummary ?? undefined}
                    >
                      {run.errorSummary || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTableShell>
        )}

        {history.data && history.data.total > history.data.pageSize ? (
          <nav
            className="flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700"
            aria-label="Discovery run history pagination"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Page {page} of {totalPages} · {history.data.total} runs
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                disabled={page <= 1 || history.isFetching}
                aria-label="Previous discovery run history page"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setPage((currentPage) => currentPage + 1)}
                disabled={!history.data.hasMore || history.isFetching}
                aria-label="Next discovery run history page"
              >
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          </nav>
        ) : null}
      </PageCard>

      <EventDiscoveryRunDetailDrawer
        open={Boolean(selectedRunId)}
        runId={selectedRunId}
        run={selectedRun}
        onClose={closeDrawer}
      />
    </>
  );
}
