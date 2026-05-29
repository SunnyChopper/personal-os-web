import { Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { pointBadgeAriaLabel, type PointBadgeStatus } from '@/lib/point-badge';

const statusShell: Record<PointBadgeStatus, string> = {
  available:
    'border-amber-300/80 bg-gradient-to-b from-amber-50 to-amber-100/90 text-amber-950 dark:border-amber-600/50 dark:from-amber-950/50 dark:to-amber-900/35 dark:text-amber-100',
  earned:
    'border-emerald-300/80 bg-gradient-to-b from-emerald-50 to-emerald-100/90 text-emerald-950 dark:border-emerald-600/45 dark:from-emerald-950/45 dark:to-emerald-900/30 dark:text-emerald-100',
  reversed:
    'border-slate-300/70 bg-slate-100/90 text-slate-500 line-through dark:border-slate-600/50 dark:bg-slate-800/60 dark:text-slate-400',
};

const statusIcon: Record<PointBadgeStatus, string> = {
  available: 'text-amber-600 dark:text-amber-400',
  earned: 'text-emerald-600 dark:text-emerald-400',
  reversed: 'text-slate-400 dark:text-slate-500',
};

const sizeClasses = {
  sm: {
    shell: 'gap-0.5 px-1.5 py-0.5 text-[11px] leading-none',
    icon: 'h-3 w-3',
    pts: 'text-[9px] tracking-[0.08em]',
    value: 'text-[11px]',
  },
  md: {
    shell: 'gap-1 px-2 py-0.5 text-xs leading-none',
    icon: 'h-3.5 w-3.5',
    pts: 'text-[10px] tracking-[0.08em]',
    value: 'text-xs',
  },
};

const inverseShell =
  'border-white/35 bg-white/15 text-white shadow-none dark:border-white/25 dark:bg-white/10';

const inverseIcon = 'text-amber-200';

export interface PointBadgeProps {
  value: number;
  status?: PointBadgeStatus;
  size?: 'sm' | 'md';
  /** Prefix value with "+" (e.g. kanban, habit quick-log). */
  showPlus?: boolean;
  /** Light badge on saturated buttons (e.g. habit quick-log). */
  tone?: 'default' | 'inverse';
  className?: string;
}

/** Wallet reward points — distinct from story-point estimates and notification counts. */
export function PointBadge({
  value,
  status = 'available',
  size = 'sm',
  showPlus = false,
  tone = 'default',
  className = '',
}: PointBadgeProps) {
  if (!Number.isFinite(value) || value <= 0) return null;

  const sizes = sizeClasses[size];
  const displayValue = showPlus ? `+${value}` : String(value);
  const isInverse = tone === 'inverse';

  return (
    <span
      role="status"
      aria-label={pointBadgeAriaLabel(value, status)}
      title={pointBadgeAriaLabel(value, status)}
      className={cn(
        'inline-flex max-w-full shrink-0 items-center rounded-md border font-semibold tabular-nums shadow-sm',
        isInverse ? inverseShell : statusShell[status],
        sizes.shell,
        className
      )}
    >
      <Coins
        className={cn('shrink-0', sizes.icon, isInverse ? inverseIcon : statusIcon[status])}
        aria-hidden
      />
      <span className={cn('font-bold', sizes.value)}>{displayValue}</span>
      <span className={cn('font-semibold uppercase opacity-80', sizes.pts)}>PTS</span>
    </span>
  );
}
