import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ClipboardList } from 'lucide-react';
import { vaultPrimitivesService } from '@/services/knowledge-vault/vault-primitives.service';
import Button from '@/components/atoms/Button';

export default function CheatSheetPage() {
  const queryClient = useQueryClient();

  const q = useQuery({
    queryKey: ['knowledge-cheat-sheet'],
    queryFn: async () => {
      const res = await vaultPrimitivesService.getCheatSheet();
      if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed');
      return res.data;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await vaultPrimitivesService.generateCheatSheet();
      if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed to generate');
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['knowledge-cheat-sheet'] });
    },
  });

  const hasContent = Boolean(q.data?.markdownContent?.trim());
  const generateLabel = generateMutation.isPending
    ? 'Generating…'
    : hasContent
      ? 'Regenerate Cheat Sheet'
      : 'Generate Cheat Sheet';

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex items-start gap-3 min-w-0">
          <ClipboardList className="w-9 h-9 text-green-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly Cheat Sheet</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              From your vault notes (same pipeline as the weekly job). Week:{' '}
              {q.data?.weekDate ?? '—'}
            </p>
          </div>
        </div>
        {!q.isLoading && (
          <Button
            type="button"
            variant={hasContent ? 'secondary' : 'primary'}
            size="default"
            className="shrink-0 w-full sm:w-auto"
            disabled={generateMutation.isPending}
            onClick={() => void generateMutation.mutate()}
          >
            {generateLabel}
          </Button>
        )}
      </div>

      {generateMutation.isError && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {generateMutation.error instanceof Error
            ? generateMutation.error.message
            : 'Could not generate Cheat Sheet'}
        </p>
      )}

      {q.isLoading && <p className="text-gray-500">Loading…</p>}
      {q.isError && (
        <p className="text-red-600">{q.error instanceof Error ? q.error.message : 'Error'}</p>
      )}

      {hasContent ? (
        <article className="prose dark:prose-invert max-w-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{q.data!.markdownContent}</ReactMarkdown>
        </article>
      ) : (
        !q.isLoading && (
          <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/70 dark:bg-gray-900/35 px-6 py-12 text-center max-w-xl mx-auto">
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              No Cheat Sheet yet. You can generate one anytime from your latest vault notes—no need
              to wait for the scheduled job.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              Use{' '}
              <span className="font-medium text-gray-600 dark:text-gray-300">
                Generate Cheat Sheet
              </span>{' '}
              above.
            </p>
          </div>
        )
      )}
    </div>
  );
}
