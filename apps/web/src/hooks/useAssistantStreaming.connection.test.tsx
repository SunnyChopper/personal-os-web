import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode, type ReactNode } from 'react';
import { resetAssistantWsManagerForTests } from '@/lib/websocket/assistant-ws-manager';

const { mockApiGet, mockSetAuthToken, mockGetValidAccessToken } = vi.hoisted(() => ({
  mockApiGet: vi.fn().mockResolvedValue({ success: true, data: {} }),
  mockSetAuthToken: vi.fn(),
  mockGetValidAccessToken: vi.fn().mockResolvedValue('token'),
}));

vi.mock('@/lib/sound-effects', () => ({
  soundEffects: { play: vi.fn() },
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    setAuthToken: mockSetAuthToken,
    get: mockApiGet,
  },
}));

vi.mock('@/lib/auth/auth.service', () => ({
  authService: { getValidAccessToken: mockGetValidAccessToken },
}));

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static instances: MockWebSocket[] = [];

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  send = vi.fn();
  close = vi.fn();

  constructor(_url: string) {
    MockWebSocket.instances.push(this);
    queueMicrotask(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    });
  }
}

describe('useAssistantStreaming WebSocket lifecycle', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  beforeEach(() => {
    vi.stubEnv('VITE_WS_URL', 'ws://localhost:3001/dev');
    MockWebSocket.instances = [];
    mockGetValidAccessToken.mockResolvedValue('token');
    mockApiGet.mockResolvedValue({ success: true, data: {} });
    mockSetAuthToken.mockClear();
    vi.stubGlobal('WebSocket', MockWebSocket);
  });

  afterEach(() => {
    resetAssistantWsManagerForTests();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it('opens one WebSocket and reuses it when threadId changes', async () => {
    vi.resetModules();
    const { useAssistantStreaming } = await import('./useAssistantStreaming');

    const { rerender, result } = renderHook(
      ({ tid }: { tid: string | undefined }) => useAssistantStreaming(tid),
      {
        wrapper,
        initialProps: { tid: 'thread-a' as string | undefined },
      }
    );

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
      expect(result.current.connectionState).toBe('connected');
    });

    expect(mockApiGet).toHaveBeenCalledWith('/auth/me');
    expect(mockSetAuthToken).toHaveBeenCalledWith('token');

    rerender({ tid: 'thread-b' });

    await waitFor(() => {
      expect(result.current.connectionState).toBe('connected');
    });

    expect(MockWebSocket.instances.length).toBe(1);
  });

  it('fails with SESSION_EXPIRED when there is no access token (preflight)', async () => {
    mockGetValidAccessToken.mockResolvedValue(null);
    vi.resetModules();
    const { useAssistantStreaming } = await import('./useAssistantStreaming');

    const { result } = renderHook(() => useAssistantStreaming('thread-a'), { wrapper });

    await waitFor(() => {
      expect(result.current.connectionState).toBe('failed');
    });

    expect(result.current.error?.code).toBe('SESSION_EXPIRED');
    expect(MockWebSocket.instances.length).toBe(0);
  });

  it('maps WS onerror before open to WS_BACKEND_REJECTED with WsHandshakeRefusedError', async () => {
    class MockWsOnError {
      static CONNECTING = 0;
      static OPEN = 1;
      static instances: MockWsOnError[] = [];
      readyState = MockWsOnError.CONNECTING;
      onopen: ((event: Event) => void) | null = null;
      onclose: ((event: CloseEvent) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      onmessage: ((event: MessageEvent) => void) | null = null;
      send = vi.fn();
      close = vi.fn();
      constructor(_url: string) {
        MockWsOnError.instances.push(this);
        queueMicrotask(() => {
          this.onerror?.(new Event('error'));
        });
      }
    }

    vi.stubGlobal('WebSocket', MockWsOnError as unknown as typeof WebSocket);
    vi.resetModules();
    const { useAssistantStreaming } = await import('./useAssistantStreaming');

    const { result } = renderHook(() => useAssistantStreaming('thread-b'), { wrapper });

    await waitFor(() => {
      expect(result.current.connectionState).toBe('failed');
    });

    expect(result.current.error?.code).toBe('WS_BACKEND_REJECTED');
    expect(result.current.error?.details?.errorName).toBe('WsHandshakeRefusedError');
    expect(result.current.error?.details?.handshakePhase).toBe('onerror');
  });

  it('maps WS onclose before open to WS_BACKEND_REJECTED with closeCode in details', async () => {
    class MockWsOnClose {
      static CONNECTING = 0;
      static OPEN = 1;
      static instances: MockWsOnClose[] = [];
      readyState = MockWsOnClose.CONNECTING;
      onopen: ((event: Event) => void) | null = null;
      onclose: ((event: CloseEvent) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      onmessage: ((event: MessageEvent) => void) | null = null;
      send = vi.fn();
      close = vi.fn();
      constructor(_url: string) {
        MockWsOnClose.instances.push(this);
        queueMicrotask(() => {
          this.onclose?.({
            code: 1006,
            reason: '',
            wasClean: false,
          } as CloseEvent);
        });
      }
    }

    vi.stubGlobal('WebSocket', MockWsOnClose as unknown as typeof WebSocket);
    vi.resetModules();
    const { useAssistantStreaming } = await import('./useAssistantStreaming');

    const { result } = renderHook(() => useAssistantStreaming('thread-c'), { wrapper });

    await waitFor(() => {
      expect(result.current.connectionState).toBe('failed');
    });

    expect(result.current.error?.code).toBe('WS_BACKEND_REJECTED');
    expect(result.current.error?.details?.closeCode).toBe(1006);
    expect(result.current.error?.details?.errorName).toBe('WsHandshakeClosedError');
  });

  it('StrictMode remount uses one manager-backed WebSocket instance', async () => {
    vi.resetModules();
    const { useAssistantStreaming } = await import('./useAssistantStreaming');

    function strictWrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <StrictMode>{children}</StrictMode>
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useAssistantStreaming('thread-strict'), {
      wrapper: strictWrapper,
    });

    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(1);
      expect(result.current.connectionState).toBe('connected');
    });
  });

  it('surfaces RUN_START_TIMEOUT when runStarted never arrives', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.resetModules();
    const { useAssistantStreaming } = await import('./useAssistantStreaming');
    const { result } = renderHook(() => useAssistantStreaming('thread-timeout'), { wrapper });

    await waitFor(() => {
      expect(result.current.connectionState).toBe('connected');
    });

    await act(async () => {
      result.current.sendFollowUp('user-msg-1');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(92_000);
    });

    await waitFor(() => {
      expect(result.current.error?.code).toBe('RUN_START_TIMEOUT');
    });
  });
});
