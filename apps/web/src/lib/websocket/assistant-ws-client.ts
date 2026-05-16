import type {
  WsUserMessagePayload,
  WsCancelRunPayload,
  WsRunStartedPayload,
  WsAssistantDeltaPayload,
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
import { wsLogger } from '@/lib/logger';
import {
  WsHandshakeClosedError,
  WsHandshakeRefusedError,
  WsHandshakeTimeoutError,
  WsNoTokenError,
} from '@/lib/websocket/assistant-ws-errors';

/** Close codes that should not trigger automatic reconnect (policy / auth at app layer). */
const DEFAULT_TERMINAL_CLOSE_CODES = new Set([1008, 4401, 4403, 4030]);

function reconnectDelayWithJitter(baseMs: number, attemptIndex: number, maxMs: number): number {
  const exp = Math.min(baseMs * 2 ** attemptIndex, maxMs);
  return Math.floor(exp * (1 + Math.random() * 0.2));
}

function jwtExpRemainingSeconds(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    if (!payload.exp || typeof payload.exp !== 'number') {
      return null;
    }
    return payload.exp - Math.floor(Date.now() / 1000);
  } catch {
    return null;
  }
}

export type WsContextBudgetMetaPayload = {
  runId: string;
  threadId: string;
  contextWindowTokens?: number;
  budgetTokens?: number;
  estimatedInputTokens?: number;
  fittedInputTokens?: number;
  compactionMode?: string;
};

export type WsEventHandlers = {
  onToolsEvent?: (payload: unknown) => void;
  onRunStarted?: (payload: WsRunStartedPayload) => void;
  onAssistantModelResolved?: (payload: WsAssistantModelResolvedPayload) => void;
  /** Best-effort: server may emit during a run; optional cache refresh hook. */
  onContextBudgetMeta?: (payload: WsContextBudgetMetaPayload) => void;
  onAssistantDelta?: (payload: WsAssistantDeltaPayload) => void;
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

export type AssistantWsClientOptions = WsEventHandlers & {
  wsBaseUrl: string;
  getAccessToken: () => Promise<string | null>;
  /** Runs once before the first socket open (e.g. HTTP preflight). Reset on disconnect/manualReconnect. */
  beforeConnect?: () => Promise<void>;
  reconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectBaseDelayMs?: number;
  reconnectMaxDelayMs?: number;
  /** Max ms waiting for open/error/close during handshake; 0 disables. */
  connectTimeoutMs?: number;
  /** If true (default), do not reconnect after a terminal close code (see terminalCloseCodes). */
  honorTerminalCloseCodes?: boolean;
  terminalCloseCodes?: ReadonlySet<number>;
  authTokenParam?: string;
  keepAliveIntervalMs?: number;
};

type IncomingMessage =
  | { type: 'toolsEvent'; payload: unknown }
  | { type: 'runStarted'; payload: WsRunStartedPayload }
  | { type: 'assistantModelResolved'; payload: WsAssistantModelResolvedPayload }
  | { type: 'assistantDelta'; payload: WsAssistantDeltaPayload }
  | { type: 'thinkingDelta'; payload: WsThinkingDeltaPayload }
  | { type: 'statusUpdate'; payload: WsStatusUpdatePayload }
  | { type: 'toolApprovalRequired'; payload: WsToolApprovalRequiredPayload }
  | { type: 'toolCallComplete'; payload: WsToolCallCompletePayload }
  | { type: 'messageComplete'; payload: WsMessageCompletePayload }
  | { type: 'threadUpdated'; payload: WsThreadUpdatedPayload }
  | { type: 'runError'; payload: WsRunErrorPayload }
  | { type: 'contextBudgetMeta'; payload: WsContextBudgetMetaPayload };

export type AssistantWsConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'failed';

export class AssistantWsClient {
  private socket: WebSocket | null = null;
  private shouldReconnect = true;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectPromise: Promise<void> | null = null;
  private connectionAttemptId = 0;
  private readonly wsBaseUrl: string;
  private readonly getAccessToken: () => Promise<string | null>;
  private readonly handlers: WsEventHandlers;
  private readonly reconnectEnabled: boolean;
  private readonly maxReconnectAttempts: number;
  private readonly reconnectBaseDelayMs: number;
  private readonly reconnectMaxDelayMs: number;
  private readonly authTokenParam: string;
  private readonly keepAliveIntervalMs: number;
  private readonly connectTimeoutMs: number;
  private readonly honorTerminalCloseCodes: boolean;
  private readonly terminalCloseCodes: ReadonlySet<number>;
  private readonly beforeConnect?: () => Promise<void>;
  private beforeConnectCompleted = false;
  private connectionState: AssistantWsConnectionState = 'disconnected';
  private pendingCloseOnOpen = false;
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null;
  private handshakeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: AssistantWsClientOptions) {
    this.wsBaseUrl = options.wsBaseUrl;
    this.getAccessToken = options.getAccessToken;
    this.handlers = {
      onToolsEvent: options.onToolsEvent,
      onRunStarted: options.onRunStarted,
      onAssistantModelResolved: options.onAssistantModelResolved,
      onAssistantDelta: options.onAssistantDelta,
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
    this.reconnectEnabled = options.reconnect ?? true;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 6;
    this.reconnectBaseDelayMs = options.reconnectBaseDelayMs ?? 500;
    this.reconnectMaxDelayMs = options.reconnectMaxDelayMs ?? 8000;
    this.authTokenParam = options.authTokenParam ?? 'authToken';
    this.keepAliveIntervalMs = options.keepAliveIntervalMs ?? 0;
    this.connectTimeoutMs = options.connectTimeoutMs ?? 30_000;
    this.honorTerminalCloseCodes = options.honorTerminalCloseCodes ?? true;
    this.terminalCloseCodes = options.terminalCloseCodes ?? DEFAULT_TERMINAL_CLOSE_CODES;
    this.beforeConnect = options.beforeConnect;
  }

  async connect(): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }
    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.shouldReconnect = true;
    this.setConnectionState('connecting');
    try {
      if (this.beforeConnect && !this.beforeConnectCompleted) {
        await this.beforeConnect();
        this.beforeConnectCompleted = true;
      }
      const attemptId = ++this.connectionAttemptId;
      const pendingConnect = this.openSocket(attemptId).finally(() => {
        if (this.connectPromise === pendingConnect) {
          this.connectPromise = null;
        }
      });
      this.connectPromise = pendingConnect;
      await pendingConnect;
    } catch (err) {
      this.setConnectionState('failed');
      throw err;
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.beforeConnectCompleted = false;
    this.connectionAttemptId += 1;
    this.connectPromise = null;
    this.clearHandshakeTimer();
    this.clearReconnectTimer();
    this.clearKeepAliveTimer();
    this.setConnectionState('disconnected');
    if (this.socket) {
      if (this.socket.readyState === WebSocket.CONNECTING) {
        this.pendingCloseOnOpen = true;
        return;
      }
      this.socket.close();
      this.socket = null;
    }
  }

  async sendUserMessage(payload: WsUserMessagePayload): Promise<void> {
    await this.connect();
    this.send({
      type: 'userMessage',
      payload,
    });
  }

  async cancelRun(payload: WsCancelRunPayload): Promise<void> {
    await this.connect();
    this.send({
      type: 'cancelRun',
      payload,
    });
  }

  async sendToolApprovalResponse(payload: WsToolApprovalResponsePayload): Promise<void> {
    await this.connect();
    this.send({
      type: 'toolApprovalResponse',
      payload,
    });
  }

  /** Subscribe to Tools fanout (e.g. webhook catcher live events). Requires an open connection. */
  async sendSubscribeToolsEvent(catcherId: string): Promise<void> {
    await this.connect();
    this.send({
      type: 'subscribeToolsEvent',
      payload: { catcherId },
    });
  }

  manualReconnect(): void {
    this.shouldReconnect = true;
    this.beforeConnectCompleted = false;
    this.connectionAttemptId += 1;
    this.connectPromise = null;
    this.reconnectAttempts = 0;
    this.clearHandshakeTimer();
    this.clearReconnectTimer();
    this.clearKeepAliveTimer();
    this.pendingCloseOnOpen = false;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    void this.connect().catch(() => {
      this.scheduleReconnect();
    });
  }

  getConnectionState(): AssistantWsConnectionState {
    return this.connectionState;
  }

  private async openSocket(attemptId: number): Promise<void> {
    const token = await this.getAccessToken();
    if (!this.shouldReconnect || attemptId !== this.connectionAttemptId) {
      return;
    }
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }
    if (!token || !token.trim()) {
      wsLogger.warn('Assistant WebSocket: skipping open — no access token', {
        wsUrlHost: new URL(this.wsBaseUrl).host,
      });
      throw new WsNoTokenError();
    }

    const expRemain = jwtExpRemainingSeconds(token);
    wsLogger.info('Assistant WebSocket opening', {
      tokenPresent: true,
      tokenExpSecondsRemaining: expRemain,
      wsUrlHost: new URL(this.wsBaseUrl).host,
    });

    const url = new URL(this.wsBaseUrl);
    // Browsers cannot set custom Authorization headers for WebSocket connections.
    // Provide the token via query param; backend should accept it or map it internally.
    url.searchParams.set(this.authTokenParam, token);

    const ws = new WebSocket(url.toString());
    this.socket = ws;

    await new Promise<void>((resolveHandshake, rejectHandshake) => {
      let handshakeSettled = false;

      const failHandshake = (reason: Error) => {
        if (handshakeSettled) {
          return;
        }
        handshakeSettled = true;
        this.clearHandshakeTimer();
        rejectHandshake(reason);
      };

      if (this.connectTimeoutMs > 0) {
        this.clearHandshakeTimer();
        this.handshakeTimer = setTimeout(() => {
          if (!handshakeSettled) {
            try {
              ws.close();
            } catch {
              /* ignore */
            }
            failHandshake(new WsHandshakeTimeoutError(this.connectTimeoutMs));
          }
        }, this.connectTimeoutMs);
      }

      ws.onopen = () => {
        if (!this.shouldReconnect || attemptId !== this.connectionAttemptId) {
          ws.close();
          failHandshake(new Error('WebSocket connection aborted'));
          return;
        }
        if (this.pendingCloseOnOpen) {
          this.pendingCloseOnOpen = false;
          ws.close();
          failHandshake(
            new Error('WebSocket closed before establishing session (pendingCloseOnOpen)')
          );
          this.setConnectionState('disconnected');
          return;
        }
        handshakeSettled = true;
        this.clearHandshakeTimer();
        this.reconnectAttempts = 0;
        this.setConnectionState('connected');
        this.startKeepAlive();
        this.handlers.onOpen?.();
        resolveHandshake();
      };

      ws.onclose = (event) => {
        if (!handshakeSettled) {
          wsLogger.warn('WebSocket handshake closed before open', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
          });
          failHandshake(
            new WsHandshakeClosedError(
              `WebSocket closed before open (code=${event.code} reason=${event.reason || 'n/a'} wasClean=${event.wasClean})`,
              event.code,
              event.reason || '',
              event.wasClean
            )
          );
          return;
        }
        this.clearHandshakeTimer();
        if (
          this.honorTerminalCloseCodes &&
          this.terminalCloseCodes.has(event.code) &&
          this.shouldReconnect &&
          this.reconnectEnabled
        ) {
          this.shouldReconnect = false;
          this.setConnectionState('failed');
          this.socket = null;
          return;
        }
        this.handlers.onClose?.(event);
        this.clearKeepAliveTimer();
        if (this.shouldReconnect && this.reconnectEnabled) {
          this.setConnectionState('reconnecting');
          this.scheduleReconnect();
        } else {
          this.setConnectionState('disconnected');
        }
        this.socket = null;
      };

      ws.onerror = (event) => {
        this.handlers.onError?.(event);
        if (!handshakeSettled) {
          wsLogger.warn('WebSocket handshake error event', { type: event.type });
          failHandshake(new WsHandshakeRefusedError(`WebSocket handshake error (${event.type})`));
        }
      };

      ws.onmessage = (event) => {
        this.handleIncoming(event.data);
      };
    });
  }

  private send(message: { type: string; payload: unknown }): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }
    this.socket.send(JSON.stringify(message));
  }

  private handleIncoming(rawData: string): void {
    let parsed: IncomingMessage | null = null;
    try {
      parsed = JSON.parse(rawData) as IncomingMessage;
    } catch {
      return;
    }

    if (!parsed || typeof parsed !== 'object' || !('type' in parsed)) {
      return;
    }

    switch (parsed.type) {
      case 'runStarted':
        this.handlers.onRunStarted?.(parsed.payload);
        break;
      case 'assistantModelResolved':
        this.handlers.onAssistantModelResolved?.(parsed.payload);
        break;
      case 'assistantDelta':
        this.handlers.onAssistantDelta?.(parsed.payload);
        break;
      case 'thinkingDelta':
        this.handlers.onThinkingDelta?.(parsed.payload);
        break;
      case 'statusUpdate':
        this.handlers.onStatusUpdate?.(parsed.payload);
        break;
      case 'toolApprovalRequired':
        this.handlers.onToolApprovalRequired?.(parsed.payload);
        break;
      case 'toolCallComplete':
        this.handlers.onToolCallComplete?.(parsed.payload);
        break;
      case 'messageComplete':
        this.handlers.onMessageComplete?.(parsed.payload);
        break;
      case 'threadUpdated': {
        // Backend uses camelCase aliases; tolerate snake_case if a proxy rewrites payloads.
        const p = parsed.payload as unknown as Record<string, unknown>;
        const threadId = String(p.threadId ?? p.thread_id ?? '');
        const title = String(p.title ?? '');
        const updatedAt = String(p.updatedAt ?? p.updated_at ?? '');
        if (threadId && title) {
          this.handlers.onThreadUpdated?.({
            threadId,
            title,
            updatedAt: updatedAt || new Date().toISOString(),
          });
        }
        break;
      }
      case 'runError':
        this.handlers.onRunError?.(parsed.payload);
        break;
      case 'contextBudgetMeta':
        this.handlers.onContextBudgetMeta?.(parsed.payload);
        break;
      case 'toolsEvent':
        this.handlers.onToolsEvent?.(parsed.payload);
        break;
      default:
        break;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setConnectionState('failed');
      return;
    }

    const delay = reconnectDelayWithJitter(
      this.reconnectBaseDelayMs,
      this.reconnectAttempts,
      this.reconnectMaxDelayMs
    );
    this.reconnectAttempts += 1;

    this.clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      if (this.connectPromise) {
        return;
      }
      const attemptId = ++this.connectionAttemptId;
      const pendingConnect = this.openSocket(attemptId)
        .catch(() => {
          if (!this.shouldReconnect || !this.reconnectEnabled) {
            this.setConnectionState('disconnected');
            return;
          }
          this.setConnectionState('reconnecting');
          this.scheduleReconnect();
        })
        .finally(() => {
          if (this.connectPromise === pendingConnect) {
            this.connectPromise = null;
          }
        });
      this.connectPromise = pendingConnect;
    }, delay);
  }

  private setConnectionState(state: AssistantWsConnectionState): void {
    if (this.connectionState === state) {
      return;
    }
    this.connectionState = state;
    this.handlers.onConnectionStateChange?.(state);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private startKeepAlive(): void {
    this.clearKeepAliveTimer();
    if (this.keepAliveIntervalMs <= 0) {
      return;
    }
    this.keepAliveTimer = setInterval(() => {
      try {
        this.send({
          type: 'ping',
          payload: {
            ts: Date.now(),
          },
        });
      } catch {
        // Ignore keepalive send errors; reconnect logic handles socket failures.
      }
    }, this.keepAliveIntervalMs);
  }

  private clearKeepAliveTimer(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  private clearHandshakeTimer(): void {
    if (this.handshakeTimer) {
      clearTimeout(this.handshakeTimer);
      this.handshakeTimer = null;
    }
  }
}
