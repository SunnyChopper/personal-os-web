import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, FolderKanban } from 'lucide-react';
import type { Project, Task, TaskStatus, UpdateTaskInput } from '@/types/growth-system';
import { KanbanCard } from '@/components/molecules/KanbanCard';
import { KanbanCompactRow } from '@/components/molecules/KanbanCompactRow';
import { AreaBadge } from '@/components/atoms/AreaBadge';
import { PriorityIndicator } from '@/components/atoms/PriorityIndicator';
import { sumKanbanStoryPoints } from '@/lib/growth-system/kanban-story-points';
import type { KanbanCardDensity } from '@/lib/growth-system/kanban-constants';

const rollupVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.22, ease: [0.34, 1.1, 0.64, 1] as const },
  },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.14 } },
};

export interface KanbanProjectRollupProps {
  project: Project;
  tasks: Task[];
  cardDensity: KanbanCardDensity;
  columnStatus: TaskStatus;
  itemIndex: number;
  draggedTask: Task | null;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: () => void;
  onTaskEdit: (task: Task) => void;
  onTaskClick?: (task: Task) => void;
  onTaskUpdate: (id: string, input: UpdateTaskInput) => void;
}

export function KanbanProjectRollup({
  project,
  tasks,
  cardDensity,
  columnStatus,
  itemIndex,
  draggedTask,
  onDragStart,
  onDragEnd,
  onTaskEdit,
  onTaskClick,
  onTaskUpdate,
}: KanbanProjectRollupProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const panelId = useId();
  const useCompactRows = cardDensity === 'compact';
  const isBacklogColumn = columnStatus === 'Backlog';
  const totalStoryPoints = sumKanbanStoryPoints(tasks);
  const highestPriority = tasks.reduce(
    (best, task) => (task.priority < best ? task.priority : best),
    tasks[0]?.priority ?? 'P4'
  );

  return (
    <motion.div
      variants={rollupVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ delay: itemIndex * 0.035 }}
      className="overflow-hidden rounded-lg border border-gray-200/90 bg-white shadow-sm dark:border-gray-700/90 dark:bg-gray-900"
    >
      <button
        type="button"
        onClick={() => setIsExpanded((open) => !open)}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-gray-50/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/80 dark:hover:bg-gray-800/80"
      >
        <PriorityIndicator priority={highestPriority} size="sm" className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <FolderKanban
              className="mt-0.5 h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400"
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                {project.name}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <AreaBadge area={project.area} size="sm" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                  {totalStoryPoints > 0 ? ` · ${totalStoryPoints} SP` : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="mt-0.5 shrink-0 text-gray-500 dark:text-gray-400"
          aria-hidden
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded ? (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden border-t border-gray-200/80 dark:border-gray-700/80"
          >
            <div className={useCompactRows ? 'space-y-1 p-2 pt-1.5' : 'space-y-2 p-2 pt-1.5'}>
              {tasks.map((task, taskIndex) =>
                useCompactRows ? (
                  <KanbanCompactRow
                    key={task.id}
                    task={task}
                    taskIndex={taskIndex}
                    isBeingDragged={draggedTask?.id === task.id}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onEdit={onTaskEdit}
                    onOpen={onTaskClick}
                    onPromote={
                      isBacklogColumn
                        ? (t) => onTaskUpdate(t.id, { status: 'Not Started' })
                        : undefined
                    }
                  />
                ) : (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    taskIndex={taskIndex}
                    isBeingDragged={draggedTask?.id === task.id}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onEdit={onTaskEdit}
                    onOpen={onTaskClick}
                  />
                )
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
