import { Pencil, Trash2, Calendar, Clock, GitBranch, Coins } from 'lucide-react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { Task } from '@/types/growth-system';
import { AreaBadge } from '@/components/atoms/AreaBadge';
import { PriorityIndicator } from '@/components/atoms/PriorityIndicator';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { DependencyBadge } from '@/components/atoms/DependencyBadge';
import Button from '@/components/atoms/Button';
import { cn } from '@/lib/utils';
import { formatTaskStoryPointsLabel } from '@/constants/growth-system';

interface TaskListItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onClick?: (task: Task) => void;
  dependencyCount?: number;
  blockedByCount?: number;
  blockedByTasks?: Task[];
  projectCount?: number;
  goalCount?: number;
  deleteLabel?: string;
  deleteAriaLabel?: string;
  deleteIcon?: ReactNode;
  deleteButtonClassName?: string;
  actionsVisibility?: 'hover' | 'always';
}

export function TaskListItem({
  task,
  onEdit,
  onDelete,
  onClick,
  dependencyCount = 0,
  blockedByCount = 0,
  blockedByTasks = [],
  projectCount = 0,
  goalCount = 0,
  deleteLabel = 'Delete task',
  deleteAriaLabel,
  deleteIcon,
  deleteButtonClassName,
  actionsVisibility: _actionsVisibility = 'hover',
}: TaskListItemProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(task);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: date.toLocaleDateString(), overdue: true };
    } else if (diffDays === 0) {
      return { text: 'Today', urgent: true };
    } else if (diffDays === 1) {
      return { text: 'Tomorrow', urgent: true };
    } else if (diffDays <= 7) {
      return { text: `${diffDays} days`, warning: true };
    } else {
      return { text: date.toLocaleDateString(), normal: true };
    }
  };

  const dueInfo = formatDate(task.dueDate);
  const scheduledInfo = formatDate(task.scheduledDate);

  const metadata = (
    <>
      <AreaBadge area={task.area} size="sm" />

      {(projectCount > 0 || goalCount > 0) && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {projectCount > 0 && `Projects: ${projectCount}`}
          {projectCount > 0 && goalCount > 0 && ' • '}
          {goalCount > 0 && `Goals: ${goalCount}`}
        </span>
      )}

      {task.size ? (
        <span
          className="text-xs font-medium text-gray-500 dark:text-gray-400"
          title="Story points (Fibonacci)"
        >
          {formatTaskStoryPointsLabel(task.size)}
        </span>
      ) : null}

      {task.pointValue ? (
        <div className="flex items-center gap-1.5">
          <Coins className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-500" />
          <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
            Reward: {task.pointValue} {task.pointValue === 1 ? 'pt' : 'pts'}
            {task.rewardLedgerStatus === 'reversed'
              ? ' · clawed back (reopened)'
              : task.status === 'Done' && task.pointsAwarded
                ? ' · earned'
                : task.status !== 'Done'
                  ? ' · if completed'
                  : ''}
          </span>
        </div>
      ) : null}

      {dueInfo ? (
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
          <span
            className={`text-xs font-medium ${
              dueInfo.overdue
                ? 'text-red-600 dark:text-red-400'
                : dueInfo.urgent
                  ? 'text-orange-600 dark:text-orange-400'
                  : dueInfo.warning
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {dueInfo.text}
          </span>
        </div>
      ) : null}

      {scheduledInfo && !dueInfo ? (
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
          <span className="text-xs text-gray-500 dark:text-gray-400">{scheduledInfo.text}</span>
        </div>
      ) : null}

      {blockedByCount > 0 ? (
        <DependencyBadge
          type="blocked"
          count={blockedByCount}
          tooltip={
            blockedByTasks.length > 0
              ? `Blocked by:\n${blockedByTasks.map((t) => `• ${t.title}`).join('\n')}`
              : undefined
          }
        />
      ) : null}

      {dependencyCount > 0 ? (
        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
          <GitBranch className="h-3.5 w-3.5" />
          <span className="text-xs">{dependencyCount}</span>
        </div>
      ) : null}
    </>
  );

  return (
    <motion.div
      layoutId={`task-item-${task.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={`group min-w-0 rounded-lg border border-gray-200 bg-white p-4 transition-all duration-200 hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 lg:p-3.5 ${
        onClick
          ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          : ''
      }`}
      onClick={(e) => {
        // Don't trigger click if clicking on action buttons
        if ((e.target as HTMLElement).closest('button')) {
          return;
        }
        handleClick();
      }}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `View task details: ${task.title}` : undefined}
    >
      <div className="flex min-w-0 flex-col gap-2 sm:gap-2.5">
        <div className="flex min-w-0 items-start gap-2 sm:gap-2.5">
          <div className="shrink-0 pt-0.5">
            <PriorityIndicator priority={task.priority} size="sm" variant="badge" />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between lg:gap-2">
              <h3 className="min-w-0 text-base font-semibold leading-snug text-gray-900 break-words dark:text-white lg:text-[1.05rem]">
                {task.title}
              </h3>
              {/* Desktop / large tablet: status + compact icon actions */}
              <div
                className="hidden shrink-0 flex-wrap items-center justify-end gap-x-0.5 gap-y-1 lg:flex"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                role="group"
                aria-label="Task actions"
              >
                <StatusBadge status={task.status} size="sm" />
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(task)}
                    aria-label={`Edit task: ${task.title}`}
                    className="touch-manipulation !h-11 !min-h-[44px] !w-11 !min-w-[44px] !max-w-[44px] !shrink-0 !rounded-lg !px-0 !py-0 text-gray-600 hover:bg-gray-100 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-700/80 dark:hover:text-blue-400"
                  >
                    <Pencil className="h-4 w-4 shrink-0" aria-hidden />
                  </Button>
                </motion.div>
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(task)}
                    aria-label={deleteAriaLabel || deleteLabel}
                    className={cn(
                      'touch-manipulation !h-11 !min-h-[44px] !w-11 !min-w-[44px] !max-w-[44px] !shrink-0 !rounded-lg !px-0 !py-0 text-gray-600 hover:bg-red-50 hover:text-red-600 dark:text-gray-300 dark:hover:bg-red-900/25 dark:hover:text-red-400',
                      deleteButtonClassName
                    )}
                  >
                    {deleteIcon || <Trash2 className="h-4 w-4 shrink-0" aria-hidden />}
                  </Button>
                </motion.div>
              </div>
            </div>
            {/* Mobile & tablet: clear status + labeled actions (44px+ targets) */}
            <div
              className="flex flex-col gap-2.5 lg:hidden"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              role="group"
              aria-label="Task actions"
            >
              <StatusBadge status={task.status} size="sm" className="w-fit" />
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <motion.div whileTap={{ scale: 0.98 }} className="min-w-0">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onEdit(task)}
                    aria-label={`Edit task: ${task.title}`}
                    className="touch-manipulation h-12 min-h-[48px] w-full rounded-xl px-3 py-2.5 text-sm font-medium"
                  >
                    <Pencil className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                    Edit
                  </Button>
                </motion.div>
                <motion.div whileTap={{ scale: 0.98 }} className="min-w-0">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onDelete(task)}
                    aria-label={deleteAriaLabel || deleteLabel}
                    className={cn(
                      'touch-manipulation h-12 min-h-[48px] w-full rounded-xl px-3 py-2.5 text-sm font-medium hover:!border-red-500 hover:!text-red-600 dark:hover:!border-red-400 dark:hover:!text-red-300',
                      deleteButtonClassName
                    )}
                  >
                    <span className="mr-2 flex shrink-0 items-center [&_svg]:h-4 [&_svg]:w-4">
                      {deleteIcon || <Trash2 aria-hidden />}
                    </span>
                    <span className="min-w-0 truncate text-center leading-tight">
                      {deleteLabel}
                    </span>
                  </Button>
                </motion.div>
              </div>
            </div>
            {task.description ? (
              <p className="text-sm leading-snug text-gray-600 line-clamp-2 dark:text-gray-400 sm:line-clamp-3 sm:leading-relaxed">
                {task.description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-2 dark:border-gray-700/80">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm">{metadata}</div>
        </div>
      </div>
    </motion.div>
  );
}
