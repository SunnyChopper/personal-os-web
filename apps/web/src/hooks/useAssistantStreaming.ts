import {
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type {
  AssistantLastResolvedModels,
  AssistantRunUsageTokens,
  ChatMessage,
  MessageTreeResponse,
  StatusEntry,
  WsAssistantModelResolvedPayload,
  WsStatusUpdatePayload,
  WsThinkingDeltaPayload,
  WsToolApprovalRequiredPayload,
  WsToolCallCompletePayload,
  WsRunErrorPayload,
  WsUserMessagePayload,
} from '@/types/chatbot';
import type {
  AssistantWsClient,
  AssistantWsConnectionState,
  WsEventHandlers,
} from '@/lib/websocket/assistant-ws-client';
import { getAssistantWsManager } from '@/lib/websocket/assistant-ws-manager';
import { authService } from '@/lib/auth/auth.service';
import { queryKeys } from '@/lib/react-query/query-keys';
import {
  preferRicherTraceArray,
  removeChatMessageCache,
  removeNodeFromTree,
  upsertMessageTreeNodeCache,
  upsertThreadTitleFromWs,
} from '@/lib/react-query/chatbot-cache';
import { soundEffects } from '@/lib/sound-effects';
import { wsLogger } from '@/lib/logger';
import {
  applyThinkingDeltaToRunsAndCache,
  type AssistantStreamingRunState,
} from '@/lib/websocket/thinking-delta-cache';
import {
  scheduleDeltaFlush,
  type StreamingStatusStage,
} from '@/hooks/assistant-streaming/stream-helpers';
import { invalidateGrowthSystemCachesAfterTaskTool } from '@/hooks/assistant-streaming/growth-system-tool-invalidation';
import { formatAssistantRunErrorForDisplay } from '@/lib/chat/assistant-error-display';
import { getResolvedWsUrl } from '@/lib/vite-public-env';
import { apiClient } from '@/lib/api-client';
import {
  AssistantWsPreflightError,
  isAssistantWsPreflightError,
  isWsHandshakeClosedError,
  isWsHandshakeRefusedError,
  isWsHandshakeTimeoutError,
  isWsNoTokenError,
} from '@/lib/websocket/assistant-ws-errors';

export { getRunProgressLabel } from '@/hooks/assistant-streaming/stream-helpers';

type RunState = AssistantStreamingRunState & {
  runId: string;
  /** Thread this run belongs to (from server runStarted); used to scope UI when one WS serves many threads */
  threadId: string;
  statusStage?: StreamingStatusStage;
  statusMessage?: string;
  statusHistory: StatusEntry[];
  runStartedAt: number;
  /** Tool call input/output per completion event (order matches Running tool status entries) */
  toolCallDetails?: WsToolCallCompletePayload[];
  /** Outstanding HITL prompts keyed by approvalId */
  pendingToolApprovals?: Record<string, WsToolApprovalRequiredPayload>;
  resolvedReasoningModelId?: string;
  resolvedResponseModelId?: string;
  modelMode?: string;
};

type StreamingState = {
  runs: Record<string, RunState>;
  isStreaming: boolean;
  isAwaitingRunStart: boolean;
  error: WsRunErrorPayload | null;
  connectionState: AssistantWsConnectionState;
};

type PendingRunDelta = {
  threadId: string;
  assistantDelta: string;
  thinkingDelta: string;
};

/** Last completed run token usage + summary flag (from `messageComplete`). */
export type AssistantStreamingMeterSnapshot = {
  lastRunUsage: AssistantRunUsageTokens | null;
  lastContextSummaryApplied: boolean | null;
};

const WS_BASE_URL = getResolvedWsUrl();

/** Mirrors contract `docs/contracts/websocket-connection-polish-contract-spec.md` (~90s window). */
const RUN_START_ACK_TIMEOUT_MS = 90_000;

/** Map WebSocket connect / preflight failures to a UI payload (distinct codes for session vs backend). */
export function mapAssistantConnectionFailure(
  reason: unknown,
  threadId: string
): WsRunErrorPayload {
  if (isAssistantWsPreflightError(reason)) {
    return {
      runId: 'connection',
      threadId,
      message:
        reason.preflightCode === 'SESSION_EXPIRED'
          ? 'Your session expired or is invalid. Please sign in again.'
          : 'Could not reach the API to verify your session. Check your network and try again.',
      code: reason.preflightCode,
      details: {
        errorName: reason.name,
        ...(reason.preflightDetails ?? {}),
      },
    };
  }
  if (isWsNoTokenError(reason)) {
    return {
      runId: 'connection',
      threadId,
      message: 'Your session expired or is not available. Please sign in again.',
      code: 'SESSION_EXPIRED',
      details: { errorName: reason.name },
    };
  }
  if (isWsHandshakeTimeoutError(reason)) {
    return {
      runId: 'connection',
      threadId,
      message:
        'The assistant streaming connection timed out during handshake. Check your network and try again.',
      code: 'WS_HANDSHAKE_TIMEOUT',
      details: {
        errorName: reason.name,
        timeoutMs: reason.timeoutMs,
      },
    };
  }

  const handshakeMessage = reason instanceof Error ? reason.message : String(reason);
  const errorName = reason instanceof Error ? reason.name : 'Error';
  const details: Record<string, unknown> = {
    handshakeError: handshakeMessage,
    errorName,
    preflightHttpOk: true,
  };
  if (isWsHandshakeClosedError(reason)) {
    details.closeCode = reason.closeCode;
    details.closeReason = reason.closeReason;
    details.wasClean = reason.wasClean;
  }
  if (isWsHandshakeRefusedError(reason)) {
    details.handshakePhase = 'onerror';
  }

  return {
    runId: 'connection',
    threadId,
    message:
      'The assistant streaming service rejected the WebSocket connection. If this persists, check $connect logs in CloudWatch.',
    code: 'WS_BACKEND_REJECTED',
    details,
  };
}

async function runAssistantStreamingPreflight(): Promise<void> {
  const token = await authService.getValidAccessToken();
  if (!token) {
    throw new AssistantWsPreflightError(
      'SESSION_EXPIRED',
      'No access token available for streaming. Sign in again.'
    );
  }
  apiClient.setAuthToken(token);
  const me = await apiClient.get<unknown>('/auth/me');
  if (!me.success) {
    const errCode = me.error?.code ?? '';
    const isAuth =
      errCode === 'HTTP_401' ||
      errCode === 'HTTP_403' ||
      errCode === 'NO_ACCESS_TOKEN' ||
      errCode === 'TOKEN_REFRESH_FAILED' ||
      errCode === 'REFRESH_FAILED';
    const isNet =
      errCode === 'NETWORK_ERROR' ||
      errCode === 'ERR_CONNECTION_REFUSED' ||
      (typeof errCode === 'string' && errCode.toUpperCase().includes('NETWORK'));
    if (isAuth) {
      throw new AssistantWsPreflightError(
        'SESSION_EXPIRED',
        'The API rejected your session. Sign in again.',
        { probeErrorCode: errCode }
      );
    }
    if (isNet) {
      throw new AssistantWsPreflightError(
        'WS_NETWORK_FAILURE',
        'Could not verify your session with the API (network error).',
        { probeErrorCode: errCode }
      );
    }
    throw new AssistantWsPreflightError(
      'WS_NETWORK_FAILURE',
      me.error?.message ?? 'Preflight failed',
      {
        probeErrorCode: errCode,
      }
    );
  }
}

const cancelScheduledDeltaFlush = (handle: number): void => {
  if (typeof window !== 'undefined') {
    if (typeof window.cancelAnimationFrame === 'function') {
      window.cancelAnimationFrame(handle);
      return;
    }
    window.clearTimeout(handle);
  }
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

export const shouldPreserveFailedPlaceholderOnMessageComplete = (
  existingMessage: ChatMessage | undefined,
  incomingMessage: ChatMessage
): boolean =>
  incomingMessage.role === 'assistant' &&
  !incomingMessage.content.trim() &&
  existingMessage?.role === 'assistant' &&
  existingMessage.clientStatus === 'failed';

export { removeNodeFromTree };

export function useAssistantStreaming(threadId: string | undefined) {
  const queryClient = useQueryClient();
  const [runs, setRuns] = useState<Record<string, RunState>>({});
  const [lastResolvedModelPick, setLastResolvedModelPick] =
    useState<AssistantLastResolvedModels | null>(null);
  const [streamingMeterSnapshot, setStreamingMeterSnapshot] =
    useState<AssistantStreamingMeterSnapshot | null>(null);
  const [pendingRunStartCount, setPendingRunStartCount] = useState(0);
  const [error, setError] = useState<WsRunErrorPayload | null>(null);
  const [connectionState, setConnectionState] =
    useState<AssistantWsConnectionState>('disconnected');
  const subscriptionRef = useRef<{ unsubscribe: () => void; client: AssistantWsClient } | null>(
    null
  );
  const streamingHandlersRef = useRef<WsEventHandlers | null>(null);
  const pendingRunStartTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const anonRunStartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thinkingSoundPlayedRef = useRef<Record<string, boolean>>({});
  const failedRunIdsRef = useRef<Record<string, boolean>>({});
  const pendingDeltasRef = useRef<Record<string, PendingRunDelta>>({});
  const flushHandleRef = useRef<number | null>(null);
  const threadIdRef = useRef(threadId);
  /** Updated synchronously on each assistant WS delta; avoids empty run.buffer on runError in the same tick as RAF-batched flushes. */
  const streamedAssistantByRunIdRef = useRef<Record<string, string>>({});

  const isAwaitingRunStart = pendingRunStartCount > 0;

  const runsForActiveThread = useMemo(() => {
    if (!threadId) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(runs).filter(([, run]) => run.threadId === threadId)
    ) as Record<string, RunState>;
  }, [runs, threadId]);

  const isStreaming = useMemo(
    () => Object.keys(runsForActiveThread).length > 0,
    [runsForActiveThread]
  );

  useEffect(() => {
    threadIdRef.current = threadId;
  }, [threadId]);

  useEffect(() => {
    setLastResolvedModelPick(null);
    setStreamingMeterSnapshot(null);
  }, [threadId]);

  const applyPendingDeltas = useCallback(
    (pendingRuns: Record<string, PendingRunDelta>) => {
      const pendingEntries = Object.entries(pendingRuns);
      if (pendingEntries.length === 0) {
        return;
      }
      setRuns((current) => {
        let next = current;
        for (const [runId, pending] of pendingEntries) {
          const run = next[runId];
          if (!run) {
            continue;
          }
          if (pending.assistantDelta) {
            const nextBuffer = `${run.buffer}${pending.assistantDelta}`;
            const placeholder = buildPlaceholderMessage(
              pending.threadId,
              run.assistantMessageId,
              run.userMessageId,
              nextBuffer,
              run.thinkingBuffer || undefined
            );
            upsertMessageTreeNodeCache(queryClient, pending.threadId, placeholder);
            next = {
              ...next,
              [runId]: {
                ...run,
                buffer: nextBuffer,
              },
            };
          }
          if (pending.thinkingDelta) {
            next = applyThinkingDeltaToRunsAndCache<RunState>(
              next,
              {
                runId,
                threadId: pending.threadId,
                delta: pending.thinkingDelta,
              },
              queryClient
            );
          }
        }
        return next;
      });
    },
    [queryClient]
  );

  const flushPendingDeltas = useCallback(() => {
    if (flushHandleRef.current !== null) {
      cancelScheduledDeltaFlush(flushHandleRef.current);
      flushHandleRef.current = null;
    }
    const pendingRuns = pendingDeltasRef.current;
    pendingDeltasRef.current = {};
    applyPendingDeltas(pendingRuns);
  }, [applyPendingDeltas]);

  const schedulePendingDeltaFlush = useCallback(() => {
    if (flushHandleRef.current !== null) {
      return;
    }
    flushHandleRef.current = scheduleDeltaFlush(() => {
      flushHandleRef.current = null;
      const pendingRuns = pendingDeltasRef.current;
      pendingDeltasRef.current = {};
      applyPendingDeltas(pendingRuns);
    });
  }, [applyPendingDeltas]);

  const clearRunStartAckForUserMessageId = useCallback((userMessageId: string) => {
    const t = pendingRunStartTimersRef.current.get(userMessageId);
    if (t) {
      clearTimeout(t);
      pendingRunStartTimersRef.current.delete(userMessageId);
    }
  }, []);

  const clearAnonRunStartTimer = useCallback(() => {
    if (anonRunStartTimerRef.current) {
      clearTimeout(anonRunStartTimerRef.current);
      anonRunStartTimerRef.current = null;
    }
  }, []);

  const clearAllRunStartAckTimers = useCallback(() => {
    for (const t of pendingRunStartTimersRef.current.values()) {
      clearTimeout(t);
    }
    pendingRunStartTimersRef.current.clear();
    clearAnonRunStartTimer();
  }, [clearAnonRunStartTimer]);

  const scheduleRunStartAck = useCallback(
    (messageId: string | undefined, forThreadId: string) => {
      if (messageId) {
        clearRunStartAckForUserMessageId(messageId);
        const timer = setTimeout(() => {
          pendingRunStartTimersRef.current.delete(messageId);
          setPendingRunStartCount((c) => Math.max(0, c - 1));
          setError({
            runId: 'pending',
            threadId: forThreadId,
            message:
              'The assistant did not acknowledge your message in time. You can try sending again.',
            code: 'RUN_START_TIMEOUT',
            details: { userMessageId: messageId, timeoutMs: RUN_START_ACK_TIMEOUT_MS },
          });
        }, RUN_START_ACK_TIMEOUT_MS);
        pendingRunStartTimersRef.current.set(messageId, timer);
        return;
      }
      clearAnonRunStartTimer();
      anonRunStartTimerRef.current = setTimeout(() => {
        anonRunStartTimerRef.current = null;
        setPendingRunStartCount((c) => Math.max(0, c - 1));
        setError({
          runId: 'pending',
          threadId: forThreadId,
          message:
            'The assistant did not acknowledge your message in time. You can try sending again.',
          code: 'RUN_START_TIMEOUT',
          details: { timeoutMs: RUN_START_ACK_TIMEOUT_MS },
        });
      }, RUN_START_ACK_TIMEOUT_MS);
    },
    [clearRunStartAckForUserMessageId, clearAnonRunStartTimer]
  );

  useLayoutEffect(() => {
    const handlers: WsEventHandlers = {
      onConnectionStateChange: (state) => {
        setConnectionState(state);
        if (state === 'disconnected' || state === 'failed') {
          clearAllRunStartAckTimers();
          setPendingRunStartCount(0);
        }
      },
      onRunStarted: (payload) => {
        soundEffects.play('whoosh', { volume: 0.14 });
        wsLogger.info('Assistant runStarted (awaiting first status/delta)', {
          runId: payload.runId,
          threadId: payload.threadId,
          assistantMessageId: payload.assistantMessageId,
          userMessageId: payload.userMessageId,
        });
        setError(null);
        clearRunStartAckForUserMessageId(payload.userMessageId);
        clearAnonRunStartTimer();
        setPendingRunStartCount((current) => Math.max(0, current - 1));
        thinkingSoundPlayedRef.current[payload.runId] = false;
        streamedAssistantByRunIdRef.current[payload.runId] = '';
        const runStartedAt = Date.now();
        const bootstrapPlanningMessage = 'Planning your answer';
        const bootstrapPlanningEntry: StatusEntry = {
          stage: 'planning',
          message: bootstrapPlanningMessage,
          startedAt: runStartedAt,
        };
        setRuns((current) => ({
          ...current,
          [payload.runId]: {
            runId: payload.runId,
            threadId: payload.threadId,
            assistantMessageId: payload.assistantMessageId,
            userMessageId: payload.userMessageId,
            buffer: '',
            thinkingBuffer: '',
            statusStage: 'planning',
            statusMessage: bootstrapPlanningMessage,
            statusHistory: [bootstrapPlanningEntry],
            runStartedAt,
            pendingToolApprovals: {},
          },
        }));
        const placeholder = buildPlaceholderMessage(
          payload.threadId,
          payload.assistantMessageId,
          payload.userMessageId,
          ''
        );
        upsertMessageTreeNodeCache(queryClient, payload.threadId, placeholder);
      },
      onContextBudgetMeta: (payload) => {
        const tid = typeof payload.threadId === 'string' ? payload.threadId : '';
        if (tid) {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.chatbot.contextUsage.prefix(tid),
          });
        }
      },
      onAssistantModelResolved: (payload: WsAssistantModelResolvedPayload) => {
        if (threadIdRef.current && payload.threadId === threadIdRef.current) {
          setLastResolvedModelPick({
            threadId: payload.threadId,
            resolvedReasoningModelId: payload.resolvedReasoningModelId,
            resolvedResponseModelId: payload.resolvedResponseModelId,
            modelMode: payload.modelMode,
          });
        }
        startTransition(() => {
          setRuns((current) => {
            const run = current[payload.runId];
            if (!run) {
              return current;
            }
            return {
              ...current,
              [payload.runId]: {
                ...run,
                resolvedReasoningModelId: payload.resolvedReasoningModelId,
                resolvedResponseModelId: payload.resolvedResponseModelId,
                modelMode: payload.modelMode,
              },
            };
          });
        });
      },
      onAssistantDelta: (payload) => {
        const prevStreamed = streamedAssistantByRunIdRef.current[payload.runId] ?? '';
        streamedAssistantByRunIdRef.current[payload.runId] = `${prevStreamed}${payload.delta}`;
        const pending = pendingDeltasRef.current[payload.runId] ?? {
          threadId: payload.threadId,
          assistantDelta: '',
          thinkingDelta: '',
        };
        pending.threadId = payload.threadId;
        pending.assistantDelta = `${pending.assistantDelta}${payload.delta}`;
        pendingDeltasRef.current[payload.runId] = pending;
        schedulePendingDeltaFlush();
      },
      onThinkingDelta: (payload: WsThinkingDeltaPayload) => {
        if (!thinkingSoundPlayedRef.current[payload.runId]) {
          soundEffects.play('click', { volume: 0.16 });
          thinkingSoundPlayedRef.current[payload.runId] = true;
        }
        const pending = pendingDeltasRef.current[payload.runId] ?? {
          threadId: payload.threadId,
          assistantDelta: '',
          thinkingDelta: '',
        };
        pending.threadId = payload.threadId;
        pending.thinkingDelta = `${pending.thinkingDelta}${payload.delta}`;
        pendingDeltasRef.current[payload.runId] = pending;
        schedulePendingDeltaFlush();
      },
      onStatusUpdate: (payload: WsStatusUpdatePayload) => {
        startTransition(() => {
          setRuns((current) => {
            const run = current[payload.runId];
            if (!run) {
              return current;
            }
            const now = Date.now();
            const newEntry: StatusEntry = {
              stage: payload.stage,
              message: payload.message,
              startedAt: now,
            };
            const prevHistory = run.statusHistory;
            const soleBootstrapPlanning =
              prevHistory.length === 1 &&
              prevHistory[0].stage === 'planning' &&
              payload.stage === 'planning';
            const mergedMessage =
              (payload.message?.trim() && payload.message.trim()) ||
              prevHistory[0]?.message ||
              undefined;
            const nextHistory = soleBootstrapPlanning
              ? [{ ...newEntry, message: mergedMessage, startedAt: now }]
              : [...prevHistory, newEntry];
            const prevLast = prevHistory[prevHistory.length - 1];
            const replanAfterTools =
              payload.stage === 'planning' &&
              !soleBootstrapPlanning &&
              prevLast?.stage === 'runningTools';
            if (replanAfterTools) {
              upsertMessageTreeNodeCache(
                queryClient,
                run.threadId,
                buildPlaceholderMessage(
                  run.threadId,
                  run.assistantMessageId,
                  run.userMessageId,
                  run.buffer,
                  ''
                )
              );
            }
            return {
              ...current,
              [payload.runId]: {
                ...run,
                statusStage: payload.stage,
                statusMessage: mergedMessage ?? payload.message,
                statusHistory: nextHistory,
                ...(replanAfterTools ? { thinkingBuffer: '' } : {}),
              },
            };
          });
        });
      },
      onToolApprovalRequired: (payload: WsToolApprovalRequiredPayload) => {
        startTransition(() => {
          setRuns((current) => {
            const run = current[payload.runId];
            if (!run) {
              return current;
            }
            const pending = { ...(run.pendingToolApprovals ?? {}) };
            pending[payload.approvalId] = payload;
            const approvalEntry: StatusEntry = {
              stage: 'awaitingApproval',
              message: `Awaiting approval: ${payload.toolName}`,
              startedAt: Date.now(),
              approvalId: payload.approvalId,
            };
            return {
              ...current,
              [payload.runId]: {
                ...run,
                statusStage: 'awaitingApproval',
                statusMessage: approvalEntry.message,
                pendingToolApprovals: pending,
                statusHistory: [...run.statusHistory, approvalEntry],
              },
            };
          });
        });
      },
      onToolCallComplete: (payload: WsToolCallCompletePayload) => {
        invalidateGrowthSystemCachesAfterTaskTool(queryClient, payload);
        startTransition(() => {
          setRuns((current) => {
            const run = current[payload.runId];
            if (!run) {
              return current;
            }
            const details = run.toolCallDetails ?? [];
            return {
              ...current,
              [payload.runId]: {
                ...run,
                toolCallDetails: [...details, payload],
              },
            };
          });
        });
      },
      onMessageComplete: (payload) => {
        flushPendingDeltas();
        if (payload.message.role === 'assistant' && payload.message.parentId) {
          clearRunStartAckForUserMessageId(payload.message.parentId);
        }
        delete thinkingSoundPlayedRef.current[payload.runId];
        const usage = payload.lastRunUsage;
        const hasNumeric =
          usage != null &&
          (usage.inputTokens != null || usage.outputTokens != null || usage.totalTokens != null);
        setStreamingMeterSnapshot({
          lastRunUsage: hasNumeric ? usage : null,
          lastContextSummaryApplied:
            payload.contextSummaryApplied === true
              ? true
              : payload.contextSummaryApplied === false
                ? false
                : null,
        });
        if (payload.threadId) {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.chatbot.contextUsage.prefix(payload.threadId),
          });
        }
        setRuns((current) => {
          const run = current[payload.runId];
          if (run && run.assistantMessageId !== payload.message.id) {
            const tree = queryClient.getQueryData<MessageTreeResponse>(
              queryKeys.chatbot.messages.tree(payload.threadId)
            );
            if (tree) {
              queryClient.setQueryData(
                queryKeys.chatbot.messages.tree(payload.threadId),
                removeNodeFromTree(tree, run.assistantMessageId)
              );
            }
          }
          const existingTree = queryClient.getQueryData<MessageTreeResponse>(
            queryKeys.chatbot.messages.tree(payload.threadId)
          );
          const existingMessage = existingTree?.nodes.find(
            (node) => node.id === payload.message.id
          );
          const isCompletionForFailedPlaceholder = shouldPreserveFailedPlaceholderOnMessageComplete(
            existingMessage,
            payload.message
          );
          const shouldIgnoreCompletionForFailedRun =
            Boolean(failedRunIdsRef.current[payload.runId]) &&
            payload.message.role === 'assistant' &&
            !payload.message.content.trim();

          if (!isCompletionForFailedPlaceholder && !shouldIgnoreCompletionForFailedRun) {
            soundEffects.play('success', { volume: 0.18 });
            let messageToStore = payload.message;
            if (run && messageToStore.role === 'assistant') {
              messageToStore = {
                ...messageToStore,
                executionSteps: preferRicherTraceArray(
                  messageToStore.executionSteps,
                  run.statusHistory
                ),
                toolCallDetails: preferRicherTraceArray(
                  messageToStore.toolCallDetails,
                  run.toolCallDetails
                ),
              };
            }
            upsertMessageTreeNodeCache(queryClient, payload.threadId, messageToStore);
          }
          delete failedRunIdsRef.current[payload.runId];
          delete streamedAssistantByRunIdRef.current[payload.runId];
          const { [payload.runId]: _removed, ...rest } = current;
          return rest;
        });
      },
      onThreadUpdated: (payload) => {
        if (!payload.threadId) {
          return;
        }
        upsertThreadTitleFromWs(queryClient, payload.threadId, payload.title, payload.updatedAt);
      },
      onRunError: (payload) => {
        const streamedSnapshot = streamedAssistantByRunIdRef.current[payload.runId] ?? '';
        flushPendingDeltas();
        delete thinkingSoundPlayedRef.current[payload.runId];
        clearAllRunStartAckTimers();
        setPendingRunStartCount(0);
        setRuns((current) => {
          const run = current[payload.runId];
          if (run) {
            const mergedBuffer = streamedSnapshot.length > 0 ? streamedSnapshot : run.buffer;
            const hadStreamedAssistant = Boolean(mergedBuffer.trim());
            if (hadStreamedAssistant) {
              setError(null);
            } else {
              setError(payload);
            }
            if (!hadStreamedAssistant) {
              soundEffects.play('error', { volume: 0.18 });
              failedRunIdsRef.current[payload.runId] = true;
            } else {
              delete failedRunIdsRef.current[payload.runId];
            }
            const placeholder = buildPlaceholderMessage(
              payload.threadId,
              run.assistantMessageId,
              run.userMessageId,
              hadStreamedAssistant ? mergedBuffer : '',
              run.thinkingBuffer || undefined
            );
            if (!hadStreamedAssistant) {
              placeholder.clientStatus = 'failed';
              placeholder.clientError = formatAssistantRunErrorForDisplay(payload);
            }
            upsertMessageTreeNodeCache(queryClient, payload.threadId, placeholder);
          } else {
            setError(payload);
            soundEffects.play('error', { volume: 0.18 });
            failedRunIdsRef.current[payload.runId] = true;
          }
          delete streamedAssistantByRunIdRef.current[payload.runId];
          const { [payload.runId]: _removed, ...rest } = current;
          return rest;
        });
      },
    };
    streamingHandlersRef.current = handlers;
  }, [
    clearAllRunStartAckTimers,
    clearRunStartAckForUserMessageId,
    clearAnonRunStartTimer,
    flushPendingDeltas,
    queryClient,
    schedulePendingDeltaFlush,
  ]);

  useLayoutEffect(() => {
    if (!WS_BASE_URL) {
      setConnectionState('disconnected');
      return;
    }

    const { client, unsubscribe } = getAssistantWsManager().subscribe(WS_BASE_URL, {
      getAccessToken: async () => authService.getValidAccessToken(),
      beforeConnect: runAssistantStreamingPreflight,
      keepAliveIntervalMs: 240_000,
      connectTimeoutMs: 30_000,
      onConnectionStateChange: (state) =>
        streamingHandlersRef.current?.onConnectionStateChange?.(state),
      onRunStarted: (payload) => streamingHandlersRef.current?.onRunStarted?.(payload),
      onContextBudgetMeta: (payload) =>
        streamingHandlersRef.current?.onContextBudgetMeta?.(payload),
      onAssistantModelResolved: (payload) =>
        streamingHandlersRef.current?.onAssistantModelResolved?.(payload),
      onAssistantDelta: (payload) => streamingHandlersRef.current?.onAssistantDelta?.(payload),
      onThinkingDelta: (payload) => streamingHandlersRef.current?.onThinkingDelta?.(payload),
      onStatusUpdate: (payload) => streamingHandlersRef.current?.onStatusUpdate?.(payload),
      onToolApprovalRequired: (payload) =>
        streamingHandlersRef.current?.onToolApprovalRequired?.(payload),
      onToolCallComplete: (payload) => streamingHandlersRef.current?.onToolCallComplete?.(payload),
      onMessageComplete: (payload) => streamingHandlersRef.current?.onMessageComplete?.(payload),
      onThreadUpdated: (payload) => streamingHandlersRef.current?.onThreadUpdated?.(payload),
      onRunError: (payload) => streamingHandlersRef.current?.onRunError?.(payload),
    });

    subscriptionRef.current = { client, unsubscribe };
    let cancelled = false;
    setConnectionState(client.getConnectionState());
    void client.connect().then(
      () => {
        if (!cancelled) {
          setConnectionState(client.getConnectionState());
        }
      },
      (reason: unknown) => {
        if (cancelled) {
          return;
        }
        setConnectionState('failed');
        wsLogger.warn('Assistant WebSocket connect failed', {
          threadId: threadIdRef.current,
          errorName: reason instanceof Error ? reason.name : typeof reason,
        });
        setError(mapAssistantConnectionFailure(reason, threadIdRef.current ?? ''));
      }
    );

    return () => {
      cancelled = true;
      unsubscribe();
      subscriptionRef.current = null;
      clearAllRunStartAckTimers();
      thinkingSoundPlayedRef.current = {};
      failedRunIdsRef.current = {};
      streamedAssistantByRunIdRef.current = {};
      pendingDeltasRef.current = {};
      if (flushHandleRef.current !== null) {
        cancelScheduledDeltaFlush(flushHandleRef.current);
        flushHandleRef.current = null;
      }
      setConnectionState('disconnected');
    };
  }, [clearAllRunStartAckTimers]);

  const getStreamingClient = useCallback((): AssistantWsClient | null => {
    if (!WS_BASE_URL) {
      return null;
    }
    return subscriptionRef.current?.client ?? getAssistantWsManager().getClient(WS_BASE_URL);
  }, []);

  const sendUserMessage = useCallback(
    (payload: Omit<WsUserMessagePayload, 'threadId'>) => {
      if (!threadId) {
        return;
      }
      const client = getStreamingClient();
      if (!client) {
        setError({
          runId: 'connection',
          threadId,
          message: 'Assistant connection is not available.',
          code: 'CONNECTION_FAILED',
        });
        return;
      }
      const runSend = async () => {
        try {
          await client.sendUserMessage({
            threadId,
            ...payload,
          });
          scheduleRunStartAck(payload.messageId, threadId);
        } catch (sendErr: unknown) {
          if (payload.messageId) {
            clearRunStartAckForUserMessageId(payload.messageId);
          } else {
            clearAnonRunStartTimer();
          }
          setPendingRunStartCount((current) => Math.max(0, current - 1));
          setError(mapAssistantConnectionFailure(sendErr, threadId));
        }
      };

      setError(null);
      setPendingRunStartCount((current) => current + 1);
      void runSend();
    },
    [
      clearAnonRunStartTimer,
      clearRunStartAckForUserMessageId,
      getStreamingClient,
      scheduleRunStartAck,
      threadId,
    ]
  );

  const sendFollowUp = useCallback(
    (userMessageId: string, options?: { runConfig?: WsUserMessagePayload['runConfig'] }) => {
      if (!threadId) {
        return;
      }

      const tree = queryClient.getQueryData<MessageTreeResponse>(
        queryKeys.chatbot.messages.tree(threadId)
      );
      if (tree) {
        const assistantChildIds = tree.nodes
          .filter((node) => node.role === 'assistant' && node.parentId === userMessageId)
          .map((node) => node.id);
        if (assistantChildIds.length > 0) {
          const nextTree = assistantChildIds.reduce(
            (currentTree, nodeId) => removeNodeFromTree(currentTree, nodeId),
            tree
          );
          queryClient.setQueryData(queryKeys.chatbot.messages.tree(threadId), nextTree);
          assistantChildIds.forEach((id) => {
            removeChatMessageCache(queryClient, threadId, id);
          });
        }
      }

      sendUserMessage({
        messageId: userMessageId,
        ...(options?.runConfig ? { runConfig: options.runConfig } : {}),
      });
    },
    [queryClient, sendUserMessage, threadId]
  );

  const cancelRun = useCallback(
    (runId: string) => {
      const client = getStreamingClient();
      if (!client) {
        return;
      }
      void client.cancelRun({ runId }).catch(() => {});
    },
    [getStreamingClient]
  );

  const respondToToolApproval = useCallback(
    (runId: string, approvalId: string, decision: 'approve' | 'reject') => {
      const client = getStreamingClient();
      if (!client) {
        setError({
          runId: 'connection',
          threadId: threadId ?? '',
          message: 'Assistant connection is not available.',
          code: 'CONNECTION_FAILED',
        });
        return;
      }
      const approve = async () => {
        try {
          await client.sendToolApprovalResponse({ runId, approvalId, decision });
        } catch {
          setError({
            runId: 'connection',
            threadId: threadId ?? '',
            message: 'Assistant connection is not available.',
            code: 'CONNECTION_FAILED',
          });
          return;
        }
        startTransition(() => {
          setRuns((current) => {
            const run = current[runId];
            if (!run) {
              return current;
            }
            const { [approvalId]: _removed, ...restPending } = run.pendingToolApprovals ?? {};
            const nextPending = Object.keys(restPending).length > 0 ? restPending : undefined;
            const resolvedLabel =
              decision === 'approve' ? 'Approved — running tool' : 'Rejected — skipped';
            const updatedHistory = run.statusHistory.map((entry) =>
              entry.approvalId === approvalId && entry.stage === 'awaitingApproval'
                ? {
                    ...entry,
                    stage: 'approvalResolved' as const,
                    message: resolvedLabel,
                  }
                : entry
            );
            const stillAwaiting = Object.keys(restPending).length > 0;
            return {
              ...current,
              [runId]: {
                ...run,
                pendingToolApprovals: nextPending,
                statusHistory: updatedHistory,
                ...(stillAwaiting
                  ? {}
                  : {
                      statusStage: 'runningTools' as const,
                      statusMessage: undefined,
                    }),
              },
            };
          });
        });
      };

      void approve().catch(() => {});
    },
    [getStreamingClient, threadId]
  );

  const reconnect = useCallback(() => {
    const client = getStreamingClient();
    if (!client) {
      setError({
        runId: 'connection',
        threadId: threadId ?? '',
        message: 'Assistant connection is not available.',
        code: 'CONNECTION_FAILED',
      });
      return;
    }
    setError(null);
    client.manualReconnect();
  }, [getStreamingClient, threadId]);

  const retryRun = useCallback(
    (
      userMessageId: string,
      failedAssistantPlaceholderId: string,
      options?: { runConfig?: WsUserMessagePayload['runConfig'] }
    ) => {
      if (!threadId) {
        return;
      }

      const tree = queryClient.getQueryData<MessageTreeResponse>(
        queryKeys.chatbot.messages.tree(threadId)
      );
      if (tree) {
        const failedAssistantNodeIds = tree.nodes
          .filter(
            (node) =>
              node.role === 'assistant' &&
              node.parentId === userMessageId &&
              node.clientStatus === 'failed'
          )
          .map((node) => node.id);
        const idsToRemove = Array.from(
          new Set([...failedAssistantNodeIds, failedAssistantPlaceholderId])
        );
        const nextTree = idsToRemove.reduce(
          (currentTree, nodeId) => removeNodeFromTree(currentTree, nodeId),
          tree
        );
        queryClient.setQueryData(queryKeys.chatbot.messages.tree(threadId), nextTree);
      }

      setError(null);
      sendFollowUp(userMessageId, { runConfig: options?.runConfig });
    },
    [queryClient, sendFollowUp, threadId]
  );

  const state: StreamingState = {
    runs: runsForActiveThread,
    isStreaming,
    isAwaitingRunStart,
    error,
    connectionState,
  };

  return {
    ...state,
    lastResolvedModelPick,
    streamingMeterSnapshot,
    sendUserMessage,
    sendFollowUp,
    cancelRun,
    respondToToolApproval,
    reconnect,
    retryRun,
  };
}
