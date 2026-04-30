import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { extractApiError, extractErrorMessage } from '@/lib/react-query/error-utils';
import { wsLogger } from '@/lib/logger';
import { useAdminShell } from '@/contexts/AdminShellContext';
import { useAuth } from '@/contexts/Auth';
import { createLocalAssistantThreadId, isLocalAssistantThreadId } from '@/lib/chat/local-thread-id';
import {
  useChatThreads,
  useChatThread,
  useChatThreadMutations,
  useChatMessageMutations,
  useMessageTree,
  useBranchSelection,
  useEditMessage,
} from '@/hooks/useChatbot';
import { useAssistantStreaming } from '@/hooks/useAssistantStreaming';
import { useChatbotSidebarLayout } from '@/hooks/chatbot/useChatbotSidebarLayout';
import { useAssistantShellOverlay } from '@/hooks/chatbot/useAssistantShellOverlay';
import { useAssistantStreamingToasts } from '@/hooks/chatbot/useAssistantStreamingToasts';
import { useThinkingAccordionSync } from '@/hooks/chatbot/useThinkingAccordionSync';
import { useExecutionTraceAccordionSync } from '@/hooks/chatbot/useExecutionTraceAccordionSync';
import { useChatbotThreadRoute } from '@/hooks/chatbot/useChatbotThreadRoute';
import { useChatbotTranscriptViewModel } from '@/hooks/chatbot/useChatbotTranscriptViewModel';
import { useChatbotSendHandlers } from '@/hooks/chatbot/useChatbotSendHandlers';
import type { ChatThreadListProps } from '@/components/organisms/ChatThreadList';
import { queryKeys } from '@/lib/react-query/query-keys';
import { chatbotService } from '@/services/chatbot.service';
import type {
  AssistantCompactionMode,
  AssistantNextSendModelsDisplay,
  AssistantOptimizeFor,
  AssistantRunConfig,
} from '@/types/chatbot';
import { useThreadContextUsage } from '@/hooks/chatbot/useThreadContextUsage';
import {
  extractAssistantRunConfigForLeaf,
  headerLabelsFromAssistantRunConfig,
} from '@/lib/assistant/thread-run-config';

export function useAssistantChatPage({
  onRestoreInput,
  onMessageSent,
}: {
  /** Called with the original content when a draft-thread send fails (so the composer can restore it). */
  onRestoreInput: (content: string) => void;
  /** Optional hook after a user message is queued (HTTP + WS handoff); e.g. close model picker + clear draft. */
  onMessageSent?: () => void;
}) {
  const queryClient = useQueryClient();
  const [streamingThreadOverrideId, setStreamingThreadOverrideId] = useState<string | null>(null);
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [thinkingExpanded, setThinkingExpanded] = useState<Record<string, boolean>>({});
  const [executionTraceExpanded, setExecutionTraceExpanded] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const { threadId: routeThreadId } = useParams<{ threadId?: string }>();
  const { showToast, dismissToast, ToastContainer } = useToast();
  const { assistantChatsOpen, closeAssistantChats } = useAdminShell();
  const { user } = useAuth();

  const { sidebarCollapsed, setSidebarCollapsed } = useChatbotSidebarLayout();
  useAssistantShellOverlay(assistantChatsOpen, closeAssistantChats);

  const {
    threads,
    isLoading: isThreadsLoading,
    isError: isThreadsError,
    error: threadsError,
    refetch: refetchThreads,
  } = useChatThreads();

  const { resolvedThreadId, syntheticDraftThread, displayThreads } = useChatbotThreadRoute({
    routeThreadId,
    threads,
    navigate,
    showToast,
    userId: user?.id,
  });

  const serverThreadQueryId =
    resolvedThreadId && !isLocalAssistantThreadId(resolvedThreadId) ? resolvedThreadId : undefined;
  const streamingThreadId = streamingThreadOverrideId ?? serverThreadQueryId;
  const { thread: serverThread } = useChatThread(serverThreadQueryId);
  const {
    tree,
    isLoading: isTreeLoading,
    isError: isTreeError,
    error: treeError,
    refetch: refetchTree,
  } = useMessageTree(resolvedThreadId || undefined);

  const activeThread = syntheticDraftThread ?? serverThread;
  const isLocalDraft =
    Boolean(resolvedThreadId) && isLocalAssistantThreadId(resolvedThreadId ?? '');

  const { createThread, updateThread, deleteThread, isUpdating } = useChatThreadMutations();
  const { createMessage } = useChatMessageMutations();
  const { editMessage } = useEditMessage();

  const {
    runs,
    lastResolvedModelPick,
    streamingMeterSnapshot,
    isStreaming,
    isAwaitingRunStart,
    error: streamingError,
    connectionState,
    sendFollowUp: streamSendFollowUp,
    cancelRun,
    reconnect,
    retryRun,
    respondToToolApproval,
  } = useAssistantStreaming(streamingThreadId);

  useAssistantStreamingToasts(
    showToast,
    dismissToast,
    streamingError,
    isAwaitingRunStart,
    isStreaming
  );

  const modelCatalogQuery = useQuery({
    queryKey: queryKeys.chatbot.modelCatalog(),
    queryFn: () => chatbotService.getAssistantModelCatalog(),
    staleTime: 120_000,
  });

  const [modelPickerMode, setModelPickerMode] = useState<'manual' | 'auto'>('auto');
  const [reasoningModelId, setReasoningModelId] = useState('');
  const [responseModelId, setResponseModelId] = useState('');
  const [optimizeFor, setOptimizeFor] = useState<AssistantOptimizeFor>('intelligence');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [threadCompactionMode, setThreadCompactionMode] = useState<AssistantCompactionMode>('auto');
  const [modelPopoverOpen, setModelPopoverOpen] = useState(false);
  const [isCompactingThread, setIsCompactingThread] = useState(false);

  const pickerStorageKey = user?.id ? `assistant-model-picker:${user.id}` : null;
  /** Avoid re-applying localStorage / defaults when React Query refreshes `data` object identity. */
  const pickerHydratedForKeyRef = useRef<string | null>(null);
  /** When true, the next picker→localStorage sync is skipped (leaf hydration is in-memory only). */
  const skipNextPickerPersistRef = useRef(false);
  /** Last (thread, leaf, run-config snapshot) we applied from transcript metadata — avoids reverting Save & apply when picker state changes. */
  const lastLeafSyncRef = useRef<{
    threadId: string | null;
    leafId: string | null;
    runConfigSig: string;
  }>({ threadId: null, leafId: null, runConfigSig: '' });

  useEffect(() => {
    pickerHydratedForKeyRef.current = null;
  }, [pickerStorageKey]);

  useEffect(() => {
    const data = modelCatalogQuery.data;
    if (!data?.defaults || !pickerStorageKey) {
      return;
    }
    if (pickerHydratedForKeyRef.current === pickerStorageKey) {
      return;
    }
    pickerHydratedForKeyRef.current = pickerStorageKey;
    try {
      const raw = localStorage.getItem(pickerStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          mode?: 'manual' | 'auto';
          reasoningModelId?: string;
          responseModelId?: string;
          optimizeFor?: AssistantOptimizeFor;
          webSearchEnabled?: boolean;
          compactionMode?: AssistantCompactionMode;
        };
        if (parsed.mode === 'auto' || parsed.mode === 'manual') {
          setModelPickerMode(parsed.mode);
        }
        if (parsed.reasoningModelId) {
          setReasoningModelId(parsed.reasoningModelId);
        }
        if (parsed.responseModelId) {
          setResponseModelId(parsed.responseModelId);
        }
        if (parsed.optimizeFor) {
          setOptimizeFor(parsed.optimizeFor);
        }
        if (typeof parsed.webSearchEnabled === 'boolean') {
          setWebSearchEnabled(parsed.webSearchEnabled);
        }
        if (parsed.compactionMode === 'manual' || parsed.compactionMode === 'auto') {
          setThreadCompactionMode(parsed.compactionMode);
        }
        return;
      }
    } catch {
      /* ignore corrupt localStorage; fall through to defaults */
    }
    setModelPickerMode('auto');
    setOptimizeFor('intelligence');
    setReasoningModelId(data.defaults.defaultReasoningModelId);
    setResponseModelId(data.defaults.defaultResponseModelId);
    setWebSearchEnabled(false);
    setThreadCompactionMode('auto');
  }, [modelCatalogQuery.data, pickerStorageKey]);

  useEffect(() => {
    if (!pickerStorageKey) {
      return;
    }
    if (skipNextPickerPersistRef.current) {
      skipNextPickerPersistRef.current = false;
      return;
    }
    try {
      localStorage.setItem(
        pickerStorageKey,
        JSON.stringify({
          mode: modelPickerMode,
          reasoningModelId,
          responseModelId,
          optimizeFor,
          webSearchEnabled,
          compactionMode: threadCompactionMode,
        })
      );
    } catch {
      /* ignore quota */
    }
  }, [
    pickerStorageKey,
    modelPickerMode,
    reasoningModelId,
    responseModelId,
    optimizeFor,
    webSearchEnabled,
    threadCompactionMode,
  ]);

  /** Re-apply the saved global picker when a thread leaf has no stored per-message run config. */
  const restoreGlobalModelPicker = useCallback(() => {
    const data = modelCatalogQuery.data;
    if (!data?.defaults || !pickerStorageKey) {
      return;
    }
    try {
      const raw = localStorage.getItem(pickerStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          mode?: 'manual' | 'auto';
          reasoningModelId?: string;
          responseModelId?: string;
          optimizeFor?: AssistantOptimizeFor;
          webSearchEnabled?: boolean;
          compactionMode?: AssistantCompactionMode;
        };
        if (parsed.mode === 'auto' || parsed.mode === 'manual') {
          setModelPickerMode(parsed.mode);
        }
        if (parsed.reasoningModelId) {
          setReasoningModelId(parsed.reasoningModelId);
        }
        if (parsed.responseModelId) {
          setResponseModelId(parsed.responseModelId);
        }
        if (parsed.optimizeFor) {
          setOptimizeFor(parsed.optimizeFor);
        }
        if (typeof parsed.webSearchEnabled === 'boolean') {
          setWebSearchEnabled(parsed.webSearchEnabled);
        }
        if (parsed.compactionMode === 'manual' || parsed.compactionMode === 'auto') {
          setThreadCompactionMode(parsed.compactionMode);
        }
        return;
      }
    } catch {
      /* ignore corrupt localStorage */
    }
    setModelPickerMode('auto');
    setOptimizeFor('intelligence');
    setReasoningModelId(data.defaults.defaultReasoningModelId);
    setResponseModelId(data.defaults.defaultResponseModelId);
    setWebSearchEnabled(false);
    setThreadCompactionMode('auto');
  }, [modelCatalogQuery.data, pickerStorageKey]);

  const getRunConfig = useCallback((): AssistantRunConfig | undefined => {
    const models = modelCatalogQuery.data?.models;
    if (!models?.length) {
      return undefined;
    }
    const web = webSearchEnabled ? { webSearchEnabled: true } : {};
    const compaction = { compactionMode: threadCompactionMode };
    if (modelPickerMode === 'auto') {
      return { mode: 'auto', auto: { optimizeFor }, ...web, ...compaction };
    }
    const r = reasoningModelId || modelCatalogQuery.data?.defaults.defaultReasoningModelId;
    const resp = responseModelId || modelCatalogQuery.data?.defaults.defaultResponseModelId;
    if (!r || !resp) {
      return undefined;
    }
    return {
      mode: 'manual',
      manual: { reasoningModelId: r, responseModelId: resp },
      ...web,
      ...compaction,
    };
  }, [
    modelCatalogQuery.data,
    modelPickerMode,
    reasoningModelId,
    responseModelId,
    optimizeFor,
    webSearchEnabled,
    threadCompactionMode,
  ]);

  const { treeForBranch, nodeByIdForBranch, runByAssistantMessageId, activeRunId } =
    useChatbotTranscriptViewModel({
      resolvedThreadId,
      tree,
      runs,
    });

  const nextSendModelsDisplay = useMemo((): AssistantNextSendModelsDisplay | null => {
    const catalogModels = modelCatalogQuery.data?.models ?? [];
    const defaults = modelCatalogQuery.data?.defaults;
    if (!catalogModels.length || !defaults) {
      return null;
    }
    const labelFor = (id: string) => catalogModels.find((m) => m.id === id)?.label ?? id;
    if (modelPickerMode === 'auto') {
      const ofLabel =
        optimizeFor === 'speed'
          ? 'Speed'
          : optimizeFor === 'cost'
            ? 'Cost'
            : optimizeFor === 'balanced'
              ? 'Balanced'
              : optimizeFor === 'value'
                ? 'Value'
                : 'Intelligence';
      return {
        mode: 'auto',
        reasoningLabel: `Auto router`,
        responseLabel: `Optimize: ${ofLabel}`,
        optimizeFor,
        webSearchEnabled,
      };
    }
    const r = reasoningModelId || defaults.defaultReasoningModelId;
    const resp = responseModelId || defaults.defaultResponseModelId;
    return {
      mode: 'manual',
      reasoningLabel: labelFor(r),
      responseLabel: labelFor(resp),
      webSearchEnabled,
    };
  }, [
    modelCatalogQuery.data?.defaults,
    modelCatalogQuery.data?.models,
    modelPickerMode,
    optimizeFor,
    reasoningModelId,
    responseModelId,
    webSearchEnabled,
  ]);

  const { selectedLeafId, transcript, setSelectedLeafId, getSiblings, selectSibling } =
    useBranchSelection({
      threadId: resolvedThreadId || undefined,
      tree: treeForBranch,
      nodeById: nodeByIdForBranch,
      activeLeafMessageId: activeThread?.activeLeafMessageId,
    });

  const runConfigForSelectedLeaf = useMemo(
    () =>
      extractAssistantRunConfigForLeaf(
        selectedLeafId ?? activeThread?.activeLeafMessageId,
        treeForBranch?.nodes
      ),
    [selectedLeafId, activeThread?.activeLeafMessageId, treeForBranch?.nodes]
  );

  /** Sync picker with the model config stored on the thread leaf (e.g. proactive / headless runs). */
  useEffect(() => {
    if (!resolvedThreadId || isLocalAssistantThreadId(resolvedThreadId) || isLocalDraft) {
      lastLeafSyncRef.current = { threadId: null, leafId: null, runConfigSig: '' };
      return;
    }
    const leafId = selectedLeafId ?? activeThread?.activeLeafMessageId ?? null;
    const runConfigSig =
      runConfigForSelectedLeaf == null ? 'null' : JSON.stringify(runConfigForSelectedLeaf);
    const prev = lastLeafSyncRef.current;
    if (
      prev.threadId === resolvedThreadId &&
      prev.leafId === leafId &&
      prev.runConfigSig === runConfigSig
    ) {
      return;
    }
    lastLeafSyncRef.current = {
      threadId: resolvedThreadId,
      leafId,
      runConfigSig,
    };

    if (!runConfigForSelectedLeaf) {
      restoreGlobalModelPicker();
      return;
    }
    const cfg = runConfigForSelectedLeaf;
    skipNextPickerPersistRef.current = true;
    if (cfg.mode === 'manual') {
      setModelPickerMode('manual');
      setReasoningModelId(cfg.manual.reasoningModelId);
      setResponseModelId(cfg.manual.responseModelId);
    } else {
      setModelPickerMode('auto');
      setOptimizeFor(cfg.auto.optimizeFor);
    }
    if (cfg.webSearchEnabled === true) {
      setWebSearchEnabled(true);
    } else if (cfg.webSearchEnabled === false) {
      setWebSearchEnabled(false);
    }
    if (cfg.compactionMode === 'manual' || cfg.compactionMode === 'auto') {
      setThreadCompactionMode(cfg.compactionMode);
    }
  }, [
    activeThread?.activeLeafMessageId,
    isLocalDraft,
    resolvedThreadId,
    restoreGlobalModelPicker,
    runConfigForSelectedLeaf,
    selectedLeafId,
  ]);

  const resolvedModelsDisplay = useMemo(() => {
    const catalogModels = modelCatalogQuery.data?.models ?? [];
    const defaults = modelCatalogQuery.data?.defaults;
    const labelFor = (id: string) => catalogModels.find((m) => m.id === id)?.label ?? id;
    const threadKey = streamingThreadId ?? resolvedThreadId ?? null;
    const runResolved =
      activeRunId && runs[activeRunId]?.resolvedReasoningModelId
        ? {
            reasoningId: runs[activeRunId].resolvedReasoningModelId!,
            responseId: runs[activeRunId].resolvedResponseModelId!,
            modelMode: runs[activeRunId].modelMode ?? '',
          }
        : null;
    const persisted =
      lastResolvedModelPick && threadKey && lastResolvedModelPick.threadId === threadKey
        ? {
            reasoningId: lastResolvedModelPick.resolvedReasoningModelId,
            responseId: lastResolvedModelPick.resolvedResponseModelId,
            modelMode: lastResolvedModelPick.modelMode,
          }
        : null;
    const fromMessageTree =
      runConfigForSelectedLeaf && catalogModels.length && defaults
        ? headerLabelsFromAssistantRunConfig(runConfigForSelectedLeaf, catalogModels, defaults)
        : null;
    const pick = runResolved ?? persisted;
    if (pick) {
      return {
        reasoningLabel: labelFor(pick.reasoningId),
        responseLabel: labelFor(pick.responseId),
        modelMode: pick.modelMode,
      };
    }
    if (fromMessageTree) {
      return {
        reasoningLabel: fromMessageTree.reasoningLabel,
        responseLabel: fromMessageTree.responseLabel,
        modelMode: fromMessageTree.modelMode,
      };
    }
    return null;
  }, [
    activeRunId,
    runs,
    lastResolvedModelPick,
    modelCatalogQuery.data?.defaults,
    modelCatalogQuery.data?.models,
    runConfigForSelectedLeaf,
    streamingThreadId,
    resolvedThreadId,
  ]);

  const leafForContextUsage = selectedLeafId ?? activeThread?.activeLeafMessageId ?? null;

  const contextUsageQuery = useThreadContextUsage({
    threadId: serverThreadQueryId,
    leafMessageId: leafForContextUsage,
    runConfig: getRunConfig(),
    enabled: Boolean(
      serverThreadQueryId && leafForContextUsage && Boolean(modelCatalogQuery.data?.models?.length)
    ),
  });

  const sendFollowUp = useCallback(
    (userMessageId: string, options?: { runConfig?: AssistantRunConfig }) => {
      setSelectedLeafId(userMessageId);
      streamSendFollowUp(userMessageId, options);
    },
    [setSelectedLeafId, streamSendFollowUp]
  );

  const latestUserMessageId = useMemo(() => {
    for (let index = transcript.length - 1; index >= 0; index -= 1) {
      if (transcript[index].role === 'user') {
        return transcript[index].id;
      }
    }
    return null;
  }, [transcript]);

  useThinkingAccordionSync(runs, setThinkingExpanded);
  useExecutionTraceAccordionSync(runs, setExecutionTraceExpanded);

  const manualSendBlockedMessage = useMemo(() => {
    if (isLocalDraft || threadCompactionMode !== 'manual') {
      return null;
    }
    if (contextUsageQuery.data?.manualCompactionRequired) {
      return (
        'This thread is over the safe context budget for the selected model. ' +
        'Compact the thread or start a new chat before sending, or switch to Auto compaction in model settings.'
      );
    }
    return null;
  }, [isLocalDraft, threadCompactionMode, contextUsageQuery.data?.manualCompactionRequired]);

  const handleCompactThread = useCallback(async () => {
    if (!serverThreadQueryId || isLocalAssistantThreadId(serverThreadQueryId)) {
      return;
    }
    const leaf = selectedLeafId ?? activeThread?.activeLeafMessageId;
    if (!leaf) {
      showToast({
        type: 'error',
        title: 'Nothing to compact',
        message: 'Open a thread with messages first.',
      });
      return;
    }
    setIsCompactingThread(true);
    try {
      await chatbotService.compactThreadContext(serverThreadQueryId, {
        leafMessageId: leaf,
        runConfig: getRunConfig(),
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.chatbot.contextUsage.prefix(serverThreadQueryId),
      });
      showToast({
        type: 'success',
        title: 'Thread compacted',
        message: 'Context summary updated. You can send again.',
      });
    } catch (error) {
      wsLogger.error('Thread compact failed', error);
      const apiError = extractApiError(error);
      const message =
        apiError?.message || extractErrorMessage(error, 'Could not compact this thread');
      showToast({
        type: 'error',
        title: 'Compaction failed',
        message,
      });
    } finally {
      setIsCompactingThread(false);
    }
  }, [
    activeThread?.activeLeafMessageId,
    getRunConfig,
    queryClient,
    selectedLeafId,
    serverThreadQueryId,
    showToast,
  ]);

  const handleAssistantMessageSent = useCallback(() => {
    if (onMessageSent) {
      onMessageSent();
    } else {
      setModelPopoverOpen(false);
    }
  }, [onMessageSent]);

  const sendHandlers = useChatbotSendHandlers({
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
    onMessageSent: handleAssistantMessageSent,
    manualSendBlockedMessage,
  });

  const {
    isLoading,
    editingMessageId,
    setEditingMessageId,
    awaitingWsFollowUp,
    handleSendMessage,
    handleRetryUserMessage,
  } = sendHandlers;

  const isInputDisabled =
    isLoading ||
    awaitingWsFollowUp ||
    isAwaitingRunStart ||
    Boolean(manualSendBlockedMessage) ||
    (!isLocalDraft && (connectionState === 'failed' || connectionState === 'disconnected'));

  const showDisconnectedBanner =
    !isLocalDraft && connectionState === 'disconnected' && Boolean(streamingError);
  const showReconnectingBanner =
    !isLocalDraft && connectionState === 'reconnecting' && (isStreaming || isAwaitingRunStart);

  const handleCreateThread = useCallback(() => {
    setModelPickerMode('auto');
    setOptimizeFor('intelligence');
    const defaults = modelCatalogQuery.data?.defaults;
    if (defaults) {
      setReasoningModelId(defaults.defaultReasoningModelId);
      setResponseModelId(defaults.defaultResponseModelId);
    }
    navigate(`/admin/assistant/${createLocalAssistantThreadId()}`);
  }, [modelCatalogQuery.data?.defaults, navigate]);

  const handleDeleteThread = useCallback(
    async (id: string) => {
      try {
        if (isLocalAssistantThreadId(id)) {
          const remainingThread = threads.find((t) => t.id !== id);
          if (resolvedThreadId === id) {
            if (remainingThread) {
              navigate(`/admin/assistant/${remainingThread.id}`, { replace: true });
            } else {
              navigate('/admin/assistant', { replace: true });
            }
          }
          return;
        }
        const remainingThread = threads.find((t) => t.id !== id);
        await deleteThread(id);
        if (resolvedThreadId === id) {
          if (remainingThread) {
            navigate(`/admin/assistant/${remainingThread.id}`, { replace: true });
          } else {
            navigate('/admin/assistant', { replace: true });
          }
        }
      } catch (error) {
        wsLogger.error('Error deleting thread', error);
      }
    },
    [deleteThread, navigate, resolvedThreadId, threads]
  );

  const handleRenameThread = useCallback(
    async (id: string) => {
      if (!editingTitle.trim()) {
        setEditingThreadId(null);
        return;
      }
      if (isLocalAssistantThreadId(id)) {
        setEditingThreadId(null);
        return;
      }
      try {
        await updateThread({ id, title: editingTitle.trim() });
        setEditingThreadId(null);
      } catch (error) {
        wsLogger.error('Error renaming thread', error);
        const apiError = extractApiError(error);
        const message = apiError?.message || extractErrorMessage(error, 'Failed to rename chat');
        showToast({
          type: 'error',
          title: 'Unable to rename chat',
          message,
        });
      }
    },
    [editingTitle, showToast, updateThread]
  );

  const handleRetryAssistantRun = useCallback(
    (userMessageId?: string, failedAssistantId?: string) => {
      if (!userMessageId || !failedAssistantId) return;
      retryRun(userMessageId, failedAssistantId, { runConfig: getRunConfig() });
    },
    [retryRun, getRunConfig]
  );

  const handleEditMessage = useCallback(
    async (messageId: string, newContent: string) => {
      if (!newContent.trim() || !activeThread || isLocalAssistantThreadId(activeThread.id)) return;

      try {
        const updated = await editMessage({
          threadId: activeThread.id,
          messageId,
          data: { content: newContent },
        });
        setEditingMessageId(null);
        setSelectedLeafId(updated.id);
        setModelPopoverOpen(false);
        sendFollowUp(updated.id, { runConfig: getRunConfig() });
      } catch (error) {
        wsLogger.error('Error editing message', error);
      }
    },
    [
      activeThread,
      editMessage,
      getRunConfig,
      sendFollowUp,
      setEditingMessageId,
      setModelPopoverOpen,
      setSelectedLeafId,
    ]
  );

  const handleThreadSelect = useCallback(
    (threadId: string) => {
      navigate(`/admin/assistant/${threadId}`);
      if (window.innerWidth < 1024) {
        closeAssistantChats();
      }
    },
    [closeAssistantChats, navigate]
  );

  const onStartEditThread = useCallback((threadId: string, title: string) => {
    setEditingThreadId(threadId);
    setEditingTitle(title);
  }, []);

  const onCancelEditThread = useCallback(() => setEditingThreadId(null), []);

  const onToggleThinking = useCallback((messageId: string) => {
    setThinkingExpanded((current) => ({
      ...current,
      [messageId]: !current[messageId],
    }));
  }, []);

  const onToggleExecutionTrace = useCallback((messageId: string) => {
    setExecutionTraceExpanded((current) => ({
      ...current,
      [messageId]: !current[messageId],
    }));
  }, []);

  const threadListProps: ChatThreadListProps = useMemo(
    () => ({
      onCreateThread: handleCreateThread,
      isThreadsLoading,
      isThreadsError,
      threadsError,
      onRefetchThreads: refetchThreads,
      displayThreads,
      resolvedThreadId,
      editingThreadId,
      editingTitle,
      onEditingTitleChange: setEditingTitle,
      onStartEdit: onStartEditThread,
      onCancelEdit: onCancelEditThread,
      onConfirmRename: handleRenameThread,
      isUpdating,
      onDeleteThread: handleDeleteThread,
      onSelectThread: handleThreadSelect,
    }),
    [
      displayThreads,
      editingThreadId,
      editingTitle,
      handleCreateThread,
      handleDeleteThread,
      handleRenameThread,
      handleThreadSelect,
      isThreadsError,
      isThreadsLoading,
      isUpdating,
      onCancelEditThread,
      onStartEditThread,
      refetchThreads,
      resolvedThreadId,
      threadsError,
    ]
  );

  return {
    assistantChatsOpen,
    closeAssistantChats,
    sidebarCollapsed,
    setSidebarCollapsed,
    threadListProps,
    ToastContainer,
    activeThread,
    isTreeLoading,
    isTreeError,
    treeError,
    refetchTree,
    transcript,
    isStreaming,
    isAwaitingRunStart,
    runByAssistantMessageId,
    getSiblings,
    selectSibling,
    sendFollowUp,
    thinkingExpanded,
    onToggleThinking,
    executionTraceExpanded,
    onToggleExecutionTrace,
    editingMessageId,
    setEditingMessageId,
    handleEditMessage,
    handleRetryAssistantRun,
    handleRetryUserMessage,
    handleSendMessage,
    isLoading,
    awaitingWsFollowUp,
    isInputDisabled,
    isLocalDraft,
    connectionState,
    showReconnectingBanner,
    showDisconnectedBanner,
    reconnect,
    activeRunId,
    cancelRun,
    respondToToolApproval,
    latestUserMessageId,
    assistantModelCatalog: modelCatalogQuery.data,
    isModelCatalogLoading: modelCatalogQuery.isLoading,
    modelPickerMode,
    setModelPickerMode,
    reasoningModelId,
    setReasoningModelId,
    responseModelId,
    setResponseModelId,
    optimizeFor,
    setOptimizeFor,
    webSearchEnabled,
    setWebSearchEnabled,
    modelPopoverOpen,
    setModelPopoverOpen,
    resolvedModelsDisplay,
    nextSendModelsDisplay,
    threadCompactionMode,
    setThreadCompactionMode,
    contextUsageQuery,
    streamingMeterSnapshot,
    manualSendBlockedMessage,
    handleCompactThread,
    isCompactingThread,
  };
}
