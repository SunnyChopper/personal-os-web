import type { TaskStatus } from '@/types/growth-system';

/** Board-wide Kanban card density (all columns). */
export type KanbanCardDensity = 'compact' | 'cards';

/** @deprecated Use KanbanCardDensity */
export type KanbanBacklogDensity = KanbanCardDensity;

/** Persisted preference for Kanban card density across all columns. */
export const KANBAN_CARD_DENSITY_STORAGE_KEY = 'kanban.card.density';

/** Legacy key (Backlog-only toggle); read for migration only. */
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
