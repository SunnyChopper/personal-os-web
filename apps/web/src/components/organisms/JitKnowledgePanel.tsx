import { useQuery } from '@tanstack/react-query';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { vaultPrimitivesService } from '@/services/knowledge-vault/vault-primitives.service';

interface JitKnowledgePanelProps {
  query: string;
  contextId?: string;
}

export function JitKnowledgePanel({ query, contextId }: JitKnowledgePanelProps) {
  const [open, setOpen] = useState(true);
  const q = query.trim();

  const jit = useQuery({
    queryKey: ['knowledge-jit', q, contextId],
    enabled: q.length > 2,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await vaultPrimitivesService.jitSearch(q, contextId);
      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'JIT search failed');
      }
      return res.data.hits as Array<{
        vaultItemId: string;
        vaultItemType: string;
        title: string;
        score: number;
        summary?: string | null;
      }>;
    },
  });

  if (q.length <= 2) return null;

  return (
    <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900/50 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
          <BookOpen className="w-4 h-4" />
          Related vault notes
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="p-4 space-y-2 bg-white dark:bg-gray-800">
          {jit.isLoading && <p className="text-sm text-gray-500">Searching knowledge vault…</p>}
          {jit.isError && (
            <p className="text-sm text-amber-600">
              {jit.error instanceof Error ? jit.error.message : 'Could not load related notes.'}
            </p>
          )}
          {jit.data?.length === 0 && !jit.isLoading && (
            <p className="text-sm text-gray-500">No close matches yet.</p>
          )}
          {jit.data?.map((h) => (
            <a
              key={h.vaultItemId}
              href={`/admin/knowledge-vault/library?highlight=${encodeURIComponent(h.vaultItemId)}`}
              className="block p-2 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/40"
            >
              <p className="text-sm font-medium text-gray-900 dark:text-white">{h.title}</p>
              <p className="text-xs text-gray-500">
                {h.vaultItemType} · score {(h.score * 100).toFixed(0)}%
              </p>
              {h.summary && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {h.summary}
                </p>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
