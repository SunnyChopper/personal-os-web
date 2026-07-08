import type { TaskStatus, ProjectStatus, GoalStatus } from '@/types/growth-system';
import {
  TASK_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
  GOAL_STATUS_LABELS,
} from '@/constants/growth-system';

interface StatusBadgeProps {
  status: TaskStatus | ProjectStatus | GoalStatus | string;
  size?: 'sm' | 'md' | 'lg';
  /** Pastel pill (default) or high-contrast label for saturated timeline bars. */
  appearance?: 'default' | 'onSolid';
  className?: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  Backlog: {
    bg: 'bg-zinc-100 dark:bg-zinc-800/80',
    text: 'text-zinc-600 dark:text-zinc-400',
  },
  'Not Started': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' },
  'In Progress': {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
  },
  Blocked: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
  'On Hold': {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-400',
  },
  Done: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
  Cancelled: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-500' },
  Planning: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-400',
  },
  Active: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
  Completed: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
  },
  Achieved: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
  Abandoned: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-500' },
  Stale: {
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    text: 'text-rose-700 dark:text-rose-400',
  },
  Paused: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-400',
  },
  Archived: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-500' },
  // Observability execution statuses
  succeeded: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
  },
  failed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
  running: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
  },
  pending: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-400',
  },
  timeout: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
  },
  cancelled: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-500' },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export function StatusBadge({
  status,
  size = 'md',
  appearance = 'default',
  className = '',
}: StatusBadgeProps) {
  const colors = statusColors[status] || statusColors['Not Started'];
  const isCompleted = status === 'Done' || status === 'Completed' || status === 'Achieved';
  const isCancelled = status === 'Cancelled' || status === 'Abandoned';
  const appearanceClasses =
    appearance === 'onSolid'
      ? 'bg-white/20 text-white ring-1 ring-inset ring-white/30'
      : `${colors.bg} ${colors.text}`;

  // Get the formatted label with proper spacing
  const getLabel = (status: string): string => {
    if (status in TASK_STATUS_LABELS) {
      return TASK_STATUS_LABELS[status as TaskStatus];
    }
    if (status in PROJECT_STATUS_LABELS) {
      return PROJECT_STATUS_LABELS[status as ProjectStatus];
    }
    if (status in GOAL_STATUS_LABELS) {
      return GOAL_STATUS_LABELS[status as GoalStatus];
    }
    return status;
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${appearanceClasses} ${sizeClasses[size]} ${isCancelled ? 'line-through' : ''} ${className}`}
    >
      {isCompleted && <span className="mr-1">✓</span>}
      {getLabel(status)}
    </span>
  );
}
