import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task, TaskStatus, UpdateTaskInput } from '@/types/growth-system';
import { KanbanCard } from '@/components/molecules/KanbanCard';
import { Plus, MoreVertical, ArrowRight, ArrowUpDown } from 'lucide-react';
import { TASK_STATUS_LABELS } from '@/constants/growth-system';
import { KANBAN_STATUSES } from '@/components/organisms/kanban/kanban-constants';

const COLUMN_DROP_SPRING = {
  type: 'spring' as const,
  stiffness: 440,
  damping: 34,
  mass: 0.85,
};

export function KanbanCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="animate-pulse space-y-3 rounded-lg border border-gray-200/80 bg-white p-3 dark:border-gray-700/80 dark:bg-gray-900"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex gap-2">
        <div className="h-5 w-8 shrink-0 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 flex-1 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="flex gap-2">
        <div className="h-5 w-14 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="h-5 w-12 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}

export interface KanbanColumnProps {
  status: TaskStatus;
  /** Tailwind classes for the status accent dot (e.g. bg-blue-500) */
  accentClassName: string;
  statusTasks: Task[];
  totalEffort: number;
  isLoading: boolean;
  isDragOver: boolean;
  columnIndex: number;
  draggedTask: Task | null;
  onTaskCreate: (status: TaskStatus) => void;
  onTaskUpdate: (id: string, input: UpdateTaskInput) => void;
  onTaskEdit: (task: Task) => void;
  onTaskClick?: (task: Task) => void;
  onDragOver: (e: React.DragEvent, status: TaskStatus) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: TaskStatus) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: () => void;
}

export function KanbanColumn({
  status,
  accentClassName,
  statusTasks,
  totalEffort,
  isLoading,
  isDragOver,
  columnIndex,
  draggedTask,
  onTaskCreate,
  onTaskUpdate,
  onTaskEdit,
  onTaskClick,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
  onDragEnd,
}: KanbanColumnProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  const handleMoveAllTasks = (_fromStatus: TaskStatus, toStatus: TaskStatus) => {
    statusTasks.forEach((task) => {
      if (task.status !== toStatus) {
        onTaskUpdate(task.id, { status: toStatus });
      }
    });
    setMenuOpen(false);
  };

  const handleSortByPriority = () => {
    setMenuOpen(false);
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen((o) => !o);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: columnIndex * 0.06, duration: 0.25 }}
      className="flex h-full min-h-0 w-[17.5rem] shrink-0 flex-col sm:w-80"
      role="region"
      aria-label={`${TASK_STATUS_LABELS[status]} column`}
      onDragOver={(e) => onDragOver(e, status)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, status)}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-gray-100/90 dark:bg-gray-800/70">
        <div className="shrink-0 px-3 pb-2 pt-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span
                className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${accentClassName}`}
                aria-hidden
              />
              <h3 className="text-sm font-semibold leading-tight text-gray-800 dark:text-gray-100">
                {TASK_STATUS_LABELS[status]}
              </h3>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => onTaskCreate(status)}
                className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10"
                title="Add task"
              >
                <Plus className="h-4 w-4" />
              </motion.button>
              <div className="relative" ref={menuRef}>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={toggleMenu}
                  className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/10"
                  title="Column options"
                >
                  <MoreVertical className="h-4 w-4" />
                </motion.button>

                {menuOpen ? (
                  <div
                    role="presentation"
                    className="absolute right-0 z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setMenuOpen(false);
                    }}
                  >
                    <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Move all tasks
                    </div>
                    {KANBAN_STATUSES.filter((s) => s !== status).map((targetStatus) => (
                      <button
                        key={targetStatus}
                        type="button"
                        onClick={() => handleMoveAllTasks(status, targetStatus)}
                        disabled={statusTasks.length === 0}
                        className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-200 dark:hover:bg-gray-700"
                      >
                        <ArrowRight className="h-4 w-4 shrink-0" />
                        <span>To {TASK_STATUS_LABELS[targetStatus]}</span>
                      </button>
                    ))}
                    <div className="my-1 border-t border-gray-200 dark:border-gray-600" />
                    <button
                      type="button"
                      onClick={handleSortByPriority}
                      disabled={statusTasks.length === 0}
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      <ArrowUpDown className="h-4 w-4 shrink-0" />
                      <span>Sort by priority</span>
                    </button>
                    <div className="my-1 border-t border-gray-200 dark:border-gray-600" />
                    <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                      {statusTasks.length} {statusTasks.length === 1 ? 'task' : 'tasks'}
                      {totalEffort > 0 ? ` · ${totalEffort} SP` : ''}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <div className="mt-1.5 min-h-[1.125rem] pl-4 text-xs text-gray-500 dark:text-gray-400">
            {isLoading ? (
              <span className="inline-block h-3 w-20 animate-pulse rounded bg-gray-300/80 dark:bg-gray-600/80" />
            ) : (
              <>
                {statusTasks.length} {statusTasks.length === 1 ? 'task' : 'tasks'}
                {totalEffort > 0 ? <> · {totalEffort} SP</> : null}
              </>
            )}
          </div>
        </div>

        <motion.div
          animate={{
            scale: isDragOver ? 1.008 : 1,
          }}
          transition={COLUMN_DROP_SPRING}
          className={`min-h-0 flex-1 origin-top overflow-y-auto rounded-lg px-2 pb-3 transition-[background-color,box-shadow] duration-200 ${
            isDragOver
              ? 'border border-dashed border-blue-400/80 bg-blue-500/[0.08] shadow-[0_0_0_1px_rgba(59,130,246,0.25),0_12px_32px_-12px_rgba(59,130,246,0.35)] dark:border-blue-400/60 dark:bg-blue-500/12'
              : ''
          }`}
        >
          <div className="space-y-2.5 pt-0.5">
            {isLoading ? (
              <div className="space-y-2.5" aria-busy="true" aria-label="Loading tasks">
                <KanbanCardSkeleton index={0} />
                <KanbanCardSkeleton index={1} />
              </div>
            ) : statusTasks.length === 0 ? (
              <div className="flex h-full min-h-[8rem] items-center justify-center px-2">
                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                  {isDragOver ? (
                    <span className="font-medium text-blue-600 dark:text-blue-400">Drop here</span>
                  ) : (
                    <>
                      <p>No tasks yet</p>
                      <button
                        type="button"
                        onClick={() => onTaskCreate(status)}
                        className="mt-2 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        + Add a card
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {statusTasks.map((task, taskIndex) => (
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
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
