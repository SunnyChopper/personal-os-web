import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import type { LogbookEntry } from '@/types/growth-system';
import Button from '@/components/atoms/Button';
import { parseDateInput } from '@/utils/date-formatters';

interface LogbookCalendarViewProps {
  entries: LogbookEntry[];
  onEntryClick: (entry: LogbookEntry) => void;
  onDateClick?: (date: Date) => void;
}

export function LogbookCalendarView({
  entries,
  onEntryClick,
  onDateClick,
}: LogbookCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { days, monthName, year } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // 0 = Sunday, 1 = Monday, etc.
    const startDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    // Previous month padding
    const paddingDays = Array.from({ length: startDayOfWeek }, (_, i) => {
      const date = new Date(year, month, -startDayOfWeek + i + 1);
      return { date, isCurrentMonth: false };
    });

    // Current month days
    const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, month, i + 1);
      return { date, isCurrentMonth: true };
    });

    // Next month padding to complete the grid (optional, but looks better)
    const totalDaysDisplayed = paddingDays.length + monthDays.length;
    const remainingCells = 42 - totalDaysDisplayed; // 6 rows * 7 cols = 42
    const nextMonthPadding = Array.from({ length: remainingCells }, (_, i) => {
      const date = new Date(year, month + 1, i + 1);
      return { date, isCurrentMonth: false };
    });

    return {
      days: [...paddingDays, ...monthDays, ...nextMonthPadding],
      monthName: firstDayOfMonth.toLocaleString('default', { month: 'long' }),
      year,
    };
  }, [currentDate]);

  const getEntriesForDate = (date: Date) => {
    return entries.filter((entry) => {
      // Use parseDateInput to avoid timezone issues when parsing YYYY-MM-DD strings
      // parseDateInput creates a Date object in local time, not UTC
      const entryDate = parseDateInput(entry.date);

      return (
        entryDate.getDate() === date.getDate() &&
        entryDate.getMonth() === date.getMonth() &&
        entryDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getMoodColor = (mood?: string) => {
    switch (mood) {
      case 'High':
        return 'bg-green-500';
      case 'Steady':
        return 'bg-yellow-500';
      case 'Low':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            {monthName} {year}
          </h2>
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={handleToday}>
          Today
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-fr bg-gray-200 dark:bg-gray-700 gap-px">
        {days.map(({ date, isCurrentMonth }, index) => {
          const dayEntries = getEntriesForDate(date);
          const isToday = new Date().toDateString() === date.toDateString();

          return (
            <div
              key={index}
              className={`min-h-[120px] bg-white dark:bg-gray-800 p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-750 ${
                !isCurrentMonth
                  ? 'bg-gray-50/50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-600'
                  : ''
              }`}
              onClick={() => onDateClick?.(date)}
            >
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                    isToday
                      ? 'bg-blue-600 text-white'
                      : isCurrentMonth
                        ? 'text-gray-700 dark:text-gray-200'
                        : 'text-gray-400 dark:text-gray-600'
                  }`}
                >
                  {date.getDate()}
                </span>
                {dayEntries.length > 0 && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {dayEntries.length} {dayEntries.length === 1 ? 'entry' : 'entries'}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {dayEntries.map((entry) => (
                  <motion.button
                    key={entry.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEntryClick(entry);
                    }}
                    className="w-full text-left px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group truncate border-l-2 border-transparent hover:border-blue-500"
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${getMoodColor(entry.mood ?? undefined)}`}
                      />
                      <span className="truncate">{entry.title || 'Untitled Entry'}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
