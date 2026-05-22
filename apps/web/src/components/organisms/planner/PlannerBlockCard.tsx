import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { X } from 'lucide-react';
import type { PlannerBlock } from '@/types/planner';

export interface PlannerBlockCardProps {
  block: PlannerBlock;
  disabled?: boolean;
  isDraft?: boolean;
  onDiscardDraft?: (tempId: string) => void;
}

export function PlannerBlockCard({
  block,
  disabled,
  isDraft,
  onDiscardDraft,
}: PlannerBlockCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: block.id,
    disabled,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.6 : isDraft ? 0.8 : 1,
  };

  const cardClass = isDraft
    ? 'rounded-lg border border-dashed border-indigo-400/70 bg-indigo-500/[0.08] p-2 text-xs shadow-sm cursor-grab active:cursor-grabbing relative'
    : 'rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 text-xs shadow-sm cursor-grab active:cursor-grabbing';

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={cardClass}>
      {isDraft ? (
        <span className="absolute right-1 top-1 rounded bg-indigo-500/30 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-indigo-200">
          Draft
        </span>
      ) : null}
      {isDraft && onDiscardDraft ? (
        <button
          type="button"
          className="absolute left-1 top-1 rounded p-0.5 text-indigo-300 hover:bg-indigo-500/20 hover:text-white"
          aria-label="Remove draft block"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDiscardDraft(block.id);
          }}
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
      <p className="font-medium text-gray-900 dark:text-white truncate pr-10">
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
