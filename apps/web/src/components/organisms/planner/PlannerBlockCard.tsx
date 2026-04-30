import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { PlannerBlock } from '@/types/planner';

export interface PlannerBlockCardProps {
  block: PlannerBlock;
  disabled?: boolean;
}

export function PlannerBlockCard({ block, disabled }: PlannerBlockCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: block.id,
    disabled,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 text-xs shadow-sm cursor-grab active:cursor-grabbing"
    >
      <p className="font-medium text-gray-900 dark:text-white truncate">
        {block.taskTitleSnapshot || block.microStepText || 'Block'}
      </p>
      <p className="text-gray-500 dark:text-gray-400 mt-1">
        {new Date(block.startAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} –{' '}
        {new Date(block.endAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
      </p>
      {block.microStepText && (
        <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-1 truncate">Rescue step</p>
      )}
    </div>
  );
}
