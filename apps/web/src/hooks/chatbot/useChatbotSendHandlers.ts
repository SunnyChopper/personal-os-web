import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { QueryClient } from '@tanstack/react-query';
import { extractApiError, extractErrorMessage } from '@/lib/react-query/error-utils';
import { isLocalAssistantThreadId } from '@/lib/chat/local-thread-id';
import {
  readMergedMessageTreeFromCache,
  removeNodeFromTree,
  replaceMessageTreeCache,
  upsertMessageTreeNodeCache,
} from '@/lib/react-query/chatbot-cache';
import type { AssistantWsConnectionState } from '@/lib/websocket/assistant-ws-client';
import { wsLogger } from '@/lib/logger';
import type { AssistantRunConfig, ChatThread } from '@/types/chatbot';

type ShowToast = (options: { type: 'error'; title: string; message: string }) => void;

type CreateThreadFn = (input: { title: string }) => Promise<ChatThread>;

type SendUserMessageFn = (
  payload: Omit<import('@/types/chatbot').WsUserMessagePayload, 'threadId'>
) => void;

export function useChatbotSendHandlers({
  queryClient,
  navigate,
  showToast,
  activeThread,
  selectedLeafId,
  setSelectedLeafId,
  createThread,
  sendUserMessage,
  sendFollowUp,
  registerOptimisticUserId,
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
  sendUserMessage: SendUserMessageFn;
  sendFollowUp: (userMessageId: string, options?: { runConfig?: AssistantRunConfig }) => void;
  registerOptimisticUserId: (threadId: string, clientUserId: string) => void;
  getRunConfig: () => AssistantRunConfig | undefined;
  connectionState: AssistantWsConnectionState;
  streamingThreadId: string | undefined;
  setStreamingThreadOverrideId: (id: string | null) => void;
  isAwaitingRunStart: boolean;
  isLocalDraft: boolean;
  onRestoreInput: (content: string) => void;
  onMessageSent?: () => void;
  manualSendBlockedMessage?: string | null;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [awaitingWsFollowUp, setAwaitingWsFollowUp] = useState(false);
  const [pendingWsFollowUp, setPendingWsFollowUp] = useState<{
    threadId: string;
    content: string;
    parentId?: string;
    runConfig?: AssistantRunConfig;
    metadata?: import('@/types/chatbot').ChatMessage['metadata'];
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
    sendUserMessage({
      content: pendingWsFollowUp.content,
      parentId: pendingWsFollowUp.parentId,
      metadata: pendingWsFollowUp.metadata,
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
    sendUserMessage,
    streamingThreadId,
    setStreamingThreadOverrideId,
    pendingWsFollowUp,
  ]);

  const stateRef = useRef({
    activeThread,
    selectedLeafId,
    setSelectedLeafId,
    createThread,
    sendUserMessage,
    sendFollowUp,
    registerOptimisticUserId,
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
      sendUserMessage,
      sendFollowUp,
      registerOptimisticUserId,
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
    sendUserMessage,
    sendFollowUp,
    registerOptimisticUserId,
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
      sendUserMessage: sendWsUserMessage,
      registerOptimisticUserId: registerOptimistic,
      getRunConfig: getRunConfigFn,
      connectionState,
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
    const optimisticUserId = clientMessageId || `client-user-${crypto.randomUUID()}`;
    const runConfigSnapshot = getRunConfigFn();
    const metadata = runConfigSnapshot ? { assistantModelConfig: runConfigSnapshot } : undefined;

    setIsLoading(true);
    setEditingMessageId(null);

    if (isDraft) {
      upsertMessageTreeNodeCache(queryClient, threadForSend.id, {
        id: optimisticUserId,
        threadId: threadForSend.id,
        role: 'user',
        content: userMessage,
        createdAt: new Date().toISOString(),
        parentId: selectedLeafId || undefined,
        clientStatus: 'sending',
        clientMessageId: optimisticUserId,
      });
      setSelectedLeafId(optimisticUserId);
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
        registerOptimistic(threadId, optimisticUserId);
        upsertMessageTreeNodeCache(queryClient, threadId, {
          id: optimisticUserId,
          threadId,
          role: 'user',
          content: userMessage,
          createdAt: new Date().toISOString(),
          parentId,
          clientStatus: 'sending',
          clientMessageId: optimisticUserId,
          metadata,
        });
        setPendingWsFollowUp({
          threadId,
          content: userMessage,
          parentId,
          runConfig: runConfigSnapshot,
          metadata,
        });
        navigate(`/admin/assistant/${threadId}`, { replace: true });
      } else {
        registerOptimistic(threadId, optimisticUserId);
        upsertMessageTreeNodeCache(queryClient, threadId, {
          id: optimisticUserId,
          threadId,
          role: 'user',
          content: userMessage,
          createdAt: new Date().toISOString(),
          parentId,
          clientStatus: 'sending',
          clientMessageId: optimisticUserId,
          metadata,
        });
        setSelectedLeafId(optimisticUserId);
        sendWsUserMessage({
          content: userMessage,
          parentId,
          metadata,
          runConfig: runConfigSnapshot,
        });
      }

      onMessageSentCb?.();
      setIsLoading(false);
    } catch (error) {
      wsLogger.error('Error sending message', error);
      const apiError = extractApiError(error);
      const message = apiError?.message || extractErrorMessage(error, 'Message failed to send');
      if (isDraft) {
        const existingDraftTree = readMergedMessageTreeFromCache(queryClient, threadForSend.id);
        if (existingDraftTree) {
          const nextDraftTree = removeNodeFromTree(existingDraftTree, optimisticUserId);
          replaceMessageTreeCache(queryClient, threadForSend.id, nextDraftTree);
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
