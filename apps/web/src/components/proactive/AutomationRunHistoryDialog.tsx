import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import Dialog from '@/components/molecules/Dialog';
import { apiClient } from '@/lib/api-client';
import { ROUTES } from '@/routes';
import type { ProactiveAutomation, ProactiveAutomationRun } from '@/types/api-contracts';
import { cn } from '@/lib/utils';

const RUN_SOURCE_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  manual_batch: 'Manual (all enabled)',
  single_automation_test: 'Test run',
};

export interface AutomationRunHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  automation: ProactiveAutomation | null;
  kindLabel: string;
}

export default function AutomationRunHistoryDialog({
  isOpen,
  onClose,
  automation,
  kindLabel,
}: AutomationRunHistoryDialogProps) {
  const aid = automation?.id;

  const runsQ = useQuery({
    queryKey: ['proactive', 'automation-runs', aid],
    queryFn: async () => {
      if (!aid) throw new Error('No automation');
      const res = await apiClient.getProactiveAutomationRuns(aid);
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to load runs');
      return res.data.runs;
    },
    enabled: isOpen && !!aid,
  });

  const runs = runsQ.data ?? [];

  const title = automation ? `${kindLabel} — run history` : 'Run history';

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title} size="lg">
      {runsQ.isPending ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : runsQ.isError ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {(runsQ.error as Error).message}
        </p>
      ) : runs.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No recorded runs yet. History is saved for each execution after this feature is deployed.
        </p>
      ) : (
        <ul className="space-y-3 max-h-[min(70vh,32rem)] overflow-y-auto pr-1">
          {runs.map((run: ProactiveAutomationRun) => (
            <li
              key={run.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-950/40 p-3 text-sm"
            >
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <span className="font-medium text-gray-900 dark:text-white tabular-nums">
                  {new Date(run.ranAt).toLocaleString()}
                </span>
                <span
                  className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    run.status === 'succeeded'
                      ? 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200'
                  )}
                >
                  {run.status === 'succeeded' ? 'Succeeded' : 'Failed'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Source: {RUN_SOURCE_LABELS[run.runSource] ?? run.runSource}
              </p>
              {run.threadId ? (
                <a
                  href={`${ROUTES.admin.assistant}/${encodeURIComponent(run.threadId)}`}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open thread <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
              {run.responsePreview ? (
                <div className="mt-2 text-xs text-gray-700 dark:text-gray-300 rounded bg-white/80 dark:bg-gray-900/50 p-2 max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {run.responsePreview}
                </div>
              ) : null}
              {run.errorMessage ? (
                <div className="mt-2 text-xs text-red-800 dark:text-red-200 rounded bg-red-50 dark:bg-red-950/40 p-2 max-h-48 overflow-y-auto whitespace-pre-wrap font-mono">
                  {run.errorMessage}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
