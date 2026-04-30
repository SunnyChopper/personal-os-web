import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { QueryClient } from '@tanstack/react-query';
import { extractApiError, extractErrorMessage } from '@/lib/react-query/error-utils';
import { isLocalAssistantThreadId } from '@/lib/chat/local-thread-id';
import {
  removeNodeFromTree,
  replaceMessageTreeCache,
  upsertMessageTreeNodeCache,
} from '@/lib/react-query/chatbot-cache';
import { queryKeys } from '@/lib/react-query/query-keys';
import type { AssistantWsConnectionState } from '@/lib/websocket/assistant-ws-client';
import { wsLogger } from '@/lib/logger';
import type { AssistantRunConfig, ChatThread, MessageTreeResponse } from '@/types/chatbot';

type ShowToast = (options: { type: 'error'; title: string; message: string }) => void;

type CreateThreadFn = (input: { title: string }) => Promise<ChatThread>;
type CreateMessageFn = (input: {
  threadId: string;
  role: 'user';
  content: string;
  parentId?: string;
  clientMessageId?: string;
  metadata?: import('@/types/chatbot').ChatMessage['metadata'];
}) => Promise<{ id: string }>;

export function useChatbotSendHandlers({
  queryClient,
  navigate,
  showToast,
  activeThread,
  selectedLeafId,
  setSelectedLeafId,
  createThread,
  createMessage,
  sendFollowUp,
  getRunConfig,
  connectionState,
  streamingThreadId,
  setStreamingThreadOverrideId,
  isAwaitingRunStart,
  isLocalDraft,
  onRestoreInput,
  onMessageSent,
  manualSendBlockedMessage,
}: {
  queryClient: QueryClient;
  navigate: NavigateFunction;
  showToast: ShowToast;
  activeThread: ChatThread | null;
  selectedLeafId: string | null;
  setSelectedLeafId: (leafId: string | null) => void;
  createThread: CreateThreadFn;
  createMessage: CreateMessageFn;
  sendFollowUp: (
    userMessageId: string,
    options?: { runConfig?: import('@/types/chatbot').AssistantRunConfig }
  ) => void;
  getRunConfig: () => AssistantRunConfig | undefined;
  connectionState: AssistantWsConnectionState;
  streamingThreadId: string | undefined;
  setStreamingThreadOverrideId: (id: string | null) => void;
  isAwaitingRunStart: boolean;
  isLocalDraft: boolean;
  /** Called with the original message content when a send fails so the composer can restore it. */
  onRestoreInput: (content: string) => void;
  /** Called after a user message is successfully queued for the assistant (HTTP + WS handoff). */
  onMessageSent?: () => void;
  /** When set (e.g. manual compaction required), block sends and toast instead of hitting the API/WS. */
  manualSendBlockedMessage?: string | null;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [awaitingWsFollowUp, setAwaitingWsFollowUp] = useState(false);
  /** State (not a ref) so the follow-up effect re-runs after the first message on a new thread. */
  const [pendingWsFollowUp, setPendingWsFollowUp] = useState<{
    threadId: string;
    userMessageId: string;
    runConfig?: AssistantRunConfig;
  } | null>(null);

  useEffect(() => {
    if (!pendingWsFollowUp) {
      return;
    }
    if (!awaitingWsFollowUp) {
      return;
    }
    if (connectionState !== 'connected') {
      return;
    }
    if (streamingThreadId !== pendingWsFollowUp.threadId) {
      return;
    }
    sendFollowUp(pendingWsFollowUp.userMessageId, {
      runConfig: pendingWsFollowUp.runConfig,
    });
    setPendingWsFollowUp(null);
    queueMicrotask(() => {
      setAwaitingWsFollowUp(false);
      setStreamingThreadOverrideId(null);
    });
  }, [
    awaitingWsFollowUp,
    connectionState,
    sendFollowUp,
    streamingThreadId,
    setStreamingThreadOverrideId,
    pendingWsFollowUp,
  ]);

  // Keep a ref to all volatile values so the stable useCallback below always sees current state
  // without being recreated on every render.
  const stateRef = useRef({
    activeThread,
    selectedLeafId,
    setSelectedLeafId,
    createThread,
    createMessage,
    sendFollowUp,
    getRunConfig,
    connectionState,
    streamingThreadId,
    setStreamingThreadOverrideId,
    isAwaitingRunStart,
    isLocalDraft,
    onRestoreInput,
    onMessageSent,
    manualSendBlockedMessage,
    isLoading,
    awaitingWsFollowUp,
    navigate,
    showToast,
    queryClient,
  });

  useLayoutEffect(() => {
    stateRef.current = {
      activeThread,
      selectedLeafId,
      setSelectedLeafId,
      createThread,
      createMessage,
      sendFollowUp,
      getRunConfig,
      connectionState,
      streamingThreadId,
      setStreamingThreadOverrideId,
      isAwaitingRunStart,
      isLocalDraft,
      onRestoreInput,
      onMessageSent,
      manualSendBlockedMessage,
      isLoading,
      awaitingWsFollowUp,
      navigate,
      showToast,
      queryClient,
    };
  }, [
    activeThread,
    selectedLeafId,
    setSelectedLeafId,
    createThread,
    createMessage,
    sendFollowUp,
    getRunConfig,
    connectionState,
    streamingThreadId,
    setStreamingThreadOverrideId,
    isAwaitingRunStart,
    isLocalDraft,
    onRestoreInput,
    onMessageSent,
    manualSendBlockedMessage,
    isLoading,
    awaitingWsFollowUp,
    navigate,
    showToast,
    queryClient,
  ]);

  const handleSendMessage = useCallback(async (content: string, clientMessageId?: string) => {
    const {
      activeThread: threadForSend,
      selectedLeafId,
      setSelectedLeafId,
      createThread,
      createMessage,
      sendFollowUp,
      getRunConfig: getRunConfigFn,
      connectionState,
      streamingThreadId: _streamingThreadId,
      setStreamingThreadOverrideId,
      isAwaitingRunStart,
      isLocalDraft,
      onRestoreInput,
      isLoading,
      awaitingWsFollowUp,
      navigate,
      showToast,
      queryClient,
      onMessageSent: onMessageSentCb,
      manualSendBlockedMessage: manualBlocked,
    } = stateRef.current;

    const userMessage = content.trim();
    const blockedByConnection =
      !isLocalDraft && (connectionState === 'failed' || connectionState === 'disconnected');
    if (
      !userMessage ||
      !threadForSend ||
      isLoading ||
      awaitingWsFollowUp ||
      isAwaitingRunStart ||
      blockedByConnection
    ) {
      return;
    }

    if (manualBlocked) {
      showToast({
        type: 'error',
        title: 'Thread needs compaction',
        message: manualBlocked,
      });
      return;
    }

    const isDraft = isLocalAssistantThreadId(threadForSend.id);
    let draftPendingMessageId: string | null = null;

    setIsLoading(true);
    setEditingMessageId(null);
    if (isDraft) {
      draftPendingMessageId = clientMessageId || `client-${crypto.randomUUID()}`;
      upsertMessageTreeNodeCache(queryClient, threadForSend.id, {
        id: draftPendingMessageId,
        threadId: threadForSend.id,
        role: 'user',
        content: userMessage,
        createdAt: new Date().toISOString(),
        parentId: selectedLeafId || undefined,
        clientStatus: 'sending',
        clientMessageId: draftPendingMessageId,
      });
      setSelectedLeafId(draftPendingMessageId);
    }

    try {
      let threadId = threadForSend.id;
      let parentId = selectedLeafId || undefined;
      if (isDraft) {
        setAwaitingWsFollowUp(true);
        const newThread = await createThread({ title: 'New Chat' });
        threadId = newThread.id;
        setStreamingThreadOverrideId(threadId);
        parentId = undefined;
      }

      const runConfigSnapshot = getRunConfigFn();
      const userMsg = await createMessage({
        threadId,
        role: 'user',
        content: userMessage,
        parentId,
        clientMessageId,
        ...(runConfigSnapshot ? { metadata: { assistantModelConfig: runConfigSnapshot } } : {}),
      });
      if (isDraft) {
        if (draftPendingMessageId) {
          const existingDraftTree = queryClient.getQueryData<MessageTreeResponse>(
            queryKeys.chatbot.messages.tree(threadForSend.id)
          );
          if (existingDraftTree) {
            const nextDraftTree = removeNodeFromTree(existingDraftTree, draftPendingMessageId);
            replaceMessageTreeCache(queryClient, threadForSend.id, nextDraftTree);
          }
        }
        setPendingWsFollowUp({
          threadId,
          userMessageId: userMsg.id,
          runConfig: runConfigSnapshot,
        });
        navigate(`/admin/assistant/${threadId}`, { replace: true });
      } else {
        setSelectedLeafId(userMsg.id);
        sendFollowUp(userMsg.id, { runConfig: runConfigSnapshot });
      }
      onMessageSentCb?.();
      setIsLoading(false);
    } catch (error) {
      wsLogger.error('Error sending message', error);
      const apiError = extractApiError(error);
      const message = apiError?.message || extractErrorMessage(error, 'Message failed to send');
      if (isDraft) {
        if (draftPendingMessageId) {
          const existingDraftTree = queryClient.getQueryData<MessageTreeResponse>(
            queryKeys.chatbot.messages.tree(threadForSend.id)
          );
          if (existingDraftTree) {
            const nextDraftTree = removeNodeFromTree(existingDraftTree, draftPendingMessageId);
            replaceMessageTreeCache(queryClient, threadForSend.id, nextDraftTree);
          }
        }
        setSelectedLeafId(null);
        onRestoreInput(userMessage);
      }
      showToast({
        type: 'error',
        title: 'Message not delivered',
        message,
      });
      setPendingWsFollowUp(null);
      setStreamingThreadOverrideId(null);
      setAwaitingWsFollowUp(false);
      setIsLoading(false);
    }
  }, []);

  const handleRetryUserMessage = useCallback(
    (messageContent: string, failedMessageId?: string) => {
      if (!failedMessageId) return;
      handleSendMessage(messageContent, failedMessageId);
    },
    [handleSendMessage]
  );

  return {
    isLoading,
    editingMessageId,
    setEditingMessageId,
    awaitingWsFollowUp,
    handleSendMessage,
    handleRetryUserMessage,
  };
}
