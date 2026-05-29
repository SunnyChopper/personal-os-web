import type { GoalStatus, ProjectStatus } from '@/types/growth-system';

/** Tailwind gradient + border classes for timeline bar fills. */
export type TimelineBarColorClasses = string;

const ACTIVE_BAR: TimelineBarColorClasses =
  'from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 border-blue-600 dark:border-blue-500';

const PLANNING_BAR: TimelineBarColorClasses =
  'from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 border-purple-600 dark:border-purple-500';

const GOAL_PLANNING_BAR: TimelineBarColorClasses =
  'from-slate-400 to-slate-500 dark:from-slate-500 dark:to-slate-600 border-slate-500 dark:border-slate-400';

const ON_HOLD_BAR: TimelineBarColorClasses =
  'from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-yellow-700 border-yellow-600 dark:border-yellow-500';

const COMPLETED_BAR: TimelineBarColorClasses =
  'from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 border-green-600 dark:border-green-500';

const CANCELLED_BAR: TimelineBarColorClasses =
  'from-gray-500 to-gray-600 dark:from-gray-600 dark:to-gray-700 border-gray-600 dark:border-gray-500';

const STALE_BAR: TimelineBarColorClasses =
  'from-rose-500/90 to-rose-600/90 dark:from-rose-600/90 dark:to-rose-700/90 border-rose-600 dark:border-rose-500 border-dashed';

const ACHIEVED_BAR: TimelineBarColorClasses =
  'from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 border-purple-600 dark:border-purple-500';

export function getProjectTimelineBarColorClasses(
  status: ProjectStatus,
  options?: { isWorkComplete?: boolean; isStale?: boolean }
): TimelineBarColorClasses {
  if (options?.isStale) return STALE_BAR;
  if (status === 'Cancelled') return CANCELLED_BAR;
  if (status === 'Completed' || options?.isWorkComplete) return COMPLETED_BAR;
  if (status === 'On Hold') return ON_HOLD_BAR;
  if (status === 'Planning') return PLANNING_BAR;
  return ACTIVE_BAR;
}

export function getGoalTimelineBarColorClasses(status: GoalStatus): TimelineBarColorClasses {
  switch (status) {
    case 'Planning':
      return GOAL_PLANNING_BAR;
    case 'Achieved':
      return ACHIEVED_BAR;
    case 'Abandoned':
      return CANCELLED_BAR;
    case 'Active':
    default:
      return ACTIVE_BAR;
  }
}

/** Legend swatch colors aligned with timeline bar fills. */
export const PROJECT_TIMELINE_LEGEND = [
  { label: 'Planning', swatchClass: 'bg-purple-500' },
  { label: 'Active', swatchClass: 'bg-blue-500' },
  { label: 'On Hold', swatchClass: 'bg-yellow-500' },
  { label: 'Stale', swatchClass: 'bg-rose-500' },
  { label: 'Completed', swatchClass: 'bg-green-500' },
  { label: 'Cancelled', swatchClass: 'bg-gray-500' },
] as const;

export const GOAL_TIMELINE_LEGEND = [
  { label: 'Planning', swatchClass: 'bg-slate-400' },
  { label: 'Active', swatchClass: 'bg-blue-500' },
  { label: 'Achieved', swatchClass: 'bg-purple-500' },
  { label: 'Abandoned', swatchClass: 'bg-gray-500' },
] as const;
