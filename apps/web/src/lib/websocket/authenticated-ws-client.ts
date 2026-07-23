/**
 * Shared authenticated WebSocket transport (connect / reconnect / ping / send).
 * Domain clients (Assistant, Content Pipeline, etc.) compose this and dispatch typed events.
 */

import { wsLogger } from '@/lib/logger';
import {
  WsHandshakeClosedError,
  WsHandshakeRefusedError,
  WsNoTokenError,
} from '@/lib/websocket/assistant-ws-errors';

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

export type AuthenticatedWsConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'failed';

export type AuthenticatedWsClientOptions = {
  wsBaseUrl: string;
  getAccessToken: () => Promise<string | null>;
  /** Runs once before the first socket open. Reset on disconnect/manualReconnect. */
  beforeConnect?: () => Promise<void>;
  reconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectBaseDelayMs?: number;
  reconnectMaxDelayMs?: number;
  authTokenParam?: string;
  keepAliveIntervalMs?: number;
  logLabel?: string;
  onMessage?: (type: string, payload: unknown) => void;
  onConnectionStateChange?: (state: AuthenticatedWsConnectionState) => void;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
};

export class AuthenticatedWsClient {
  private socket: WebSocket | null = null;
  private shouldReconnect = true;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connectPromise: Promise<void> | null = null;
  private connectionAttemptId = 0;
  private readonly wsBaseUrl: string;
  private readonly getAccessToken: () => Promise<string | null>;
  private readonly reconnectEnabled: boolean;
  private readonly maxReconnectAttempts: number;
  private readonly reconnectBaseDelayMs: number;
  private readonly reconnectMaxDelayMs: number;
  private readonly authTokenParam: string;
  private readonly keepAliveIntervalMs: number;
  private readonly beforeConnect?: () => Promise<void>;
  private readonly logLabel: string;
  private beforeConnectCompleted = false;
  private connectionState: AuthenticatedWsConnectionState = 'disconnected';
  private pendingCloseOnOpen = false;
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null;
  private readonly onMessage?: (type: string, payload: unknown) => void;
  private readonly onConnectionStateChange?: (state: AuthenticatedWsConnectionState) => void;
  private readonly onOpen?: () => void;
  private readonly onClose?: (event: CloseEvent) => void;
  private readonly onError?: (event: Event) => void;

  constructor(options: AuthenticatedWsClientOptions) {
    this.wsBaseUrl = options.wsBaseUrl;
    this.getAccessToken = options.getAccessToken;
    this.reconnectEnabled = options.reconnect ?? true;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 6;
    this.reconnectBaseDelayMs = options.reconnectBaseDelayMs ?? 500;
    this.reconnectMaxDelayMs = options.reconnectMaxDelayMs ?? 8000;
    this.authTokenParam = options.authTokenParam ?? 'authToken';
    this.keepAliveIntervalMs = options.keepAliveIntervalMs ?? 0;
    this.beforeConnect = options.beforeConnect;
    this.logLabel = options.logLabel ?? 'WebSocket';
    this.onMessage = options.onMessage;
    this.onConnectionStateChange = options.onConnectionStateChange;
    this.onOpen = options.onOpen;
    this.onClose = options.onClose;
    this.onError = options.onError;
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

  send(message: { type: string; payload?: unknown }): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }
    this.socket.send(JSON.stringify(message));
  }

  async sendAfterConnect(message: { type: string; payload?: unknown }): Promise<void> {
    await this.connect();
    this.send(message);
  }

  manualReconnect(): void {
    this.shouldReconnect = true;
    this.beforeConnectCompleted = false;
    this.connectionAttemptId += 1;
    this.connectPromise = null;
    this.reconnectAttempts = 0;
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

  getConnectionState(): AuthenticatedWsConnectionState {
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
      wsLogger.warn(`${this.logLabel}: skipping open — no access token`, {
        wsUrlHost: new URL(this.wsBaseUrl).host,
      });
      throw new WsNoTokenError();
    }

    const expRemain = jwtExpRemainingSeconds(token);
    wsLogger.info(`${this.logLabel} opening`, {
      tokenPresent: true,
      tokenExpSecondsRemaining: expRemain,
      wsUrlHost: new URL(this.wsBaseUrl).host,
    });

    const url = new URL(this.wsBaseUrl);
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
        rejectHandshake(reason);
      };

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
        this.reconnectAttempts = 0;
        this.setConnectionState('connected');
        this.startKeepAlive();
        this.onOpen?.();
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
        this.onClose?.(event);
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
        this.onError?.(event);
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

  private handleIncoming(rawData: string): void {
    let parsed: { type?: string; payload?: unknown } | null = null;
    try {
      parsed = JSON.parse(rawData) as { type?: string; payload?: unknown };
    } catch {
      return;
    }

    if (!parsed || typeof parsed !== 'object' || typeof parsed.type !== 'string') {
      return;
    }

    this.onMessage?.(parsed.type, parsed.payload);
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setConnectionState('failed');
      return;
    }

    const delay = Math.min(
      this.reconnectBaseDelayMs * 2 ** this.reconnectAttempts,
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

  private setConnectionState(state: AuthenticatedWsConnectionState): void {
    if (this.connectionState === state) {
      return;
    }
    this.connectionState = state;
    this.onConnectionStateChange?.(state);
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
}

/** Build a connect URL with authToken query param (browsers cannot set WS headers). */
export async function buildAuthenticatedWsUrl(
  wsBaseUrl: string,
  getAccessToken: () => Promise<string | null>,
  authTokenParam = 'authToken'
): Promise<string> {
  const token = await getAccessToken();
  const url = new URL(wsBaseUrl);
  if (token) {
    url.searchParams.set(authTokenParam, token);
  }
  return url.toString();
}
