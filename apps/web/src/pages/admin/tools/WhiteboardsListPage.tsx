import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid, Plus } from 'lucide-react';
import { queryKeys } from '@/lib/react-query/query-keys';
import { ROUTES } from '@/routes';
import { whiteboardsService } from '@/services/tools/whiteboards.service';
import { cn } from '@/lib/utils';

function newBoardPath() {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `b-${Date.now()}`;
  return `${ROUTES.admin.tools.base}/whiteboard/${id}`;
}

export default function WhiteboardsListPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.tools.whiteboards.list(),
    queryFn: () => whiteboardsService.list(),
  });

  const items = useMemo(() => data?.items ?? [], [data?.items]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Whiteboards</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Excalidraw canvas with local autosave (IndexedDB). Save to Vault to list here and sync
            across devices.
          </p>
        </div>
        <Link
          to={newBoardPath()}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New board
        </Link>
      </div>

      {isLoading && <p className="text-gray-500">Loading…</p>}
      {error && (
        <p className="text-red-600">{error instanceof Error ? error.message : 'Failed to load'}</p>
      )}

      {!isLoading && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
          <LayoutGrid className="mx-auto h-10 w-10 text-gray-400" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            No boards saved to the Vault yet. Create a board and use <strong>Save to Vault</strong>{' '}
            to add it here.
          </p>
          <Link
            to={newBoardPath()}
            className="mt-4 inline-block text-blue-600 hover:underline dark:text-blue-400"
          >
            Open a new canvas
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((b) => (
          <Link
            key={b.id}
            to={`${ROUTES.admin.tools.base}/whiteboard/${b.id}`}
            className={cn(
              'rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800'
            )}
          >
            <div className="font-semibold text-gray-900 dark:text-white">{b.name}</div>
            <div className="mt-1 text-xs text-gray-500">
              Updated {new Date(b.updatedAt).toLocaleString()}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
