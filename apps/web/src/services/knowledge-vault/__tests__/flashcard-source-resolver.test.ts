import { describe, expect, it } from 'vitest';
import { resolveFlashcardSources } from '../flashcard-source-resolver';
import type { Course, CourseLesson, Note } from '@/types/knowledge-vault';

describe('resolveFlashcardSources', () => {
  it('concatenates note content with headings', async () => {
    const notes: Note[] = [
      {
        id: 'note-1',
        type: 'note',
        title: 'Quantum note',
        content: 'Superposition basics.',
        tags: [],
        area: 'Operations',
        status: 'active',
        searchableText: 'quantum',
        userId: 'u1',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        lastAccessedAt: null,
        linkedItems: [],
        sourceUrl: null,
      },
    ];

    const result = await resolveFlashcardSources(['note-1'], notes, []);
    expect(result.sources).toHaveLength(1);
    expect(result.content).toContain('### Quantum note');
    expect(result.content).toContain('Superposition basics.');
    expect(result.title).toBe('Quantum note');
  });

  it('expands course selection into lessons', async () => {
    const courses: Course[] = [
      {
        id: 'course-1',
        title: 'Linear Algebra',
        description: null,
        topic: 'math',
        difficulty: 'intermediate',
        estimatedHours: 10,
        userId: 'u1',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        isAiGenerated: false,
      },
    ];
    const lessons: CourseLesson[] = [
      {
        id: 'lesson-1',
        type: 'course_lesson',
        title: 'Gaussian elimination',
        content: 'Row reduction steps.',
        tags: [],
        area: 'Operations',
        status: 'active',
        searchableText: 'gaussian',
        userId: 'u1',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        lastAccessedAt: null,
        courseId: 'course-1',
        moduleId: 'mod-1',
        lessonIndex: 0,
        estimatedMinutes: 20,
        completedAt: null,
        aiGenerated: false,
      },
    ];

    const result = await resolveFlashcardSources(['course-1'], lessons, courses);
    expect(result.sources).toHaveLength(1);
    expect(result.content).toContain('Gaussian elimination');
  });
});
