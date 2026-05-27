import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { Task } from '@/types/growth-system';
import { PriorityIndicator } from '@/components/atoms/PriorityIndicator';

const rowVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: [0.34, 1.1, 0.64, 1] as const },
  },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

export interface KanbanCompactRowProps {
  task: Task;
  taskIndex: number;
  isBeingDragged: boolean;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: () => void;
  onEdit: (task: Task) => void;
  onOpen?: (task: Task) => void;
  /** Backlog column: quick promote to Not Started */
  onPromote?: (task: Task) => void;
}

/** Single-line Kanban row when board density is compact. */
export function KanbanCompactRow({
  task,
  taskIndex,
  isBeingDragged,
  onDragStart,
  onDragEnd,
  onEdit,
  onOpen,
  onPromote,
}: KanbanCompactRowProps) {
  const handleActivate = () => {
    if (onOpen) {
      onOpen(task);
      return;
    }
    onEdit(task);
  };

  return (
    <motion.div
      variants={rowVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ delay: taskIndex * 0.02 }}
      draggable
      onDragStart={(e) => {
        const dragEvent = e as unknown as React.DragEvent;
        onDragStart(dragEvent, task);
      }}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button') || isBeingDragged) {
          return;
        }
        handleActivate();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleActivate();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={onOpen ? `View task details: ${task.title}` : `Edit task: ${task.title}`}
      className={`group flex h-9 min-h-9 max-h-9 cursor-grab items-center gap-2 rounded-md border border-gray-200/90 bg-white px-2 shadow-sm transition-[opacity,transform,box-shadow] active:cursor-grabbing dark:border-gray-700/90 dark:bg-gray-900 ${
        isBeingDragged
          ? 'z-10 scale-[0.98] opacity-50 ring-2 ring-blue-400/35 dark:ring-blue-500/40'
          : 'hover:border-gray-300 hover:shadow dark:hover:border-gray-600'
      }`}
    >
      <PriorityIndicator priority={task.priority} variant="dot" size="sm" className="shrink-0" />
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 dark:text-gray-100">
        {task.title}
      </span>
      {task.size != null && task.size > 0 ? (
        <span
          className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-gray-600 dark:bg-gray-800 dark:text-gray-300"
          title="Story points"
        >
          {task.size}pts
        </span>
      ) : null}
      {onPromote ? (
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onPromote(task);
          }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-gray-500 opacity-0 transition-opacity hover:bg-gray-100 hover:text-blue-600 focus:opacity-100 group-hover:opacity-100 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-blue-400"
          title="Promote to Not Started"
          aria-label={`Promote to Not Started: ${task.title}`}
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </motion.button>
      ) : null}
    </motion.div>
  );
}
