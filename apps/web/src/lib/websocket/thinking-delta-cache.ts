import type { QueryClient } from '@tanstack/react-query';
import type { ChatMessage, WsThinkingDeltaPayload } from '@/types/chatbot';
import { upsertMessageTreeNodeCache } from '@/lib/react-query/chatbot-cache';

export type AssistantStreamingRunState = {
  assistantMessageId: string;
  userMessageId: string;
  buffer: string;
  thinkingBuffer: string;
};

const buildPlaceholderMessage = (
  threadId: string,
  assistantMessageId: string,
  userMessageId: string,
  content: string,
  thinking?: string
): ChatMessage => ({
  id: assistantMessageId,
  threadId,
  role: 'assistant',
  content,
  thinking,
  createdAt: new Date().toISOString(),
  parentId: userMessageId,
});

export const applyThinkingDeltaToRunsAndCache = <TRun extends AssistantStreamingRunState>(
  currentRuns: Record<string, TRun>,
  payload: WsThinkingDeltaPayload,
  queryClient: QueryClient
): Record<string, TRun> => {
  const run = currentRuns[payload.runId];
  if (!run) {
    return currentRuns;
  }

  const nextThinkingBuffer = `${run.thinkingBuffer}${payload.delta}`;
  const placeholder = buildPlaceholderMessage(
    payload.threadId,
    run.assistantMessageId,
    run.userMessageId,
    run.buffer,
    nextThinkingBuffer
  );
  upsertMessageTreeNodeCache(queryClient, payload.threadId, placeholder);

  return {
    ...currentRuns,
    [payload.runId]: {
      ...run,
      thinkingBuffer: nextThinkingBuffer,
    } as TRun,
  };
};
