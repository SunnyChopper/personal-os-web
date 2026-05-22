import { Archive, ArrowRight } from 'lucide-react';
import {
  VELOCITY_DRAG_ROLLOVER_THRESHOLD,
  type WeeklyReviewTechDebtCandidate,
  type WeeklyReviewTechDebtDecision,
} from '@/types/growth-system';
import { cn } from '@/lib/utils';

interface AccumulatedTechDebtProps {
  candidates: WeeklyReviewTechDebtCandidate[];
  decisions: WeeklyReviewTechDebtDecision[];
  onChange: (decisions: WeeklyReviewTechDebtDecision[]) => void;
  /** When true, decisions are shown but cannot be changed (archived / completed week). */
  readOnly?: boolean;
}

function formatScheduledDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const day = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  return day;
}

export function AccumulatedTechDebt({
  candidates,
  decisions,
  onChange,
  readOnly = false,
}: AccumulatedTechDebtProps) {
  const setAction = (
    c: WeeklyReviewTechDebtCandidate,
    action: WeeklyReviewTechDebtDecision['action']
  ) => {
    if (readOnly) return;
    const existing = decisions.find((d) => d.taskId === c.taskId);
    const rest = decisions.filter((d) => d.taskId !== c.taskId);
    if (existing?.action === action) {
      onChange(rest);
      return;
    }
    onChange([...rest, { taskId: c.taskId, action }]);
  };

  const decisionFor = (c: WeeklyReviewTechDebtCandidate) =>
    decisions.find((d) => d.taskId === c.taskId);

  if (!candidates.length) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No accumulated debt — clean week.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {candidates.map((c) => {
        const d = decisionFor(c);
        const rolled = c.rolloverCount ?? 0;
        const velocityDrag = rolled >= VELOCITY_DRAG_ROLLOVER_THRESHOLD;
        const sched = formatScheduledDate(c.scheduledDate);

        return (
          <div
            key={c.taskId}
            className="rounded-lg border border-rose-900/35 bg-rose-950/15 p-4 dark:border-rose-800/40 dark:bg-rose-950/25"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-100">{c.title}</p>
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                      velocityDrag
                        ? 'bg-red-600/90 text-white'
                        : rolled >= 1
                          ? 'bg-amber-600/80 text-white'
                          : 'bg-slate-700 text-slate-200'
                    )}
                  >
                    Rolled {rolled}x
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
                  <span className="rounded bg-slate-800/80 px-1.5 py-0.5 uppercase tracking-wide">
                    {c.status}
                  </span>
                  {sched && (
                    <span className="rounded bg-slate-800/80 px-1.5 py-0.5">Scheduled {sched}</span>
                  )}
                  {c.dueDate && (
                    <span className="rounded bg-slate-800/80 px-1.5 py-0.5">
                      Due {formatScheduledDate(c.dueDate)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => setAction(c, 'purge')}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium',
                    readOnly && 'cursor-not-allowed opacity-60',
                    d?.action === 'purge'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  )}
                >
                  <Archive className="h-3.5 w-3.5" />
                  Purge task
                </button>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => setAction(c, 'refactor')}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium',
                    readOnly && 'cursor-not-allowed opacity-60',
                    d?.action === 'refactor'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  )}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  Refactor to next week
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
