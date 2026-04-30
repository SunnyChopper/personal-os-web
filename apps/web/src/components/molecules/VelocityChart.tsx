import { useMemo, useState } from 'react';
import type { WeeklyReviewVelocityWeek } from '@/types/growth-system';
import { cn } from '@/lib/utils';

function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

interface VelocityChartProps {
  /** Newest week first (index 0 = current). */
  weeks: WeeklyReviewVelocityWeek[];
  /** Highlight label for the latest week column. */
  currentWeekStart: string;
  className?: string;
}

export function VelocityChart({ weeks, currentWeekStart, className }: VelocityChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const ordered = useMemo(() => [...weeks].reverse(), [weeks]);

  /** Average of completed weeks in this window (excludes index 0); matches backend dashboard. */
  const completedWeeksAvg = useMemo(() => {
    if (weeks.length <= 1) return null;
    return mean(weeks.slice(1).map((w) => w.storyPointsCompleted));
  }, [weeks]);

  /** Rolling average of the up-to-four most recent weeks, including the current week. */
  const rollingFourAvg = useMemo(() => {
    const slice = weeks.slice(0, Math.min(4, weeks.length));
    return mean(slice.map((w) => w.storyPointsCompleted));
  }, [weeks]);

  const maxY = useMemo(() => {
    const vals = ordered.map((w) => w.storyPointsCompleted);
    const candidates = [...vals, rollingFourAvg, completedWeeksAvg ?? 0];
    const m = Math.max(...candidates, 1);
    return m * 1.15;
  }, [ordered, rollingFourAvg, completedWeeksAvg]);

  const w = 320;
  const h = 140;
  const pad = 28;
  const n = Math.max(ordered.length, 1);
  const slotW = (w - pad * 2) / n;
  const barW = slotW - 4;
  const plotH = h - pad * 2;

  const yAt = (value: number) => h - pad - (value / maxY) * plotH;

  const currentBarIndex = ordered.length - 1;
  const xSplit = ordered.length > 0 ? pad + currentBarIndex * slotW + 2 : pad;

  const averagesDiffer =
    completedWeeksAvg !== null && Math.abs(completedWeeksAvg - rollingFourAvg) > 0.05;

  const ariaAverages =
    completedWeeksAvg !== null
      ? `Completed-weeks average ${completedWeeksAvg.toFixed(1)} points; rolling four-week average including current week ${rollingFourAvg.toFixed(1)} points.`
      : `Rolling average ${rollingFourAvg.toFixed(1)} points.`;

  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-gray-100 p-4 dark:border-gray-600 dark:bg-gray-900/60',
        className
      )}
    >
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Story point velocity
        </h3>
        <div className="flex flex-col items-start gap-0.5 text-xs text-gray-600 dark:text-gray-400 sm:items-end">
          {completedWeeksAvg !== null && averagesDiffer && (
            <span>
              Completed weeks avg:{' '}
              <span className="font-mono text-gray-800 dark:text-gray-200">
                {completedWeeksAvg.toFixed(1)}
              </span>{' '}
              pts <span className="text-gray-500 dark:text-gray-500">(solid)</span>
            </span>
          )}
          {completedWeeksAvg !== null && !averagesDiffer && (
            <span>
              Avg (completed weeks & rolling 4 wk):{' '}
              <span className="font-mono text-cyan-600 dark:text-cyan-400">
                {rollingFourAvg.toFixed(1)}
              </span>{' '}
              pts
            </span>
          )}
          {(completedWeeksAvg === null || averagesDiffer) && (
            <span>
              Rolling 4 wk (incl. this week):{' '}
              <span className="font-mono text-cyan-600 dark:text-cyan-400">
                {rollingFourAvg.toFixed(1)}
              </span>{' '}
              pts{' '}
              {averagesDiffer && (
                <span className="text-gray-500 dark:text-gray-500">(dashed segment)</span>
              )}
            </span>
          )}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="mx-auto w-full max-w-md"
        role="img"
        aria-label={`Weekly story point velocity. ${ariaAverages}`}
      >
        {ordered.length > 0 && averagesDiffer && completedWeeksAvg !== null && (
          <>
            <line
              x1={pad}
              y1={yAt(completedWeeksAvg)}
              x2={xSplit}
              y2={yAt(completedWeeksAvg)}
              stroke="rgb(34 211 238)"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity={0.95}
            />
            <line
              x1={xSplit}
              y1={yAt(rollingFourAvg)}
              x2={w - pad}
              y2={yAt(rollingFourAvg)}
              stroke="rgb(34 211 238)"
              strokeWidth="1.5"
              strokeDasharray="6 4"
              strokeLinecap="round"
              opacity={0.9}
            />
          </>
        )}
        {ordered.length > 0 && !averagesDiffer && (
          <line
            x1={pad}
            y1={yAt(rollingFourAvg)}
            x2={w - pad}
            y2={yAt(rollingFourAvg)}
            stroke="rgb(34 211 238)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={completedWeeksAvg === null ? '6 4' : undefined}
            opacity={0.9}
          />
        )}
        {ordered.map((week, i) => {
          const x = pad + i * slotW + 2;
          const bhRaw = (week.storyPointsCompleted / maxY) * plotH;
          const barDisplayH = Math.max(bhRaw, 2);
          const isCurrent = week.weekStart === currentWeekStart;
          const hovered = hoveredIndex === i;
          const barTop = h - pad - barDisplayH;
          const pts = week.storyPointsCompleted;
          const labelY = Math.max(pad + 10, barTop - 5);

          return (
            <g key={week.weekStart}>
              <title>{`${pts} story points · week of ${week.weekStart}`}</title>
              <rect
                x={x}
                y={barTop}
                width={barW}
                height={barDisplayH}
                rx={3}
                fill={isCurrent ? 'rgb(59 130 246)' : 'rgb(51 65 85)'}
                opacity={hovered ? 1 : isCurrent ? 1 : 0.85}
                className="transition-opacity duration-150"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'default' }}
              />
              <text
                x={x + barW / 2}
                y={labelY}
                textAnchor="middle"
                fontSize={10}
                fontWeight={600}
                className="fill-gray-900 dark:fill-gray-100"
                style={{ pointerEvents: 'none' }}
              >
                {pts}
              </text>
              <text
                x={x + barW / 2}
                y={h - 6}
                textAnchor="middle"
                className="fill-gray-500 dark:fill-gray-400"
                fontSize={9}
                style={{ pointerEvents: 'none' }}
              >
                {week.weekStart.slice(5)}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-center text-xs text-gray-600 dark:text-gray-400">
        Bars = completed story points (values on bars). Solid line = average of completed weeks in
        view; dashed = rolling 4-week average including this week. Hover a bar for details.
      </p>
    </div>
  );
}
