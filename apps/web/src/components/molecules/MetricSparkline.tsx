import { useMemo } from 'react';
import type { MetricLog } from '@/types/growth-system';
import { getTimeSeriesData } from '@/utils/metric-analytics';

interface MetricSparklineProps {
  logs: MetricLog[];
  days?: number;
  height?: number;
  width?: number;
  color?: string;
  showPoints?: boolean;
  className?: string;
}

export function MetricSparkline({
  logs,
  days = 30,
  height = 40,
  width = 120,
  color = 'blue',
  showPoints = false,
  className = '',
}: MetricSparklineProps) {
  const data = useMemo(() => getTimeSeriesData(logs, 'day', days), [logs, days]);

  if (data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center text-gray-400 dark:text-gray-600 ${className}`}
        style={{ width, height }}
      >
        <span className="text-xs">No data</span>
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map((point, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
    const normalizedValue = (point.value - minValue) / range;
    const y = padding + chartHeight - normalizedValue * chartHeight;
    return { x, y, value: point.value };
  });

  const pathData = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const colorClasses = {
    blue: 'stroke-blue-600 dark:stroke-blue-400',
    green: 'stroke-green-600 dark:stroke-green-400',
    orange: 'stroke-orange-600 dark:stroke-orange-400',
    red: 'stroke-red-600 dark:stroke-red-400',
    purple: 'stroke-purple-600 dark:stroke-purple-400',
  };

  const fillColorClasses = {
    blue: 'fill-blue-50 dark:fill-blue-900/20',
    green: 'fill-green-50 dark:fill-green-900/20',
    orange: 'fill-orange-50 dark:fill-orange-900/20',
    red: 'fill-red-50 dark:fill-red-900/20',
    purple: 'fill-purple-50 dark:fill-purple-900/20',
  };

  const areaPath = `${pathData} L ${points[points.length - 1].x} ${padding + chartHeight} L ${points[0].x} ${padding + chartHeight} Z`;

  return (
    <div className={className}>
      <svg width={width} height={height} className="overflow-visible">
        {/* Area fill */}
        <path d={areaPath} className={fillColorClasses[color as keyof typeof fillColorClasses]} />
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={colorClasses[color as keyof typeof colorClasses]}
        />
        {/* Points */}
        {showPoints &&
          points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="2"
              className={colorClasses[color as keyof typeof colorClasses]}
              fill="currentColor"
            />
          ))}
      </svg>
    </div>
  );
}
