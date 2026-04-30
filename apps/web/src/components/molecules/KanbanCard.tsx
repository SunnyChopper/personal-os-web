import { motion } from 'framer-motion';
import type { Task } from '@/types/growth-system';
import { AreaBadge } from '@/components/atoms/AreaBadge';
import { PriorityIndicator } from '@/components/atoms/PriorityIndicator';
import { Pencil } from 'lucide-react';

const cardVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.26,
      ease: [0.34, 1.15, 0.64, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: -4,
    transition: { duration: 0.16, ease: [0.4, 0, 1, 1] as const },
  },
};

export interface KanbanCardProps {
  task: Task;
  taskIndex: number;
  isBeingDragged: boolean;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: () => void;
  onEdit: (task: Task) => void;
  onOpen?: (task: Task) => void;
}

export function KanbanCard({
  task,
  taskIndex,
  isBeingDragged,
  onDragStart,
  onDragEnd,
  onEdit,
  onOpen,
}: KanbanCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ delay: taskIndex * 0.035 }}
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
        onOpen?.(task);
      }}
      onKeyDown={(e) => {
        if (onOpen && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          e.stopPropagation();
          onOpen(task);
        }
      }}
      role={onOpen ? 'button' : 'listitem'}
      tabIndex={onOpen ? 0 : undefined}
      aria-label={onOpen ? `View task details: ${task.title}` : `Task: ${task.title}`}
      className={`group cursor-grab rounded-lg border border-gray-200/90 bg-white p-3 shadow-sm transition-[opacity,transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing dark:border-gray-700/90 dark:bg-gray-900 ${
        isBeingDragged
          ? 'z-10 -rotate-1 scale-[0.97] opacity-[0.48] shadow-lg ring-2 ring-blue-400/35 dark:ring-blue-500/40'
          : onOpen
            ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/80 focus:ring-offset-2 dark:focus:ring-offset-gray-900'
            : ''
      } `}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <PriorityIndicator priority={task.priority} size="sm" />
          <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 dark:text-gray-100">
            {task.title}
          </h4>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.05 }}
          onClick={(e) => {
            e.stopPropagation();
            onEdit(task);
          }}
          className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md p-1.5 opacity-0 transition-opacity hover:bg-gray-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500/60 group-hover:opacity-100 dark:hover:bg-gray-800"
          title="Edit task"
          aria-label={`Edit task: ${task.title}`}
        >
          <Pencil className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
        </motion.button>
      </div>

      {task.description ? (
        <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
          {task.description}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <AreaBadge area={task.area} size="sm" />
        {task.size != null && task.size > 0 ? (
          <span
            className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            title="Story points (Fibonacci)"
          >
            {task.size}pts
          </span>
        ) : null}
        {task.pointValue != null && task.pointValue > 0 ? (
          <span className="rounded-md bg-amber-100/90 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/35 dark:text-amber-200">
            +{task.pointValue} reward
            {task.rewardLedgerStatus === 'reversed'
              ? ' · clawed back'
              : task.pointsAwarded
                ? ' · earned'
                : ''}
          </span>
        ) : null}
        {task.dueDate ? (
          <span className="rounded-md bg-amber-100/90 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            {new Date(task.dueDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}
