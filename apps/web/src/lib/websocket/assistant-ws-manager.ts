/**
 * Ref-counted singleton Assistant WebSocket per tab and base URL. Survives StrictMode
 * double-mount: a short grace period before disconnect when the last subscriber leaves.
 */
import {
  AssistantWsClient,
  type AssistantWsClientOptions,
  type WsEventHandlers,
} from '@/lib/websocket/assistant-ws-client';

const DISCONNECT_GRACE_MS = 450;

const HANDLER_KEYS: (keyof WsEventHandlers)[] = [
  'onToolsEvent',
  'onRunStarted',
  'onAssistantModelResolved',
  'onContextBudgetMeta',
  'onAssistantDelta',
  'onThinkingDelta',
  'onStatusUpdate',
  'onToolApprovalRequired',
  'onToolCallComplete',
  'onMessageComplete',
  'onThreadUpdated',
  'onRunError',
  'onConnectionStateChange',
  'onOpen',
  'onClose',
  'onError',
];

export type AssistantWsTransportOptions = Pick<
  AssistantWsClientOptions,
  | 'getAccessToken'
  | 'beforeConnect'
  | 'keepAliveIntervalMs'
  | 'connectTimeoutMs'
  | 'reconnect'
  | 'maxReconnectAttempts'
  | 'reconnectBaseDelayMs'
  | 'reconnectMaxDelayMs'
  | 'honorTerminalCloseCodes'
  | 'terminalCloseCodes'
  | 'authTokenParam'
>;

export type AssistantWsSubscribeOptions = AssistantWsTransportOptions & Partial<WsEventHandlers>;

function extractTransport(options: AssistantWsSubscribeOptions): AssistantWsTransportOptions {
  const {
    getAccessToken,
    beforeConnect,
    keepAliveIntervalMs,
    connectTimeoutMs,
    reconnect,
    maxReconnectAttempts,
    reconnectBaseDelayMs,
    reconnectMaxDelayMs,
    honorTerminalCloseCodes,
    terminalCloseCodes,
    authTokenParam,
  } = options;
  return {
    getAccessToken,
    beforeConnect,
    keepAliveIntervalMs,
    connectTimeoutMs,
    reconnect,
    maxReconnectAttempts,
    reconnectBaseDelayMs,
    reconnectMaxDelayMs,
    honorTerminalCloseCodes,
    terminalCloseCodes,
    authTokenParam,
  };
}

function extractHandlers(options: AssistantWsSubscribeOptions): Partial<WsEventHandlers> {
  const h: Partial<WsEventHandlers> = {};
  for (const key of HANDLER_KEYS) {
    const fn = options[key];
    if (typeof fn === 'function') {
      (h as Record<string, unknown>)[key] = fn;
    }
  }
  return h;
}

function buildFan(entry: ManagedEntry, key: keyof WsEventHandlers): WsEventHandlers[typeof key] {
  return ((...args: never[]) => {
    for (const sub of entry.subscribers.values()) {
      const fn = sub[key] as ((...a: never[]) => void) | undefined;
      fn?.(...args);
    }
  }) as WsEventHandlers[typeof key];
}

class ManagedEntry {
  readonly wsBaseUrl: string;
  transport: AssistantWsTransportOptions;
  refCount = 0;
  private graceTimer: ReturnType<typeof setTimeout> | null = null;
  client: AssistantWsClient | null = null;
  subscribers = new Map<number, Partial<WsEventHandlers>>();
  private nextSubId = 0;

  private readonly onDrained: () => void;

  constructor(wsBaseUrl: string, first: AssistantWsSubscribeOptions, onDrained: () => void) {
    this.wsBaseUrl = wsBaseUrl;
    this.transport = extractTransport(first);
    this.onDrained = onDrained;
  }

  private ensureClient(): AssistantWsClient {
    if (!this.client) {
      const opts = {
        wsBaseUrl: this.wsBaseUrl,
        ...this.transport,
      } as AssistantWsClientOptions;
      const withHandlers = opts as unknown as Record<string, unknown>;
      for (const key of HANDLER_KEYS) {
        withHandlers[key as keyof WsEventHandlers] = buildFan(this, key);
      }
      this.client = new AssistantWsClient(opts);
    }
    return this.client;
  }

  subscribe(options: AssistantWsSubscribeOptions): {
    unsubscribe: () => void;
    client: AssistantWsClient;
  } {
    if (this.graceTimer) {
      clearTimeout(this.graceTimer);
      this.graceTimer = null;
    }
    this.refCount += 1;
    const id = ++this.nextSubId;
    this.subscribers.set(id, extractHandlers(options));
    const client = this.ensureClient();
    return {
      client,
      unsubscribe: () => this.removeSubscriber(id),
    };
  }

  private removeSubscriber(id: number): void {
    this.subscribers.delete(id);
    this.refCount = Math.max(0, this.refCount - 1);
    if (this.refCount > 0) {
      return;
    }
    this.graceTimer = setTimeout(() => {
      this.graceTimer = null;
      if (this.refCount === 0 && this.client) {
        this.client.disconnect();
        this.client = null;
        this.onDrained();
      }
    }, DISCONNECT_GRACE_MS);
  }

  dispose(): void {
    if (this.graceTimer) {
      clearTimeout(this.graceTimer);
      this.graceTimer = null;
    }
    this.client?.disconnect();
    this.client = null;
    this.subscribers.clear();
    this.refCount = 0;
  }
}

export class AssistantWsManager {
  private readonly byUrl = new Map<string, ManagedEntry>();

  subscribe(
    wsBaseUrl: string,
    options: AssistantWsSubscribeOptions
  ): {
    unsubscribe: () => void;
    client: AssistantWsClient;
  } {
    let entry = this.byUrl.get(wsBaseUrl);
    if (!entry) {
      entry = new ManagedEntry(wsBaseUrl, options, () => {
        this.byUrl.delete(wsBaseUrl);
      });
      this.byUrl.set(wsBaseUrl, entry);
    }
    return entry.subscribe(options);
  }

  getClient(wsBaseUrl: string): AssistantWsClient | null {
    return this.byUrl.get(wsBaseUrl)?.client ?? null;
  }

  /** Vitest / HMR isolation */
  resetForTests(): void {
    for (const entry of this.byUrl.values()) {
      entry.dispose();
    }
    this.byUrl.clear();
  }
}

let managerSingleton: AssistantWsManager | null = null;

export function getAssistantWsManager(): AssistantWsManager {
  if (!managerSingleton) {
    managerSingleton = new AssistantWsManager();
  }
  return managerSingleton;
}

export function resetAssistantWsManagerForTests(): void {
  managerSingleton?.resetForTests();
  managerSingleton = null;
}
