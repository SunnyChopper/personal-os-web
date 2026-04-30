import { memo, useMemo } from 'react';
import { getVisibleExecutionTraceEntries } from '@/lib/chat/assistant-execution-trace-entries';
import { AlertTriangle, Loader2, Search, Sparkles } from 'lucide-react';
import MarkdownRenderer from '@/components/molecules/MarkdownRenderer';
import { AssistantExecutionTracePanel } from '@/components/molecules/AssistantExecutionTracePanel';
import { AssistantThinkingPanel } from '@/components/molecules/AssistantThinkingPanel';
import { ChatAssistantPendingRow } from '@/components/molecules/ChatAssistantPendingRow';
import { ChatMessageSiblingNav } from '@/components/molecules/ChatMessageSiblingNav';
import { ChatUserMessageToolbar } from '@/components/molecules/ChatUserMessageToolbar';
import { formatRelativeChatTimestamp } from '@/lib/chat/format-relative-time';
import { shouldShowAssistantErrorDetails } from '@/lib/chat/assistant-error-display';
import { getRunProgressLabel } from '@/hooks/useAssistantStreaming';
import {
  chatMessageMarkdownComponents,
  chatUserMessageMarkdownComponents,
} from '@/lib/markdown/chat-message-markdown-components';
import type { AssistantStreamingRunState } from '@/lib/websocket/thinking-delta-cache';
import type {
  ChatMessage,
  StatusEntry,
  WsStatusUpdatePayload,
  WsToolApprovalRequiredPayload,
  WsToolCallCompletePayload,
} from '@/types/chatbot';

type StreamingRunStatusStage = NonNullable<WsStatusUpdatePayload['stage']> | 'awaitingApproval';

export type ChatMessageStreamingRun = AssistantStreamingRunState & {
  runId?: string;
  statusStage?: StreamingRunStatusStage;
  statusMessage?: string;
  statusHistory?: StatusEntry[];
  toolCallDetails?: WsToolCallCompletePayload[];
  pendingToolApprovals?: Record<string, WsToolApprovalRequiredPayload>;
};

/** Shown after runStarted until the first statusUpdate — execution trace is empty and the main bubble is hidden. */
function StreamingAssistantPreTraceRow({ run }: { run: ChatMessageStreamingRun }) {
  return (
    <div className="rounded-lg border border-gray-200/80 bg-white/50 px-3 py-2.5 dark:border-gray-700/60 dark:bg-gray-800/30 flex items-center gap-2">
      <Loader2 size={14} className="animate-spin text-gray-500 dark:text-gray-400" />
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {getRunProgressLabel(run) ?? 'Planning response'}
      </span>
    </div>
  );
}

type ChatMessageRowProps = {
  message: ChatMessage;
  index: number;
  transcriptLength: number;
  run: ChatMessageStreamingRun | undefined;
  /** Active WS run whose user turn is this message — suppresses redundant pending strip under the user bubble. */
  streamingRunForThisUserMessage?: ChatMessageStreamingRun;
  getSiblings: (messageId: string) => string[];
  latestUserMessageId: string | null;
  isLoading: boolean;
  isStreaming: boolean;
  isAwaitingRunStart: boolean;
  /** True while saving the user message or handing off to WS before runStarted (shows planning row immediately). */
  awaitingWsFollowUp: boolean;
  /** Per-row expanded state so memo is not busted by unrelated accordion toggles. */
  thinkingPanelExpanded: boolean;
  onToggleThinking: (messageId: string) => void;
  executionTracePanelExpanded: boolean;
  onToggleExecutionTrace: (messageId: string) => void;
  editingMessageId: string | null;
  onSetEditingMessageId: (id: string | null) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onRetryAssistantRun: (userMessageId?: string, failedAssistantId?: string) => void;
  onRetryUserMessage: (messageContent: string, failedMessageId?: string) => void;
  onSendFollowUp: (userMessageId: string) => void;
  onSelectSibling: (messageId: string, direction: 'prev' | 'next') => void;
  onRespondToToolApproval?: (
    runId: string,
    approvalId: string,
    decision: 'approve' | 'reject'
  ) => void;
};

export const ChatMessageRow = memo(function ChatMessageRow({
  message,
  index,
  transcriptLength,
  run,
  streamingRunForThisUserMessage,
  getSiblings,
  latestUserMessageId,
  isLoading,
  isStreaming,
  isAwaitingRunStart,
  awaitingWsFollowUp,
  thinkingPanelExpanded,
  onToggleThinking,
  executionTracePanelExpanded,
  onToggleExecutionTrace,
  editingMessageId,
  onSetEditingMessageId,
  onEditMessage,
  onRetryAssistantRun,
  onRetryUserMessage,
  onSendFollowUp,
  onSelectSibling,
  onRespondToToolApproval,
}: ChatMessageRowProps) {
  const siblings = getSiblings(message.id);
  const currentIndex = siblings.indexOf(message.id);
  const isStreamingThinking = Boolean(run?.thinkingBuffer?.trim());
  const hasBufferedThinking = Boolean(run?.thinkingBuffer?.trim());
  const isEmptyStreamingAssistantPlaceholder =
    message.role === 'assistant' &&
    Boolean(run) &&
    !message.content.trim() &&
    !message.thinking?.trim() &&
    !hasBufferedThinking &&
    message.clientStatus !== 'failed';
  const isLastMessage = index === transcriptLength - 1;
  const isLatestUserRow = message.role === 'user' && message.id === latestUserMessageId;
  const assistantKickoffInProgress =
    isAwaitingRunStart || awaitingWsFollowUp || (isLoading && message.id === latestUserMessageId);
  /** Single strip: "Sending…" then kickoff progress (latest user only). Hidden once runStarted so the assistant row owns planning UI. */
  const showAssistantPendingStrip =
    isLatestUserRow &&
    !streamingRunForThisUserMessage &&
    (message.clientStatus === 'sending' || assistantKickoffInProgress);
  const assistantPendingPhase =
    message.clientStatus === 'sending' ? ('sending' as const) : ('planning' as const);
  const isLatestUserMessageRetryable =
    message.role === 'user' &&
    message.id === latestUserMessageId &&
    message.clientStatus !== 'sending' &&
    !isLoading &&
    !isStreaming &&
    !isAwaitingRunStart &&
    !awaitingWsFollowUp;
  const showRetryAction =
    (isLastMessage && message.clientStatus === 'failed') || isLatestUserMessageRetryable;

  /** Live trace uses run state; after the run completes the trace must come from persisted message fields. */
  const executionTraceHistory =
    (run?.statusHistory?.length ?? 0) > 0
      ? (run?.statusHistory ?? [])
      : (message.executionSteps ?? []);
  const executionTraceToolDetails = run?.toolCallDetails ?? message.toolCallDetails;
  const pendingApprovalCount = run?.pendingToolApprovals
    ? Object.keys(run.pendingToolApprovals).length
    : 0;
  const visibleTraceEntries = useMemo(
    () => getVisibleExecutionTraceEntries(executionTraceHistory),
    [executionTraceHistory]
  );
  const showExecutionTrace =
    message.role === 'assistant' && (visibleTraceEntries.length > 0 || pendingApprovalCount > 0);
  const traceHasPlanning = visibleTraceEntries.some((e) => e.stage === 'planning');
  /** Fold thinkingDelta into the latest planning row instead of a separate “Thinking” accordion. */
  const foldThinkingIntoTrace = showExecutionTrace && traceHasPlanning;
  const assistantThinkingForTrace = run?.thinkingBuffer?.trim() || message.thinking?.trim() || '';
  const assistantThinkingStreaming = Boolean(run?.thinkingBuffer?.trim());

  /** Thinking stream duplicates the execution trace during HITL; hide standalone panel until the reply has body text. */
  const hitlSuppressesThinking =
    message.role === 'assistant' &&
    Boolean(run) &&
    showExecutionTrace &&
    !foldThinkingIntoTrace &&
    !message.content.trim() &&
    (pendingApprovalCount > 0 ||
      run?.statusStage === 'awaitingApproval' ||
      (run?.statusHistory ?? []).some(
        (e) => e.stage === 'approvalResolved' || e.stage === 'awaitingApproval'
      ));

  const showAssistantReplyBubble =
    message.role !== 'assistant' ||
    Boolean(message.content.trim()) ||
    message.clientStatus === 'failed' ||
    !(showExecutionTrace && Boolean(run) && !message.content.trim());

  const userRetryHandler = useMemo(
    () => () => {
      if (message.clientStatus === 'failed') {
        onRetryUserMessage(message.content, message.clientMessageId || message.id);
        return;
      }
      onSendFollowUp(message.id);
    },
    [
      message.clientStatus,
      message.content,
      message.clientMessageId,
      message.id,
      onRetryUserMessage,
      onSendFollowUp,
    ]
  );

  return (
    <div className="group">
      <div
        className={`flex gap-2 sm:gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
      >
        {message.role === 'assistant' && (
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
            <Sparkles size={16} className="text-blue-600 dark:text-blue-400 max-sm:scale-90" />
          </div>
        )}
        <div
          className={
            message.role === 'user'
              ? 'min-w-0 max-w-[min(100%,34rem)]'
              : 'min-w-0 flex-1 max-w-full sm:max-w-[min(100%,48rem)]'
          }
        >
          {showExecutionTrace && (
            <AssistantExecutionTracePanel
              messageId={message.id}
              statusHistory={executionTraceHistory}
              isActive={Boolean(run)}
              toolCallDetails={executionTraceToolDetails}
              assistantThinkingText={assistantThinkingForTrace}
              assistantThinkingStreaming={assistantThinkingStreaming}
              expanded={executionTracePanelExpanded}
              onToggle={() => onToggleExecutionTrace(message.id)}
              pendingToolApprovals={run?.pendingToolApprovals}
              runId={run?.runId}
              onRespondToToolApproval={onRespondToToolApproval}
            />
          )}
          {message.role === 'assistant' &&
            !foldThinkingIntoTrace &&
            !hitlSuppressesThinking &&
            (Boolean(message.thinking?.trim()) || isStreamingThinking) && (
              <AssistantThinkingPanel
                messageId={message.id}
                thinking={message.thinking}
                expanded={thinkingPanelExpanded}
                isStreamingThinking={isStreamingThinking}
                onToggle={() => onToggleThinking(message.id)}
              />
            )}

          {message.metadata?.webSearch && (
            <div className="mb-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <Search size={14} />
              <span>Searched: {message.metadata.searchQuery}</span>
            </div>
          )}

          {editingMessageId === message.id ? (
            <input
              type="text"
              defaultValue={message.content}
              onBlur={(e) => {
                if (e.target.value !== message.content) {
                  onEditMessage(message.id, e.target.value);
                } else {
                  onSetEditingMessageId(null);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onEditMessage(message.id, e.currentTarget.value);
                } else if (e.key === 'Escape') {
                  onSetEditingMessageId(null);
                }
              }}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          ) : (
            <>
              {isEmptyStreamingAssistantPlaceholder &&
                run &&
                (run.statusHistory?.length ?? 0) === 0 && (
                  <StreamingAssistantPreTraceRow run={run} />
                )}
              {!isEmptyStreamingAssistantPlaceholder && showAssistantReplyBubble && (
                <>
                  <div
                    className={`min-w-0 w-full rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {message.role === 'assistant' && message.clientStatus === 'failed' ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                          <AlertTriangle size={14} />
                          <span className="font-medium">Assistant run failed</span>
                        </div>
                        {shouldShowAssistantErrorDetails(message.clientError) && (
                          <pre className="text-xs leading-relaxed whitespace-pre-wrap break-words text-red-600 dark:text-red-200 font-mono">
                            {message.clientError}
                          </pre>
                        )}
                        <button
                          type="button"
                          onClick={() => onRetryAssistantRun(message.parentId, message.id)}
                          className="text-sm underline underline-offset-2 hover:text-red-800 dark:hover:text-red-100"
                        >
                          Retry
                        </button>
                      </div>
                    ) : message.role === 'assistant' ? (
                      message.content.trim() ? (
                        <MarkdownRenderer
                          content={message.content}
                          variant="chat"
                          contentKey={message.id}
                          className="prose-p:my-3 prose-ul:my-2 prose-li:my-1"
                          components={chatMessageMarkdownComponents}
                        />
                      ) : (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          No reply text was returned for this run. Use the execution steps above to
                          see what ran.
                        </p>
                      )
                    ) : (
                      <MarkdownRenderer
                        content={message.content}
                        variant="chat"
                        contentKey={message.id}
                        className="prose-invert !prose-strong:text-white prose-p:my-3 prose-ul:my-2 prose-li:my-1"
                        components={chatUserMessageMarkdownComponents}
                      />
                    )}
                  </div>
                  {message.role === 'user' ? (
                    <ChatUserMessageToolbar
                      message={message}
                      showRetryAction={showRetryAction}
                      onEdit={() => onSetEditingMessageId(message.id)}
                      onRetryClick={userRetryHandler}
                    />
                  ) : (
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                      <span>{formatRelativeChatTimestamp(message.createdAt)}</span>
                    </div>
                  )}
                </>
              )}
              {message.role === 'user' &&
                message.clientStatus === 'sending' &&
                !showAssistantPendingStrip && (
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Loader2 size={12} className="animate-spin" />
                    <span>Sending...</span>
                  </div>
                )}
              {message.role === 'user' && message.clientStatus === 'failed' && (
                <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                  <span title={message.clientError || 'Message failed to send'}>Not delivered</span>
                </div>
              )}
            </>
          )}

          {message.role === 'user' && (
            <ChatMessageSiblingNav
              messageId={message.id}
              siblings={siblings}
              currentIndex={currentIndex}
              onSelectSibling={onSelectSibling}
            />
          )}
        </div>
      </div>
      {showAssistantPendingStrip && <ChatAssistantPendingRow phase={assistantPendingPhase} />}
    </div>
  );
});

ChatMessageRow.displayName = 'ChatMessageRow';
