import { useState } from 'react';
import { CheckSquare, Plus, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Task } from '@/types/growth-system';
import { EmptyState } from './EmptyState';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { PriorityIndicator } from '@/components/atoms/PriorityIndicator';
import Button from '@/components/atoms/Button';

interface GoalTasksSectionProps {
  tasks: Task[];
  onAddTask?: () => void;
  onTaskClick?: (task: Task) => void;
  showEmpty?: boolean;
}

export function GoalTasksSection({
  tasks,
  onAddTask,
  onTaskClick,
  showEmpty = true,
}: GoalTasksSectionProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'done'>('all');

  const filteredTasks = tasks.filter((task) => {
    if (statusFilter === 'active') {
      return task.status !== 'Done' && task.status !== 'Cancelled';
    } else if (statusFilter === 'done') {
      return task.status === 'Done';
    }
    return true;
  });

  if (tasks.length === 0 && showEmpty) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            Tasks (0)
          </h3>
        </div>
        <EmptyState
          icon={CheckSquare}
          title="No tasks linked"
          description="Add tasks that contribute to achieving this goal"
          actionLabel={onAddTask ? 'Add Task' : undefined}
          onAction={onAddTask}
        />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <CheckSquare className="w-5 h-5" />
          Tasks ({filteredTasks.length})
        </h3>
        {onAddTask && (
          <Button variant="secondary" size="sm" onClick={onAddTask}>
            <Plus className="w-4 h-4 mr-1" />
            Add Task
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <div className="flex gap-1">
          {(['all', 'active', 'done'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                statusFilter === filter
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {filter === 'all' ? 'All' : filter === 'active' ? 'Active' : 'Completed'}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1">
        {filteredTasks.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
            No {statusFilter === 'all' ? '' : statusFilter} tasks
          </p>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onTaskClick?.(task)}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <PriorityIndicator priority={task.priority} size="sm" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <StatusBadge status={task.status} size="sm" />
                      {task.dueDate && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
