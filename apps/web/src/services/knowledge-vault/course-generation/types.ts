/**
 * Progress for AI course outline generation (WebSocket to backend, with REST fallback).
 */
export interface CourseGenerationProgress {
  phase: 'preparing' | 'streaming' | 'validating' | 'persisting' | 'done';
  phaseName: string;
  summary?: string;
  /** 0-100 */
  progress: number;
  currentModule?: number;
  totalModules?: number;
  currentLesson?: number;
  totalLessons?: number;
}

/**
 * Progress for per-lesson content generation.
 */
export interface LessonGenerationProgress {
  phase: 'analyzing' | 'structuring' | 'writing' | 'polishing';
  phaseName: string;
  summary?: string;
  progress: number;
}
