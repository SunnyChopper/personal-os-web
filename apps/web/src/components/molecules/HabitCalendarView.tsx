import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { Habit, HabitLog } from '@/types/growth-system';
import { generateCalendarDays } from '@/utils/habit-analytics';
import { getHabitTypeColors } from '@/utils/habit-colors';

interface HabitCalendarViewProps {
  habit: Habit;
  logs: HabitLog[];
  onDateClick?: (date: Date, dayLogs: HabitLog[]) => void;
  onQuickLog?: (date: Date) => void;
}

export function HabitCalendarView({
  habit,
  logs,
  onDateClick,
  onQuickLog,
}: HabitCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const today = new Date();

  const calendarDays = generateCalendarDays(year, month, logs);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const colors = getHabitTypeColors(habit.habitType);

  // Get current week start (Monday)
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  // Get current week end (Sunday)
  const currentWeekEnd = new Date(monday);
  currentWeekEnd.setDate(monday.getDate() + 6);
  currentWeekEnd.setHours(23, 59, 59, 999);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{monthName}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 py-2"
          >
            {day}
          </div>
        ))}

        {calendarDays.map((calendarDay, index) => {
          const hasCompletions = calendarDay.completionCount > 0;
          const isToday = calendarDay.isToday;
          const dayDate = new Date(calendarDay.date);
          dayDate.setHours(0, 0, 0, 0);
          const isCurrentWeek =
            dayDate >= monday && dayDate <= currentWeekEnd && calendarDay.isCurrentMonth;

          return (
            <div
              key={index}
              className={`aspect-square border-2 rounded-lg p-2 transition-all cursor-pointer group ${
                isToday
                  ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-md ring-2 ring-blue-200 dark:ring-blue-800'
                  : hasCompletions
                    ? `${colors.border} bg-white dark:bg-gray-800 hover:shadow-md hover:scale-105`
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50'
              } ${!calendarDay.isCurrentMonth ? 'opacity-40' : ''} ${
                isCurrentWeek && !isToday ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
              }`}
              onClick={() => onDateClick?.(calendarDay.date, calendarDay.logs)}
            >
              <div className="flex flex-col h-full">
                <div
                  className={`text-sm font-semibold mb-1 ${
                    isToday
                      ? 'text-blue-600 dark:text-blue-400'
                      : calendarDay.isCurrentMonth
                        ? 'text-gray-700 dark:text-gray-300'
                        : 'text-gray-400 dark:text-gray-600'
                  }`}
                >
                  {calendarDay.day}
                </div>

                {hasCompletions && (
                  <div className="flex-1 flex items-center justify-center">
                    <div
                      className={`w-full h-full rounded ${colors.progressFill} flex items-center justify-center text-white text-xs font-bold`}
                      style={{
                        minHeight: '20px',
                        opacity: Math.min(1, 0.5 + calendarDay.completionCount * 0.1),
                      }}
                    >
                      {calendarDay.completionCount > 1 && calendarDay.completionCount}
                    </div>
                  </div>
                )}

                {isToday && !hasCompletions && onQuickLog && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickLog(calendarDay.date);
                    }}
                    className="mt-1 p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                    title="Log Completion"
                    aria-label="Log completion for today"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {logs.length === 0 && (
        <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400 mt-4">
          No completions recorded
        </div>
      )}
    </div>
  );
}
