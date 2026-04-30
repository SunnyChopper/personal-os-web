import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  taskLinksService,
  type VaultTaskLink,
} from '@/services/knowledge-vault/task-links.service';
import { ROUTES } from '@/routes';
import Button from '@/components/atoms/Button';
import { EmptyState } from '@/components/molecules/EmptyState';
import { cn } from '@/lib/utils';

export default function TaskLinksPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['vault-task-links-unack'],
    queryFn: async () => {
      const data = await taskLinksService.listUnacknowledged();
      return data?.items ?? [];
    },
    refetchInterval: 60_000,
  });

  const ack = useMutation({
    mutationFn: (id: string) => taskLinksService.acknowledge(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['vault-task-links-unack'] });
      void qc.invalidateQueries({ queryKey: ['vault-task-links-unack-count'] });
    },
  });

  const analyze = useMutation({
    mutationFn: async () => {
      const data = await taskLinksService.analyze();
      if (data == null) throw new Error('Analysis failed');
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['vault-task-links-unack'] });
      void qc.invalidateQueries({ queryKey: ['vault-task-links-unack-count'] });
    },
  });

  const approve = useMutation({
    mutationFn: async (id: string) => {
      const ok = await taskLinksService.approve(id);
      if (!ok) throw new Error('Approve failed');
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['vault-task-links-unack'] });
      void qc.invalidateQueries({ queryKey: ['vault-task-links-unack-count'] });
    },
  });

  const items = q.data ?? [];
  const rowActionBusy = ack.isPending || approve.isPending;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex items-start gap-3 min-w-0">
          <Link2 className="w-8 h-8 text-green-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vault ↔ Task Links</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Semantic matches between vault notes or documents and your active tasks. Use{' '}
              <span className="font-medium text-gray-800 dark:text-gray-200">Run analysis</span> to
              scan recent items, then approve to add markdown links on both sides—or dismiss.
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="primary"
          className="shrink-0 sm:mt-1"
          disabled={analyze.isPending}
          onClick={() => analyze.mutate()}
        >
          {analyze.isPending ? 'Running analysis…' : 'Run analysis'}
        </Button>
      </div>

      {(analyze.isError || analyze.isSuccess) && (
        <div
          role="status"
          className={cn(
            'rounded-xl border px-4 py-3 text-sm',
            analyze.isError &&
              'border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200',
            analyze.isSuccess &&
              'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-800/60 dark:text-gray-300'
          )}
        >
          {analyze.isError
            ? analyze.error instanceof Error
              ? analyze.error.message
              : 'Analysis failed'
            : analyze.data.newLinksCount === 0
              ? 'No new link suggestions from this run.'
              : `Added ${analyze.data.newLinksCount} new suggestion(s).`}
        </div>
      )}
      {approve.isError && (
        <p className="text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-3">
          {approve.error instanceof Error ? approve.error.message : 'Approve failed'}
        </p>
      )}

      {q.isLoading && <p className="text-gray-500 dark:text-gray-400">Loading…</p>}
      {q.isError && (
        <p className="text-red-600 dark:text-red-400">
          {q.error instanceof Error ? q.error.message : 'Error'}
        </p>
      )}

      {items.length > 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 p-3 sm:p-4 shadow-sm">
          <ul className="space-y-3">
            {items.map((row: VaultTaskLink) => (
              <li
                key={row.id}
                className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 bg-white dark:bg-gray-800 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    Note{' '}
                    <code className="text-xs bg-gray-100 dark:bg-gray-900 px-1 rounded">
                      {row.vaultItemId.slice(0, 12)}…
                    </code>{' '}
                    ↔ Task{' '}
                    <code className="text-xs bg-gray-100 dark:bg-gray-900 px-1 rounded">
                      {row.taskId.slice(0, 12)}…
                    </code>
                  </p>
                  {row.similarityScore != null && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Similarity {(row.similarityScore * 100).toFixed(0)}%
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`${ROUTES.admin.knowledgeVaultLibrary}?highlight=${encodeURIComponent(row.vaultItemId)}`}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View note
                  </Link>
                  <Link
                    to={`${ROUTES.admin.tasks}?highlightTask=${encodeURIComponent(row.taskId)}`}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400"
                  >
                    View task
                  </Link>
                  <Button
                    type="button"
                    size="sm"
                    variant="success"
                    disabled={rowActionBusy}
                    onClick={() => approve.mutate(row.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={rowActionBusy}
                    onClick={() => ack.mutate(row.id)}
                  >
                    Dismiss
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {items.length === 0 && !q.isLoading && !q.isError && (
        <EmptyState
          icon={Link2}
          title="No pending link suggestions"
          description="When recent vault notes or documents align with your active tasks, suggested links appear here. Use Run analysis above to scan your latest vault items."
          className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/90 dark:bg-gray-900/50 py-14 px-6"
        />
      )}
    </div>
  );
}
