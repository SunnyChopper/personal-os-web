import { memo, useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Loader2 } from 'lucide-react';
import { extractErrorMessage } from '@/lib/react-query/error-utils';
import { ChatStarterSuggestions } from '@/components/molecules/ChatStarterSuggestions';
import {
  ChatMessageRow,
  type ChatMessageStreamingRun,
} from '@/components/organisms/ChatMessageRow';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types/chatbot';

export type AssistantChatTranscriptProps = {
  isTreeLoading: boolean;
  isTreeError: boolean;
  treeError: unknown;
  onRetryTree: () => void;
  transcript: ChatMessage[];
  runByAssistantMessageId: Record<string, ChatMessageStreamingRun>;
  getSiblings: (messageId: string) => string[];
  latestUserMessageId: string | null;
  isLoading: boolean;
  isStreaming: boolean;
  isAwaitingRunStart: boolean;
  awaitingWsFollowUp: boolean;
  thinkingExpanded: Record<string, boolean>;
  onToggleThinking: (messageId: string) => void;
  executionTraceExpanded: Record<string, boolean>;
  onToggleExecutionTrace: (messageId: string) => void;
  editingMessageId: string | null;
  onSetEditingMessageId: (id: string | null) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onRetryAssistantRun: (userMessageId?: string, failedAssistantId?: string) => void;
  onRetryUserMessage: (messageContent: string, failedMessageId?: string) => void;
  onSendFollowUp: (userMessageId: string) => void;
  onSelectSibling: (messageId: string, direction: 'prev' | 'next') => void;
  onPickStarterPrompt: (prompt: string) => void;
  onRespondToToolApproval?: (
    runId: string,
    approvalId: string,
    decision: 'approve' | 'reject'
  ) => void;
};

/**
 * Stick-to-bottom key: changes when the last bubble grows (content, live run buffers, status trace)
 * or the thread shape changes — avoids tying scroll to full `transcript` array identity.
 * Intentionally excludes execution-trace accordion and thinking accordion toggles so expanding
 * those does not call scrollToIndex (would yank the viewport to the bottom).
 */
function getStickToBottomKey(
  transcript: ChatMessage[],
  runByAssistantMessageId: Record<string, ChatMessageStreamingRun>
): string {
  if (transcript.length === 0) {
    return '';
  }
  const last = transcript[transcript.length - 1];
  const run = last.role === 'assistant' ? runByAssistantMessageId[last.id] : undefined;
  return [
    last.id,
    last.content.length,
    last.thinking?.length ?? 0,
    run?.buffer?.length ?? 0,
    run?.thinkingBuffer?.length ?? 0,
    run?.statusHistory?.length ?? 0,
    Object.keys(run?.pendingToolApprovals ?? {}).length,
    last.clientStatus ?? '',
    transcript.length,
  ].join(':');
}

/** Pixels from the bottom of the scroll container to still count as "following" the latest message. */
const STICK_TO_BOTTOM_THRESHOLD_PX = 100;

// React.memo IS safe to use here even though @tanstack/react-virtual is not React-Compiler-memoizable.
// React.memo only checks if the component should re-run at all; the virtualizer works correctly inside.
export const AssistantChatTranscript = memo(function AssistantChatTranscript({
  isTreeLoading,
  isTreeError,
  treeError,
  onRetryTree,
  transcript,
  runByAssistantMessageId,
  getSiblings,
  latestUserMessageId,
  isLoading,
  isStreaming,
  isAwaitingRunStart,
  awaitingWsFollowUp,
  thinkingExpanded,
  onToggleThinking,
  executionTraceExpanded,
  onToggleExecutionTrace,
  editingMessageId,
  onSetEditingMessageId,
  onEditMessage,
  onRetryAssistantRun,
  onRetryUserMessage,
  onSendFollowUp,
  onSelectSibling,
  onPickStarterPrompt,
  onRespondToToolApproval,
}: AssistantChatTranscriptProps) {
  const scrollParentRef = useRef<HTMLDivElement>(null);
  /** When false, streaming/content updates must not call scrollToIndex (user scrolled up to read). */
  const stickToBottomRef = useRef(true);
  const stickKey = getStickToBottomKey(transcript, runByAssistantMessageId);

  const syncStickToBottomFromScroll = useCallback(() => {
    const el = scrollParentRef.current;
    if (!el) {
      return;
    }
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom <= STICK_TO_BOTTOM_THRESHOLD_PX;
  }, []);

  const streamingRunByUserMessageId = useMemo(() => {
    const acc: Record<string, ChatMessageStreamingRun> = {};
    for (const run of Object.values(runByAssistantMessageId)) {
      acc[run.userMessageId] = run;
    }
    return acc;
  }, [runByAssistantMessageId]);

  const virtualizer = useVirtualizer({
    count: transcript.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => 200,
    overscan: 6,
  });

  const virtualizerRef = useRef(virtualizer);
  virtualizerRef.current = virtualizer;

  useLayoutEffect(() => {
    stickToBottomRef.current = true;
  }, [latestUserMessageId]);

  useLayoutEffect(() => {
    if (transcript.length === 0) {
      return;
    }
    if (!stickToBottomRef.current) {
      return;
    }
    virtualizerRef.current.scrollToIndex(transcript.length - 1, {
      align: 'end',
      behavior: 'auto',
    });
  }, [stickKey, transcript.length]);

  return (
    <div
      ref={scrollParentRef}
      onScroll={syncStickToBottomFromScroll}
      className="flex-1 overflow-y-auto min-h-0 px-2 py-3 sm:px-4 sm:py-4 lg:p-6"
    >
      {isTreeLoading && (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 gap-2">
          <Loader2 size={18} className="animate-spin" />
          <span>Loading messages...</span>
        </div>
      )}
      {isTreeError && (
        <div className="max-w-md mx-auto mt-10 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-4 text-sm text-red-700 dark:text-red-200 space-y-3">
          <p>{extractErrorMessage(treeError, 'Failed to load messages')}</p>
          <button
            type="button"
            onClick={() => onRetryTree()}
            className="text-sm underline underline-offset-2 hover:text-red-800 dark:hover:text-red-100"
          >
            Retry
          </button>
        </div>
      )}
      {!isTreeLoading && !isTreeError && transcript.length === 0 && (
        <ChatStarterSuggestions onPickPrompt={onPickStarterPrompt} />
      )}

      {!isTreeLoading && !isTreeError && transcript.length > 0 && (
        <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const message = transcript[virtualRow.index];
            const run =
              message.role === 'assistant' ? runByAssistantMessageId[message.id] : undefined;
            const isLastRow = virtualRow.index === transcript.length - 1;
            return (
              <div
                key={message.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className={cn('absolute left-0 top-0 w-full', !isLastRow && 'pb-3 sm:pb-4')}
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <ChatMessageRow
                  message={message}
                  index={virtualRow.index}
                  transcriptLength={transcript.length}
                  run={run}
                  streamingRunForThisUserMessage={
                    message.role === 'user' ? streamingRunByUserMessageId[message.id] : undefined
                  }
                  getSiblings={getSiblings}
                  latestUserMessageId={latestUserMessageId}
                  isLoading={isLoading}
                  isStreaming={isStreaming}
                  isAwaitingRunStart={isAwaitingRunStart}
                  awaitingWsFollowUp={awaitingWsFollowUp}
                  thinkingPanelExpanded={Boolean(thinkingExpanded[message.id])}
                  onToggleThinking={onToggleThinking}
                  executionTracePanelExpanded={Boolean(executionTraceExpanded[message.id] ?? run)}
                  onToggleExecutionTrace={onToggleExecutionTrace}
                  editingMessageId={editingMessageId}
                  onSetEditingMessageId={onSetEditingMessageId}
                  onEditMessage={onEditMessage}
                  onRetryAssistantRun={onRetryAssistantRun}
                  onRetryUserMessage={onRetryUserMessage}
                  onSendFollowUp={onSendFollowUp}
                  onSelectSibling={onSelectSibling}
                  onRespondToToolApproval={onRespondToToolApproval}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

AssistantChatTranscript.displayName = 'AssistantChatTranscript';
