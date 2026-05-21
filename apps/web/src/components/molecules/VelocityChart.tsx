import { useMemo, useState } from 'react';
import type { WeeklyReviewVelocityWeek } from '@/types/growth-system';
import { computeRollingAverages } from '@/utils/velocity-chart-math';
import { cn } from '@/lib/utils';

interface VelocityChartProps {
  /** Newest week first (index 0 = current). */
  weeks: WeeklyReviewVelocityWeek[];
  /** Highlight label for the latest week column. */
  currentWeekStart: string;
  /** Server-computed rolling means (oldest→newest). Preferred over client fallback. */
  rollingAverages?: number[];
  rollingWindow?: number;
  className?: string;
}

export function VelocityChart({
  weeks,
  currentWeekStart,
  rollingAverages,
  rollingWindow = 4,
  className,
}: VelocityChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const ordered = useMemo(() => [...weeks].reverse(), [weeks]);

  const rollingSeries = useMemo(() => {
    if (rollingAverages && rollingAverages.length === ordered.length) {
      return rollingAverages;
    }
    const points = ordered.map((w) => w.storyPointsCompleted);
    return computeRollingAverages(points, rollingWindow);
  }, [ordered, rollingAverages, rollingWindow]);

  const maxY = useMemo(() => {
    const vals = ordered.map((w) => w.storyPointsCompleted);
    const candidates = [...vals, ...rollingSeries];
    const m = Math.max(...candidates, 1);
    return m * 1.15;
  }, [ordered, rollingSeries]);

  const w = 320;
  const h = 140;
  const pad = 28;
  const n = Math.max(ordered.length, 1);
  const slotW = (w - pad * 2) / n;
  const barW = slotW - 4;
  const plotH = h - pad * 2;

  const yAt = (value: number) => h - pad - (value / maxY) * plotH;
  const xCenter = (i: number) => pad + i * slotW + 2 + barW / 2;

  const polylinePoints = useMemo(() => {
    if (ordered.length === 0) return '';
    return rollingSeries.map((avg, i) => `${xCenter(i)},${yAt(avg)}`).join(' ');
  }, [ordered.length, rollingSeries, maxY]);

  const latestRolling = rollingSeries.length > 0 ? rollingSeries[rollingSeries.length - 1] : 0;

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
          <span>
            Rolling {rollingWindow}-week avg:{' '}
            <span className="font-mono text-cyan-600 dark:text-cyan-400">
              {latestRolling.toFixed(1)}
            </span>{' '}
            pts
          </span>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="mx-auto w-full max-w-md"
        role="img"
        aria-label={`Weekly story point velocity. Rolling ${rollingWindow}-week average ${latestRolling.toFixed(1)} points.`}
      >
        {ordered.length > 1 && polylinePoints && (
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="rgb(34 211 238)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.95}
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
          const rollingAtBar = rollingSeries[i] ?? 0;

          return (
            <g key={week.weekStart}>
              <title>{`${pts} story points · rolling avg ${rollingAtBar.toFixed(1)} · week of ${week.weekStart}`}</title>
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
        Bars = completed story points. Cyan line = {rollingWindow}-week rolling average (sloped per
        week). Hover a bar for details.
      </p>
    </div>
  );
}
