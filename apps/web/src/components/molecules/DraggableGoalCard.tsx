import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { Goal, GoalProgressBreakdown } from '@/types/growth-system';
import { GoalCard } from './GoalCard';

interface DraggableGoalCardProps {
  goal: Goal;
  onClick: (goal: Goal) => void;
  progress?: GoalProgressBreakdown;
  linkedCounts?: { tasks: number; metrics: number; habits: number; projects: number };
  healthStatus?: 'healthy' | 'at_risk' | 'behind' | 'dormant';
  daysRemaining?: number | null;
  momentum?: 'active' | 'dormant';
  onQuickAction?: (action: 'add_task' | 'log_metric' | 'complete_criterion') => void;
  isDraggingEnabled?: boolean;
}

export function DraggableGoalCard({
  goal,
  onClick,
  progress,
  linkedCounts,
  healthStatus,
  daysRemaining,
  momentum,
  onQuickAction,
  isDraggingEnabled = true,
}: DraggableGoalCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: goal.id,
    disabled: !isDraggingEnabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Drag Handle */}
      {isDraggingEnabled && (
        <button
          {...attributes}
          {...listeners}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-600" />
        </button>
      )}

      {/* Goal Card */}
      <div className={isDraggingEnabled ? 'pl-6' : ''}>
        <GoalCard
          goal={goal}
          onClick={onClick}
          progress={progress}
          linkedCounts={linkedCounts}
          healthStatus={healthStatus}
          daysRemaining={daysRemaining}
          momentum={momentum}
          onQuickAction={onQuickAction}
        />
      </div>
    </div>
  );
}
