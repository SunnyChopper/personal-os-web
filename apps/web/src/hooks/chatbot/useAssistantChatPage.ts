import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
import { apiClient } from '@/lib/api-client';
import {
  draftFromDefaultModels,
  type ModelPickerDraft,
} from '@/lib/assistant/run-config-picker-draft';
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
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
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

  const { createThread, updateThread, deleteThread, isUpdating, isDeleting } =
    useChatThreadMutations();
  const { editMessage } = useEditMessage();

  const {
    runs,
    lastResolvedModelPick,
    streamingMeterSnapshot,
    debugWsEvents,
    lastContextBudgetMeta,
    isStreaming,
    isAwaitingRunStart,
    error: streamingError,
    connectionState,
    sendUserMessage: streamSendUserMessage,
    sendFollowUp: streamSendFollowUp,
    registerOptimisticUserId,
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

  const assistantSettingsQuery = useQuery({
    queryKey: queryKeys.chatbot.assistantSettings(),
    queryFn: async () => {
      const res = await apiClient.getAssistantSettings();
      if (!res.success || !res.data) {
        throw new Error(res.error?.message ?? 'Failed to load assistant settings');
      }
      return res.data;
    },
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

  /** Avoid re-applying saved defaults when React Query refreshes object identity. */
  const pickerHydratedForKeyRef = useRef<string | null>(null);
  /** Last (thread, leaf, run-config snapshot) we applied from transcript metadata — avoids reverting Save & apply when picker state changes. */
  const lastLeafSyncRef = useRef<{
    threadId: string | null;
    leafId: string | null;
    runConfigSig: string;
  }>({ threadId: null, leafId: null, runConfigSig: '' });

  useEffect(() => {
    pickerHydratedForKeyRef.current = null;
  }, [user?.id]);

  const applyModelPickerDraft = useCallback((draft: ModelPickerDraft) => {
    setModelPickerMode(draft.mode);
    setReasoningModelId(draft.reasoningModelId);
    setResponseModelId(draft.responseModelId);
    setOptimizeFor(draft.optimizeFor);
    setWebSearchEnabled(false);
    setThreadCompactionMode('auto');
  }, []);

  const seedDraftFromSavedDefaults = useCallback((): ModelPickerDraft | null => {
    const catalog = modelCatalogQuery.data;
    if (!catalog?.defaults) {
      return null;
    }
    return draftFromDefaultModels(assistantSettingsQuery.data?.defaultModels, catalog);
  }, [assistantSettingsQuery.data?.defaultModels, modelCatalogQuery.data]);

  /** Sync picker from saved default models before paint so the header does not briefly show stale values. */
  useLayoutEffect(() => {
    const data = modelCatalogQuery.data;
    if (!data?.defaults || !user?.id) {
      return;
    }
    if (assistantSettingsQuery.isLoading || assistantSettingsQuery.isError) {
      return;
    }
    const hydrationKey = `${user.id}:${assistantSettingsQuery.dataUpdatedAt}`;
    if (pickerHydratedForKeyRef.current === hydrationKey) {
      return;
    }
    pickerHydratedForKeyRef.current = hydrationKey;
    const draft = seedDraftFromSavedDefaults();
    if (draft) {
      applyModelPickerDraft(draft);
    }
  }, [
    applyModelPickerDraft,
    assistantSettingsQuery.dataUpdatedAt,
    assistantSettingsQuery.isError,
    assistantSettingsQuery.isLoading,
    modelCatalogQuery.data,
    seedDraftFromSavedDefaults,
    user?.id,
  ]);

  /** Re-apply saved default models when a thread leaf has no stored per-message run config. */
  const restoreGlobalModelPicker = useCallback(() => {
    const draft = seedDraftFromSavedDefaults();
    if (draft) {
      applyModelPickerDraft(draft);
    }
  }, [applyModelPickerDraft, seedDraftFromSavedDefaults]);

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

  const activeRunDebug = useMemo(() => {
    if (!activeRunId) {
      return null;
    }
    const run = runs[activeRunId];
    if (!run) {
      return null;
    }
    return {
      runId: activeRunId,
      threadId: run.threadId,
      statusStage: run.statusStage,
      statusMessage: run.statusMessage,
      resolvedReasoningModelId: run.resolvedReasoningModelId,
      resolvedResponseModelId: run.resolvedResponseModelId,
    };
  }, [activeRunId, runs]);

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
    sendUserMessage: streamSendUserMessage,
    sendFollowUp,
    registerOptimisticUserId,
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
    /** Seed from saved Default Models in Assistant Settings (settings-authoritative). */
    restoreGlobalModelPicker();
    navigate(`/admin/assistant/${createLocalAssistantThreadId()}`);
  }, [navigate, restoreGlobalModelPicker]);

  const requestDeleteThread = useCallback(
    (id: string) => {
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
      const thread = threads.find((t) => t.id === id);
      setDeleteTarget({ id, title: thread?.title?.trim() || 'Chat' });
    },
    [navigate, resolvedThreadId, threads]
  );

  const confirmDeleteThread = useCallback(async () => {
    const id = deleteTarget?.id;
    if (!id) return;
    try {
      const remainingThread = threads.find((t) => t.id !== id);
      await deleteThread(id);
      setDeleteTarget(null);
      if (resolvedThreadId === id) {
        if (remainingThread) {
          navigate(`/admin/assistant/${remainingThread.id}`, { replace: true });
        } else {
          navigate('/admin/assistant', { replace: true });
        }
      }
    } catch (error) {
      wsLogger.error('Error deleting thread', error);
      const apiError = extractApiError(error);
      const message = apiError?.message || extractErrorMessage(error, 'Failed to delete chat');
      showToast({
        type: 'error',
        title: 'Unable to delete chat',
        message,
      });
    }
  }, [deleteTarget?.id, deleteThread, navigate, resolvedThreadId, showToast, threads]);

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
      onDeleteThread: requestDeleteThread,
      onSelectThread: handleThreadSelect,
    }),
    [
      displayThreads,
      editingThreadId,
      editingTitle,
      handleCreateThread,
      requestDeleteThread,
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
    deleteDialogProps: {
      isOpen: Boolean(deleteTarget),
      onClose: () => setDeleteTarget(null),
      onConfirm: confirmDeleteThread,
      threadTitle: deleteTarget?.title,
      isDeleting,
    },
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
    activeRunDebug,
    debugWsEvents,
    lastContextBudgetMeta,
    manualSendBlockedMessage,
    handleCompactThread,
    isCompactingThread,
  };
}
