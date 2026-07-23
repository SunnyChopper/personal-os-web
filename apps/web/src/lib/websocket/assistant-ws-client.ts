import type {
  WsUserMessagePayload,
  WsCancelRunPayload,
  WsRunStartedPayload,
  WsAssistantDeltaPayload,
  WsAssistantContentReplacePayload,
  WsThinkingDeltaPayload,
  WsStatusUpdatePayload,
  WsToolCallCompletePayload,
  WsToolApprovalRequiredPayload,
  WsToolApprovalResponsePayload,
  WsMessageCompletePayload,
  WsThreadUpdatedPayload,
  WsRunErrorPayload,
  WsAssistantModelResolvedPayload,
} from '@/types/chatbot';
import {
  AuthenticatedWsClient,
  type AuthenticatedWsConnectionState,
} from '@/lib/websocket/authenticated-ws-client';

export type WsContextBudgetMetaPayload = {
  runId: string;
  threadId: string;
  contextWindowTokens?: number;
  budgetTokens?: number;
  estimatedInputTokens?: number;
  fittedInputTokens?: number;
  compactionMode?: string;
};

type WsEventHandlers = {
  onToolsEvent?: (payload: unknown) => void;
  onRunStarted?: (payload: WsRunStartedPayload) => void;
  onAssistantModelResolved?: (payload: WsAssistantModelResolvedPayload) => void;
  /** Best-effort: server may emit during a run; optional cache refresh hook. */
  onContextBudgetMeta?: (payload: WsContextBudgetMetaPayload) => void;
  onAssistantDelta?: (payload: WsAssistantDeltaPayload) => void;
  onAssistantContentReplace?: (payload: WsAssistantContentReplacePayload) => void;
  onThinkingDelta?: (payload: WsThinkingDeltaPayload) => void;
  onStatusUpdate?: (payload: WsStatusUpdatePayload) => void;
  onToolApprovalRequired?: (payload: WsToolApprovalRequiredPayload) => void;
  onToolCallComplete?: (payload: WsToolCallCompletePayload) => void;
  onMessageComplete?: (payload: WsMessageCompletePayload) => void;
  onThreadUpdated?: (payload: WsThreadUpdatedPayload) => void;
  onRunError?: (payload: WsRunErrorPayload) => void;
  onConnectionStateChange?: (state: AssistantWsConnectionState) => void;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
};

type AssistantWsClientOptions = WsEventHandlers & {
  wsBaseUrl: string;
  getAccessToken: () => Promise<string | null>;
  /** Runs once before the first socket open (e.g. HTTP preflight). Reset on disconnect/manualReconnect. */
  beforeConnect?: () => Promise<void>;
  reconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectBaseDelayMs?: number;
  reconnectMaxDelayMs?: number;
  authTokenParam?: string;
  keepAliveIntervalMs?: number;
};

export type AssistantWsConnectionState = AuthenticatedWsConnectionState;

export class AssistantWsClient {
  private readonly transport: AuthenticatedWsClient;
  private readonly handlers: WsEventHandlers;

  constructor(options: AssistantWsClientOptions) {
    this.handlers = {
      onToolsEvent: options.onToolsEvent,
      onRunStarted: options.onRunStarted,
      onAssistantModelResolved: options.onAssistantModelResolved,
      onAssistantDelta: options.onAssistantDelta,
      onAssistantContentReplace: options.onAssistantContentReplace,
      onThinkingDelta: options.onThinkingDelta,
      onStatusUpdate: options.onStatusUpdate,
      onToolApprovalRequired: options.onToolApprovalRequired,
      onToolCallComplete: options.onToolCallComplete,
      onMessageComplete: options.onMessageComplete,
      onThreadUpdated: options.onThreadUpdated,
      onRunError: options.onRunError,
      onContextBudgetMeta: options.onContextBudgetMeta,
      onConnectionStateChange: options.onConnectionStateChange,
      onOpen: options.onOpen,
      onClose: options.onClose,
      onError: options.onError,
    };

    this.transport = new AuthenticatedWsClient({
      wsBaseUrl: options.wsBaseUrl,
      getAccessToken: options.getAccessToken,
      beforeConnect: options.beforeConnect,
      reconnect: options.reconnect,
      maxReconnectAttempts: options.maxReconnectAttempts,
      reconnectBaseDelayMs: options.reconnectBaseDelayMs,
      reconnectMaxDelayMs: options.reconnectMaxDelayMs,
      authTokenParam: options.authTokenParam,
      keepAliveIntervalMs: options.keepAliveIntervalMs,
      logLabel: 'Assistant WebSocket',
      onConnectionStateChange: (state) => this.handlers.onConnectionStateChange?.(state),
      onOpen: () => this.handlers.onOpen?.(),
      onClose: (event) => this.handlers.onClose?.(event),
      onError: (event) => this.handlers.onError?.(event),
      onMessage: (type, payload) => this.dispatch(type, payload),
    });
  }

  async connect(): Promise<void> {
    await this.transport.connect();
  }

  disconnect(): void {
    this.transport.disconnect();
  }

  async sendUserMessage(payload: WsUserMessagePayload): Promise<void> {
    await this.transport.sendAfterConnect({
      type: 'userMessage',
      payload,
    });
  }

  async cancelRun(payload: WsCancelRunPayload): Promise<void> {
    await this.transport.sendAfterConnect({
      type: 'cancelRun',
      payload,
    });
  }

  async sendToolApprovalResponse(payload: WsToolApprovalResponsePayload): Promise<void> {
    await this.transport.sendAfterConnect({
      type: 'toolApprovalResponse',
      payload,
    });
  }

  /** Subscribe to Tools fanout (e.g. webhook catcher live events). Requires an open connection. */
  async sendSubscribeToolsEvent(catcherId: string): Promise<void> {
    await this.transport.sendAfterConnect({
      type: 'subscribeToolsEvent',
      payload: { catcherId },
    });
  }

  manualReconnect(): void {
    this.transport.manualReconnect();
  }

  getConnectionState(): AssistantWsConnectionState {
    return this.transport.getConnectionState();
  }

  private dispatch(type: string, payload: unknown): void {
    switch (type) {
      case 'runStarted':
        this.handlers.onRunStarted?.(payload as WsRunStartedPayload);
        break;
      case 'assistantModelResolved':
        this.handlers.onAssistantModelResolved?.(payload as WsAssistantModelResolvedPayload);
        break;
      case 'assistantDelta':
        this.handlers.onAssistantDelta?.(payload as WsAssistantDeltaPayload);
        break;
      case 'assistantContentReplace':
        this.handlers.onAssistantContentReplace?.(payload as WsAssistantContentReplacePayload);
        break;
      case 'thinkingDelta':
        this.handlers.onThinkingDelta?.(payload as WsThinkingDeltaPayload);
        break;
      case 'statusUpdate':
        this.handlers.onStatusUpdate?.(payload as WsStatusUpdatePayload);
        break;
      case 'toolApprovalRequired':
        this.handlers.onToolApprovalRequired?.(payload as WsToolApprovalRequiredPayload);
        break;
      case 'toolCallComplete':
        this.handlers.onToolCallComplete?.(payload as WsToolCallCompletePayload);
        break;
      case 'messageComplete':
        this.handlers.onMessageComplete?.(payload as WsMessageCompletePayload);
        break;
      case 'threadUpdated': {
        const p = payload as Record<string, unknown>;
        const threadId = String(p.threadId ?? p.thread_id ?? '');
        const title = String(p.title ?? '');
        const updatedAt = String(p.updatedAt ?? p.updated_at ?? '');
        const lastMessageAtRaw = p.lastMessageAt ?? p.last_message_at;
        const lastMessageAt =
          lastMessageAtRaw != null && String(lastMessageAtRaw).trim()
            ? String(lastMessageAtRaw)
            : undefined;
        const activeLeafRaw = p.activeLeafMessageId ?? p.active_leaf_message_id;
        const activeLeafMessageId =
          activeLeafRaw != null && String(activeLeafRaw).trim() ? String(activeLeafRaw) : undefined;
        if (threadId && title) {
          this.handlers.onThreadUpdated?.({
            threadId,
            title,
            updatedAt: updatedAt || new Date().toISOString(),
            ...(lastMessageAt ? { lastMessageAt } : {}),
            ...(activeLeafMessageId ? { activeLeafMessageId } : {}),
          });
        }
        break;
      }
      case 'runError':
        this.handlers.onRunError?.(payload as WsRunErrorPayload);
        break;
      case 'contextBudgetMeta':
        this.handlers.onContextBudgetMeta?.(payload as WsContextBudgetMetaPayload);
        break;
      case 'toolsEvent':
        this.handlers.onToolsEvent?.(payload);
        break;
      default:
        break;
    }
  }
}
