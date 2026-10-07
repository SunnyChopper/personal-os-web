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

export interface LessonGenerationArtifact {
  kind: 'analysis' | 'outline' | 'draftPreview' | 'polishNotes';
  title: string;
  bullets?: string[];
  markdown?: string;
}

export interface LessonGenerationTrace {
  analysisBullets?: string[];
  outlineMarkdown?: string | null;
  polishNotes?: string | null;
}

/**
 * Progress for per-lesson content generation.
 */
export interface LessonGenerationProgress {
  phase: 'analyzing' | 'structuring' | 'writing' | 'polishing';
  phaseName: string;
  summary?: string;
  progress: number;
  artifact?: LessonGenerationArtifact;
}

export type LessonGenerationPhaseId = LessonGenerationProgress['phase'];
