import { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Frown,
  Meh,
  Plus,
  Smile,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { LogbookEntry, LogbookMood } from '@/types/growth-system';
import Button from '@/components/atoms/Button';
import { parseDateInput } from '@/utils/date-formatters';

type CalendarGranularity = 'week' | 'month';

interface LogbookCalendarViewProps {
  entries: LogbookEntry[];
  onEntryClick: (entry: LogbookEntry) => void;
  onDateClick?: (date: Date) => void;
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getSundayWeekStart(containing: Date): Date {
  const d = new Date(containing.getFullYear(), containing.getMonth(), containing.getDate());
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekRangeLabel(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);

  const sameMonth =
    weekStart.getMonth() === end.getMonth() && weekStart.getFullYear() === end.getFullYear();

  if (sameMonth) {
    const monthLong = weekStart.toLocaleDateString('en-US', { month: 'long' });
    return `${monthLong} ${weekStart.getDate()} – ${end.getDate()}, ${weekStart.getFullYear()}`;
  }

  const startStr = weekStart.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const endStr = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${startStr} – ${endStr}`;
}

function getCellMoodSurface(mood: LogbookMood | null | undefined): string {
  switch (mood) {
    case 'High':
      return 'bg-green-100 dark:bg-green-900/30 border-green-500';
    case 'Steady':
      return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500';
    case 'Low':
      return 'bg-red-100 dark:bg-red-900/30 border-red-500';
    default:
      return 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600';
  }
}

function MoodGlyph({ mood }: { mood: LogbookMood | null | undefined }) {
  switch (mood) {
    case 'High':
      return <Smile className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />;
    case 'Steady':
      return <Meh className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />;
    case 'Low':
      return <Frown className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />;
    default:
      return null;
  }
}

export function LogbookCalendarView({
  entries,
  onEntryClick,
  onDateClick,
}: LogbookCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [granularity, setGranularity] = useState<CalendarGranularity>('week');

  const monthGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const paddingDays = Array.from({ length: startDayOfWeek }, (_, i) => {
      const date = new Date(year, month, -startDayOfWeek + i + 1);
      return { date, isCurrentMonth: false };
    });

    const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, month, i + 1);
      return { date, isCurrentMonth: true };
    });

    const totalDaysDisplayed = paddingDays.length + monthDays.length;
    const remainingCells = 42 - totalDaysDisplayed;
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

  const weekGrid = useMemo(() => {
    const weekStart = getSundayWeekStart(currentDate);
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      return { date, isCurrentMonth: true as const };
    });
    return { days, label: formatWeekRangeLabel(weekStart) };
  }, [currentDate]);

  const headerTitle =
    granularity === 'week'
      ? weekGrid.label
      : `${monthGrid.monthName} ${monthGrid.year}`;

  const gridDays = granularity === 'week' ? weekGrid.days : monthGrid.days;

  const getEntriesForDate = (date: Date) => {
    return entries.filter((entry) => {
      const entryDate = parseDateInput(entry.date);
      return isSameCalendarDay(entryDate, date);
    });
  };

  const handlePrev = () => {
    if (granularity === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
      return;
    }
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNext = () => {
    if (granularity === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
      return;
    }
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleGranularityChange = (next: CalendarGranularity) => {
    setGranularity(next);
    if (next === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
    }
  };

  const cellMinHeight =
    granularity === 'week' ? 'min-h-[150px] sm:min-h-[160px]' : 'min-h-[100px] sm:min-h-[120px]';

  const todayStart = startOfLocalDay(new Date());

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-3 sm:p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 min-w-0">
            <CalendarIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <span className="truncate">{headerTitle}</span>
          </h2>
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors"
              aria-label={granularity === 'week' ? 'Previous week' : 'Previous month'}
            >
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors"
              aria-label={granularity === 'week' ? 'Next week' : 'Next month'}
            >
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-1">
            <button
              type="button"
              onClick={() => handleGranularityChange('week')}
              className={`px-3 py-1.5 min-h-[40px] rounded-md text-sm transition-colors ${
                granularity === 'week'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              aria-pressed={granularity === 'week'}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => handleGranularityChange('month')}
              className={`px-3 py-1.5 min-h-[40px] rounded-md text-sm transition-colors ${
                granularity === 'month'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              aria-pressed={granularity === 'month'}
            >
              Month
            </button>
          </div>
          <Button variant="secondary" size="sm" onClick={handleToday}>
            Today
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="py-2 text-center text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Horizontal scroll on narrow screens so week stays readable */}
      <div className="overflow-x-auto md:overflow-visible -mx-px">
        <div
          className={`grid grid-cols-7 bg-gray-200 dark:bg-gray-700 gap-px min-w-[640px] md:min-w-0 ${granularity === 'week' ? 'auto-rows-fr' : 'auto-rows-fr'}`}
        >
          {gridDays.map(({ date, isCurrentMonth }, index) => {
            const dayEntries = getEntriesForDate(date);
            const primary = dayEntries[0];
            const extraCount = dayEntries.length > 1 ? dayEntries.length - 1 : 0;
            const isToday = isSameCalendarDay(date, todayStart);

            const cellDayStart = startOfLocalDay(date);
            const isPast = cellDayStart.getTime() < todayStart.getTime() && !isToday;
            const isFuture = cellDayStart.getTime() > todayStart.getTime();

            const basePadding = 'p-2 text-left transition-colors flex flex-col';

            if (primary) {
              return (
                <motion.button
                  key={`${granularity}-${index}-${date.toISOString()}`}
                  type="button"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => onEntryClick(primary)}
                  className={`${basePadding} ${cellMinHeight} rounded-none border-2 cursor-pointer hover:shadow-md hover:brightness-[1.02] dark:hover:brightness-110 ${getCellMoodSurface(primary.mood)} ${
                    !isCurrentMonth ? 'opacity-80' : ''
                  }`}
                >
                  <div className="flex justify-between items-start gap-1 mb-2">
                    <span
                      className={`text-xs font-semibold w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0 ${
                        isToday
                          ? 'bg-blue-600 text-white'
                          : isCurrentMonth
                            ? 'text-gray-800 dark:text-gray-100'
                            : 'text-gray-500 dark:text-gray-500'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {primary.mood ? <MoodGlyph mood={primary.mood} /> : null}
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white line-clamp-3 leading-snug mb-1">
                    {primary.title || 'Untitled Entry'}
                  </p>
                  {extraCount > 0 ? (
                    <span className="text-[10px] text-gray-600 dark:text-gray-400 mb-1">
                      +{extraCount} more
                    </span>
                  ) : null}
                  {primary.energy !== null && (
                    <div className="mt-auto pt-2 flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] text-gray-600 dark:text-gray-400 hidden sm:inline">
                        Energy
                      </span>
                      <div className="flex gap-px">
                        {Array.from({ length: 10 }, (_, i) => (
                          <div
                            key={i}
                            className={`w-1 h-2 sm:w-1.5 sm:h-3 rounded-[1px] ${
                              i < (primary.energy || 0)
                                ? 'bg-blue-500'
                                : 'bg-gray-300/80 dark:bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-semibold text-gray-900 dark:text-white tabular-nums">
                        {primary.energy}/10
                      </span>
                    </div>
                  )}
                </motion.button>
              );
            }

            if (isToday) {
              return (
                <button
                  key={`${granularity}-${index}-${date.toISOString()}`}
                  type="button"
                  onClick={() => onDateClick?.(date)}
                  className={`${basePadding} ${cellMinHeight} bg-white dark:bg-gray-800 border-2 border-dashed border-blue-400 dark:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 justify-between gap-2`}
                >
                  <span className="text-xs font-semibold w-7 h-7 flex items-center justify-center rounded-full bg-blue-600 text-white">
                    {date.getDate()}
                  </span>
                  <div className="flex flex-col items-center justify-center gap-1 flex-1 text-blue-700 dark:text-blue-300">
                    <Plus className="w-5 h-5" aria-hidden />
                    <span className="text-[11px] sm:text-xs font-medium text-center leading-tight">
                      Add today&apos;s entry
                    </span>
                  </div>
                </button>
              );
            }

            if (isPast) {
              return (
                <button
                  key={`${granularity}-${index}-${date.toISOString()}`}
                  type="button"
                  onClick={() => onDateClick?.(date)}
                  className={`${basePadding} ${cellMinHeight} bg-gray-50/80 dark:bg-gray-900/40 ${
                    !isCurrentMonth
                      ? 'text-gray-400 dark:text-gray-600'
                      : 'text-gray-500 dark:text-gray-500'
                  } hover:bg-gray-100/90 dark:hover:bg-gray-800/80`}
                >
                  <span
                    className={`text-xs font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1 ${
                      !isCurrentMonth
                        ? 'text-gray-400 dark:text-gray-600'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-gray-400/70 dark:text-gray-600/70 italic mt-auto">
                    No entry
                  </span>
                </button>
              );
            }

            return (
              <button
                key={`${granularity}-${index}-${date.toISOString()}`}
                type="button"
                onClick={() => onDateClick?.(date)}
                className={`${basePadding} ${cellMinHeight} text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-[-2px] ${
                  !isCurrentMonth
                    ? 'bg-gray-50/50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-600 hover:bg-gray-100/70 dark:hover:bg-gray-800'
                    : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/80'
                }`}
              >
                <span
                  className={`text-xs font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                    isFuture && isCurrentMonth
                      ? 'text-gray-700 dark:text-gray-200'
                      : 'text-gray-400 dark:text-gray-600'
                  }`}
                >
                  {date.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
