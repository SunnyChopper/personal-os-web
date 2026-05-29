import { useCallback } from 'react';
import MarkdownRenderer from '@/components/molecules/MarkdownRenderer';
import { TaskListToggleProvider } from '@/lib/markdown/task-list-context';
import { toggleTaskListItemAt } from '@/lib/markdown/task-list-toggle';
import { useTasks } from '@/hooks/useGrowthSystem';
import { cn } from '@/lib/utils';
import type { UpdateTaskInput } from '@/types/growth-system';

export type TaskMarkdownField = 'description' | 'extendedDescription' | 'notes';

interface TaskFieldMarkdownProps {
  taskId: string;
  field: TaskMarkdownField;
  value: string;
  readOnly?: boolean;
  variant?: 'default' | 'compact';
  className?: string;
}

const COMPACT_PROSE_CLASSES = [
  'prose-p:my-1 prose-p:leading-snug',
  'prose-ul:my-1 prose-ol:my-1',
  'prose-li:my-0',
  'prose-headings:my-1',
  'text-sm leading-snug text-gray-600 dark:text-gray-400',
];

export function TaskFieldMarkdown({
  taskId,
  field,
  value,
  readOnly = false,
  variant = 'default',
  className,
}: TaskFieldMarkdownProps) {
  const { updateTask } = useTasks();

  const handleToggle = useCallback(
    (index: number, nextChecked: boolean) => {
      const next = toggleTaskListItemAt(value, index, nextChecked);
      if (next === value) {
        return;
      }
      const input = { [field]: next } as UpdateTaskInput;
      void updateTask({ id: taskId, input });
    },
    [field, taskId, updateTask, value]
  );

  return (
    <TaskListToggleProvider onToggle={readOnly ? undefined : handleToggle}>
      <MarkdownRenderer
        content={value}
        contentKey={`${taskId}:${field}:${value}`}
        className={cn(variant === 'compact' && COMPACT_PROSE_CLASSES, className)}
      />
    </TaskListToggleProvider>
  );
}
