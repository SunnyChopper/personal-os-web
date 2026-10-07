import type {
  LessonGenerationArtifact,
  LessonGenerationProgress,
} from '@/services/knowledge-vault/course-generation/types';
import { wsLogger } from '@/lib/logger';

let courseLessonWsFlight: { ws: WebSocket; runId: string | null } | null = null;

const LESSON_TIMEOUT_MS = 15 * 60_000;
const PING_INTERVAL_MS = 4 * 60_000;

export function cancelInFlightCourseLesson(): void {
  const f = courseLessonWsFlight;
  if (!f) return;
  if (f.runId && f.ws.readyState === WebSocket.OPEN) {
    try {
      f.ws.send(JSON.stringify({ type: 'cancelRun', payload: { runId: f.runId } }));
    } catch {
      // ignore
    }
  }
  try {
    f.ws.close();
  } catch {
    // ignore
  }
  courseLessonWsFlight = null;
}

export function runCourseLessonOverWebSocket(options: {
  wsBaseUrl: string;
  getAccessToken: () => Promise<string | null>;
  courseId: string;
  lessonId: string;
  model?: string;
  onProgress?: (progress: LessonGenerationProgress) => void;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    let completed = false;
    let pingTimer: ReturnType<typeof setInterval> | null = null;

    const markDone = () => {
      completed = true;
      if (pingTimer) clearInterval(pingTimer);
      courseLessonWsFlight = null;
    };

    void options
      .getAccessToken()
      .then((token) => {
        const openUrl = new URL(options.wsBaseUrl);
        if (token) openUrl.searchParams.set('authToken', token);

        const ws = new WebSocket(openUrl.toString());
        courseLessonWsFlight = { ws, runId: null };

        const timeout = window.setTimeout(() => {
          try {
            ws.close();
          } catch {
            // ignore
          }
          if (!completed) {
            markDone();
            reject(new Error('Lesson generation timed out.'));
          }
        }, LESSON_TIMEOUT_MS);

        ws.onopen = () => {
          pingTimer = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              try {
                ws.send(JSON.stringify({ type: 'ping', payload: {} }));
              } catch {
                // ignore
              }
            }
          }, PING_INTERVAL_MS);

          try {
            const payload: Record<string, unknown> = {
              courseId: options.courseId,
              lessonId: options.lessonId,
              useCache: true,
            };
            const model = options.model?.trim();
            if (model) payload.model = model;
            ws.send(JSON.stringify({ type: 'courseLessonStart', payload }));
          } catch (e) {
            clearTimeout(timeout);
            markDone();
            reject(e instanceof Error ? e : new Error('Failed to start lesson generation'));
          }
        };

        ws.onmessage = (ev) => {
          let msg: { type?: string; payload?: Record<string, unknown> };
          try {
            msg = JSON.parse(String(ev.data)) as {
              type?: string;
              payload?: Record<string, unknown>;
            };
          } catch {
            return;
          }
          const t = msg.type;
          const p = msg.payload ?? {};

          if (t === 'courseLessonStarted' && p.runId) {
            courseLessonWsFlight = { ws, runId: String(p.runId) };
            return;
          }

          if (t === 'courseLessonPhase' && options.onProgress) {
            const phase = p.phase as LessonGenerationProgress['phase'] | undefined;
            if (!phase) return;
            const artifact = p.artifact as LessonGenerationArtifact | undefined;
            options.onProgress({
              phase,
              phaseName: String(p.phaseName ?? ''),
              progress: typeof p.progress === 'number' ? p.progress : 0,
              summary: p.summary != null ? String(p.summary) : undefined,
              artifact,
            });
            return;
          }

          if (t === 'courseLessonComplete') {
            clearTimeout(timeout);
            const md = String(p.markdown ?? '');
            if (!completed) {
              markDone();
              try {
                ws.close();
              } catch {
                // ignore
              }
              if (!md.trim()) {
                reject(new Error('Invalid lesson generation response'));
                return;
              }
              resolve(md);
            }
            return;
          }

          if (t === 'courseLessonError') {
            clearTimeout(timeout);
            const err = String(p.error ?? 'Lesson generation failed');
            if (!completed) {
              markDone();
              try {
                ws.close();
              } catch {
                // ignore
              }
              reject(new Error(err));
            }
          }
        };

        ws.onerror = (ev) => {
          clearTimeout(timeout);
          wsLogger.error('course lesson WebSocket error', ev);
          if (!completed) {
            markDone();
            reject(new Error('WebSocket error during lesson generation'));
          }
        };

        ws.onclose = () => {
          clearTimeout(timeout);
          if (!completed) {
            markDone();
            reject(new Error('Connection closed before lesson generation completed'));
          }
        };
      })
      .catch((e: unknown) => {
        if (!completed) {
          completed = true;
          courseLessonWsFlight = null;
          reject(e instanceof Error ? e : new Error('Failed to open lesson generation connection'));
        }
      });
  });
}
