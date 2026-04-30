import { Trash2, RefreshCw, CalendarClock } from 'lucide-react';
import type {
  WeeklyReviewQuarantineCandidate,
  WeeklyReviewQuarantineDecision,
} from '@/types/growth-system';
import { cn } from '@/lib/utils';

interface QuarantineZoneProps {
  candidates: WeeklyReviewQuarantineCandidate[];
  decisions: WeeklyReviewQuarantineDecision[];
  onChange: (decisions: WeeklyReviewQuarantineDecision[]) => void;
  /** When true, decisions are shown but cannot be changed (archived / completed week). */
  readOnly?: boolean;
}

export function QuarantineZone({
  candidates,
  decisions,
  onChange,
  readOnly = false,
}: QuarantineZoneProps) {
  const setAction = (
    c: WeeklyReviewQuarantineCandidate,
    action: WeeklyReviewQuarantineDecision['action']
  ) => {
    if (readOnly) return;
    const rest = decisions.filter(
      (d) => !(d.entityType === c.entityType && d.entityId === c.entityId)
    );
    onChange([...rest, { entityType: c.entityType, entityId: c.entityId, action }]);
  };

  const decisionFor = (c: WeeklyReviewQuarantineCandidate) =>
    decisions.find((d) => d.entityType === c.entityType && d.entityId === c.entityId);

  if (!candidates.length) {
    return (
      <p className="text-sm text-slate-500">No quarantine candidates surfaced for this week.</p>
    );
  }

  return (
    <div className="space-y-3">
      {candidates.map((c) => {
        const d = decisionFor(c);
        return (
          <div
            key={`${c.entityType}-${c.entityId}`}
            className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-slate-100">{c.name}</p>
                <p className="text-xs uppercase tracking-wide text-amber-200/80">{c.entityType}</p>
                <p className="mt-1 text-sm text-slate-400">{c.reason}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => setAction(c, 'revive')}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium',
                    readOnly && 'cursor-not-allowed opacity-60',
                    d?.action === 'revive'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  )}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Revive
                </button>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => setAction(c, 'schedule')}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium',
                    readOnly && 'cursor-not-allowed opacity-60',
                    d?.action === 'schedule'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  )}
                >
                  <CalendarClock className="h-3.5 w-3.5" />
                  Reschedule
                </button>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => setAction(c, 'delete')}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium',
                    readOnly && 'cursor-not-allowed opacity-60',
                    d?.action === 'delete'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  )}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>
            {d?.action === 'schedule' && (
              <input
                type="text"
                readOnly={readOnly}
                disabled={readOnly}
                placeholder="When / how will you revisit this?"
                className="mt-3 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 read-only:opacity-80"
                value={d.rescheduleNote ?? ''}
                onChange={(e) => {
                  if (readOnly) return;
                  const rest = decisions.filter(
                    (x) => !(x.entityType === c.entityType && x.entityId === c.entityId)
                  );
                  onChange([
                    ...rest,
                    {
                      entityType: c.entityType,
                      entityId: c.entityId,
                      action: 'schedule',
                      rescheduleNote: e.target.value,
                    },
                  ]);
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
