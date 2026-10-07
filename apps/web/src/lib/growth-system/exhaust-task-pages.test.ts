import { describe, expect, it } from 'vitest';
import type { Task } from '@/types/growth-system';
import {
  mergeTaskPage,
  shouldContinueTaskExhaust,
  taskExhaustCapReached,
  TASK_LIST_EXHAUST_MAX_PAGES,
} from './exhaust-task-pages';

function makeTask(id: string, title = id): Task {
  return {
    id,
    title,
    description: null,
    extendedDescription: null,
    area: 'Operations',
    subCategory: null,
    priority: 'P2',
    status: 'Not Started',
    size: 3,
    dueDate: null,
    scheduledDate: null,
    completedDate: null,
    notes: null,
    isRecurring: false,
    recurrenceRule: null,
    pointValue: null,
    pointsAwarded: null,
    projectIds: [],
    goalIds: [],
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

describe('mergeTaskPage', () => {
  it('merges two pages without duplicates', () => {
    const page1 = {
      data: [makeTask('a'), makeTask('b')],
      hasMore: true,
      total: 3,
      page: 1,
      pageSize: 2,
    };
    const afterFirst = mergeTaskPage([], page1);
    expect(afterFirst.data.map((t) => t.id)).toEqual(['a', 'b']);
    expect(afterFirst.hasMore).toBe(true);

    const page2 = {
      data: [makeTask('c')],
      hasMore: false,
      total: 3,
      page: 2,
      pageSize: 2,
    };
    const afterSecond = mergeTaskPage(afterFirst.data, page2);
    expect(afterSecond.data.map((t) => t.id)).toEqual(['a', 'b', 'c']);
    expect(afterSecond.hasMore).toBe(false);
    expect(afterSecond.loadedCount).toBe(3);
    expect(afterSecond.total).toBe(3);
  });

  it('later page wins on duplicate id', () => {
    const accumulated = [makeTask('a', 'old')];
    const next = {
      data: [makeTask('a', 'new')],
      hasMore: false,
      total: 1,
      page: 2,
      pageSize: 100,
    };
    const merged = mergeTaskPage(accumulated, next);
    expect(merged.data).toHaveLength(1);
    expect(merged.data[0]?.title).toBe('new');
  });
});

describe('shouldContinueTaskExhaust', () => {
  it('stops when hasMore is false', () => {
    expect(shouldContinueTaskExhaust(false, 1)).toBe(false);
  });

  it('stops at max pages', () => {
    expect(shouldContinueTaskExhaust(true, TASK_LIST_EXHAUST_MAX_PAGES)).toBe(false);
  });

  it('continues while hasMore and under cap', () => {
    expect(shouldContinueTaskExhaust(true, 1)).toBe(true);
  });
});

describe('taskExhaustCapReached', () => {
  it('is true only when hasMore remains at cap', () => {
    expect(taskExhaustCapReached(true, TASK_LIST_EXHAUST_MAX_PAGES)).toBe(true);
    expect(taskExhaustCapReached(false, TASK_LIST_EXHAUST_MAX_PAGES)).toBe(false);
    expect(taskExhaustCapReached(true, 1)).toBe(false);
  });
});
