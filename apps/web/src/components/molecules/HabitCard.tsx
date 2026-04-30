import { Check, Flame, Calendar, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Habit } from '@/types/growth-system';
import { AreaBadge } from '@/components/atoms/AreaBadge';

interface HabitCardProps {
  habit: Habit;
  streak?: number;
  todayCompleted?: boolean;
  todayProgress?: number;
  weeklyProgress?: number;
  totalCompletions?: number;
  lastCompletedDate?: string | null;
  onClick: (habit: Habit) => void;
  onQuickLog?: (habit: Habit) => void;
}

export function HabitCard({
  habit,
  streak = 0,
  todayCompleted = false,
  todayProgress = 0,
  weeklyProgress = 0,
  totalCompletions = 0,
  lastCompletedDate = null,
  onClick,
  onQuickLog,
}: HabitCardProps) {
  const getHabitTypeColor = (type: string) => {
    switch (type) {
      case 'Build':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'Maintain':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'Reduce':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'Quit':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const getHabitTypeAccentColor = (type: string) => {
    switch (type) {
      case 'Build':
        return {
          border: 'border-green-200 dark:border-green-800',
          bg: 'bg-green-50/50 dark:bg-green-900/10',
          indicator: 'bg-green-100 dark:bg-green-800 border-green-300 dark:border-green-700',
          progressBg: 'bg-green-100/50 dark:bg-green-900/20',
        };
      case 'Maintain':
        return {
          border: 'border-blue-200 dark:border-blue-800',
          bg: 'bg-blue-50/50 dark:bg-blue-900/10',
          indicator: 'bg-blue-100 dark:bg-blue-800 border-blue-300 dark:border-blue-700',
          progressBg: 'bg-blue-100/50 dark:bg-blue-900/20',
        };
      case 'Reduce':
        return {
          border: 'border-yellow-200 dark:border-yellow-800',
          bg: 'bg-yellow-50/50 dark:bg-yellow-900/10',
          indicator: 'bg-yellow-100 dark:bg-yellow-800 border-yellow-300 dark:border-yellow-700',
          progressBg: 'bg-yellow-100/50 dark:bg-yellow-900/20',
        };
      case 'Quit':
        return {
          border: 'border-red-200 dark:border-red-800',
          bg: 'bg-red-50/50 dark:bg-red-900/10',
          indicator: 'bg-red-100 dark:bg-red-800 border-red-300 dark:border-red-700',
          progressBg: 'bg-red-100/50 dark:bg-red-900/20',
        };
      default:
        return {
          border: 'border-gray-200 dark:border-gray-700',
          bg: '',
          indicator: 'bg-gray-200 dark:bg-gray-700',
          progressBg: 'bg-gray-100 dark:bg-gray-800',
        };
    }
  };

  const getProgressColor = (current: number, target: number | null, habitType: string): string => {
    if (!target) {
      // Use habit type color for empty progress
      switch (habitType) {
        case 'Build':
          return 'bg-green-200 dark:bg-green-800';
        case 'Maintain':
          return 'bg-blue-200 dark:bg-blue-800';
        case 'Reduce':
          return 'bg-yellow-200 dark:bg-yellow-800';
        case 'Quit':
          return 'bg-red-200 dark:bg-red-800';
        default:
          return 'bg-gray-200 dark:bg-gray-700';
      }
    }
    if (current >= target) return 'bg-green-500 dark:bg-green-600';
    if (current > 0) {
      // Use habit type color for in-progress
      switch (habitType) {
        case 'Build':
          return 'bg-green-500 dark:bg-green-600';
        case 'Maintain':
          return 'bg-blue-500 dark:bg-blue-600';
        case 'Reduce':
          return 'bg-yellow-500 dark:bg-yellow-600';
        case 'Quit':
          return 'bg-red-500 dark:bg-red-600';
        default:
          return 'bg-blue-500 dark:bg-blue-600';
      }
    }
    // Use subtle habit type color for empty
    switch (habitType) {
      case 'Build':
        return 'bg-green-200 dark:bg-green-800';
      case 'Maintain':
        return 'bg-blue-200 dark:bg-blue-800';
      case 'Reduce':
        return 'bg-yellow-200 dark:bg-yellow-800';
      case 'Quit':
        return 'bg-red-200 dark:bg-red-800';
      default:
        return 'bg-gray-200 dark:bg-gray-700';
    }
  };

  const getProgressPercentage = (current: number, target: number | null): number => {
    if (!target || target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const dailyProgressPercent = getProgressPercentage(todayProgress, habit.dailyTarget);
  const weeklyProgressPercent = getProgressPercentage(weeklyProgress, habit.weeklyTarget);
  const accentColors = getHabitTypeAccentColor(habit.habitType);

  const formatLastCompleted = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const logDate = new Date(date);
    logDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div
      layout
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className={`group bg-white dark:bg-gray-800 rounded-lg border ${
        todayCompleted
          ? 'border-green-300 dark:border-green-700 bg-green-50/30 dark:bg-green-900/10'
          : `${accentColors.border} ${accentColors.bg}`
      } p-4 hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200`}
    >
      {/* Header Section - Name + Streak */}
      <motion.div
        onClick={() => onClick(habit)}
        className="cursor-pointer"
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                {habit.name}
              </h3>
              {todayCompleted && (
                <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              )}
            </div>
            {habit.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mb-2">
                {habit.description}
              </p>
            )}
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-1 flex-shrink-0 ml-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-lg font-bold text-orange-500">{streak}</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* Today Progress */}
          {habit.dailyTarget && (
            <div className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-gray-400" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-600 dark:text-gray-400">Today</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {todayProgress}/{habit.dailyTarget}
                </div>
              </div>
            </div>
          )}

          {/* Weekly Progress */}
          {habit.weeklyTarget ? (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-600 dark:text-gray-400">Week</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {weeklyProgress}/{habit.weeklyTarget}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {totalCompletions}
                </div>
              </div>
            </div>
          )}

          {/* Last Completed */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-600 dark:text-gray-400">Last</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatLastCompleted(lastCompletedDate)}
              </div>
            </div>
          </div>

          {/* Progress Indicator - Single bar showing most relevant progress */}
          <div className="flex items-center gap-1.5">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Progress</div>
              {habit.dailyTarget ? (
                <div
                  className={`w-full h-1.5 ${accentColors.progressBg} rounded-full overflow-hidden`}
                >
                  <div
                    className={`h-full transition-all duration-500 ${getProgressColor(todayProgress, habit.dailyTarget, habit.habitType)}`}
                    style={{ width: `${dailyProgressPercent}%` }}
                  />
                </div>
              ) : habit.weeklyTarget ? (
                <div
                  className={`w-full h-1.5 ${accentColors.progressBg} rounded-full overflow-hidden`}
                >
                  <div
                    className={`h-full transition-all duration-500 ${getProgressColor(weeklyProgress, habit.weeklyTarget, habit.habitType)}`}
                    style={{ width: `${weeklyProgressPercent}%` }}
                  />
                </div>
              ) : (
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {totalCompletions} total
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className={`flex items-center gap-2 pt-2 border-t ${accentColors.border} opacity-60`}>
          <AreaBadge area={habit.area} />
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded-full ${getHabitTypeColor(habit.habitType)}`}
          >
            {habit.habitType}
          </span>
        </div>
      </motion.div>

      {/* Action Button */}
      {onQuickLog && !todayCompleted && (
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onQuickLog(habit);
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          className="w-full mt-3 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow-md min-h-[44px] touch-manipulation"
        >
          Mark Complete
        </motion.button>
      )}
    </motion.div>
  );
}
