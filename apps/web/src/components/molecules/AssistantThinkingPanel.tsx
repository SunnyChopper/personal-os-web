import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AIThinkingIndicator } from '@/components/atoms/AIThinkingIndicator';
import { AssistantExecutionTrace } from '@/components/molecules/AssistantExecutionTrace';
import type { StatusEntry, WsToolCallCompletePayload } from '@/types/chatbot';

interface AssistantThinkingPanelProps {
  messageId: string;
  thinking?: string;
  /** Persisted execution steps (from messageComplete); shown inside accordion when expanded */
  executionSteps?: StatusEntry[];
  /** Persisted tool call input/output (from messageComplete) so trace steps are expandable when done */
  toolCallDetails?: WsToolCallCompletePayload[];
  expanded: boolean;
  isStreamingThinking: boolean;
  onToggle: () => void;
}

const countWords = (text: string): number => {
  return text
    .split(/\s+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean).length;
};

export function AssistantThinkingPanel({
  messageId,
  thinking,
  executionSteps,
  toolCallDetails,
  expanded,
  isStreamingThinking,
  onToggle,
}: AssistantThinkingPanelProps) {
  const shouldReduceMotion = useReducedMotion();
  const hasThinking = Boolean(thinking?.trim());
  const hasExecutionSteps = Boolean(executionSteps?.length);
  const panelId = `thinking-panel-${messageId}`;

  if (!hasThinking && !isStreamingThinking && !hasExecutionSteps) {
    return null;
  }

  const label = hasThinking
    ? `Show Thinking (${countWords(thinking ?? '')} words)`
    : hasExecutionSteps
      ? `Show execution steps (${executionSteps!.length})`
      : 'Show Thinking';

  return (
    <div className="mb-2 rounded-lg border border-gray-200 bg-white/60 p-2 dark:border-gray-700 dark:bg-gray-800/40">
      <div className="flex items-center justify-between gap-2">
        {hasThinking || hasExecutionSteps ? (
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
        ) : (
          <AIThinkingIndicator size="sm" message="Assistant is thinking..." />
        )}
        {isStreamingThinking && hasThinking && (
          <AIThinkingIndicator size="sm" message="Updating..." className="shrink-0" />
        )}
      </div>
      <AnimatePresence initial={false}>
        {(hasThinking || hasExecutionSteps) && expanded && (
          <motion.div
            id={panelId}
            initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
            animate={shouldReduceMotion ? undefined : { height: 'auto', opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2">
              {hasExecutionSteps && (
                <AssistantExecutionTrace
                  statusHistory={executionSteps!}
                  isActive={false}
                  toolCallDetails={toolCallDetails}
                />
              )}
              {hasThinking && (
                <div className="whitespace-pre-wrap rounded-lg border-l-2 border-gray-300 bg-gray-100 p-3 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-300">
                  {thinking}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
