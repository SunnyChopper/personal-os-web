import { useMemo, useState } from 'react';
import type { Habit, HabitLog } from '@/types/growth-system';
import { generateHeatmapData } from '@/utils/habit-analytics';

interface HabitCalendarHeatmapProps {
  habit: Habit;
  logs: HabitLog[];
  months?: number;
  onDateClick?: (date: Date) => void;
}

export function HabitCalendarHeatmap({
  habit,
  logs,
  months = 6,
  onDateClick,
}: HabitCalendarHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  const heatmapData = useMemo(() => generateHeatmapData(logs, months), [logs, months]);

  const getIntensityColor = (intensity: number, habitType: string) => {
    if (intensity === 0) return 'bg-gray-100 dark:bg-gray-800';

    const colors = {
      Build: [
        'bg-green-200 dark:bg-green-900',
        'bg-green-400 dark:bg-green-700',
        'bg-green-500 dark:bg-green-600',
        'bg-green-600 dark:bg-green-500',
      ],
      Maintain: [
        'bg-blue-200 dark:bg-blue-900',
        'bg-blue-400 dark:bg-blue-700',
        'bg-blue-500 dark:bg-blue-600',
        'bg-blue-600 dark:bg-blue-500',
      ],
      Reduce: [
        'bg-yellow-200 dark:bg-yellow-900',
        'bg-yellow-400 dark:bg-yellow-700',
        'bg-yellow-500 dark:bg-yellow-600',
        'bg-yellow-600 dark:bg-yellow-500',
      ],
      Quit: [
        'bg-red-200 dark:bg-red-900',
        'bg-red-400 dark:bg-red-700',
        'bg-red-500 dark:bg-red-600',
        'bg-red-600 dark:bg-red-500',
      ],
    };

    const typeColors = colors[habitType as keyof typeof colors] || colors.Maintain;
    return typeColors[Math.min(intensity - 1, typeColors.length - 1)];
  };

  // Group by weeks (Sunday to Saturday)
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

      // If we hit Sunday and have a week in progress, start a new week
      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      currentWeek.push(day);

      // If this is the last day, finalize the week
      if (index === heatmapData.length - 1) {
        // Fill remaining days of week
        while (currentWeek.length < 7) {
          currentWeek.push(null);
        }
        weeks.push(currentWeek);
      }
    });
  }

  const handleDayHover = (day: (typeof heatmapData)[0], event: React.MouseEvent) => {
    setHoveredDay(day.date);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const handleDayLeave = () => {
    setHoveredDay(null);
    setTooltipPosition(null);
  };

  const hoveredDayData = hoveredDay ? heatmapData.find((d) => d.date === hoveredDay) : null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = today.toISOString().split('T')[0];

  if (heatmapData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Activity Heatmap
        </h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No activity data yet
        </div>
      </div>
    );
  }

  const weekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthLabels: string[] = [];
  const firstDate = new Date(heatmapData[0].date);
  const lastDate = new Date(heatmapData[heatmapData.length - 1].date);

  // Generate month labels
  const currentMonth = new Date(firstDate);
  while (currentMonth <= lastDate) {
    const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'short' });
    if (!monthLabels.includes(monthLabel)) {
      monthLabels.push(monthLabel);
    }
    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Heatmap</h3>
        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((intensity) => (
              <div
                key={intensity}
                className={`w-3 h-3 rounded ${getIntensityColor(intensity, habit.habitType)}`}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-2">
            {weekLabels.map((label, index) => (
              <div
                key={index}
                className="h-3 text-xs text-gray-500 dark:text-gray-400 text-right pr-2"
                style={{ lineHeight: '12px' }}
              >
                {index % 2 === 1 ? label : ''}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div className="flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => {
                  if (!day) {
                    return <div key={`${weekIndex}-${dayIndex}`} className="w-3 h-3" />;
                  }

                  const dayDate = new Date(day.date);
                  dayDate.setHours(0, 0, 0, 0);
                  const dayKey = dayDate.toISOString().split('T')[0];
                  const isToday = dayKey === todayKey;

                  return (
                    <div
                      key={day.date}
                      className={`w-3 h-3 rounded-sm cursor-pointer transition-all ${getIntensityColor(
                        day.intensity,
                        habit.habitType
                      )} ${hoveredDay === day.date ? 'ring-2 ring-blue-500 dark:ring-blue-400 scale-110' : ''} ${
                        isToday ? 'ring-1 ring-blue-600 dark:ring-blue-400' : ''
                      }`}
                      onMouseEnter={(e) => handleDayHover(day, e)}
                      onMouseLeave={handleDayLeave}
                      onClick={() => onDateClick && onDateClick(new Date(day.date))}
                      title={`${new Date(day.date).toLocaleDateString()}: ${day.count} completion${day.count !== 1 ? 's' : ''}${isToday ? ' (Today)' : ''}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Month labels */}
        <div className="flex gap-1 mt-2 ml-8">
          {monthLabels.map((month) => (
            <div
              key={month}
              className="text-xs text-gray-500 dark:text-gray-400"
              style={{ width: `${(weeks.length / monthLabels.length) * 12}px` }}
            >
              {month}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDayData && tooltipPosition && (
        <div
          className="fixed z-50 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none transition-opacity"
          style={{
            left: `${Math.min(tooltipPosition.x + 10, window.innerWidth - 200)}px`,
            top: `${Math.max(10, tooltipPosition.y - 50)}px`,
          }}
        >
          <div className="font-semibold">
            {new Date(hoveredDayData.date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
          <div className="text-gray-300">
            {hoveredDayData.count} completion{hoveredDayData.count !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}
