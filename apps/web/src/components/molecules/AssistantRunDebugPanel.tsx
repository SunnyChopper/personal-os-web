import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy } from 'lucide-react';
import type { AssistantDebugWsEvent } from '@/hooks/useAssistantStreaming';
import type { WsContextBudgetMetaPayload } from '@/lib/websocket/assistant-ws-client';

type ActiveRunDebug = {
  runId: string;
  threadId: string;
  statusStage?: string;
  statusMessage?: string;
  resolvedReasoningModelId?: string;
  resolvedResponseModelId?: string;
};

interface AssistantRunDebugPanelProps {
  activeRun: ActiveRunDebug | null;
  debugEvents: AssistantDebugWsEvent[];
  contextBudgetMeta: WsContextBudgetMetaPayload | null;
}

export function AssistantRunDebugPanel({
  activeRun,
  debugEvents,
  contextBudgetMeta,
}: AssistantRunDebugPanelProps) {
  const [expanded, setExpanded] = useState(true);

  if (!import.meta.env.DEV) {
    return null;
  }

  const runId = activeRun?.runId ?? '—';
  const copyCmd =
    runId !== '—'
      ? `python personal-os-backend/scripts/debug_assistant_run.py --run-id ${runId}`
      : '';

  const copyRunId = async () => {
    if (!runId || runId === '—') return;
    try {
      await navigator.clipboard.writeText(runId);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mt-2 rounded-lg border border-dashed border-amber-400/60 bg-amber-50/80 p-2 text-xs dark:border-amber-600/50 dark:bg-amber-950/30">
      <button
        type="button"
        className="flex w-full items-center gap-2 text-left font-medium text-amber-900 dark:text-amber-100"
        onClick={() => setExpanded((e) => !e)}
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        Assistant run debug (dev)
      </button>
      {expanded && (
        <div className="mt-2 space-y-2 font-mono text-[10px] text-amber-950 dark:text-amber-50">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <span>
              runId:{' '}
              <button type="button" onClick={copyRunId} className="underline">
                {runId}
              </button>
            </span>
            <span>threadId: {activeRun?.threadId ?? '—'}</span>
            <span>stage: {activeRun?.statusStage ?? '—'}</span>
          </div>
          {(activeRun?.resolvedReasoningModelId || activeRun?.resolvedResponseModelId) && (
            <div>
              models: {activeRun.resolvedReasoningModelId ?? '—'} →{' '}
              {activeRun.resolvedResponseModelId ?? '—'}
            </div>
          )}
          {contextBudgetMeta && (
            <div>
              context: est {contextBudgetMeta.estimatedInputTokens ?? '—'} / budget{' '}
              {contextBudgetMeta.budgetTokens ?? '—'} (window{' '}
              {contextBudgetMeta.contextWindowTokens ?? '—'})
            </div>
          )}
          {copyCmd ? (
            <div className="flex items-start gap-1">
              <code className="flex-1 break-all rounded bg-white/70 p-1 dark:bg-black/30">
                {copyCmd}
              </code>
              <button
                type="button"
                aria-label="Copy debug command"
                className="shrink-0 rounded p-1 hover:bg-amber-200/60 dark:hover:bg-amber-800/40"
                onClick={() => void navigator.clipboard.writeText(copyCmd)}
              >
                <Copy size={12} />
              </button>
            </div>
          ) : null}
          {debugEvents.length > 0 && (
            <ul className="max-h-32 space-y-0.5 overflow-y-auto rounded bg-white/60 p-1 dark:bg-black/20">
              {debugEvents.slice(0, 12).map((ev) => (
                <li key={`${ev.type}-${ev.at}`}>
                  <span className="text-amber-700 dark:text-amber-300">{ev.type}</span> {ev.summary}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
