import { describe, expect, it } from 'vitest';
import type { CourseLesson } from '@/types/knowledge-vault';
import type { CourseWithDetails } from '@/services/knowledge-vault/courses.service';
import {
  flattenCourseLessons,
  formatModuleHeading,
  getLessonGenerationState,
  getLessonStatusBadge,
  getLessonTimeLabel,
  getPrerequisiteGenerationMessage,
  isLessonGenerated,
} from './course-detail-helpers';

function lesson(
  overrides: Partial<CourseLesson> & Pick<CourseLesson, 'id' | 'title' | 'lessonIndex'>
): CourseLesson {
  return {
    type: 'course_lesson',
    content: null,
    tags: [],
    area: 'Operations',
    status: 'draft',
    searchableText: overrides.title,
    courseId: 'course-1',
    moduleId: 'mod-1',
    estimatedMinutes: 15,
    completedAt: null,
    aiGenerated: true,
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    lastAccessedAt: null,
    ...overrides,
  };
}

const courseData: CourseWithDetails = {
  course: {
    id: 'course-1',
    title: 'Linear Algebra',
    description: null,
    topic: 'Math',
    difficulty: 'intermediate',
    estimatedHours: 5,
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    isAiGenerated: true,
  },
  modules: [
    {
      module: {
        id: 'mod-1',
        courseId: 'course-1',
        title: 'Module 1: Vectors and Scalars',
        description: null,
        moduleIndex: 0,
        userId: 'user-1',
        createdAt: '2026-01-01T00:00:00Z',
      },
      lessons: [
        lesson({
          id: 'les-1',
          title: 'Scalars, Vectors, and Tensors',
          lessonIndex: 0,
          content: '# Intro',
        }),
        lesson({ id: 'les-2', title: 'Vector Addition', lessonIndex: 1 }),
      ],
    },
    {
      module: {
        id: 'mod-2',
        courseId: 'course-1',
        title: 'Module 2: Matrices',
        description: null,
        moduleIndex: 1,
        userId: 'user-1',
        createdAt: '2026-01-01T00:00:00Z',
      },
      lessons: [lesson({ id: 'les-3', title: 'The Dot Product', lessonIndex: 2 })],
    },
  ],
};

describe('formatModuleHeading', () => {
  it('strips duplicate Module N prefix', () => {
    expect(formatModuleHeading(0, 'Module 1: Vectors and Scalars')).toBe(
      'Module 1: Vectors and Scalars'
    );
  });

  it('keeps plain titles', () => {
    expect(formatModuleHeading(1, 'Matrices')).toBe('Module 2: Matrices');
  });
});

describe('isLessonGenerated', () => {
  it('is false for empty content', () => {
    expect(isLessonGenerated({ content: null })).toBe(false);
    expect(isLessonGenerated({ content: '   ' })).toBe(false);
  });

  it('is true for non-empty content', () => {
    expect(isLessonGenerated({ content: '# Lesson' })).toBe(true);
  });
});

describe('flattenCourseLessons', () => {
  it('orders modules and lessons', () => {
    const flat = flattenCourseLessons(courseData);
    expect(flat.map((l) => l.id)).toEqual(['les-1', 'les-2', 'les-3']);
  });
});

describe('getLessonGenerationState', () => {
  const allLessons = flattenCourseLessons(courseData);

  it('marks generated lessons', () => {
    expect(getLessonGenerationState(allLessons[0], allLessons).status).toBe('generated');
  });

  it('unlocks next lesson when prior is generated', () => {
    expect(getLessonGenerationState(allLessons[1], allLessons).status).toBe('unlocked');
  });

  it('locks lesson when a prior lesson lacks content', () => {
    const state = getLessonGenerationState(allLessons[2], allLessons);
    expect(state.status).toBe('locked');
    expect(state.blockedBy?.id).toBe('les-2');
  });
});

describe('getLessonTimeLabel', () => {
  it('uses target time before generation', () => {
    expect(getLessonTimeLabel({ content: null, estimatedMinutes: 15 })).toEqual({
      kind: 'target',
      label: 'Target Time: 15 min',
      minutes: 15,
    });
  });

  it('uses estimated time after generation', () => {
    expect(getLessonTimeLabel({ content: '# Body', estimatedMinutes: 15 })).toEqual({
      kind: 'estimated',
      label: 'Estimated Time: 15 min',
      minutes: 15,
    });
  });
});

describe('getLessonStatusBadge', () => {
  it('distinguishes complete, generated, and pending', () => {
    expect(getLessonStatusBadge(allLessonsFromCourse()[0]).tone).toBe('generated');
    expect(getLessonStatusBadge(allLessonsFromCourse()[1]).tone).toBe('pending');
    expect(
      getLessonStatusBadge({
        ...allLessonsFromCourse()[0],
        completedAt: '2026-01-02T00:00:00Z',
      }).tone
    ).toBe('complete');
  });
});

function allLessonsFromCourse(): CourseLesson[] {
  return flattenCourseLessons(courseData);
}

describe('getPrerequisiteGenerationMessage', () => {
  it('names the blocking lesson', () => {
    expect(getPrerequisiteGenerationMessage(allLessonsFromCourse()[1])).toBe(
      'Generate "Vector Addition" first.'
    );
  });
});
