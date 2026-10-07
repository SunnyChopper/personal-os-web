import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { BackendStatusBanner } from '@/components/molecules/BackendStatusBanner';
import SlideDrawer from '@/components/molecules/SlideDrawer';
import { AssistantRunConfigPickerForm } from '@/components/organisms/assistant/AssistantRunConfigPickerForm';
import {
  RelevantNowRail,
  RelevantNowRailDrawerBody,
} from '@/components/organisms/assistant/RelevantNowRail';
import type { ModelPickerDraft } from '@/lib/assistant/run-config-picker-draft';
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { AssistantMessagesShell } from '@/components/templates/assistant/AssistantMessagesShell';
import { useAdminShell } from '@/contexts/AdminShellContext';
import { useAssistantChatPage } from '@/hooks/chatbot/useAssistantChatPage';
import { useAssistantShellOverlay } from '@/hooks/chatbot/useAssistantShellOverlay';
import { useRelevantNowRailLayout } from '@/hooks/chatbot/useRelevantNowRailLayout';
import { ChatComposer, type ChatComposerHandle } from '@/components/organisms/ChatComposer';
import { AssistantChatTranscript } from '@/components/organisms/AssistantChatTranscript';
import { AssistantMemoryPanel } from '@/components/organisms/AssistantMemoryPanel';
import { DeleteThreadDialog } from '@/components/molecules/DeleteThreadDialog';
import { resolveThreadTitleDisplay } from '@/lib/chat/whisper-thread-title';
import {
  chatEmptyStateTextClassName,
  chatPageRootClassName,
  chatThreadContextDetailsClassName,
  chatThreadContextDividerClassName,
  chatThreadContextSummaryClassName,
  chatThreadHeaderClassName,
  chatThreadHeaderMenuClassName,
  chatThreadHeaderMenuItemClassName,
  chatThreadHeaderPopoverClassName,
  chatThreadHeaderSubtitleClassName,
  chatThreadHeaderTitleClassName,
} from '@/lib/chat/imessage-surfaces';
import { AssistantRunDebugPanel } from '@/components/molecules/AssistantRunDebugPanel';
import { cn } from '@/lib/utils';

function formatContextTokens(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return `${Math.round(n)}`;
}

export default function ChatbotPage() {
  const composerRef = useRef<ChatComposerHandle>(null);
  const navigate = useNavigate();
  const { assistantRelevantNowOpen, closeAssistantRelevantNow } = useAdminShell();
  const { railCollapsed, toggleRailCollapsed } = useRelevantNowRailLayout();
  useAssistantShellOverlay(assistantRelevantNowOpen, closeAssistantRelevantNow);
  const [viewMode, setViewMode] = useState<'chat' | 'memory'>('chat');
  const [pickerDraft, setPickerDraft] = useState<ModelPickerDraft | null>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const closeModelPopoverRef = useRef<() => void>(() => {});
  const notifyAssistantMessageSent = useCallback(() => closeModelPopoverRef.current(), []);

  const handleRelevantAsk = useCallback(
    (prompt: string) => {
      composerRef.current?.setValue(prompt);
      closeAssistantRelevantNow();
    },
    [closeAssistantRelevantNow]
  );

  const handleRelevantOpen = useCallback(
    (href: string) => {
      closeAssistantRelevantNow();
      navigate(href);
    },
    [closeAssistantRelevantNow, navigate]
  );

  const {
    assistantChatsOpen,
    closeAssistantChats,
    sidebarCollapsed,
    setSidebarCollapsed,
    threadListProps,
    deleteDialogProps,
    activeThread,
    showChatShell,
    isTreeLoading,
    fetchEarlier,
    hasEarlier,
    isFetchingEarlier,
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
    activeRunDebug,
    debugWsEvents,
    lastContextBudgetMeta,
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

  const assistantHeaderTitle = useMemo(() => {
    if (!activeThread?.title?.trim() || activeThread.title.trim().toLowerCase() === 'new chat') {
      return 'Personal OS Assistant';
    }
    return resolveThreadTitleDisplay(activeThread).displayTitle;
  }, [activeThread]);

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
    <div
      className={cn(
        'relative flex min-h-0 flex-1 min-w-0 overflow-hidden',
        chatPageRootClassName,
        'max-lg:pt-[calc(3.5rem+env(safe-area-inset-top,0px))] lg:pt-0'
      )}
    >
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
      <AssistantMessagesShell
        threadListProps={threadListProps}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        assistantChatsOpen={assistantChatsOpen}
        onCloseAssistantChats={closeAssistantChats}
      >
        <BackendStatusBanner />
        <div className={cn('relative shrink-0 px-3 py-2 sm:px-4', chatThreadHeaderClassName)}>
          <div className="flex items-center justify-between gap-2">
            <div className="w-20 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1 text-center">
              <h2 className={chatThreadHeaderTitleClassName} title={assistantHeaderTitle}>
                {assistantHeaderTitle}
              </h2>
              {viewMode === 'chat' && nextSendModelsDisplay ? (
                <p className={chatThreadHeaderSubtitleClassName} title={nextModelsTitle}>
                  {nextSendModelsDisplay.mode === 'auto' ? 'Auto' : 'Manual'} ·{' '}
                  {nextSendModelsDisplay.responseLabel}
                </p>
              ) : viewMode === 'memory' ? (
                <p className={chatThreadHeaderSubtitleClassName}>Memory</p>
              ) : null}
            </div>
            <div
              className="relative flex w-20 shrink-0 items-center justify-end gap-0.5"
              ref={modelPickerContainerRef}
            >
              <button
                type="button"
                onClick={() => setHeaderMenuOpen((v) => !v)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#0A84FF] hover:bg-gray-100 dark:hover:bg-white/10"
                aria-label="Assistant options"
                aria-expanded={headerMenuOpen}
              >
                <MoreHorizontal size={20} />
              </button>
              {headerMenuOpen ? (
                <div className={chatThreadHeaderMenuClassName}>
                  <button
                    type="button"
                    onClick={() => {
                      openModelPopover();
                      setHeaderMenuOpen(false);
                    }}
                    className={chatThreadHeaderMenuItemClassName}
                  >
                    <SlidersHorizontal size={16} />
                    Models
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('chat');
                      setHeaderMenuOpen(false);
                    }}
                    className={chatThreadHeaderMenuItemClassName}
                  >
                    Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('memory');
                      setHeaderMenuOpen(false);
                    }}
                    className={chatThreadHeaderMenuItemClassName}
                  >
                    <Brain size={16} />
                    Memory
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      toggleRailCollapsed();
                      setHeaderMenuOpen(false);
                    }}
                    className={cn(chatThreadHeaderMenuItemClassName, 'lg:hidden')}
                  >
                    Relevant now
                  </button>
                </div>
              ) : null}
              {modelPopoverOpen && pickerDraft ? (
                <div
                  role="dialog"
                  aria-label="Assistant model configuration"
                  className={chatThreadHeaderPopoverClassName}
                >
                  {renderModelPickerForm(pickerDraft)}
                  {renderModelPickerFooter('popover')}
                </div>
              ) : null}
            </div>
          </div>
          {!isLocalDraft &&
          (contextUsageQuery.data ||
            contextUsageQuery.isLoading ||
            contextUsageQuery.isError ||
            manualSendBlockedMessage) ? (
            <details className={chatThreadContextDetailsClassName}>
              <summary className={chatThreadContextSummaryClassName}>
                Thread context &amp; compaction
              </summary>
              <div className={chatThreadContextDividerClassName}>
                {contextUsageQuery.isLoading ? (
                  <span>Estimating context…</span>
                ) : contextUsageQuery.isError ? (
                  <span className="text-red-400">Could not load context estimate.</span>
                ) : contextUsageQuery.data ? (
                  <span
                    className={
                      contextUsageQuery.data.utilizationPercent >= 90
                        ? 'text-red-400'
                        : contextUsageQuery.data.utilizationPercent >= 75
                          ? 'text-amber-300'
                          : ''
                    }
                  >
                    {formatContextTokens(contextUsageQuery.data.estimatedThreadTokens)} /{' '}
                    {formatContextTokens(contextUsageQuery.data.budgetTokens)} (
                    {Math.round(contextUsageQuery.data.utilizationPercent)}%)
                  </span>
                ) : null}
                {manualSendBlockedMessage ? (
                  <div className="space-y-1">
                    <p className="text-amber-700 dark:text-amber-200">{manualSendBlockedMessage}</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={isCompactingThread}
                        onClick={() => void handleCompactThread()}
                        className="rounded-md bg-amber-700 px-2 py-1 text-[10px] font-semibold text-white"
                      >
                        {isCompactingThread ? 'Compacting…' : 'Compact now'}
                      </button>
                      <button
                        type="button"
                        onClick={() => threadListProps.onCreateThread()}
                        className="rounded-md bg-gray-700 px-2 py-1 text-[10px] font-semibold text-white"
                      >
                        New thread
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </details>
          ) : null}
        </div>
        {viewMode === 'memory' ? (
          <AssistantMemoryPanel />
        ) : showChatShell ? (
          <>
            <AssistantChatTranscript
              isTreeLoading={isTreeLoading}
              isTreeError={isTreeError}
              treeError={treeError}
              onRetryTree={refetchTree}
              hasEarlierMessages={hasEarlier}
              isFetchingEarlierMessages={isFetchingEarlier}
              onLoadEarlierMessages={fetchEarlier}
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

            <AssistantRunDebugPanel
              activeRun={activeRunDebug}
              debugEvents={debugWsEvents}
              contextBudgetMeta={lastContextBudgetMeta}
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
          <div
            className={cn('flex flex-1 items-center justify-center', chatEmptyStateTextClassName)}
          >
            Select or create a chat to get started
          </div>
        )}
        <DeleteThreadDialog {...deleteDialogProps} />
      </AssistantMessagesShell>

      <RelevantNowRail
        collapsed={railCollapsed}
        onToggleCollapsed={toggleRailCollapsed}
        onAsk={handleRelevantAsk}
        onOpen={handleRelevantOpen}
      />

      <button
        type="button"
        onClick={toggleRailCollapsed}
        className={`hidden lg:inline-flex absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
          railCollapsed ? 'right-4' : 'right-72'
        }`}
        aria-label={railCollapsed ? 'Open relevant panel' : 'Close relevant panel'}
        aria-expanded={!railCollapsed}
      >
        {railCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      <SlideDrawer
        open={assistantRelevantNowOpen}
        onClose={closeAssistantRelevantNow}
        ariaLabel="What's relevant right now"
        title="What's relevant"
        maxWidth="md"
        panelClassName="lg:hidden max-lg:pt-[calc(3.5rem+env(safe-area-inset-top,0px))]"
      >
        <RelevantNowRailDrawerBody onAsk={handleRelevantAsk} onOpen={handleRelevantOpen} />
      </SlideDrawer>
    </div>
  );
}
