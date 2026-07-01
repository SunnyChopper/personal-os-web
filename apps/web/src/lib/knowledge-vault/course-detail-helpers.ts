import type { CourseLesson } from '@/types/knowledge-vault';
import type { CourseWithDetails } from '@/services/knowledge-vault/courses.service';

/** Strip a leading `Module N:` prefix so UI can render a single canonical heading. */
export function formatModuleHeading(moduleIndex: number, title: string): string {
  const cleanTitle = title.replace(/^\s*Module\s+\d+\s*:\s*/i, '').trim() || title.trim();
  return `Module ${moduleIndex + 1}: ${cleanTitle}`;
}

export function isLessonGenerated(lesson: Pick<CourseLesson, 'content'>): boolean {
  return Boolean(lesson.content?.trim());
}

export function flattenCourseLessons(courseData: CourseWithDetails): CourseLesson[] {
  const sortedModules = [...courseData.modules].sort(
    (a, b) => a.module.moduleIndex - b.module.moduleIndex
  );
  return sortedModules.flatMap((m) => [...m.lessons].sort((a, b) => a.lessonIndex - b.lessonIndex));
}

export type LessonGenerationStatus = 'generated' | 'unlocked' | 'locked';

export interface LessonGenerationState {
  status: LessonGenerationStatus;
  /** First prior lesson in course order that still lacks generated content. */
  blockedBy: CourseLesson | null;
}

export function getLessonGenerationState(
  lesson: CourseLesson,
  allLessons: CourseLesson[]
): LessonGenerationState {
  if (isLessonGenerated(lesson)) {
    return { status: 'generated', blockedBy: null };
  }

  const index = allLessons.findIndex((l) => l.id === lesson.id);
  if (index <= 0) {
    return { status: 'unlocked', blockedBy: null };
  }

  for (let i = 0; i < index; i += 1) {
    const prior = allLessons[i];
    if (!isLessonGenerated(prior)) {
      return { status: 'locked', blockedBy: prior };
    }
  }

  return { status: 'unlocked', blockedBy: null };
}

export type LessonTimeKind = 'estimated' | 'target';

export interface LessonTimeLabel {
  kind: LessonTimeKind;
  label: string;
  minutes: number | null;
}

export function getLessonTimeLabel(
  lesson: Pick<CourseLesson, 'content' | 'estimatedMinutes'>
): LessonTimeLabel {
  const minutes = lesson.estimatedMinutes ?? null;
  const kind: LessonTimeKind = isLessonGenerated(lesson) ? 'estimated' : 'target';
  const prefix = kind === 'estimated' ? 'Estimated Time' : 'Target Time';

  if (minutes == null) {
    return { kind, label: prefix, minutes: null };
  }

  return { kind, label: `${prefix}: ${minutes} min`, minutes };
}

export function getLessonStatusBadge(lesson: CourseLesson): {
  text: string;
  tone: 'complete' | 'generated' | 'pending';
} {
  if (lesson.completedAt) {
    return { text: 'Complete', tone: 'complete' };
  }
  if (isLessonGenerated(lesson)) {
    return { text: 'Generated', tone: 'generated' };
  }
  return { text: 'Not generated', tone: 'pending' };
}

export function getPrerequisiteGenerationMessage(blockedBy: CourseLesson): string {
  return `Generate "${blockedBy.title}" first.`;
}
