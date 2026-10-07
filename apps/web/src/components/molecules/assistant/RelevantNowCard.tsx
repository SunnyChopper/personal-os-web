import type { CoachNudgeLevel, RelevantNowKind, RelevantNowSlot } from '@/types/chatbot';
import { cardSurfaceClassName } from '@/components/atoms/Card';
import { cn } from '@/lib/utils';

const KIND_LABELS: Record<RelevantNowKind, string> = {
  topTask: 'Top task',
  avoidanceCoach: 'Escalation',
  blocker: 'Blocker',
  nextHabit: 'Habit',
  knowledge: 'Knowledge',
  radarHit: 'Radar',
  healthConstraint: 'Health',
};

const KIND_BADGE_CLASS: Record<RelevantNowKind, string> = {
  topTask: 'bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100',
  avoidanceCoach: 'bg-orange-100 text-orange-950 dark:bg-orange-900/40 dark:text-orange-100',
  blocker: 'bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-100',
  nextHabit: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100',
  knowledge: 'bg-violet-100 text-violet-900 dark:bg-violet-900/40 dark:text-violet-100',
  radarHit: 'bg-amber-100 text-amber-950 dark:bg-amber-900/40 dark:text-amber-100',
  healthConstraint: 'bg-teal-100 text-teal-950 dark:bg-teal-900/40 dark:text-teal-100',
};

const NUDGE_EMPHASIS_CLASS: Record<CoachNudgeLevel, string> = {
  supportive: '',
  firm: 'ring-1 ring-orange-300 dark:ring-orange-700',
  strict: 'ring-2 ring-rose-400 dark:ring-rose-600',
};

export interface RelevantNowCardProps {
  item: RelevantNowSlot;
  onAsk: (prompt: string) => void;
  onOpen: (href: string) => void;
  slotLabel?: string;
}

export function RelevantNowCard({ item, onAsk, onOpen, slotLabel }: RelevantNowCardProps) {
  const nudgeLevel: CoachNudgeLevel | undefined = item.nudgeLevel;
  const badgeLabel = slotLabel ?? KIND_LABELS[item.kind];
  const nudgeSuffix =
    nudgeLevel === 'strict' ? ' · strict' : nudgeLevel === 'firm' ? ' · firm' : '';

  return (
    <article
      className={cn(
        cardSurfaceClassName,
        'p-3 space-y-2',
        nudgeLevel ? NUDGE_EMPHASIS_CLASS[nudgeLevel] : undefined
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            'inline-flex shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
            KIND_BADGE_CLASS[item.kind]
          )}
        >
          {badgeLabel}
          {nudgeSuffix}
        </span>
      </div>
      <div className="min-w-0 space-y-1">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">
          {item.title}
        </h4>
        {item.subtitle ? (
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug line-clamp-2">
            {item.subtitle}
          </p>
        ) : null}
        {item.reason ? (
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">
            {item.reason}
          </p>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={() => onAsk(item.askPrompt)}
          className="min-h-[36px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          Ask
        </button>
        <button
          type="button"
          onClick={() => onOpen(item.href)}
          className="min-h-[36px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          Open
        </button>
      </div>
    </article>
  );
}
