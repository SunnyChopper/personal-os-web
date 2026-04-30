import { useMemo } from 'react';
import type { MetricLog } from '@/types/growth-system';
import { generateHeatmapData } from '@/utils/metric-analytics';

interface MetricHeatmapPreviewProps {
  logs: MetricLog[];
  months?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function MetricHeatmapPreview({
  logs,
  months = 6,
  size = 'sm',
  className = '',
}: MetricHeatmapPreviewProps) {
  const heatmapData = useMemo(() => generateHeatmapData(logs, months), [logs, months]);

  if (heatmapData.length === 0) {
    return (
      <div
        className={`flex items-center justify-center text-gray-400 dark:text-gray-600 text-xs ${className}`}
      >
        No data
      </div>
    );
  }

  const cellSize = size === 'sm' ? 8 : 10;

  // Group by weeks
  const weeks: Array<Array<(typeof heatmapData)[0] | null>> = [];

  if (heatmapData.length > 0) {
    const firstDate = new Date(heatmapData[0].date);
    const firstDayOfWeek = firstDate.getDay();

    let currentWeek: Array<(typeof heatmapData)[0] | null> = [];

    // Fill in empty days at start of first week
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }

    heatmapData.forEach((day, index) => {
      const date = new Date(day.date);
      const dayOfWeek = date.getDay();

      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      currentWeek.push(day);

      if (index === heatmapData.length - 1) {
        while (currentWeek.length < 7) {
          currentWeek.push(null);
        }
        weeks.push(currentWeek);
      }
    });
  }

  const getIntensityColor = (intensity: number, hasLog: boolean) => {
    if (!hasLog) return 'bg-gray-100 dark:bg-gray-800';
    if (intensity === 0) return 'bg-gray-200 dark:bg-gray-700';
    if (intensity === 1) return 'bg-blue-200 dark:bg-blue-900';
    if (intensity === 2) return 'bg-blue-400 dark:bg-blue-700';
    if (intensity === 3) return 'bg-blue-500 dark:bg-blue-600';
    return 'bg-blue-600 dark:bg-blue-500';
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = today.toISOString().split('T')[0];

  return (
    <div className={`flex items-start gap-1 ${className}`}>
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="flex flex-col gap-1">
          {week.map((day, dayIndex) => {
            if (!day) {
              return (
                <div
                  key={dayIndex}
                  style={{ width: cellSize, height: cellSize }}
                  className="bg-transparent"
                />
              );
            }

            const isToday = day.date === todayKey;
            const colorClass = getIntensityColor(day.intensity, day.hasLog);

            return (
              <div
                key={day.date}
                style={{ width: cellSize, height: cellSize }}
                className={`${colorClass} rounded-sm ${
                  isToday ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
                } transition-colors`}
                title={`${day.date}: ${day.value?.toFixed(1) || 'No log'}`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
