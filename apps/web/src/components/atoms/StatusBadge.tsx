import type { TaskStatus, ProjectStatus, GoalStatus } from '@/types/growth-system';
import {
  TASK_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
  GOAL_STATUS_LABELS,
} from '@/constants/growth-system';

interface StatusBadgeProps {
  status: TaskStatus | ProjectStatus | GoalStatus | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
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
  'On Track': {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
  },
  'At Risk': {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
  },
  Achieved: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
  Abandoned: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-500' },
  Paused: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-400',
  },
  Archived: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-500' },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export function StatusBadge({ status, size = 'md', className = '' }: StatusBadgeProps) {
  const colors = statusColors[status] || statusColors['Not Started'];
  const isCompleted = status === 'Done' || status === 'Completed' || status === 'Achieved';
  const isCancelled = status === 'Cancelled' || status === 'Abandoned';

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
      className={`inline-flex items-center rounded-full font-medium ${colors.bg} ${colors.text} ${sizeClasses[size]} ${isCancelled ? 'line-through' : ''} ${className}`}
    >
      {isCompleted && <span className="mr-1">✓</span>}
      {getLabel(status)}
    </span>
  );
}
