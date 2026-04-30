import type { CourseGenerationProgress } from '@/services/knowledge-vault/course-generation/types';
import type {
  Course,
  CourseModule,
  DifficultyLevel,
  PreAssessmentStored,
} from '@/types/knowledge-vault';
import { wsLogger } from '@/lib/logger';

/** In-flight WebSocket + run id for cancellation (reuses `cancelRun` on the same API). */
let courseSkeletonWsFlight: { ws: WebSocket; runId: string | null } | null = null;

export type CourseSkeletonResult = {
  course: Course;
  modules: Array<{
    module: CourseModule;
    lessons: Array<{
      title: string;
      estimatedMinutes: number;
    }>;
  }>;
};

/**
 * Send `cancelRun` with the current course-skeleton run id and close the socket.
 * Safe to call if no generation is in progress.
 */
export function cancelInFlightCourseSkeleton(): void {
  const f = courseSkeletonWsFlight;
  if (!f) {
    return;
  }
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
  courseSkeletonWsFlight = null;
}

const SKELETON_TIMEOUT_MS = 6 * 60_000;

/**
 * One-shot WebSocket run: `courseSkeletonStart` → phase events → `courseSkeletonComplete` | `courseSkeletonError`.
 * Uses the same connect URL and `authToken` query param as the assistant WebSocket.
 */
export function runCourseSkeletonOverWebSocket(options: {
  wsBaseUrl: string;
  getAccessToken: () => Promise<string | null>;
  topic: string;
  preAssessment: PreAssessmentStored;
  targetDifficulty: DifficultyLevel;
  knowledgeSource?: 'global' | 'vault';
  onProgress?: (progress: CourseGenerationProgress) => void;
}): Promise<CourseSkeletonResult> {
  return new Promise((resolve, reject) => {
    let completed = false;

    const markDone = () => {
      completed = true;
      courseSkeletonWsFlight = null;
    };

    void options
      .getAccessToken()
      .then((token) => {
        const openUrl = new URL(options.wsBaseUrl);
        if (token) {
          openUrl.searchParams.set('authToken', token);
        }

        const ws = new WebSocket(openUrl.toString());
        courseSkeletonWsFlight = { ws, runId: null };

        const timeout = window.setTimeout(() => {
          try {
            ws.close();
          } catch {
            // ignore
          }
          if (!completed) {
            markDone();
            reject(new Error('Course outline generation timed out.'));
          }
        }, SKELETON_TIMEOUT_MS);

        ws.onopen = () => {
          try {
            ws.send(
              JSON.stringify({
                type: 'courseSkeletonStart',
                payload: {
                  topic: options.topic,
                  targetDifficulty: options.targetDifficulty,
                  knowledgeSource: options.knowledgeSource ?? 'global',
                  preAssessment: options.preAssessment,
                  useCache: true,
                },
              })
            );
          } catch (e) {
            clearTimeout(timeout);
            if (!completed) {
              markDone();
              reject(e instanceof Error ? e : new Error('Failed to start course generation'));
            }
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

          if (t === 'courseSkeletonStarted' && p.runId) {
            courseSkeletonWsFlight = { ws, runId: String(p.runId) };
            return;
          }

          if (t === 'courseSkeletonPhase' && options.onProgress) {
            const phase = p.phase as CourseGenerationProgress['phase'] | undefined;
            const phaseName = String(p.phaseName ?? '');
            const progress = typeof p.progress === 'number' ? p.progress : 0;
            const summary = p.summary != null ? String(p.summary) : undefined;
            if (phase) {
              options.onProgress({
                phase,
                phaseName,
                progress,
                summary,
              });
            }
            return;
          }

          if (t === 'courseSkeletonComplete') {
            clearTimeout(timeout);
            const sk = p.skeleton;
            if (!sk || typeof sk !== 'object') {
              if (!completed) {
                markDone();
                try {
                  ws.close();
                } catch {
                  // ignore
                }
                reject(new Error('Invalid course skeleton response'));
              }
              return;
            }
            if (!completed) {
              markDone();
              try {
                ws.close();
              } catch {
                // ignore
              }
              resolve(sk as unknown as CourseSkeletonResult);
            }
            return;
          }

          if (t === 'courseSkeletonError') {
            clearTimeout(timeout);
            const err = String(p.error ?? 'Course generation failed');
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
          wsLogger.error('course skeleton WebSocket error', ev);
          if (!completed) {
            markDone();
            reject(new Error('WebSocket error during course generation'));
          }
        };

        ws.onclose = () => {
          clearTimeout(timeout);
          if (!completed) {
            markDone();
            reject(new Error('Connection closed before course outline completed'));
          }
        };
      })
      .catch((e: unknown) => {
        if (!completed) {
          completed = true;
          courseSkeletonWsFlight = null;
          reject(e instanceof Error ? e : new Error('Failed to open course generation connection'));
        }
      });
  });
}
