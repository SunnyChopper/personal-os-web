import { Zap } from 'lucide-react';
import type { HabitVelocityCorrelation } from '@/types/growth-system';
import { cn } from '@/lib/utils';

interface HabitVelocityInsightCalloutProps {
  correlations: HabitVelocityCorrelation[] | undefined;
  className?: string;
}

function formatPct(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function formatStoryPoints(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function CorrelationLine({
  row,
  variant,
}: {
  row: HabitVelocityCorrelation;
  variant: 'primary' | 'secondary';
}) {
  const threshold = row.consistencyThresholdPct;
  const uplift = formatPct(row.upliftPct);
  const high = formatStoryPoints(row.highBucketAvgStoryPoints);
  const low = formatStoryPoints(row.lowBucketAvgStoryPoints);

  return (
    <p
      className={cn(
        variant === 'primary' ? 'font-medium' : 'text-amber-900/90 dark:text-amber-100/90'
      )}
    >
      {variant === 'primary' ? (
        <>
          <span className="font-semibold">Kinetic Momentum:</span> Weeks with ≥{threshold}%{' '}
          <span className="font-semibold">{row.habitName}</span> consistency average{' '}
          <span className="font-semibold text-amber-800 dark:text-amber-200">+{uplift}%</span> story
          points ({high} vs {low}). Based on the last {row.trailingWeeks} weeks.
        </>
      ) : (
        <>
          Also: <span className="font-semibold">{row.habitName}</span> (+{uplift}% at ≥{threshold}%
          consistency).
        </>
      )}
    </p>
  );
}

export function HabitVelocityInsightCallout({
  correlations,
  className,
}: HabitVelocityInsightCalloutProps) {
  const rows = correlations?.filter(Boolean) ?? [];
  if (rows.length === 0) {
    return null;
  }

  const [primary, ...rest] = rows;

  return (
    <div
      className={cn(
        'mt-3 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2.5 text-sm text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-100',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex gap-2">
        <Zap className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        <div className="min-w-0 space-y-1.5">
          <CorrelationLine row={primary} variant="primary" />
          {rest.map((row) => (
            <CorrelationLine key={row.habitId} row={row} variant="secondary" />
          ))}
        </div>
      </div>
    </div>
  );
}
