import { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, LayoutList } from 'lucide-react';
import type { Task, TaskStatus, UpdateTaskInput } from '@/types/growth-system';
import { KanbanColumn } from '@/components/organisms/KanbanColumn';
import {
  KANBAN_STATUSES,
  KANBAN_STATUS_ACCENTS,
  type KanbanCardDensity,
} from '@/components/organisms/kanban/kanban-constants';
import {
  persistKanbanCardDensity,
  readKanbanCardDensity,
} from '@/components/organisms/kanban/kanban-density';

interface TaskKanbanBoardProps {
  tasks: Task[];
  isLoading?: boolean;
  onTaskUpdate: (id: string, input: UpdateTaskInput) => void;
  onTaskEdit: (task: Task) => void;
  onTaskCreate: (status: TaskStatus) => void;
  onTaskClick?: (task: Task) => void;
}

export function TaskKanbanBoard({
  tasks,
  isLoading = false,
  onTaskUpdate,
  onTaskEdit,
  onTaskCreate,
  onTaskClick,
}: TaskKanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [cardDensity, setCardDensity] = useState<KanbanCardDensity>(() => readKanbanCardDensity());

  const isCompact = cardDensity === 'compact';

  const setCardDensityMode = (mode: KanbanCardDensity) => {
    setCardDensity(mode);
    persistKanbanCardDensity(mode);
  };

  const getTasksByStatus = (status: TaskStatus) => {
    if (!tasks || !Array.isArray(tasks)) {
      return [];
    }
    return tasks.filter((task) => task.status === status);
  };

  const getTotalEffort = (status: TaskStatus) => {
    const statusTasks = getTasksByStatus(status);
    return statusTasks.reduce((sum, task) => sum + (task.size || 0), 0);
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDragLeaveColumn = (e: React.DragEvent) => {
    const next = e.relatedTarget as Node | null;
    if (next && e.currentTarget.contains(next)) {
      return;
    }
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== newStatus) {
      onTaskUpdate(draggedTask.id, { status: newStatus });
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col self-stretch bg-slate-100/95 pt-5 dark:bg-gray-950">
      <div className="flex shrink-0 justify-end px-6 pb-2 lg:px-12">
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => setCardDensityMode(isCompact ? 'cards' : 'compact')}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-gray-200/90 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700/90 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          title={isCompact ? 'Show card details on all columns' : 'Use compact rows on all columns'}
          aria-pressed={isCompact}
          aria-label={
            isCompact
              ? 'Switch to detailed cards on all columns'
              : 'Switch to compact rows on all columns'
          }
        >
          {isCompact ? (
            <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <LayoutList className="h-4 w-4 shrink-0" aria-hidden />
          )}
          <span>{isCompact ? 'Detailed cards' : 'Compact rows'}</span>
        </motion.button>
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="flex h-full min-h-0 min-w-max flex-1 gap-3 px-6 pb-5 sm:gap-4 lg:px-12"
        >
          {KANBAN_STATUSES.map((status, columnIndex) => (
            <KanbanColumn
              key={status}
              status={status}
              cardDensity={cardDensity}
              accentClassName={KANBAN_STATUS_ACCENTS[status]}
              statusTasks={getTasksByStatus(status)}
              totalEffort={getTotalEffort(status)}
              isLoading={isLoading}
              isDragOver={dragOverColumn === status}
              columnIndex={columnIndex}
              draggedTask={draggedTask}
              onTaskCreate={onTaskCreate}
              onTaskUpdate={onTaskUpdate}
              onTaskEdit={onTaskEdit}
              onTaskClick={onTaskClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeaveColumn}
              onDrop={handleDrop}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
