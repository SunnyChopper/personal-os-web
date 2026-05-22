import { Archive, Check } from 'lucide-react';

import { VelocityDragBadge } from '@/components/molecules/VelocityDragInterventionCard';
import type { PlannerRolloverAction, PlannerRolloverTask } from '@/types/planner';
import { isVelocityDragDetected } from '@/types/growth-system';

export interface RolloverTaskCardProps {
  task: PlannerRolloverTask;
  disabled?: boolean;
  pendingAction?: PlannerRolloverAction | null;
  onAction: (rolloverId: string, action: PlannerRolloverAction) => void;
}

export function RolloverTaskCard({
  task,
  disabled,
  pendingAction,
  onAction,
}: RolloverTaskCardProps) {
  const badgeClass =
    task.badge === 'Overdue' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-500/25 text-slate-300';

  const busyKeep = pendingAction === 'keep';
  const busyBacklog = pendingAction === 'backlog';

  const dragDetected = task.velocityDragDetected ?? isVelocityDragDetected(task.rolloverCount);

  return (
    <article
      className={`rounded-lg border border-dashed p-2 text-xs shadow-sm ${
        dragDetected
          ? 'border-orange-500/50 bg-orange-500/[0.08]'
          : 'border-amber-500/35 bg-amber-500/[0.06]'
      }`}
      data-testid={`rollover-card-${task.taskId}`}
    >
      <div className="mb-1 flex flex-wrap items-center gap-1.5">
        <span
          className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${badgeClass}`}
        >
          {task.badge}
        </span>
        <VelocityDragBadge rolloverCount={task.rolloverCount} />
        <span className="text-[10px] text-gray-500">from {task.sourceDate.slice(5)}</span>
        {task.storyPoints > 0 ? (
          <span className="ml-auto text-[10px] font-medium text-gray-400">
            {task.storyPoints} SP
          </span>
        ) : null}
      </div>
      <p className="truncate font-medium text-gray-100">{task.title}</p>
      <p className="mt-0.5 text-[10px] text-gray-500">{task.priority}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          disabled={disabled || busyKeep || busyBacklog}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-emerald-600/80 px-2 py-1 text-[10px] font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={(e) => {
            e.stopPropagation();
            onAction(task.rolloverId, 'keep');
          }}
        >
          <Check className="h-3 w-3" />
          {busyKeep ? 'Keeping…' : 'Keep today'}
        </button>
        <button
          type="button"
          disabled={disabled || busyKeep || busyBacklog}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[10px] font-semibold text-gray-200 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={(e) => {
            e.stopPropagation();
            onAction(task.rolloverId, 'backlog');
          }}
        >
          <Archive className="h-3 w-3" />
          {busyBacklog ? 'Moving…' : 'Backlog'}
        </button>
      </div>
    </article>
  );
}
