import { useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, ArchiveRestore, Loader2, Pencil, RefreshCw, Search, Trash2 } from 'lucide-react';
import Dialog from '@/components/molecules/Dialog';
import TagInput from '@/components/molecules/TagInput';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { queryKeys } from '@/lib/react-query/query-keys';
import { ltmService } from '@/services/ltm.service';
import type { Area } from '@/types/growth-system';
import type { LongTermMemoryEntry } from '@/types/assistant-memory';

const AREAS: Area[] = ['Health', 'Wealth', 'Love', 'Happiness', 'Operations', 'Day Job'];

const SEARCH_DEBOUNCE_MS = 500;

type LtmVisibilityFilter = 'active' | 'all' | 'archivedOnly';

function preview(text: string | null | undefined, max = 200): string {
  return (text || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function parseTagTokens(raw: string): string[] {
  return raw
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

export default function MemoryAuditPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const [visibility, setVisibility] = useState<LtmVisibilityFilter>('active');
  const [filterArea, setFilterArea] = useState<Area | 'all'>('all');
  const [filterSource, setFilterSource] = useState('');
  const [filterTagsRaw, setFilterTagsRaw] = useState('');
  const [filterUpdatedFrom, setFilterUpdatedFrom] = useState('');
  const [filterUpdatedTo, setFilterUpdatedTo] = useState('');
  const [editingEntry, setEditingEntry] = useState<LongTermMemoryEntry | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editArea, setEditArea] = useState<Area>('Operations');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LongTermMemoryEntry | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const debouncedSearchTrim = debouncedSearch.trim();
  const isDebouncingSearch = search.trim() !== debouncedSearchTrim;

  const listQuery = useQuery({
    queryKey: queryKeys.ltm.list(visibility, debouncedSearchTrim),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const includeArchived = visibility === 'all' || visibility === 'archivedOnly';
      if (debouncedSearchTrim) {
        const hits = await ltmService.search({
          query: debouncedSearchTrim,
          limit: 50,
          includeArchived,
        });
        if (visibility === 'archivedOnly') {
          return hits.filter((h) => h.archived);
        }
        return hits;
      }
      const res = await ltmService.list({
        pageSize: 100,
        includeArchived: visibility === 'all',
        archivedOnly: visibility === 'archivedOnly',
      });
      return res.items;
    },
  });

  const rawEntries = listQuery.data;
  const filterTags = useMemo(() => parseTagTokens(filterTagsRaw), [filterTagsRaw]);
  const filterSourceTrim = filterSource.trim().toLowerCase();

  const filteredEntries = useMemo(() => {
    let out = rawEntries ?? [];
    if (filterArea !== 'all') {
      out = out.filter((e) => (e.area || '') === filterArea);
    }
    if (filterSourceTrim) {
      out = out.filter((e) => (e.source || '').toLowerCase().includes(filterSourceTrim));
    }
    if (filterTags.length > 0) {
      out = out.filter((e) => {
        const et = (e.tags || []).map((t) => t.toLowerCase());
        return filterTags.some((ft) => et.some((t) => t === ft || t.includes(ft)));
      });
    }
    if (filterUpdatedFrom) {
      const from = new Date(filterUpdatedFrom).getTime();
      out = out.filter((e) => !Number.isNaN(from) && new Date(e.updatedAt).getTime() >= from);
    }
    if (filterUpdatedTo) {
      const to = new Date(filterUpdatedTo);
      to.setHours(23, 59, 59, 999);
      out = out.filter((e) => new Date(e.updatedAt).getTime() <= to.getTime());
    }
    return out;
  }, [rawEntries, filterArea, filterSourceTrim, filterTags, filterUpdatedFrom, filterUpdatedTo]);

  const hasClientFilters =
    filterArea !== 'all' ||
    filterSourceTrim.length > 0 ||
    filterTags.length > 0 ||
    Boolean(filterUpdatedFrom) ||
    Boolean(filterUpdatedTo);

  const metaLine = useMemo(() => {
    if (listQuery.isError) return 'Failed to load';
    if (listQuery.isPending && !listQuery.data) return 'Loading memories…';
    if (isDebouncingSearch) return 'Waiting to search…';
    if (listQuery.isFetching) return debouncedSearchTrim ? 'Searching…' : 'Refreshing…';
    const n = filteredEntries.length;
    const total = rawEntries?.length ?? 0;
    if (hasClientFilters && total !== n) {
      return `${n} of ${total} memor${total === 1 ? 'y' : 'ies'} (after filters)`;
    }
    return `${n} memor${n === 1 ? 'y' : 'ies'}`;
  }, [
    listQuery.isError,
    listQuery.isPending,
    listQuery.isFetching,
    listQuery.data,
    isDebouncingSearch,
    debouncedSearchTrim,
    filteredEntries.length,
    rawEntries,
    hasClientFilters,
  ]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.ltm.all });

  const archiveToggleMut = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      await ltmService.update(id, { archived });
    },
    onSuccess: invalidate,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => ltmService.remove(id),
    onSuccess: () => {
      setDeleteTarget(null);
      invalidate();
    },
    onError: (e: Error) => setDeleteError(e.message),
  });

  return (
    <div className="min-h-0 flex-1 flex flex-col p-4 md:p-6 max-w-7xl mx-auto w-full">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Memory Audit</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Inspect and manage assistant long-term memory (PostgreSQL + pgvector). Search is
          debounced; refine results by visibility, area, source, tags, or updated date—all
          client-side on the loaded set.
        </p>
      </header>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 mb-3 items-stretch sm:items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Semantic search or leave empty for recent list"
            aria-busy={isDebouncingSearch || listQuery.isFetching}
            className="w-full pl-10 pr-11 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
          {(isDebouncingSearch || listQuery.isFetching) && (
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              title={isDebouncingSearch ? 'Waiting to search' : 'Loading'}
            >
              <Loader2 size={18} className="animate-spin" aria-hidden />
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => listQuery.refetch()}
          disabled={listQuery.isFetching}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 shrink-0 disabled:opacity-60"
        >
          <RefreshCw size={16} className={listQuery.isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
        <label className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">Visibility</span>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as LtmVisibilityFilter)}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
          >
            <option value="active">Active only</option>
            <option value="all">Active + archived</option>
            <option value="archivedOnly">Archived only</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">Area</span>
          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value as Area | 'all')}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
          >
            <option value="all">All areas</option>
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400 sm:col-span-2">
          <span className="font-medium text-gray-700 dark:text-gray-300">Source contains</span>
          <input
            type="text"
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            placeholder="e.g. consolidation"
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400 sm:col-span-2">
          <span className="font-medium text-gray-700 dark:text-gray-300">Tags (match any)</span>
          <input
            type="text"
            value={filterTagsRaw}
            onChange={(e) => setFilterTagsRaw(e.target.value)}
            placeholder="comma-separated, e.g. growth, overdue"
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">Updated from</span>
          <input
            type="date"
            value={filterUpdatedFrom}
            onChange={(e) => setFilterUpdatedFrom(e.target.value)}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-300">Updated to</span>
          <input
            type="date"
            value={filterUpdatedTo}
            onChange={(e) => setFilterUpdatedTo(e.target.value)}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
          />
        </label>
        {hasClientFilters && (
          <div className="flex items-end sm:col-span-2 lg:col-span-3 xl:col-span-2">
            <button
              type="button"
              onClick={() => {
                setFilterArea('all');
                setFilterSource('');
                setFilterTagsRaw('');
                setFilterUpdatedFrom('');
                setFilterUpdatedTo('');
              }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear refined filters
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{metaLine}</p>

      {listQuery.isError && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300 mb-4">
          {listQuery.error instanceof Error ? listQuery.error.message : 'Request failed'}
        </div>
      )}

      {listQuery.isPending && !listQuery.data ? (
        <div className="text-gray-500 dark:text-gray-400 py-12 text-center">Loading memories…</div>
      ) : !rawEntries || rawEntries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center text-gray-600 dark:text-gray-400">
          No long-term memories match this visibility and search.
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center text-gray-600 dark:text-gray-400">
          No memories match the refined filters (area, source, tags, or dates). Try clearing those
          filters or widening the date range.
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-y-auto pb-8 transition-opacity ${listQuery.isFetching ? 'opacity-75' : ''}`}
        >
          {filteredEntries.map((entry) => (
            <article
              key={entry.id}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 p-4 flex flex-col gap-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="font-semibold text-gray-900 dark:text-white truncate">
                    {entry.title}
                  </h2>
                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>{entry.area || '—'}</span>
                    <span>·</span>
                    <span title={entry.source}>source: {preview(entry.source, 40)}</span>
                    {entry.archived && (
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        archived
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    title={entry.archived ? 'Unarchive' : 'Archive'}
                    disabled={archiveToggleMut.isPending}
                    onClick={() =>
                      archiveToggleMut.mutate({ id: entry.id, archived: !entry.archived })
                    }
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                  >
                    {entry.archived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
                  </button>
                  <button
                    type="button"
                    title="Edit"
                    onClick={() => {
                      setEditingEntry(entry);
                      setEditTitle(entry.title);
                      setEditSummary(entry.summary);
                      setEditArea((entry.area as Area) || 'Operations');
                      setEditTags(entry.tags || []);
                      setEditError(null);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    onClick={() => {
                      setDeleteTarget(entry);
                      setDeleteError(null);
                    }}
                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {entry.summary}
              </p>
              <div className="flex flex-wrap gap-2">
                {(entry.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs text-gray-700 dark:text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-3">
                <div>
                  <dt className="font-medium text-gray-600 dark:text-gray-500">dedupeKey</dt>
                  <dd className="truncate font-mono" title={entry.dedupeKey}>
                    {entry.dedupeKey}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600 dark:text-gray-500">id</dt>
                  <dd className="truncate font-mono" title={entry.id}>
                    {entry.id}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600 dark:text-gray-500">updated</dt>
                  <dd>{new Date(entry.updatedAt).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-600 dark:text-gray-500">access</dt>
                  <dd>
                    {entry.accessCount ?? 0}
                    {entry.lastAccessedAt
                      ? ` · last ${new Date(entry.lastAccessedAt).toLocaleString()}`
                      : ''}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-medium text-gray-600 dark:text-gray-500">embedding</dt>
                  <dd>
                    {entry.embeddingModel} v{entry.embeddingVersion}
                  </dd>
                </div>
                {(entry.relatedMemoryIds?.length ?? 0) > 0 && (
                  <div className="sm:col-span-2">
                    <dt className="font-medium text-gray-600 dark:text-gray-500">
                      relatedMemoryIds
                    </dt>
                    <dd className="font-mono break-all">{entry.relatedMemoryIds.join(', ')}</dd>
                  </div>
                )}
              </dl>
            </article>
          ))}
        </div>
      )}

      <Dialog
        isOpen={editingEntry !== null}
        onClose={() => setEditingEntry(null)}
        title={editingEntry ? `Edit: ${editingEntry.title}` : 'Edit memory'}
        size="full"
      >
        <div className="p-6 max-w-3xl mx-auto space-y-4">
          {editingEntry && (
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setEditSaving(true);
                setEditError(null);
                try {
                  await ltmService.update(editingEntry.id, {
                    title: editTitle.trim(),
                    summary: editSummary.trim(),
                    area: editArea,
                    tags: editTags,
                  });
                  setEditingEntry(null);
                  await invalidate();
                } catch (err) {
                  setEditError(err instanceof Error ? err.message : 'Save failed');
                } finally {
                  setEditSaving(false);
                }
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(ev) => setEditTitle(ev.target.value)}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Summary
                </label>
                <textarea
                  value={editSummary}
                  onChange={(ev) => setEditSummary(ev.target.value)}
                  rows={10}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Area
                </label>
                <select
                  value={editArea}
                  onChange={(ev) => setEditArea(ev.target.value as Area)}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100"
                >
                  {AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              <TagInput value={editTags} onChange={setEditTags} />
              {editError && (
                <div className="text-sm text-red-600 dark:text-red-400">{editError}</div>
              )}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
                >
                  {editSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          )}
        </div>
      </Dialog>

      <Dialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete memory?"
        size="md"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Permanently remove this memory from Postgres? This cannot be undone.
          </p>
          {deleteTarget && (
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {deleteTarget.title}
            </p>
          )}
          {deleteError && (
            <div className="text-sm text-red-600 dark:text-red-400">{deleteError}</div>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteMut.isPending || !deleteTarget}
              onClick={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
              className="px-4 py-2 rounded-lg bg-red-600 text-white disabled:opacity-50"
            >
              {deleteMut.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
