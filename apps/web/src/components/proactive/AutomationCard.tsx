import { useState } from 'react';
import { Sun, Moon, Zap, Pencil, Trash2, Play, History, TrendingUp, BookMarked } from 'lucide-react';
import Dialog from '@/components/molecules/Dialog';
import Button from '@/components/atoms/Button';
import { cn } from '@/lib/utils';
import { formatProactiveLocalTime12h } from '@/components/proactive/format-proactive-time';
import { formatProactiveAssistantRunConfigSummary } from '@/lib/proactive/assistant-run-config';
import type { ProactiveAutomation, ProactiveAutomationKind } from '@/types/api-contracts';
import type { AssistantModelCatalogData } from '@/types/chatbot';

const KIND_ICONS: Record<ProactiveAutomationKind, typeof Sun> = {
  dailyBriefing: Sun,
  logbookEvening: Moon,
  custom: Zap,
  dailyLearningTrends: TrendingUp,
  dailyLearningTheory: BookMarked,
};

export interface AutomationCardProps {
  automation: ProactiveAutomation;
  kindLabel: string;
  /** Optional catalog to resolve manual model ids to labels. */
  modelCatalog?: AssistantModelCatalogData | null;
  onTestRun: () => void;
  testRunPending: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  togglePending: boolean;
  onEdit: () => void;
  onDelete: () => void;
  deletePending: boolean;
  onOpenHistory: () => void;
}

function statusPill(automation: ProactiveAutomation): { label: string; className: string } {
  const status = (automation.lastStatus ?? '').toLowerCase();
  if (status === 'error' || automation.lastErrorPreview) {
    return {
      label: 'Error',
      className: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200',
    };
  }
  if (status === 'success' || status === 'ok' || status === 'succeeded') {
    return {
      label: 'Healthy',
      className: 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-200',
    };
  }
  if (status) {
    return {
      label: automation.lastStatus ?? 'Unknown',
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    };
  }
  return {
    label: 'Not run yet',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };
}

function truncate(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export default function AutomationCard({
  automation,
  kindLabel,
  modelCatalog = null,
  onTestRun,
  testRunPending,
  onToggleEnabled,
  togglePending,
  onEdit,
  onDelete,
  deletePending,
  onOpenHistory,
}: AutomationCardProps) {
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const Icon = KIND_ICONS[automation.kind];
  const pill = statusPill(automation);
  const errorPreview = automation.lastErrorPreview?.trim();
  const shortError = errorPreview ? truncate(errorPreview, 140) : null;
  const modelsLine = formatProactiveAssistantRunConfigSummary(
    automation.assistantRunConfig ?? null,
    modelCatalog
  );

  return (
    <>
      <li
        className={cn(
          'rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40',
          'shadow-sm flex h-full min-h-0 flex-col overflow-hidden',
          !automation.enabled && 'opacity-75'
        )}
      >
        <button
          type="button"
          className="flex min-h-0 flex-1 gap-3 p-4 text-left w-full border-0 bg-transparent cursor-pointer hover:bg-gray-50/90 dark:hover:bg-gray-800/40 transition-colors"
          onClick={onOpenHistory}
          aria-label={`View run history for ${kindLabel}`}
        >
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
            aria-hidden
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {automation.title?.trim() ? automation.title.trim() : kindLabel}
              </h3>
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', pill.className)}>
                {pill.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium tabular-nums">
                {formatProactiveLocalTime12h(automation.localTime)}
              </span>
              <span className="mx-1.5 text-gray-400">·</span>
              <span>{automation.timeZone}</span>
            </p>
            {modelsLine ? (
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                <span className="font-medium text-gray-500 dark:text-gray-500">Models: </span>
                {modelsLine}
              </p>
            ) : null}
            {automation.lastRunAt ? (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                Last run: {new Date(automation.lastRunAt).toLocaleString()}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">No runs recorded yet</p>
            )}
            {errorPreview ? (
              <div className="mt-2 rounded-md bg-red-50 dark:bg-red-950/30 px-2 py-1.5 text-xs text-red-800 dark:text-red-200">
                <span className="line-clamp-2">{shortError}</span>
                {errorPreview.length > 140 ? (
                  <button
                    type="button"
                    className="mt-1 block text-red-700 dark:text-red-300 underline font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      setErrorDialogOpen(true);
                    }}
                  >
                    View full error
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </button>

        <div className="mt-auto flex shrink-0 flex-wrap items-center gap-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 px-4 py-3 dark:bg-gray-950/30">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-lg !px-3 !py-1.5 text-xs gap-1"
            disabled={testRunPending}
            onClick={onTestRun}
          >
            <Play className="h-3.5 w-3.5 shrink-0" />
            {testRunPending ? 'Running…' : 'Test run'}
          </Button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
            onClick={onOpenHistory}
          >
            <History className="h-3.5 w-3.5" />
            History
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 disabled:opacity-50"
            onClick={onEdit}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
          <label className="inline-flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 ml-auto sm:ml-0">
            <input
              type="checkbox"
              className="rounded border-gray-400"
              checked={automation.enabled}
              disabled={togglePending}
              onChange={(e) => onToggleEnabled(e.target.checked)}
            />
            Enabled
          </label>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:underline disabled:opacity-50 ml-auto"
            disabled={deletePending}
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </li>

      <Dialog
        isOpen={errorDialogOpen}
        onClose={() => setErrorDialogOpen(false)}
        title="Run error"
        size="lg"
      >
        <pre className="text-xs whitespace-pre-wrap break-words font-mono bg-gray-100 dark:bg-gray-900 p-3 rounded-md max-h-[50vh] overflow-auto">
          {errorPreview}
        </pre>
      </Dialog>
    </>
  );
}
