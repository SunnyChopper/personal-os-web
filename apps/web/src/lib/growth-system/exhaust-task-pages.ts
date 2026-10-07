import type { Task } from '@/types/growth-system';

/** ponytail: cap auto-pagination at 20 pages (2000 rows at pageSize 100); raise HTTP max pageSize to reduce round-trips. */
export const TASK_LIST_EXHAUST_MAX_PAGES = 20;

export type TaskPagePayload = {
  data: Task[];
  hasMore?: boolean;
  total: number;
  page: number;
  pageSize: number;
};

export type MergedTaskPageResult = {
  data: Task[];
  hasMore: boolean;
  loadedCount: number;
  total: number;
  page: number;
  pageSize: number;
};

/** Merge the next API page into accumulated tasks by id (later pages win on duplicate ids). */
export function mergeTaskPage(
  accumulated: Task[],
  nextPage: TaskPagePayload
): MergedTaskPageResult {
  const byId = new Map<string, Task>();
  for (const task of accumulated) {
    byId.set(task.id, task);
  }
  for (const task of nextPage.data) {
    byId.set(task.id, task);
  }
  const merged = [...byId.values()];
  return {
    data: merged,
    hasMore: nextPage.hasMore === true,
    loadedCount: merged.length,
    total: nextPage.total,
    page: nextPage.page,
    pageSize: nextPage.pageSize,
  };
}

export function shouldContinueTaskExhaust(hasMore: boolean, pagesFetched: number): boolean {
  return hasMore && pagesFetched < TASK_LIST_EXHAUST_MAX_PAGES;
}

export function taskExhaustCapReached(hasMore: boolean, pagesFetched: number): boolean {
  return hasMore && pagesFetched >= TASK_LIST_EXHAUST_MAX_PAGES;
}
