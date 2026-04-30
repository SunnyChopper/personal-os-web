import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AssistantExecutionTrace } from '@/components/molecules/AssistantExecutionTrace';
import { getVisibleExecutionTraceEntries } from '@/lib/chat/assistant-execution-trace-entries';
import type {
  StatusEntry,
  WsToolApprovalRequiredPayload,
  WsToolCallCompletePayload,
} from '@/types/chatbot';

interface AssistantExecutionTracePanelProps {
  messageId: string;
  statusHistory: StatusEntry[];
  isActive: boolean;
  toolCallDetails?: WsToolCallCompletePayload[];
  /** Streamed or persisted model reasoning; shown under the latest planning step. */
  assistantThinkingText?: string;
  assistantThinkingStreaming?: boolean;
  expanded: boolean;
  onToggle: () => void;
  pendingToolApprovals?: Record<string, WsToolApprovalRequiredPayload>;
  runId?: string;
  onRespondToToolApproval?: (
    runId: string,
    approvalId: string,
    decision: 'approve' | 'reject'
  ) => void;
}

export function AssistantExecutionTracePanel({
  messageId,
  statusHistory,
  isActive,
  toolCallDetails,
  assistantThinkingText,
  assistantThinkingStreaming,
  expanded,
  onToggle,
  pendingToolApprovals,
  runId,
  onRespondToToolApproval,
}: AssistantExecutionTracePanelProps) {
  const shouldReduceMotion = useReducedMotion();
  const visibleCount = getVisibleExecutionTraceEntries(statusHistory).length;
  const pendingCount = Object.keys(pendingToolApprovals ?? {}).length;
  const panelId = `execution-trace-panel-${messageId}`;

  if (visibleCount === 0 && pendingCount === 0) {
    return null;
  }

  const label = expanded
    ? `Hide execution steps (${visibleCount})`
    : `Show execution steps (${visibleCount})`;

  return (
    <div className="mb-2 rounded-lg border border-gray-200 bg-white/60 p-2 dark:border-gray-700 dark:bg-gray-800/40">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2 text-sm text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          aria-expanded={expanded}
          aria-controls={panelId}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <span className="font-medium">{label}</span>
        </button>
        {isActive && (
          <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">Streaming…</span>
        )}
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={panelId}
            initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
            animate={shouldReduceMotion ? undefined : { height: 'auto', opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-lg border border-gray-200/80 bg-white/50 px-2 py-2 dark:border-gray-700/60 dark:bg-gray-800/30">
              <AssistantExecutionTrace
                statusHistory={statusHistory}
                isActive={isActive}
                toolCallDetails={toolCallDetails}
                assistantThinkingText={assistantThinkingText}
                assistantThinkingStreaming={assistantThinkingStreaming}
                bare
                pendingToolApprovals={pendingToolApprovals}
                runId={runId}
                onRespondToToolApproval={onRespondToToolApproval}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
