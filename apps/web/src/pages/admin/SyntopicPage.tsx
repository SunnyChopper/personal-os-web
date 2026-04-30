import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookMarked } from 'lucide-react';
import { vaultPrimitivesService } from '@/services/knowledge-vault/vault-primitives.service';
import { vaultItemsService } from '@/services/knowledge-vault/vault-items.service';
import Button from '@/components/atoms/Button';
import { MultiSelectVaultCombobox } from '@/components/molecules/MultiSelectVaultCombobox';
import { cn } from '@/lib/utils';

type SyntopicMatrixRow = Record<string, string | undefined>;

type ClusterChild = { id: string; title: string; type: string };

function isNoteOrDocumentType(t: string): boolean {
  return t === 'note' || t === 'document';
}

function matrixKeysToTitleMap(matrix: SyntopicMatrixRow[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (const row of matrix) {
    for (const k of Object.keys(row)) {
      if (k !== 'theme' && k !== 'topic' && !m[k]) m[k] = k;
    }
  }
  return m;
}

function themesToTitleMap(themes: unknown[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (const t of themes) {
    if (t && typeof t === 'object') {
      const o = t as Record<string, unknown>;
      const id = o.documentId ?? o.docId;
      if (typeof id === 'string' && o.title) m[id] = String(o.title);
    }
  }
  return m;
}

function buildSyntopicTitleMap(result: Record<string, unknown> | null): Record<string, string> {
  if (!result) return {};
  const matrix = result.matrix as SyntopicMatrixRow[] | undefined;
  const themes = result.themes as unknown[] | undefined;
  return {
    ...(Array.isArray(matrix) ? matrixKeysToTitleMap(matrix) : {}),
    ...(Array.isArray(themes) ? themesToTitleMap(themes) : {}),
  };
}

export default function SyntopicPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);

  const clustersQuery = useQuery({
    queryKey: ['graph-clusters'],
    queryFn: async () => {
      const res = await vaultPrimitivesService.getGraphClusters();
      if (!res.success || !res.data)
        throw new Error(res.error?.message || 'Failed to load clusters');
      return res.data.clusters as Array<{
        area: string;
        itemCount: number;
        children: ClusterChild[];
      }>;
    },
  });

  const recentItemsQuery = useQuery({
    queryKey: ['recent-vault-items', 'syntopic'],
    queryFn: async () => {
      const res = await vaultItemsService.getAll({ page: 1, pageSize: 15 });
      if (!res.success || !res.data) throw new Error(res.error || 'Failed to load items');
      return res.data.filter((i) => isNoteOrDocumentType(i.type));
    },
  });

  const quickCompareClusters = useMemo(() => {
    const rows = clustersQuery.data ?? [];
    return rows
      .map((c) => ({
        area: c.area,
        ids: (c.children ?? [])
          .filter((ch) => ch?.id && isNoteOrDocumentType(ch.type))
          .slice(0, 3)
          .map((ch) => ch.id),
      }))
      .filter((c) => c.ids.length >= 2);
  }, [clustersQuery.data]);

  const titleMap = useMemo(() => buildSyntopicTitleMap(result), [result]);

  /** Titles for selected chips: vault data from clusters + recents, then syntopic matrix keys */
  const comboboxLabelLookup = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of clustersQuery.data ?? []) {
      for (const ch of c.children ?? []) {
        if (ch.id && ch.title) m[ch.id] = ch.title;
      }
    }
    for (const it of recentItemsQuery.data ?? []) {
      m[it.id] = it.title;
    }
    Object.assign(m, titleMap);
    return m;
  }, [clustersQuery.data, recentItemsQuery.data, titleMap]);

  const run = async () => {
    if (selectedIds.length < 2) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await vaultPrimitivesService.syntopic(selectedIds);
      if (res.success && res.data) setResult(res.data as Record<string, unknown>);
    } finally {
      setLoading(false);
    }
  };

  const exportNote = async () => {
    if (!result) return;
    setExportBusy(true);
    try {
      const lines: string[] = ['# Compare Sources\n'];
      const matrix = result.matrix as SyntopicMatrixRow[] | undefined;
      if (Array.isArray(matrix) && matrix.length) {
        const cols = Object.keys(matrix[0] || {}).filter((k) => k !== 'theme' && k !== 'topic');
        const header = ['Theme', ...cols.map((c) => titleMap[c] || c)];
        lines.push('| ' + header.join(' | ') + ' |');
        lines.push('|' + header.map(() => '---').join('|') + '|');
        for (const row of matrix) {
          const theme = String(row.theme ?? row.topic ?? '');
          const cells = cols.map((c) => String(row[c] ?? '').replace(/\|/g, '\\|'));
          lines.push('| ' + [theme, ...cells].join(' | ') + ' |');
        }
      } else {
        lines.push('```json\n', JSON.stringify(result, null, 2), '\n```\n');
      }
      const body = lines.join('\n');
      await vaultItemsService.createNote({
        title: `Compare Sources: ${selectedIds.length} docs`,
        content: body,
        tags: ['syntopic'],
        area: 'Operations' as const,
        linkedItems: selectedIds,
      });
    } finally {
      setExportBusy(false);
    }
  };

  const applyQuickCompare = (ids: string[]) => {
    setResult(null);
    setSelectedIds(ids.slice(0, 5));
  };

  const toggleRecentItem = (id: string) => {
    setResult(null);
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
      return;
    }
    if (selectedIds.length >= 5) return;
    setSelectedIds([...selectedIds, id]);
  };

  const matrix = result?.matrix as SyntopicMatrixRow[] | undefined;
  const themes = result?.themes as Array<Record<string, unknown>> | undefined;
  const synthesis = typeof result?.synthesis === 'string' ? result.synthesis : '';

  const tableCols =
    Array.isArray(matrix) && matrix.length
      ? Object.keys(matrix[0]).filter((k) => k !== 'theme' && k !== 'topic')
      : [];

  /** Keep suggestions visible until Analyze returns so users can grow selection up to max */
  const showQuickStart = !result;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <BookMarked className="w-8 h-8 text-sky-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Compare Sources</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Compare themes across 2–5 vault documents.
          </p>
        </div>
      </div>

      {showQuickStart && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/40 p-4 md:p-6 space-y-5">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Pick a quick set below or use the search—no typing required to get started.
          </p>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Quick compare by area
            </p>
            {clustersQuery.isLoading && (
              <p className="text-sm text-gray-500">Loading suggestions…</p>
            )}
            {clustersQuery.isError && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Could not load area groupings. You can still search above.
              </p>
            )}
            {!clustersQuery.isLoading && quickCompareClusters.length === 0 && (
              <p className="text-sm text-gray-500">
                Add at least two notes or documents in one area to see one-tap suggestions.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {quickCompareClusters.map((c) => (
                <Button
                  key={c.area}
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => applyQuickCompare(c.ids)}
                >
                  {c.area} ({c.ids.length} docs)
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Recent notes & documents
            </p>
            {recentItemsQuery.isLoading && (
              <p className="text-sm text-gray-500">Loading recent items…</p>
            )}
            {recentItemsQuery.isError && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Could not load recent items.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {(recentItemsQuery.data ?? []).map((it) => {
                const selected = selectedIds.includes(it.id);
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => toggleRecentItem(it.id)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm transition-colors text-left max-w-[220px] truncate',
                      selected
                        ? 'border-sky-500 bg-sky-500/15 text-sky-100'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                    title={it.title}
                  >
                    {it.title}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <MultiSelectVaultCombobox
        selectedIds={selectedIds}
        onSelectionChange={(ids) => {
          setResult(null);
          setSelectedIds(ids);
        }}
        minItems={2}
        maxItems={5}
        labelLookup={comboboxLabelLookup}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => void run()}
          disabled={loading || selectedIds.length < 2}
        >
          Analyze
        </Button>
        {result && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => void exportNote()}
            disabled={exportBusy}
          >
            Export as note
          </Button>
        )}
      </div>

      {synthesis && (
        <div className="prose prose-sm dark:prose-invert max-w-none border rounded-lg p-4 bg-gray-50 dark:bg-gray-900/40">
          <h3 className="text-lg">Overall synthesis</h3>
          <p className="whitespace-pre-wrap">{synthesis}</p>
        </div>
      )}

      {Array.isArray(matrix) && matrix.length > 0 && tableCols.length > 0 && (
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="sticky left-0 z-10 bg-gray-100 dark:bg-gray-800 px-3 py-2 text-left border-b">
                  Theme
                </th>
                {tableCols.map((c) => (
                  <th key={c} className="px-3 py-2 text-left border-b whitespace-nowrap">
                    {titleMap[c] || c.slice(0, 8) + '…'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="sticky left-0 z-10 bg-white dark:bg-gray-900 px-3 py-2 font-medium">
                    {String(row.theme ?? row.topic ?? '—')}
                  </td>
                  {tableCols.map((c) => (
                    <td key={c} className="px-3 py-2 align-top text-gray-700 dark:text-gray-300">
                      {String(row[c] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {Array.isArray(themes) && themes.length > 0 && !matrix?.length && (
        <div className="space-y-2 text-sm">
          {themes.map((t, i) => (
            <div key={i} className="border rounded-lg p-3 bg-white dark:bg-gray-800">
              <p className="font-semibold">{String(t.theme ?? t.topic ?? `Theme ${i + 1}`)}</p>
              <pre className="text-xs mt-2 overflow-auto whitespace-pre-wrap">
                {JSON.stringify(t, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
