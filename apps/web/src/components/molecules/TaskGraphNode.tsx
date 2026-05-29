import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { Task, TaskStatus } from '@/types/growth-system';
import { cn } from '@/lib/utils';

export const TASK_GRAPH_NODE_WIDTH = 180;
export const TASK_GRAPH_NODE_HEIGHT = 60;

export type TaskGraphNodeData = {
  task: Task;
};

export type TaskGraphRfNode = Node<TaskGraphNodeData, 'taskGraph'>;

function statusSurfaceClass(status: TaskStatus): string {
  switch (status) {
    case 'Done':
      return 'bg-green-500 border-green-600 dark:bg-green-600 dark:border-green-700';
    case 'In Progress':
      return 'bg-blue-500 border-blue-600 dark:bg-blue-600 dark:border-blue-700';
    case 'Blocked':
      return 'bg-red-500 border-red-600 dark:bg-red-600 dark:border-red-700';
    case 'On Hold':
      return 'bg-yellow-500 border-yellow-600 dark:bg-yellow-600 dark:border-yellow-700';
    case 'Backlog':
      return 'bg-zinc-400 border-zinc-500 dark:bg-zinc-500 dark:border-zinc-600';
    default:
      return 'bg-gray-400 border-gray-500 dark:bg-gray-600 dark:border-gray-700';
  }
}

function truncateTitle(title: string, maxLen = 20): string {
  if (title.length <= maxLen) return title;
  return `${title.substring(0, maxLen)}…`;
}

export function TaskGraphNode({ data, selected }: NodeProps<TaskGraphRfNode>) {
  const { task } = data;

  return (
    <div
      className={cn(
        'rounded-lg border-2 px-3 py-2 text-center shadow-sm transition-all',
        'cursor-pointer hover:brightness-110',
        statusSurfaceClass(task.status),
        selected && 'ring-2 ring-blue-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-800'
      )}
      style={{ width: TASK_GRAPH_NODE_WIDTH, height: TASK_GRAPH_NODE_HEIGHT }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-0 !bg-transparent !opacity-0"
      />
      <p className="pointer-events-none truncate text-sm font-semibold text-white">
        {truncateTitle(task.title)}
      </p>
      <p className="pointer-events-none mt-1 truncate text-xs text-white/90">
        {task.status} • {task.priority}
      </p>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-0 !bg-transparent !opacity-0"
      />
    </div>
  );
}
