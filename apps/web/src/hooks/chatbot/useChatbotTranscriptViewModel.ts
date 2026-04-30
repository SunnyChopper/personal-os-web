import { useMemo } from 'react';
import { isLocalAssistantThreadId } from '@/lib/chat/local-thread-id';
import { EMPTY_MESSAGE_TREE } from '@/lib/chat/empty-message-tree';
import type { AssistantStreamingRunState } from '@/lib/websocket/thinking-delta-cache';
import type {
  ChatMessage,
  MessageTreeResponse,
  StatusEntry,
  WsToolApprovalRequiredPayload,
  WsToolCallCompletePayload,
} from '@/types/chatbot';

type RunWithExtras = AssistantStreamingRunState & {
  runId?: string;
  statusHistory?: StatusEntry[];
  toolCallDetails?: WsToolCallCompletePayload[];
  pendingToolApprovals?: Record<string, WsToolApprovalRequiredPayload>;
};

export function useChatbotTranscriptViewModel({
  resolvedThreadId,
  tree,
  runs,
}: {
  resolvedThreadId: string | null;
  tree: MessageTreeResponse | null;
  runs: Record<string, RunWithExtras>;
}) {
  const treeForBranch = useMemo(() => {
    if (resolvedThreadId && isLocalAssistantThreadId(resolvedThreadId)) {
      return tree ?? EMPTY_MESSAGE_TREE;
    }
    return tree;
  }, [resolvedThreadId, tree]);

  const nodeByIdForBranch = useMemo(() => {
    if (!treeForBranch?.nodes) {
      return new Map<string, ChatMessage>();
    }
    return new Map(treeForBranch.nodes.map((node) => [node.id, node]));
  }, [treeForBranch]);

  const runByAssistantMessageId = useMemo(() => {
    return Object.values(runs).reduce<Record<string, RunWithExtras>>((acc, run) => {
      acc[run.assistantMessageId] = run;
      return acc;
    }, {});
  }, [runs]);

  const activeRunId = useMemo(() => {
    const runIds = Object.keys(runs);
    return runIds.length > 0 ? runIds[runIds.length - 1] : null;
  }, [runs]);

  return {
    treeForBranch,
    nodeByIdForBranch,
    runByAssistantMessageId,
    activeRunId,
  };
}
