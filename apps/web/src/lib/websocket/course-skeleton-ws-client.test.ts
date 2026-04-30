import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

async function flushMicrotasks() {
  await new Promise((r) => {
    setTimeout(r, 0);
  });
}
import { runCourseSkeletonOverWebSocket } from './course-skeleton-ws-client';

class MockWebSocket {
  static OPEN = 1;
  static CONNECTING = 0;
  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  onclose: (() => void) | null = null;
  static instances: MockWebSocket[] = [];
  sent: string[] = [];
  url = '';
  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    queueMicrotask(() => {
      this.onopen?.();
    });
  }
  send(data: string) {
    this.sent.push(data);
  }
  close() {
    this.onclose?.();
  }
  dispatch(data: object) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
}

describe('course-skeleton-ws-client', () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal('WebSocket', MockWebSocket);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves on courseSkeletonComplete with skeleton payload', async () => {
    const p = runCourseSkeletonOverWebSocket({
      wsBaseUrl: 'ws://localhost:8000/ws',
      getAccessToken: async () => 'tok',
      topic: 'Rust',
      preAssessment: {
        questions: [],
        userResponses: {},
        completedAt: '2020-01-01T00:00:00.000Z',
      },
      targetDifficulty: 'intermediate',
    });

    await flushMicrotasks();
    const ws = MockWebSocket.instances[0];
    expect(ws).toBeDefined();
    const startMsg = JSON.parse(ws.sent[0]) as { type: string; payload: { topic: string } };
    expect(startMsg.type).toBe('courseSkeletonStart');
    expect(startMsg.payload.topic).toBe('Rust');

    ws.dispatch({ type: 'courseSkeletonStarted', payload: { runId: 'run-1' } });
    ws.dispatch({
      type: 'courseSkeletonPhase',
      payload: {
        runId: 'run-1',
        phase: 'preparing',
        phaseName: 'Preparing',
        progress: 5,
        summary: 'x',
      },
    });
    const skeleton = { course: { title: 'T' }, modules: [] };
    ws.dispatch({
      type: 'courseSkeletonComplete',
      payload: { runId: 'run-1', skeleton },
    });

    await expect(p).resolves.toEqual(skeleton);
  });

  it('reject on courseSkeletonError', async () => {
    const p = runCourseSkeletonOverWebSocket({
      wsBaseUrl: 'ws://localhost:8000/ws',
      getAccessToken: async () => null,
      topic: 'x',
      preAssessment: {
        questions: [],
        userResponses: {},
        completedAt: '2020-01-01T00:00:00.000Z',
      },
      targetDifficulty: 'beginner',
    });
    await flushMicrotasks();
    const ws = MockWebSocket.instances[0];
    expect(ws).toBeDefined();
    ws.dispatch({ type: 'courseSkeletonStarted', payload: { runId: 'r' } });
    ws.dispatch({ type: 'courseSkeletonError', payload: { runId: 'r', error: 'nope' } });
    await expect(p).rejects.toThrow('nope');
  });
});
