import { useId, useState } from 'react';
import { ChevronDown, ChevronRight, Link2Off } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Task } from '@/types/growth-system';
import { TaskListItem } from '@/components/molecules/TaskListItem';
import { cn } from '@/lib/utils';
import {
  formatMostRecentCompletedSummary,
  shouldAutoCollapseCompletedSection,
} from '@/lib/projects/completed-tasks-section';

export type ProjectCompletedTasksSectionProps = {
  doneTasks: Task[];
  mostRecentDoneTask: Task;
  olderDoneTasks: Task[];
  projectName: string;
  onEdit: (task: Task) => void;
  onUnlink: (taskId: string) => void;
  onDelete?: (task: Task) => void;
  onView?: (task: Task) => void;
  onViewAllCompleted: () => void;
};

export function ProjectCompletedTasksSection({
  doneTasks,
  mostRecentDoneTask,
  olderDoneTasks,
  projectName,
  onEdit,
  onUnlink,
  onDelete,
  onView,
  onViewAllCompleted,
}: ProjectCompletedTasksSectionProps) {
  const [isOpen, setIsOpen] = useState(() => !shouldAutoCollapseCompletedSection(doneTasks.length));
  const shouldReduceMotion = useReducedMotion();
  const headingId = useId();
  const panelId = `${headingId}-panel`;
  const summaryText = formatMostRecentCompletedSummary(mostRecentDoneTask);

  const unlinkDeleteIcon = <Link2Off className="w-4 h-4" />;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center gap-1.5 rounded text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-800"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
        )}
        <span
          id={headingId}
          className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
        >
          Completed ({doneTasks.length})
        </span>
      </button>

      {!isOpen && (
        <p className="truncate pl-5 text-sm text-gray-600 dark:text-gray-400" title={summaryText}>
          {summaryText}
        </p>
      )}

      <motion.div
        id={panelId}
        role="region"
        aria-labelledby={headingId}
        aria-hidden={!isOpen}
        inert={!isOpen ? true : undefined}
        initial={false}
        animate={
          shouldReduceMotion
            ? { height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }
            : isOpen
              ? 'visible'
              : 'hidden'
        }
        variants={{
          visible: {
            height: 'auto',
            opacity: 1,
            transition: { duration: 0.2, ease: 'easeOut' },
          },
          hidden: {
            height: 0,
            opacity: 0,
            transition: { duration: 0.2, ease: 'easeOut' },
          },
        }}
        className={cn('overflow-hidden', !isOpen && 'pointer-events-none')}
      >
        <div className="space-y-3">
          <TaskListItem
            key={mostRecentDoneTask.id}
            task={mostRecentDoneTask}
            presentation="project"
            onView={onView}
            onClick={onView}
            onEdit={onEdit}
            onUnlink={() => onUnlink(mostRecentDoneTask.id)}
            onDelete={onDelete ?? (() => onUnlink(mostRecentDoneTask.id))}
            deleteLabel="Unlink task"
            deleteAriaLabel={`Unlink ${mostRecentDoneTask.title} from ${projectName}`}
            deleteIcon={unlinkDeleteIcon}
            deleteButtonClassName="hover:!bg-amber-50 hover:!text-amber-600 dark:hover:!bg-amber-900/20 dark:hover:!text-amber-400"
          />
          {olderDoneTasks.length > 0 && (
            <button
              type="button"
              onClick={onViewAllCompleted}
              className="w-full rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:bg-gray-700/50 dark:hover:text-gray-200"
            >
              View {olderDoneTasks.length} more completed task
              {olderDoneTasks.length === 1 ? '' : 's'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
