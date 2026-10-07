import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runCourseLessonOverWebSocket } from './course-lesson-ws-client';

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  readyState = 0;
  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    queueMicrotask(() => {
      this.readyState = 1;
      this.onopen?.();
    });
  }

  send = vi.fn();
  close = vi.fn();

  dispatch(msg: object) {
    this.onmessage?.({ data: JSON.stringify(msg) });
  }
}

describe('runCourseLessonOverWebSocket', () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal('WebSocket', MockWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves on courseLessonComplete with markdown', async () => {
    const promise = runCourseLessonOverWebSocket({
      wsBaseUrl: 'wss://example.test/ws',
      getAccessToken: async () => 'token',
      courseId: 'c1',
      lessonId: 'l1',
    });

    await new Promise((r) => setTimeout(r, 0));
    const ws = MockWebSocket.instances[0];
    expect(ws).toBeDefined();
    ws.dispatch({ type: 'courseLessonStarted', payload: { runId: 'run-1' } });
    ws.dispatch({
      type: 'courseLessonComplete',
      payload: { runId: 'run-1', markdown: '# Hello\n\nBody' },
    });

    await expect(promise).resolves.toBe('# Hello\n\nBody');
  });
});
