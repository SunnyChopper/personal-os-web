import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { queryKeys } from '@/lib/react-query/query-keys';
import { ROUTES } from '@/routes';
import { webhooksService } from '@/services/tools/webhooks.service';
import { cn } from '@/lib/utils';
import { getResolvedApiBaseUrl } from '@/lib/vite-public-env';

const API_BASE = getResolvedApiBaseUrl();

export default function WebhooksListPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.tools.webhooks.list(),
    queryFn: () => webhooksService.list(),
  });

  const createMut = useMutation({
    mutationFn: () => webhooksService.create(`Catcher ${new Date().toISOString().slice(0, 19)}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tools.webhooks.list() }),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => webhooksService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tools.webhooks.list() }),
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Webhook Catcher</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Public ingest URL (no JWT). Paste the URL into external systems; events appear in the
            detail view. Combine with a live WebSocket subscription for instant updates.
          </p>
        </div>
        <button
          type="button"
          onClick={() => createMut.mutate()}
          disabled={createMut.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          New catcher
        </button>
      </div>
      {isLoading && <p className="text-gray-500">Loading…</p>}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Name</th>
              <th className="px-4 py-2 text-left font-medium">Ingest URL</th>
              <th className="px-4 py-2 text-left font-medium">Events</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {items.map((c) => {
              const fullUrl = `${API_BASE.replace(/\/$/, '')}${c.ingestPath}`;
              return (
                <tr key={c.id}>
                  <td className="px-4 py-2">
                    <Link
                      to={`${ROUTES.admin.tools.base}/webhooks/${c.id}`}
                      className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="max-w-md truncate px-4 py-2 font-mono text-xs text-gray-600 dark:text-gray-400">
                    {fullUrl}
                  </td>
                  <td className="px-4 py-2">{c.eventCount}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Delete this catcher?')) delMut.mutate(c.id);
                      }}
                      className={cn('rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950')}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
