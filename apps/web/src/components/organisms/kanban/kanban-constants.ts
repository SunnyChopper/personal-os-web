import type { TaskStatus } from '@/types/growth-system';

/** Column order on the board */
export const KANBAN_STATUSES: TaskStatus[] = [
  'Not Started',
  'In Progress',
  'Blocked',
  'On Hold',
  'Done',
  'Cancelled',
];

/** Accent dot per status (Trello-style lane indicator) */
export const KANBAN_STATUS_ACCENTS: Record<TaskStatus, string> = {
  'Not Started': 'bg-slate-400 dark:bg-slate-500',
  'In Progress': 'bg-blue-500',
  Blocked: 'bg-red-500',
  'On Hold': 'bg-amber-500',
  Done: 'bg-emerald-500',
  Cancelled: 'bg-gray-400 dark:bg-gray-500',
};
