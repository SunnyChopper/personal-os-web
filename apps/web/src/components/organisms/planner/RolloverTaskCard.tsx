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
    task.badge === 'Overdue'
      ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
      : 'bg-slate-200 text-slate-700 dark:bg-slate-500/25 dark:text-slate-300';

  const busyKeep = pendingAction === 'keep';
  const busyBacklog = pendingAction === 'backlog';

  const dragDetected = task.velocityDragDetected ?? isVelocityDragDetected(task.rolloverCount);

  return (
    <article
      className={`rounded-lg border p-3 text-xs shadow-sm ${
        dragDetected
          ? 'border-orange-300 bg-orange-50 dark:border-orange-500/50 dark:bg-orange-500/[0.08]'
          : 'border-amber-200 bg-amber-50 dark:border-amber-500/35 dark:bg-amber-500/[0.06]'
      }`}
      data-testid={`rollover-card-${task.taskId}`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span
          className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${badgeClass}`}
        >
          {task.badge}
        </span>
        <VelocityDragBadge rolloverCount={task.rolloverCount} />
      </div>
      <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-900 dark:text-gray-100">
        {task.title}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-gray-600 dark:text-gray-500">
        <span>{task.priority}</span>
        <span aria-hidden>·</span>
        <span>from {task.sourceDate.slice(5)}</span>
        {task.storyPoints > 0 ? (
          <>
            <span aria-hidden>·</span>
            <span className="font-medium text-gray-500 dark:text-gray-400">
              {task.storyPoints} SP
            </span>
          </>
        ) : null}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled || busyKeep || busyBacklog}
          aria-label={busyKeep ? 'Keeping task for today' : 'Keep task for today'}
          className="inline-flex items-center justify-center gap-1 rounded-md bg-emerald-600 px-2 py-1.5 text-[10px] font-semibold text-white hover:bg-emerald-500 dark:bg-emerald-600/80 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={(e) => {
            e.stopPropagation();
            onAction(task.rolloverId, 'keep');
          }}
        >
          <Check className="h-3 w-3 shrink-0" />
          {busyKeep ? 'Keeping…' : 'Keep'}
        </button>
        <button
          type="button"
          disabled={disabled || busyKeep || busyBacklog}
          className="inline-flex items-center justify-center gap-1 rounded-md border border-gray-200 bg-gray-100 px-2 py-1.5 text-[10px] font-semibold text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-transparent dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
          onClick={(e) => {
            e.stopPropagation();
            onAction(task.rolloverId, 'backlog');
          }}
        >
          <Archive className="h-3 w-3 shrink-0" />
          {busyBacklog ? 'Moving…' : 'Backlog'}
        </button>
      </div>
    </article>
  );
}
