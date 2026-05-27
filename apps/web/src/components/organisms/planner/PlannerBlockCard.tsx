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
    ? 'rounded-lg border border-indigo-300 bg-indigo-50 p-3 text-xs shadow-sm cursor-grab active:cursor-grabbing relative dark:border-indigo-400/70 dark:bg-indigo-500/[0.08]'
    : 'rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-3 text-xs shadow-sm cursor-grab active:cursor-grabbing';

  const title = block.taskTitleSnapshot || block.microStepText || 'Block';

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={cardClass}>
      {isDraft ? (
        <div className="mb-2 flex items-start justify-between gap-2">
          {onDiscardDraft ? (
            <button
              type="button"
              className="shrink-0 rounded p-0.5 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-500/20 dark:hover:text-white"
              aria-label="Remove draft block"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDiscardDraft(block.id);
              }}
            >
              <X className="h-3 w-3" />
            </button>
          ) : (
            <span className="w-4 shrink-0" aria-hidden />
          )}
          <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-500/30 dark:text-indigo-200">
            Draft
          </span>
        </div>
      ) : null}
      <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-900 dark:text-white">
        {title}
      </p>
      <p className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400">
        {new Date(block.startAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} –{' '}
        {new Date(block.endAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
      </p>
      {block.microStepText && (
        <p className="mt-1 line-clamp-2 text-[10px] text-amber-700 dark:text-amber-300">
          Rescue step
        </p>
      )}
    </div>
  );
}
