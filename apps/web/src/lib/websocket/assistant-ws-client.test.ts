import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { AssistantWsClient } from '@/lib/websocket/assistant-ws-client';

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: MockWebSocket[] = [];

  readyState = MockWebSocket.OPEN;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  send = vi.fn();
  close = vi.fn();
  readonly url: string;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }
}

describe('AssistantWsClient', () => {
  const wsBaseUrl = 'ws://localhost:8000/assistant/ws';
  const threadId = 'thread-123';
  const token = 'token-abc';

  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal('WebSocket', MockWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('connect URL includes auth token but not threadId', async () => {
    const client = new AssistantWsClient({
      wsBaseUrl,
      getAccessToken: async () => token,
    });
    await client.connect();
    const socket = MockWebSocket.instances[0];
    const url = new URL(socket.url);
    expect(url.searchParams.get('authToken')).toBe(token);
    expect(url.searchParams.has('threadId')).toBe(false);
  });

  it('dispatches thinkingDelta payloads to handler', async () => {
    const onThinkingDelta = vi.fn();
    const client = new AssistantWsClient({
      wsBaseUrl,
      getAccessToken: async () => token,
      onThinkingDelta,
    });

    await client.connect();
    const socket = MockWebSocket.instances[0];
    expect(socket).toBeDefined();

    socket.onmessage?.({
      data: JSON.stringify({
        type: 'thinkingDelta',
        payload: {
          runId: 'run-1',
          threadId,
          delta: 'analyzing...',
        },
      }),
    } as MessageEvent);

    expect(onThinkingDelta).toHaveBeenCalledWith({
      runId: 'run-1',
      threadId,
      delta: 'analyzing...',
    });
  });

  it('dispatches statusUpdate payloads to handler', async () => {
    const onStatusUpdate = vi.fn();
    const client = new AssistantWsClient({
      wsBaseUrl,
      getAccessToken: async () => token,
      onStatusUpdate,
    });

    await client.connect();
    const socket = MockWebSocket.instances[0];
    expect(socket).toBeDefined();

    socket.onmessage?.({
      data: JSON.stringify({
        type: 'statusUpdate',
        payload: {
          runId: 'run-1',
          threadId,
          stage: 'runningTools',
          message: 'Running tools',
        },
      }),
    } as MessageEvent);

    expect(onStatusUpdate).toHaveBeenCalledWith({
      runId: 'run-1',
      threadId,
      stage: 'runningTools',
      message: 'Running tools',
    });
  });

  it('dispatches contextBudgetMeta payloads to handler', async () => {
    const onContextBudgetMeta = vi.fn();
    const client = new AssistantWsClient({
      wsBaseUrl,
      getAccessToken: async () => token,
      onContextBudgetMeta,
    });

    await client.connect();
    const socket = MockWebSocket.instances[0];
    expect(socket).toBeDefined();

    const payload = {
      runId: 'run-1',
      threadId,
      budgetTokens: 96000,
      estimatedInputTokens: 50000,
      compactionMode: 'auto',
    };

    socket.onmessage?.({
      data: JSON.stringify({
        type: 'contextBudgetMeta',
        payload,
      }),
    } as MessageEvent);

    expect(onContextBudgetMeta).toHaveBeenCalledWith(payload);
  });

  it('dispatches toolApprovalRequired payloads to handler', async () => {
    const onToolApprovalRequired = vi.fn();
    const client = new AssistantWsClient({
      wsBaseUrl,
      getAccessToken: async () => token,
      onToolApprovalRequired,
    });

    await client.connect();
    const socket = MockWebSocket.instances[0];
    expect(socket).toBeDefined();

    const approvalPayload = {
      runId: 'run-1',
      threadId,
      approvalId: 'apr-1',
      toolName: 'delete_task',
      arguments: { taskId: 't1' },
      description: 'Delete task t1',
    };

    socket.onmessage?.({
      data: JSON.stringify({
        type: 'toolApprovalRequired',
        payload: approvalPayload,
      }),
    } as MessageEvent);

    expect(onToolApprovalRequired).toHaveBeenCalledWith(approvalPayload);
  });

  it('sendToolApprovalResponse serializes camelCase envelope', async () => {
    const client = new AssistantWsClient({
      wsBaseUrl,
      getAccessToken: async () => token,
    });

    await client.connect();
    const socket = MockWebSocket.instances[0];
    expect(socket).toBeDefined();
    socket.onopen?.(new Event('open'));

    client.sendToolApprovalResponse({
      runId: 'run-1',
      approvalId: 'apr-9',
      decision: 'reject',
    });

    expect(socket.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: 'toolApprovalResponse',
        payload: {
          runId: 'run-1',
          approvalId: 'apr-9',
          decision: 'reject',
        },
      })
    );
  });

  it('emits connection state changes and marks failed when retries are exhausted', async () => {
    const onConnectionStateChange = vi.fn();
    const client = new AssistantWsClient({
      wsBaseUrl,
      getAccessToken: async () => token,
      onConnectionStateChange,
      maxReconnectAttempts: 0,
    });

    await client.connect();
    expect(onConnectionStateChange).toHaveBeenCalledWith('connecting');

    const socket = MockWebSocket.instances[0];
    socket.onopen?.(new Event('open'));
    expect(onConnectionStateChange).toHaveBeenCalledWith('connected');

    socket.onclose?.({} as CloseEvent);
    expect(onConnectionStateChange).toHaveBeenCalledWith('reconnecting');
    expect(onConnectionStateChange).toHaveBeenCalledWith('failed');
  });

  it('manualReconnect resets retry state and starts connecting', async () => {
    const onConnectionStateChange = vi.fn();
    const client = new AssistantWsClient({
      wsBaseUrl,
      getAccessToken: async () => token,
      onConnectionStateChange,
      maxReconnectAttempts: 0,
    });

    await client.connect();
    const socket = MockWebSocket.instances[0];
    socket.onclose?.({} as CloseEvent);
    expect(client.getConnectionState()).toBe('failed');

    client.manualReconnect();
    await Promise.resolve();
    expect(client.getConnectionState()).toBe('connecting');
    expect(MockWebSocket.instances.length).toBe(2);
  });

  it('does not open socket after disconnect while token fetch is pending', async () => {
    let resolveToken: (value: string | null) => void = () => {};
    const tokenPromise = new Promise<string | null>((resolve) => {
      resolveToken = resolve;
    });
    const client = new AssistantWsClient({
      wsBaseUrl,
      getAccessToken: async () => tokenPromise,
    });

    const connectPromise = client.connect();
    client.disconnect();
    resolveToken(token);
    await connectPromise;

    expect(MockWebSocket.instances.length).toBe(0);
    expect(client.getConnectionState()).toBe('disconnected');
  });
});
