import { useMemo, useState } from 'react';
import type { Habit, HabitLog } from '@/types/growth-system';
import { generateHeatmapData } from '@/utils/habit-analytics';
import { habitConfiguredOffDates } from '@/utils/habit-off-days';

interface HabitCalendarHeatmapProps {
  habit: Habit;
  logs: HabitLog[];
  months?: number;
  onDateClick?: (date: Date) => void;
}

const CELL_PX = 12;
const CELL_GAP_PX = 4;

export function HabitCalendarHeatmap({
  habit,
  logs,
  months = 6,
  onDateClick,
}: HabitCalendarHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  const heatmapData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setMonth(start.getMonth() - months);
    const offDayDates = habitConfiguredOffDates(habit, start, today);
    return generateHeatmapData(logs, months, offDayDates);
  }, [habit, logs, months]);

  const getIntensityColor = (intensity: number, habitType: string, isOffDay?: boolean) => {
    if (isOffDay) {
      return 'bg-slate-200 dark:bg-slate-700/80 ring-1 ring-inset ring-slate-300/60 dark:ring-slate-500/50';
    }
    if (intensity === 0) {
      return 'bg-gray-200 dark:bg-gray-600/70 ring-1 ring-inset ring-gray-300/80 dark:ring-gray-500/60';
    }

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

  const { weeks, monthLabelPositions } = useMemo(() => {
    const weekRows: Array<Array<(typeof heatmapData)[0] | null>> = [];
    const monthPositions: Array<{ label: string; weekIndex: number }> = [];
    const seenMonths = new Set<string>();

    if (heatmapData.length === 0) {
      return { weeks: weekRows, monthLabelPositions: monthPositions };
    }

    const firstDate = new Date(heatmapData[0].date);
    const firstDayOfWeek = firstDate.getDay();
    let currentWeek: Array<(typeof heatmapData)[0] | null> = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }

    heatmapData.forEach((day, index) => {
      const date = new Date(day.date);
      const dayOfWeek = date.getDay();
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weekRows.push(currentWeek);
        currentWeek = [];
      }

      if (!seenMonths.has(monthKey)) {
        seenMonths.add(monthKey);
        monthPositions.push({
          label: date.toLocaleDateString('en-US', { month: 'short' }),
          weekIndex: weekRows.length,
        });
      }

      currentWeek.push(day);

      if (index === heatmapData.length - 1) {
        while (currentWeek.length < 7) {
          currentWeek.push(null);
        }
        weekRows.push(currentWeek);
      }
    });

    return { weeks: weekRows, monthLabelPositions: monthPositions };
  }, [heatmapData]);

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
  const weekColumnWidth = CELL_PX + CELL_GAP_PX;

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

          <div className="flex flex-col">
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
                          habit.habitType,
                          day.isOffDay
                        )} ${hoveredDay === day.date ? 'ring-2 ring-blue-500 dark:ring-blue-400 scale-110' : ''} ${
                          isToday ? 'ring-1 ring-blue-600 dark:ring-blue-400' : ''
                        }`}
                        onMouseEnter={(e) => handleDayHover(day, e)}
                        onMouseLeave={handleDayLeave}
                        onClick={() => onDateClick && onDateClick(new Date(day.date))}
                        title={`${new Date(day.date).toLocaleDateString()}: ${
                          day.isOffDay
                            ? 'Off day'
                            : `${day.count} completion${day.count !== 1 ? 's' : ''}${isToday ? ' (Today)' : day.count === 0 ? ' (miss)' : ''}`
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="relative mt-2 h-4" style={{ width: weeks.length * weekColumnWidth }}>
              {monthLabelPositions.map(({ label, weekIndex }) => (
                <div
                  key={`${label}-${weekIndex}`}
                  className="absolute text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap"
                  style={{ left: weekIndex * weekColumnWidth }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

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
            {hoveredDayData.isOffDay
              ? 'Off day (not counted against streak)'
              : hoveredDayData.count === 0
                ? 'No completion (miss)'
                : `${hoveredDayData.count} completion${hoveredDayData.count !== 1 ? 's' : ''}`}
          </div>
        </div>
      )}
    </div>
  );
}
