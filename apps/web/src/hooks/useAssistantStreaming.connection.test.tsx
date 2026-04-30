import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('@/lib/sound-effects', () => ({
  soundEffects: { play: vi.fn() },
}));

vi.mock('@/lib/auth/auth.service', () => ({
  authService: { getAccessToken: vi.fn().mockResolvedValue('token') },
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
    vi.stubGlobal('WebSocket', MockWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('opens one WebSocket and reuses it when threadId changes', async () => {
    vi.resetModules();
    const { useAssistantStreaming } = await import('@/hooks/useAssistantStreaming');

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

    rerender({ tid: 'thread-b' });

    await waitFor(() => {
      expect(result.current.connectionState).toBe('connected');
    });

    expect(MockWebSocket.instances.length).toBe(1);
  });
});
