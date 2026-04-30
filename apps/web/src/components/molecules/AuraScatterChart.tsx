import { useMemo, useState } from 'react';
import type { AuraPoint, AuraXMetric } from '@/types/fitness';
import { cn } from '@/lib/utils';

const X_LABELS: Record<AuraXMetric, string> = {
  sleepHours: 'Sleep (hours)',
  sleepQuality: 'Sleep quality (1–10)',
  energyLevel: 'Energy (1–10)',
  recoveryScore: 'Recovery score',
};

interface AuraScatterChartProps {
  points: AuraPoint[];
  xMetric: AuraXMetric;
  className?: string;
}

export function AuraScatterChart({ points, xMetric, className }: AuraScatterChartProps) {
  const [hover, setHover] = useState<number | null>(null);

  const plot = useMemo(() => {
    const valid = points.filter(
      (p) =>
        typeof p.xValue === 'number' &&
        !Number.isNaN(p.xValue) &&
        typeof p.yStoryPoints === 'number'
    );
    if (valid.length === 0) {
      return { valid: [] as AuraPoint[], minX: 0, maxX: 1, minY: 0, maxY: 1 };
    }
    const xs = valid.map((p) => p.xValue);
    const ys = valid.map((p) => p.yStoryPoints);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const padX = maxX === minX ? 1 : (maxX - minX) * 0.08;
    const padY = maxY === minY ? 1 : (maxY - minY) * 0.12;
    return {
      valid,
      minX: minX - padX,
      maxX: maxX + padX,
      minY: Math.max(0, minY - padY),
      maxY: maxY + padY,
    };
  }, [points]);

  const w = 420;
  const h = 260;
  const padL = 44;
  const padR = 16;
  const padT = 16;
  const padB = 40;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const xScale = (x: number) =>
    padL + ((x - plot.minX) / (plot.maxX - plot.minX || 1)) * innerW;
  const yScale = (y: number) =>
    padT + innerH - ((y - plot.minY) / (plot.maxY - plot.minY || 1)) * innerH;

  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-900/50',
        className
      )}
    >
      <svg
        width="100%"
        viewBox={`0 0 ${w} ${h}`}
        className="max-w-full"
        role="img"
        aria-label="Aura scatter: recovery metric vs story points"
      >
        <text x={padL} y={14} className="fill-gray-600 text-[11px] dark:fill-gray-400">
          Story points (day)
        </text>
        <text
          x={w / 2}
          y={h - 8}
          textAnchor="middle"
          className="fill-gray-600 text-[11px] dark:fill-gray-400"
        >
          {X_LABELS[xMetric]}
        </text>
        <line
          x1={padL}
          y1={padT + innerH}
          x2={padL + innerW}
          y2={padT + innerH}
          className="stroke-gray-300 dark:stroke-gray-600"
          strokeWidth={1}
        />
        <line
          x1={padL}
          y1={padT}
          x2={padL}
          y2={padT + innerH}
          className="stroke-gray-300 dark:stroke-gray-600"
          strokeWidth={1}
        />
        {plot.valid.map((p, i) => {
          const cx = xScale(p.xValue);
          const cy = yScale(p.yStoryPoints);
          const active = hover === i;
          return (
            <g key={`${p.date}-${i}`}>
              <circle
                cx={cx}
                cy={cy}
                r={active ? 9 : 6}
                className={cn(
                  'cursor-pointer transition-all',
                  active
                    ? 'fill-cyan-500 stroke-cyan-200'
                    : 'fill-blue-500/80 stroke-blue-900/20 dark:stroke-white/20'
                )}
                strokeWidth={1}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
              {active && (
                <text
                  x={cx + 12}
                  y={cy - 8}
                  className="fill-gray-800 text-[10px] dark:fill-gray-100"
                >
                  {p.date} · {p.yStoryPoints} pts
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
