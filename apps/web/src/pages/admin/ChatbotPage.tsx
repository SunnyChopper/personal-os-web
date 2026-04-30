import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BackendStatusBanner } from '@/components/molecules/BackendStatusBanner';
import { AssistantRunConfigPickerForm } from '@/components/assistant/AssistantRunConfigPickerForm';
import type { ModelPickerDraft } from '@/lib/assistant/run-config-picker-draft';
import { Sparkles, ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { useAssistantChatPage } from '@/hooks/chatbot/useAssistantChatPage';
import { ChatComposer, type ChatComposerHandle } from '@/components/organisms/ChatComposer';
import { AssistantChatTranscript } from '@/components/organisms/AssistantChatTranscript';
import { AssistantMemoryPanel } from '@/components/organisms/AssistantMemoryPanel';
import { ChatThreadList } from '@/components/organisms/ChatThreadList';

function formatContextTokens(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return `${Math.round(n)}`;
}

export default function ChatbotPage() {
  const composerRef = useRef<ChatComposerHandle>(null);
  const [viewMode, setViewMode] = useState<'chat' | 'memory'>('chat');
  const [pickerDraft, setPickerDraft] = useState<ModelPickerDraft | null>(null);
  const closeModelPopoverRef = useRef<() => void>(() => {});
  const notifyAssistantMessageSent = useCallback(() => closeModelPopoverRef.current(), []);

  const {
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
    assistantModelCatalog,
    isModelCatalogLoading,
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
  } = useAssistantChatPage({
    onRestoreInput: (content) => composerRef.current?.setValue(content),
    onMessageSent: notifyAssistantMessageSent,
  });

  const toggleWebSearch = useCallback(() => {
    setWebSearchEnabled((v) => !v);
  }, [setWebSearchEnabled]);

  const modelPickerContainerRef = useRef<HTMLDivElement>(null);
  const modelPickerModalRef = useRef<HTMLDivElement>(null);

  const closeModelPopover = useCallback(() => {
    setModelPopoverOpen(false);
    setPickerDraft(null);
  }, [setModelPopoverOpen]);

  useLayoutEffect(() => {
    closeModelPopoverRef.current = closeModelPopover;
  }, [closeModelPopover]);

  const openModelPopover = useCallback(() => {
    setPickerDraft({
      mode: modelPickerMode,
      reasoningModelId,
      responseModelId,
      optimizeFor,
      compactionMode: threadCompactionMode,
    });
    setModelPopoverOpen(true);
  }, [
    modelPickerMode,
    reasoningModelId,
    responseModelId,
    optimizeFor,
    threadCompactionMode,
    setModelPopoverOpen,
  ]);

  const saveModelPicker = useCallback(() => {
    if (!pickerDraft) return;
    setModelPickerMode(pickerDraft.mode);
    setReasoningModelId(pickerDraft.reasoningModelId);
    setResponseModelId(pickerDraft.responseModelId);
    setOptimizeFor(pickerDraft.optimizeFor);
    setThreadCompactionMode(pickerDraft.compactionMode ?? 'auto');
    setModelPopoverOpen(false);
    setPickerDraft(null);
  }, [
    pickerDraft,
    setModelPickerMode,
    setReasoningModelId,
    setResponseModelId,
    setOptimizeFor,
    setThreadCompactionMode,
    setModelPopoverOpen,
  ]);

  const updatePickerDraft = useCallback((patch: Partial<ModelPickerDraft>) => {
    setPickerDraft((d) => (d ? { ...d, ...patch } : d));
  }, []);

  useEffect(() => {
    if (!modelPopoverOpen) {
      return;
    }
    const onDoc = (e: PointerEvent) => {
      const t = e.target as Node;
      if (modelPickerContainerRef.current?.contains(t)) return;
      if (modelPickerModalRef.current?.contains(t)) return;
      if (t instanceof Element && t.closest('[data-assistant-model-menu]')) return;
      closeModelPopover();
    };
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, [closeModelPopover, modelPopoverOpen]);

  useEffect(() => {
    if (!modelPopoverOpen) return;
    const mq = window.matchMedia('(max-width: 1023px)');
    if (!mq.matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [modelPopoverOpen]);

  useEffect(() => {
    if (!modelPopoverOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModelPopover();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeModelPopover, modelPopoverOpen]);

  const assistantHeaderTitle =
    activeThread?.title?.trim() && activeThread.title.trim().toLowerCase() !== 'new chat'
      ? activeThread.title.trim()
      : 'Personal OS Assistant';

  /** Omit redundant “last reply” when it matches next-send or both sides are Auto (same routing mode). */
  const showLastReplySubline = useMemo(() => {
    if (!resolvedModelsDisplay || !nextSendModelsDisplay) return false;
    const lastMode = (resolvedModelsDisplay.modelMode || '').toLowerCase();
    const nextMode = nextSendModelsDisplay.mode;
    if (lastMode !== nextMode) return true;
    if (nextMode === 'manual') {
      return (
        resolvedModelsDisplay.reasoningLabel !== nextSendModelsDisplay.reasoningLabel ||
        resolvedModelsDisplay.responseLabel !== nextSendModelsDisplay.responseLabel
      );
    }
    return false;
  }, [nextSendModelsDisplay, resolvedModelsDisplay]);

  const nextModelsTitle = useMemo(() => {
    if (!nextSendModelsDisplay) return undefined;
    return `Next message: ${nextSendModelsDisplay.mode} — ${nextSendModelsDisplay.reasoningLabel}; ${nextSendModelsDisplay.responseLabel}`;
  }, [nextSendModelsDisplay]);

  const renderModelPickerForm = (draft: ModelPickerDraft) => (
    <AssistantRunConfigPickerForm
      catalog={assistantModelCatalog ?? null}
      isLoading={isModelCatalogLoading}
      draft={draft}
      onDraftChange={updatePickerDraft}
      lastResolved={draft.mode === 'auto' && resolvedModelsDisplay ? resolvedModelsDisplay : null}
      autoLastReplyPlaceholder={
        draft.mode === 'auto' && !resolvedModelsDisplay
          ? 'Shown after your next assistant reply.'
          : null
      }
    />
  );

  const renderModelPickerFooter = (layout: 'mobileSticky' | 'popover') => (
    <div
      className={
        layout === 'mobileSticky'
          ? 'shrink-0 border-t border-gray-200 dark:border-gray-700 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white dark:bg-gray-900 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end'
          : 'mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end'
      }
    >
      <button
        type="button"
        onClick={closeModelPopover}
        className="w-full sm:w-auto px-3 py-2.5 sm:py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={saveModelPicker}
        className="w-full sm:w-auto px-3 py-2.5 sm:py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700"
      >
        Save & apply
      </button>
    </div>
  );

  return (
    <div className="relative flex min-h-0 flex-1 min-w-0 overflow-hidden bg-white dark:bg-gray-800 max-lg:pt-[calc(3.5rem+env(safe-area-inset-top,0px))] lg:pt-0">
      {modelPopoverOpen && pickerDraft && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={modelPickerModalRef}
              role="dialog"
              aria-modal="true"
              aria-label="Assistant model configuration"
              className="lg:hidden fixed inset-0 z-[80] flex flex-col bg-white dark:bg-gray-900"
            >
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))]">
                <div className="flex items-center gap-2 min-w-0">
                  <SlidersHorizontal
                    className="shrink-0 text-blue-600 dark:text-blue-400"
                    size={20}
                    aria-hidden
                  />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                    Model settings
                  </h3>
                </div>
                <button
                  type="button"
                  className="p-2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                  aria-label="Close model settings"
                  onClick={closeModelPopover}
                >
                  <X size={22} />
                </button>
              </div>
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 text-left">
                  {renderModelPickerForm(pickerDraft)}
                </div>
                {renderModelPickerFooter('mobileSticky')}
              </div>
            </div>,
            document.body
          )
        : null}
      {assistantChatsOpen && (
        <button
          type="button"
          aria-label="Close chat list"
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={closeAssistantChats}
        />
      )}
      {assistantChatsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Chat threads"
          className="fixed right-0 top-0 bottom-0 w-80 sm:w-80 md:w-96 z-40 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl lg:hidden flex flex-col max-lg:pt-[calc(3.5rem+env(safe-area-inset-top,0px))] max-lg:pb-[env(safe-area-inset-bottom,0px)] max-lg:pl-[env(safe-area-inset-left,0px)]"
        >
          <ChatThreadList {...threadListProps} />
        </div>
      )}

      <div
        className={`hidden lg:flex bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col transition-[width] duration-300 relative z-10 h-full overflow-hidden ${
          sidebarCollapsed ? 'w-0 border-r-0' : 'w-64'
        }`}
      >
        <ChatThreadList {...threadListProps} />
      </div>

      <button
        type="button"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className={`hidden lg:inline-flex absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
          sidebarCollapsed ? 'left-4' : 'left-64'
        }`}
        aria-label={sidebarCollapsed ? 'Open chat list' : 'Close chat list'}
        aria-expanded={!sidebarCollapsed}
      >
        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white dark:bg-gray-800">
        <BackendStatusBanner />
        <div className="px-2 py-2.5 sm:px-4 sm:py-3 border-b border-gray-200 dark:border-gray-700 flex flex-col gap-2 sm:gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
          <div className="flex gap-2 sm:gap-3 min-w-0 flex-1">
            <Sparkles
              className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0"
              size={20}
              aria-hidden
            />
            <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
              <h2
                className="text-[15px] font-bold text-gray-900 dark:text-white break-words sm:text-base lg:text-lg lg:truncate leading-tight"
                title={assistantHeaderTitle}
              >
                {assistantHeaderTitle}
              </h2>
              <p className="hidden text-xs text-gray-500 dark:text-gray-400 leading-snug sm:block">
                Connected to your Personal OS
              </p>
              {nextSendModelsDisplay ? (
                <div className="pt-0.5 max-w-full" title={nextModelsTitle}>
                  <p className="text-[11px] leading-snug text-gray-800 dark:text-gray-200 flex flex-wrap items-center gap-x-1.5 gap-y-1 sm:gap-x-2 sm:text-[13px]">
                    <span
                      className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        nextSendModelsDisplay.mode === 'auto'
                          ? 'bg-violet-100 text-violet-900 dark:bg-violet-900/45 dark:text-violet-100'
                          : 'bg-amber-100 text-amber-950 dark:bg-amber-900/40 dark:text-amber-100'
                      }`}
                    >
                      {nextSendModelsDisplay.mode === 'auto' ? 'Auto' : 'Manual'}
                    </span>
                    <span className="min-w-0 text-gray-700 dark:text-gray-300">
                      <span className="text-gray-500 dark:text-gray-400">Plan</span>{' '}
                      <span className="font-medium text-gray-900 dark:text-gray-100 break-words">
                        {nextSendModelsDisplay.reasoningLabel}
                      </span>
                      <span className="mx-1.5 text-gray-300 dark:text-gray-600" aria-hidden>
                        ·
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">Reply</span>{' '}
                      <span className="font-medium text-gray-900 dark:text-gray-100 break-words">
                        {nextSendModelsDisplay.responseLabel}
                      </span>
                    </span>
                  </p>
                  {showLastReplySubline && resolvedModelsDisplay ? (
                    <p className="mt-1 text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                      Last reply:{' '}
                      {(resolvedModelsDisplay.modelMode || '').toLowerCase() === 'auto'
                        ? 'Auto'
                        : 'Manual'}{' '}
                      · {resolvedModelsDisplay.reasoningLabel} ·{' '}
                      {resolvedModelsDisplay.responseLabel}
                    </p>
                  ) : null}
                </div>
              ) : null}
              {!isLocalDraft &&
              (contextUsageQuery.data ||
                contextUsageQuery.isLoading ||
                contextUsageQuery.isError) ? (
                <div className="pt-1.5 space-y-1 border-t border-gray-100 dark:border-gray-700/80 mt-1.5">
                  <p className="text-[11px] sm:text-xs text-gray-800 dark:text-gray-200 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span
                      className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        threadCompactionMode === 'manual'
                          ? 'bg-amber-100 text-amber-950 dark:bg-amber-900/40 dark:text-amber-100'
                          : 'bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100'
                      }`}
                    >
                      {threadCompactionMode === 'manual' ? 'Manual compact' : 'Auto compact'}
                    </span>
                    {contextUsageQuery.isLoading ? (
                      <span className="text-gray-500 dark:text-gray-400">Estimating context…</span>
                    ) : contextUsageQuery.isError ? (
                      <span className="text-red-600 dark:text-red-400">
                        Could not load context estimate.
                      </span>
                    ) : contextUsageQuery.data ? (
                      <>
                        <span
                          className={
                            contextUsageQuery.data.utilizationPercent >= 90
                              ? 'text-red-600 dark:text-red-400 font-semibold'
                              : contextUsageQuery.data.utilizationPercent >= 75
                                ? 'text-amber-700 dark:text-amber-300 font-medium'
                                : ''
                          }
                        >
                          Estimated thread context:{' '}
                          {formatContextTokens(contextUsageQuery.data.estimatedThreadTokens)} /{' '}
                          {formatContextTokens(contextUsageQuery.data.budgetTokens)} (
                          {Math.round(contextUsageQuery.data.utilizationPercent)}%)
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-[11px]">
                          (preflight; not billable tokens)
                        </span>
                      </>
                    ) : null}
                  </p>
                  {streamingMeterSnapshot?.lastRunUsage &&
                  (streamingMeterSnapshot.lastRunUsage.inputTokens != null ||
                    streamingMeterSnapshot.lastRunUsage.outputTokens != null ||
                    streamingMeterSnapshot.lastRunUsage.totalTokens != null) ? (
                    <p className="text-[11px] text-gray-600 dark:text-gray-300">
                      Last run actual usage:{' '}
                      {streamingMeterSnapshot.lastRunUsage.inputTokens != null
                        ? `${formatContextTokens(streamingMeterSnapshot.lastRunUsage.inputTokens)} in`
                        : ''}
                      {streamingMeterSnapshot.lastRunUsage.inputTokens != null &&
                      streamingMeterSnapshot.lastRunUsage.outputTokens != null
                        ? ' · '
                        : ''}
                      {streamingMeterSnapshot.lastRunUsage.outputTokens != null
                        ? `${formatContextTokens(streamingMeterSnapshot.lastRunUsage.outputTokens)} out`
                        : ''}
                      {streamingMeterSnapshot.lastRunUsage.totalTokens != null &&
                      streamingMeterSnapshot.lastRunUsage.inputTokens == null &&
                      streamingMeterSnapshot.lastRunUsage.outputTokens == null
                        ? `${formatContextTokens(streamingMeterSnapshot.lastRunUsage.totalTokens)} total`
                        : ''}
                      {streamingMeterSnapshot.lastRunUsage.provider
                        ? ` · ${streamingMeterSnapshot.lastRunUsage.provider}`
                        : ''}
                    </p>
                  ) : null}
                  {streamingMeterSnapshot?.lastContextSummaryApplied === true ? (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      Last reply used a rolling context summary (older turns condensed).
                    </p>
                  ) : null}
                  {manualSendBlockedMessage ? (
                    <div className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-2 py-2 space-y-2">
                      <p className="text-[11px] text-amber-950 dark:text-amber-100">
                        {manualSendBlockedMessage}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={isCompactingThread}
                          onClick={() => void handleCompactThread()}
                          className="px-2.5 py-1.5 rounded-md text-[11px] font-semibold bg-amber-700 text-white hover:bg-amber-800 disabled:opacity-60"
                        >
                          {isCompactingThread ? 'Compacting…' : 'Compact thread now'}
                        </button>
                        <button
                          type="button"
                          onClick={() => threadListProps.onCreateThread()}
                          className="px-2.5 py-1.5 rounded-md text-[11px] font-semibold bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                          Start new thread
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 w-full lg:flex lg:w-auto lg:flex-nowrap lg:items-center lg:justify-end lg:gap-2 shrink-0 lg:pt-0.5">
            <div className="relative min-w-0" ref={modelPickerContainerRef}>
              <button
                type="button"
                onClick={() => (modelPopoverOpen ? closeModelPopover() : openModelPopover())}
                className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-3 text-sm font-medium text-gray-800 transition hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 lg:w-auto"
                aria-expanded={modelPopoverOpen}
                aria-haspopup="dialog"
                title={`Configure models (${modelPickerMode === 'auto' ? 'Auto' : 'Manual'})`}
              >
                <SlidersHorizontal size={16} className="shrink-0" aria-hidden />
                <span className="whitespace-nowrap">Models</span>
              </button>
              {modelPopoverOpen && pickerDraft ? (
                <div
                  role="dialog"
                  aria-label="Assistant model configuration"
                  className="hidden lg:block absolute right-0 top-full mt-2 w-[min(22rem,calc(100vw-2rem))] max-h-[min(32rem,calc(100vh-8rem))] z-50 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-xl p-3 text-left"
                >
                  {renderModelPickerForm(pickerDraft)}
                  {renderModelPickerFooter('popover')}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setViewMode('chat')}
              className={`inline-flex h-11 w-full items-center justify-center rounded-lg px-3 text-sm font-medium transition lg:w-auto ${
                viewMode === 'chat'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setViewMode('memory')}
              className={`inline-flex h-11 w-full items-center justify-center rounded-lg px-3 text-sm font-medium transition lg:w-auto ${
                viewMode === 'memory'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Memory
            </button>
          </div>
        </div>
        {viewMode === 'memory' ? (
          <AssistantMemoryPanel />
        ) : activeThread ? (
          <>
            <AssistantChatTranscript
              isTreeLoading={isTreeLoading}
              isTreeError={isTreeError}
              treeError={treeError}
              onRetryTree={refetchTree}
              transcript={transcript}
              runByAssistantMessageId={runByAssistantMessageId}
              getSiblings={getSiblings}
              latestUserMessageId={latestUserMessageId}
              isLoading={isLoading}
              isStreaming={isStreaming}
              isAwaitingRunStart={isAwaitingRunStart}
              awaitingWsFollowUp={awaitingWsFollowUp}
              thinkingExpanded={thinkingExpanded}
              onToggleThinking={onToggleThinking}
              executionTraceExpanded={executionTraceExpanded}
              onToggleExecutionTrace={onToggleExecutionTrace}
              editingMessageId={editingMessageId}
              onSetEditingMessageId={setEditingMessageId}
              onEditMessage={handleEditMessage}
              onRetryAssistantRun={handleRetryAssistantRun}
              onRetryUserMessage={handleRetryUserMessage}
              onSendFollowUp={sendFollowUp}
              onSelectSibling={selectSibling}
              onPickStarterPrompt={(prompt) => composerRef.current?.setValue(prompt)}
              onRespondToToolApproval={respondToToolApproval}
            />

            <ChatComposer
              ref={composerRef}
              onSend={(value) => {
                handleSendMessage(value);
                composerRef.current?.clear();
              }}
              isInputDisabled={isInputDisabled}
              isLocalDraft={isLocalDraft}
              connectionState={connectionState}
              showReconnectingBanner={showReconnectingBanner}
              showDisconnectedBanner={showDisconnectedBanner}
              onReconnect={reconnect}
              isStreaming={isStreaming}
              activeRunId={activeRunId}
              onCancelRun={cancelRun}
              webSearchEnabled={webSearchEnabled}
              onWebSearchToggle={toggleWebSearch}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            Select or create a chat to get started
          </div>
        )}
        <ToastContainer />
      </div>
    </div>
  );
}
