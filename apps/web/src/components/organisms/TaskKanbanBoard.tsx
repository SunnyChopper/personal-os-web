import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Task, TaskStatus, UpdateTaskInput } from '@/types/growth-system';
import { KanbanColumn } from '@/components/organisms/KanbanColumn';
import {
  KANBAN_STATUSES,
  KANBAN_STATUS_ACCENTS,
} from '@/components/organisms/kanban/kanban-constants';

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
