import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Database,
  Loader2,
  MessageSquare,
  ShieldAlert,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { ToolApprovalCard } from '@/components/molecules/ToolApprovalCard';
import { getVisibleExecutionTraceEntries } from '@/lib/chat/assistant-execution-trace-entries';
import type {
  StatusEntry,
  WsToolApprovalRequiredPayload,
  WsToolCallCompletePayload,
} from '@/types/chatbot';

interface AssistantExecutionTraceProps {
  statusHistory: StatusEntry[];
  isActive: boolean;
  /** Tool call input/output per completion (order matches Running tool status entries) */
  toolCallDetails?: WsToolCallCompletePayload[];
  /** Model reasoning stream (thinkingDelta / persisted thinking); shown under the latest planning step. */
  assistantThinkingText?: string;
  assistantThinkingStreaming?: boolean;
  /** Strip outer card when nested (e.g. inside a collapsible panel). */
  bare?: boolean;
  /** Live HITL payloads keyed by approvalId */
  pendingToolApprovals?: Record<string, WsToolApprovalRequiredPayload>;
  runId?: string;
  onRespondToToolApproval?: (
    runId: string,
    approvalId: string,
    decision: 'approve' | 'reject'
  ) => void;
}

type StageConfig = {
  icon: LucideIcon;
  color: string;
  defaultLabel: string;
};

const STAGE_CONFIG: Record<StatusEntry['stage'], StageConfig> = {
  planning: {
    icon: Brain,
    color: 'text-violet-500 dark:text-violet-400',
    defaultLabel: 'Planning your answer',
  },
  runningTools: {
    icon: Wrench,
    color: 'text-amber-500 dark:text-amber-400',
    defaultLabel: 'Running tools',
  },
  responding: {
    icon: MessageSquare,
    color: 'text-blue-500 dark:text-blue-400',
    defaultLabel: 'Generating response',
  },
  persisting: {
    icon: Database,
    color: 'text-emerald-500 dark:text-emerald-400',
    defaultLabel: 'Saving response',
  },
  awaitingApproval: {
    icon: ShieldAlert,
    color: 'text-amber-600 dark:text-amber-400',
    defaultLabel: 'Awaiting your approval',
  },
  approvalResolved: {
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    defaultLabel: 'Approval recorded',
  },
};

function formatDurationMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function parseToolName(message: string | undefined): string | null {
  if (!message) return null;
  const match = message.match(/^Running tool:\s*(.+)$/i);
  return match ? match[1].trim() : null;
}

function formatLabel(entry: StatusEntry): string {
  const toolName = parseToolName(entry.message);
  if (toolName) return toolName;
  if (entry.message) return entry.message;
  return STAGE_CONFIG[entry.stage].defaultLabel;
}

type PlanningReasoningSlot = {
  text: string;
  isStreaming: boolean;
};

interface TraceEntryProps {
  entry: StatusEntry;
  isLast: boolean;
  isActive: boolean;
  nextStartedAt: number | undefined;
  toolDetails?: WsToolCallCompletePayload | null;
  planningReasoning?: PlanningReasoningSlot | null;
}

function TraceEntry({
  entry,
  isLast,
  isActive,
  nextStartedAt,
  toolDetails,
  planningReasoning,
}: TraceEntryProps) {
  const [toolExpanded, setToolExpanded] = useState(false);
  const userCollapsedReasoning = useRef(false);
  const [reasoningExpanded, setReasoningExpanded] = useState(() =>
    Boolean(
      planningReasoning && (planningReasoning.text.length > 0 || planningReasoning.isStreaming)
    )
  );
  const config = STAGE_CONFIG[entry.stage];
  const Icon = config.icon;
  const toolName = parseToolName(entry.message);
  /** HITL resolution is done as soon as the user approves; do not spin while the tool executes. */
  const isCompleted = !isActive || !isLast || entry.stage === 'approvalResolved';
  const durationMs = isCompleted
    ? nextStartedAt != null
      ? nextStartedAt - entry.startedAt
      : (toolDetails?.durationMs ?? null)
    : (toolDetails?.durationMs ?? null);
  const canExpandTool = Boolean(toolDetails && toolName);
  const displayDurationMs =
    durationMs !== null && durationMs > 0 ? durationMs : (toolDetails?.durationMs ?? null);

  useEffect(() => {
    if (planningReasoning?.isStreaming && !userCollapsedReasoning.current) {
      setReasoningExpanded(true);
    }
  }, [planningReasoning?.isStreaming]);

  const toggleReasoning = () => {
    userCollapsedReasoning.current = true;
    setReasoningExpanded((e) => !e);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="flex items-start gap-2.5"
    >
      {/* Step indicator */}
      <div className="relative flex flex-col items-center">
        <div
          className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full ${
            isCompleted ? 'bg-gray-100 dark:bg-gray-700' : 'bg-gray-50 dark:bg-gray-800'
          }`}
        >
          {isCompleted ? (
            <CheckCircle2 size={14} className="text-gray-400 dark:text-gray-500" />
          ) : (
            <Loader2 size={12} className={`animate-spin ${config.color}`} />
          )}
        </div>
        {!isLast && (
          <div
            className="mt-1 h-full w-px bg-gray-200 dark:bg-gray-700"
            style={{ minHeight: '12px' }}
          />
        )}
      </div>

      {/* Step content */}
      <div className="min-w-0 flex-1 pb-2">
        {planningReasoning ? (
          <>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleReasoning}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                aria-expanded={reasoningExpanded}
              >
                {reasoningExpanded ? (
                  <ChevronDown size={14} className="shrink-0 text-gray-500" />
                ) : (
                  <ChevronRight size={14} className="shrink-0 text-gray-500" />
                )}
                <Icon
                  size={12}
                  className={`mt-0.5 shrink-0 ${isCompleted ? 'text-gray-400 dark:text-gray-500' : config.color}`}
                />
                <span
                  className={`min-w-0 truncate text-xs ${
                    isCompleted
                      ? 'text-gray-500 dark:text-gray-400'
                      : 'font-medium text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {formatLabel(entry)}
                </span>
              </button>
              {displayDurationMs !== null && displayDurationMs > 0 && (
                <span className="ml-auto shrink-0 tabular-nums text-[10px] text-gray-400 dark:text-gray-500">
                  {formatDurationMs(displayDurationMs)}
                </span>
              )}
              {!isCompleted && (
                <Circle
                  size={6}
                  className="ml-auto shrink-0 animate-pulse text-gray-300 dark:text-gray-600"
                />
              )}
            </div>
            {reasoningExpanded && (
              <div className="mt-2 space-y-2 rounded border border-gray-200 bg-gray-50 p-2 text-xs dark:border-gray-700 dark:bg-gray-800/50">
                <div className="mb-1 font-medium text-gray-600 dark:text-gray-400">
                  Internal reasoning
                </div>
                <pre className="max-h-64 overflow-y-auto overflow-x-auto whitespace-pre-wrap break-words rounded bg-white p-2 font-mono text-[11px] leading-relaxed text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                  {planningReasoning.text.trim()
                    ? planningReasoning.text
                    : planningReasoning.isStreaming
                      ? 'Receiving reasoning from the model…'
                      : 'No reasoning stream was captured for this run (the thinking model may be disabled).'}
                </pre>
              </div>
            )}
          </>
        ) : canExpandTool ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setToolExpanded((e) => !e)}
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
              aria-expanded={toolExpanded}
            >
              {toolExpanded ? (
                <ChevronDown size={14} className="shrink-0 text-gray-500" />
              ) : (
                <ChevronRight size={14} className="shrink-0 text-gray-500" />
              )}
              <Icon
                size={12}
                className={`mt-0.5 shrink-0 ${isCompleted ? 'text-gray-400 dark:text-gray-500' : config.color}`}
              />
              <span className="truncate text-xs text-gray-500 dark:text-gray-400">Tool:</span>
              <code
                className={`min-w-0 truncate rounded px-1 py-0.5 font-mono text-[10px] ${
                  isCompleted ? 'bg-gray-100 dark:bg-gray-700' : 'bg-amber-50 dark:bg-amber-900/20'
                }`}
              >
                {toolName}
              </code>
            </button>
            {displayDurationMs !== null && displayDurationMs > 0 && (
              <span className="ml-auto shrink-0 tabular-nums text-[10px] text-gray-400 dark:text-gray-500">
                {formatDurationMs(displayDurationMs)}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Icon
              size={12}
              className={`mt-0.5 shrink-0 ${isCompleted ? 'text-gray-400 dark:text-gray-500' : config.color}`}
            />
            <span
              className={`min-w-0 truncate text-xs ${
                isCompleted
                  ? 'text-gray-500 dark:text-gray-400'
                  : 'font-medium text-gray-700 dark:text-gray-200'
              }`}
            >
              {toolName ? (
                <>
                  <span className={isCompleted ? undefined : 'text-gray-500 dark:text-gray-400'}>
                    Tool:{' '}
                  </span>
                  <code
                    className={`rounded px-1 py-0.5 font-mono text-[10px] ${
                      isCompleted
                        ? 'bg-gray-100 dark:bg-gray-700'
                        : 'bg-amber-50 dark:bg-amber-900/20'
                    }`}
                  >
                    {toolName}
                  </code>
                </>
              ) : (
                formatLabel(entry)
              )}
            </span>
            {displayDurationMs !== null && displayDurationMs > 0 && (
              <span className="ml-auto shrink-0 tabular-nums text-[10px] text-gray-400 dark:text-gray-500">
                {formatDurationMs(displayDurationMs)}
              </span>
            )}
            {!isCompleted && (
              <Circle
                size={6}
                className="ml-auto shrink-0 animate-pulse text-gray-300 dark:text-gray-600"
              />
            )}
          </div>
        )}

        {canExpandTool && toolExpanded && toolDetails && (
          <div className="mt-2 space-y-2 rounded border border-gray-200 bg-gray-50 p-2 text-xs dark:border-gray-700 dark:bg-gray-800/50">
            <div>
              <div className="mb-1 font-medium text-gray-600 dark:text-gray-400">Input</div>
              <pre className="overflow-x-auto rounded bg-white p-2 font-mono text-[10px] dark:bg-gray-900">
                {JSON.stringify(toolDetails.arguments, null, 2)}
              </pre>
            </div>
            <div>
              <div className="mb-1 font-medium text-gray-600 dark:text-gray-400">Output</div>
              {toolDetails.error && (
                <p className="text-red-600 dark:text-red-400">{toolDetails.error}</p>
              )}
              {toolDetails.result !== undefined && (
                <pre className="overflow-x-auto rounded bg-white p-2 font-mono text-[10px] dark:bg-gray-900">
                  {typeof toolDetails.result === 'object'
                    ? JSON.stringify(toolDetails.result, null, 2)
                    : String(toolDetails.result)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function AssistantExecutionTrace({
  statusHistory,
  isActive,
  toolCallDetails,
  assistantThinkingText,
  assistantThinkingStreaming,
  bare = false,
  pendingToolApprovals,
  runId,
  onRespondToToolApproval,
}: AssistantExecutionTraceProps) {
  const shouldReduceMotion = useReducedMotion();

  const visibleEntries = getVisibleExecutionTraceEntries(statusHistory);
  let lastPlanningVisibleIndex = -1;
  for (let i = visibleEntries.length - 1; i >= 0; i--) {
    if (visibleEntries[i].stage === 'planning') {
      lastPlanningVisibleIndex = i;
      break;
    }
  }
  const toolEntryCount = visibleEntries.filter(
    (e) => e.stage === 'runningTools' && parseToolName(e.message)
  ).length;

  useEffect(() => {
    if (
      import.meta.env.DEV &&
      toolEntryCount > 0 &&
      (toolCallDetails?.length ?? 0) < toolEntryCount
    ) {
      console.warn(
        '[AssistantExecutionTrace] Tool steps exceed toolCallDetails; expandable rows may be missing.',
        { toolEntryCount, toolCallDetailsLength: toolCallDetails?.length ?? 0 }
      );
    }
  }, [toolEntryCount, toolCallDetails?.length]);

  if (visibleEntries.length === 0) {
    return null;
  }

  const toolIndexFor = (i: number) =>
    visibleEntries.slice(0, i).filter((e) => e.stage === 'runningTools' && parseToolName(e.message))
      .length;

  return (
    <div
      className={
        bare
          ? 'px-1 pt-0.5'
          : 'mb-2 rounded-lg border border-gray-200/80 bg-white/50 px-3 py-2.5 dark:border-gray-700/60 dark:bg-gray-800/30'
      }
    >
      <AnimatePresence initial={false}>
        {visibleEntries.map((entry, index) => {
          const isLast = index === visibleEntries.length - 1;
          const nextEntry = visibleEntries[index + 1];

          if (entry.stage === 'awaitingApproval') {
            const cfg = STAGE_CONFIG.awaitingApproval;
            const Icon = cfg.icon;
            const pending = entry.approvalId ? pendingToolApprovals?.[entry.approvalId] : undefined;
            return (
              <motion.div
                key={`awaitingApproval-${entry.startedAt}-${index}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="flex items-start gap-2.5"
              >
                <div className="relative flex flex-col items-center">
                  <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/25">
                    <Icon size={12} className={cfg.color} />
                  </div>
                  {!isLast && (
                    <div
                      className="mt-1 h-full w-px bg-gray-200 dark:bg-gray-700"
                      style={{ minHeight: '12px' }}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1 pb-2">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-200">
                    {entry.message ?? cfg.defaultLabel}
                  </p>
                  {pending && runId && onRespondToToolApproval ? (
                    <ToolApprovalCard
                      payload={pending}
                      runId={runId}
                      onRespond={onRespondToToolApproval}
                    />
                  ) : (
                    <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                      Choice submitted — updating run…
                    </p>
                  )}
                </div>
              </motion.div>
            );
          }

          const isToolEntry = entry.stage === 'runningTools' && parseToolName(entry.message);
          const toolIndex = toolIndexFor(index);
          const toolDetails = isToolEntry ? (toolCallDetails?.[toolIndex] ?? null) : null;
          const planningReasoning =
            entry.stage === 'planning' && index === lastPlanningVisibleIndex
              ? {
                  text: assistantThinkingText ?? '',
                  isStreaming: Boolean(assistantThinkingStreaming),
                }
              : null;
          return (
            <TraceEntry
              key={`${entry.stage}-${entry.startedAt}-${index}`}
              entry={entry}
              isLast={isLast}
              isActive={isActive}
              nextStartedAt={nextEntry?.startedAt}
              toolDetails={toolDetails ?? undefined}
              planningReasoning={planningReasoning}
            />
          );
        })}
      </AnimatePresence>

      {/* Pending indicator for next expected step (hidden while HITL row is the latest — tool run follows as new steps). */}
      {isActive &&
        visibleEntries.length > 0 &&
        visibleEntries[visibleEntries.length - 1]?.stage !== 'approvalResolved' && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 pt-0.5"
          >
            <div className="flex h-5 w-5 items-center justify-center">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>
            <div className="flex gap-1">
              <div
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-300 dark:bg-gray-600"
                style={{ animationDelay: '0ms' }}
              />
              <div
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-300 dark:bg-gray-600"
                style={{ animationDelay: '150ms' }}
              />
              <div
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-300 dark:bg-gray-600"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          </motion.div>
        )}
    </div>
  );
}
