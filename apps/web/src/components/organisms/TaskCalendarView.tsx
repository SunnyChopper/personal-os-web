import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import type { Task } from '@/types/growth-system';
import { PriorityIndicator } from '@/components/atoms/PriorityIndicator';
import Button from '@/components/atoms/Button';
import { extractDateOnly, toLocalDateKey } from '@/utils/date-formatters';

const VISIBLE_TASKS_PER_DAY = 2;

interface TaskCalendarViewProps {
  tasks: Task[];
  isLoading?: boolean;
  onTaskClick: (task: Task) => void;
}

export function TaskCalendarView({ tasks, isLoading = false, onTaskClick }: TaskCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const getMonthData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { year, month, daysInMonth, startingDayOfWeek };
  };

  const getTasksForDate = (date: Date) => {
    const dateStr = toLocalDateKey(date);
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = extractDateOnly(task.dueDate);
      return taskDate === dateStr;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const [monthKey, setMonthKey] = useState(0);
  const handleMonthChange = (direction: 'prev' | 'next') => {
    setMonthKey((prev) => prev + 1);
    setExpandedDate(null);
    navigateMonth(direction);
  };

  const goToToday = () => {
    setExpandedDate(null);
    setCurrentDate(new Date());
  };

  const { year, month, daysInMonth, startingDayOfWeek } = getMonthData();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const tasksWithDates = tasks.filter((t) => t.dueDate).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <AnimatePresence mode="wait">
              <motion.h2
                key={monthKey}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="text-xl font-bold text-gray-900 dark:text-white"
              >
                {monthName}
              </motion.h2>
            </AnimatePresence>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isLoading ? (
                <span className="inline-block h-4 w-36 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
              ) : (
                <>
                  {tasksWithDates} {tasksWithDates === 1 ? 'task' : 'tasks'} scheduled
                </>
              )}
            </p>
          </div>
        </motion.div>
        <div className="flex items-center gap-2">
          <motion.div whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.02 }}>
            <Button variant="secondary" size="sm" onClick={goToToday} className="min-h-[44px]">
              Today
            </Button>
          </motion.div>
          <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => handleMonthChange('prev')}
              className="p-2 min-h-[44px] min-w-[44px] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => handleMonthChange('next')}
              className="p-2 min-h-[44px] min-w-[44px] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expandedDate !== null && (
          <motion.div
            key="calendar-overflow-backdrop"
            data-testid="calendar-overflow-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            aria-hidden
            onClick={() => setExpandedDate(null)}
          />
        )}
      </AnimatePresence>

      <div className="p-4">
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 py-3"
            >
              {day}
            </div>
          ))}

          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            if (isLoading) {
              return (
                <div
                  key={`sk-${day}`}
                  className="aspect-square border-2 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/80 animate-pulse"
                />
              );
            }

            const date = new Date(year, month, day);
            const dateStr = toLocalDateKey(date);
            const isExpanded = expandedDate === dateStr;
            const isToday = isCurrentMonth && day === today.getDate();
            const dateTasks = getTasksForDate(date);
            const hasTasks = dateTasks.length > 0;
            const overflowCount = dateTasks.length - VISIBLE_TASKS_PER_DAY;
            const alignPopoverLeft = index % 7 <= 3;
            const formattedDateLabel = date.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });

            return (
              <motion.div
                key={day}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01 }}
                whileHover={isExpanded ? undefined : { scale: 1.05 }}
                whileTap={isExpanded ? undefined : { scale: 0.95 }}
                className={`relative aspect-square border-2 rounded-lg p-2 transition-all ${
                  isExpanded ? 'z-50' : 'z-10'
                } ${
                  isToday
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                    : hasTasks
                      ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                }`}
              >
                <div className="flex flex-col h-full">
                  <div
                    className={`text-sm font-bold mb-1 ${
                      isToday
                        ? 'text-blue-600 dark:text-blue-400'
                        : hasTasks
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-500 dark:text-gray-500'
                    }`}
                  >
                    {day}
                  </div>

                  <div className="flex-1 space-y-1 overflow-hidden">
                    <AnimatePresence>
                      {dateTasks.slice(0, VISIBLE_TASKS_PER_DAY).map((task, taskIndex) => (
                        <motion.button
                          key={task.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ delay: taskIndex * 0.05 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onTaskClick(task)}
                          className="w-full text-left px-1.5 py-1 rounded text-[10px] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:shadow-sm hover:border-blue-400 dark:hover:border-blue-500 transition-all group min-h-[44px]"
                        >
                          <div className="flex items-center gap-1">
                            <PriorityIndicator priority={task.priority} size="sm" />
                            <span className="truncate text-gray-900 dark:text-white font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              {task.title}
                            </span>
                          </div>
                        </motion.button>
                      ))}
                    </AnimatePresence>

                    {overflowCount > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedDate(dateStr);
                        }}
                        className="w-full text-left text-[10px] text-gray-500 dark:text-gray-400 pl-1.5 font-medium hover:text-blue-600 dark:hover:text-blue-400 min-h-[44px] flex items-center"
                        aria-expanded={isExpanded}
                        aria-label={`Show ${overflowCount} more tasks on ${formattedDateLabel}`}
                      >
                        +{overflowCount} more
                      </button>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      key={`popover-${dateStr}`}
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      role="dialog"
                      aria-label={`Tasks on ${formattedDateLabel}`}
                      className="absolute top-full mt-1 z-50 w-56 max-h-64 flex flex-col rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg overflow-hidden"
                      style={alignPopoverLeft ? { left: 0 } : { right: 0, left: 'auto' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="sticky top-0 flex items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2">
                        <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                          {formattedDateLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedDate(null)}
                          className="shrink-0 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          aria-label="Close task list"
                        >
                          <X className="w-4 h-4" aria-hidden />
                        </button>
                      </div>
                      <ul className="overflow-y-auto p-2 space-y-1">
                        {dateTasks.map((task) => (
                          <li key={task.id}>
                            <button
                              type="button"
                              aria-label={task.title}
                              onClick={() => {
                                setExpandedDate(null);
                                onTaskClick(task);
                              }}
                              className="w-full text-left px-2 py-2 rounded text-xs bg-gray-50 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 hover:shadow-sm hover:border-blue-400 dark:hover:border-blue-500 transition-all group min-h-[44px]"
                            >
                              <div className="flex items-center gap-1.5">
                                <PriorityIndicator priority={task.priority} size="sm" />
                                <span className="truncate text-gray-900 dark:text-white font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                  {task.title}
                                </span>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {!isLoading && tasksWithDates === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-6 py-8 text-center border-t border-gray-200 dark:border-gray-700"
        >
          <CalendarIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            No tasks with due dates. Add due dates to see them on the calendar.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
