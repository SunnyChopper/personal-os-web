import type { TaskStatus } from '@/types/growth-system';

export type KanbanBacklogDensity = 'compact' | 'cards';

/** Persisted preference for Backlog column card density (contract §6). */
export const KANBAN_BACKLOG_DENSITY_STORAGE_KEY = 'kanban.backlog.density';

/** Column order on the board */
export const KANBAN_STATUSES: TaskStatus[] = [
  'Backlog',
  'Not Started',
  'In Progress',
  'Blocked',
  'On Hold',
  'Done',
  'Cancelled',
];

/** Accent dot per status (Trello-style lane indicator) */
export const KANBAN_STATUS_ACCENTS: Record<TaskStatus, string> = {
  Backlog: 'bg-zinc-400 dark:bg-zinc-500',
  'Not Started': 'bg-slate-400 dark:bg-slate-500',
  'In Progress': 'bg-blue-500',
  Blocked: 'bg-red-500',
  'On Hold': 'bg-amber-500',
  Done: 'bg-emerald-500',
  Cancelled: 'bg-gray-400 dark:bg-gray-500',
};
