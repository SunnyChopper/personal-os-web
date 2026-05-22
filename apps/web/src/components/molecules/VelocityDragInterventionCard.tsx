import { Flame, Loader2 } from 'lucide-react';

import Button from '@/components/atoms/Button';
import type { Task } from '@/types/growth-system';
import { isVelocityDragDetected } from '@/types/growth-system';

export interface VelocityDragInterventionCardProps {
  task: Task;
  onSplit?: () => void | Promise<void>;
  isSplitting?: boolean;
  splitError?: string | null;
  className?: string;
}

export function VelocityDragInterventionCard({
  task,
  onSplit,
  isSplitting,
  splitError,
  className = '',
}: VelocityDragInterventionCardProps) {
  if (!isVelocityDragDetected(task.rolloverCount)) {
    return null;
  }

  return (
    <div
      className={`rounded-lg border border-amber-500/40 bg-amber-500/[0.08] p-4 ${className}`}
      data-testid="velocity-drag-intervention"
    >
      <div className="flex items-start gap-3">
        <Flame className="h-5 w-5 shrink-0 text-amber-500 dark:text-amber-400" aria-hidden />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            Velocity Drag Detected
          </p>
          <p className="text-sm text-amber-800/90 dark:text-amber-200/90">
            This task might be too bloated or ill-defined. It has rolled over{' '}
            <span className="font-medium">{task.rolloverCount ?? 0}</span> times without completing.
          </p>
          {onSplit ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={isSplitting}
              onClick={() => void onSplit()}
              className="bg-amber-600 hover:bg-amber-500 dark:bg-amber-600 dark:hover:bg-amber-500"
            >
              {isSplitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Splitting…
                </>
              ) : (
                'Split into 1-point subtasks'
              )}
            </Button>
          ) : null}
          {splitError ? (
            <p className="text-xs text-red-600 dark:text-red-400" role="alert">
              {splitError}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Compact badge for board/list rows. */
export function VelocityDragBadge({
  rolloverCount,
  className = '',
}: {
  rolloverCount?: number | null;
  className?: string;
}) {
  if (!isVelocityDragDetected(rolloverCount)) {
    return null;
  }
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide bg-orange-500/20 text-orange-300 ${className}`}
      title={`Velocity Drag: ${rolloverCount} rollovers`}
      data-testid="velocity-drag-badge"
    >
      <Flame className="h-2.5 w-2.5" aria-hidden />
      Drag
    </span>
  );
}
