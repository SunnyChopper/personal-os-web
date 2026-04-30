import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { queryKeys } from '@/lib/react-query/query-keys';
import { ROUTES } from '@/routes';
import { workflowsService } from '@/services/tools/workflows.service';
import type { WorkflowDefinition } from '@/types/api/tools';

function buildDefaultDefinition(): WorkflowDefinition {
  let pending: string | null = null;
  try {
    pending = sessionStorage.getItem('tools.pendingCron');
    if (pending) sessionStorage.removeItem('tools.pendingCron');
  } catch {
    /* ignore */
  }
  if (pending) {
    return {
      nodes: [
        {
          id: 'n-trigger',
          type: 'trigger.cron',
          position: { x: 120, y: 40 },
          config: { expression: pending },
        },
        {
          id: 'n-fetch',
          type: 'action.fetch',
          position: { x: 120, y: 180 },
          config: {
            method: 'GET',
            url: 'https://httpbin.org/json',
            headers: {},
          },
        },
      ],
      edges: [{ id: 'e1', source: 'n-trigger', target: 'n-fetch' }],
    };
  }
  return {
    nodes: [
      {
        id: 'n-trigger',
        type: 'trigger.manual',
        position: { x: 120, y: 40 },
        config: {},
      },
      {
        id: 'n-fetch',
        type: 'action.fetch',
        position: { x: 120, y: 180 },
        config: {
          method: 'GET',
          url: 'https://httpbin.org/json',
          headers: {},
        },
      },
    ],
    edges: [{ id: 'e1', source: 'n-trigger', target: 'n-fetch' }],
  };
}

export default function WorkflowsListPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.tools.workflows.list(),
    queryFn: () => workflowsService.list(),
  });

  const createMut = useMutation({
    mutationFn: () =>
      workflowsService.create({
        name: `Workflow ${new Date().toISOString().slice(0, 19)}`,
        definition: buildDefaultDefinition(),
        enabled: false,
      }),
    onSuccess: (w) => {
      void qc.invalidateQueries({ queryKey: queryKeys.tools.workflows.list() });
      navigate(`${ROUTES.admin.tools.base}/workflows/${w.id}`);
    },
  });

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workflow Engine</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Visual workflows with cron dispatch, HTTP actions, vault saves, and Growth tool calls.
          </p>
        </div>
        <button
          type="button"
          onClick={() => createMut.mutate()}
          disabled={createMut.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          New workflow
        </button>
      </div>
      {isLoading && <p className="text-gray-500">Loading…</p>}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Name</th>
              <th className="px-4 py-2 text-left font-medium">Enabled</th>
              <th className="px-4 py-2 text-left font-medium">Last run</th>
              <th className="px-4 py-2 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {items.map((w) => (
              <tr key={w.id}>
                <td className="px-4 py-2">
                  <Link
                    to={`${ROUTES.admin.tools.base}/workflows/${w.id}`}
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {w.name}
                  </Link>
                </td>
                <td className="px-4 py-2">{w.enabled ? 'Yes' : 'No'}</td>
                <td className="px-4 py-2 font-mono text-xs">{w.lastRunAt ?? '—'}</td>
                <td className="px-4 py-2">{w.lastRunStatus ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
