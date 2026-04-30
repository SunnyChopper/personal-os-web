import { Repeat, Plus, Check, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Habit } from '@/types/growth-system';
import { EmptyState } from './EmptyState';
import { AreaBadge } from '@/components/atoms/AreaBadge';
import Button from '@/components/atoms/Button';

interface HabitWithStreak {
  habit: Habit;
  currentStreak: number;
  completedToday: boolean;
  weeklyProgress: number;
}

interface GoalHabitsSectionProps {
  habits: HabitWithStreak[];
  onLinkHabit?: () => void;
  onCompleteHabit?: (habitId: string) => void;
  onHabitClick?: (habit: Habit) => void;
  showEmpty?: boolean;
}

export function GoalHabitsSection({
  habits,
  onLinkHabit,
  onCompleteHabit,
  onHabitClick,
  showEmpty = true,
}: GoalHabitsSectionProps) {
  if (habits.length === 0 && showEmpty) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Repeat className="w-5 h-5" />
            Habits (0)
          </h3>
        </div>
        <EmptyState
          icon={Repeat}
          title="No habits linked"
          description="Link habits that support this goal for consistent progress"
          actionLabel={onLinkHabit ? 'Link Habit' : undefined}
          onAction={onLinkHabit}
        />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Repeat className="w-5 h-5" />
          Habits ({habits.length})
        </h3>
        {onLinkHabit && (
          <Button variant="secondary" size="sm" onClick={onLinkHabit}>
            <Plus className="w-4 h-4 mr-1" />
            Link Habit
          </Button>
        )}
      </div>

      {/* Habits List */}
      <div className="space-y-3 flex-1">
        {habits.map((item, index) => {
          const { habit, currentStreak, completedToday, weeklyProgress } = item;

          return (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onHabitClick?.(habit)}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {habit.name}
                  </h4>
                  {habit.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {habit.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <AreaBadge area={habit.area} />
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                      {habit.habitType}
                    </span>
                  </div>
                </div>

                {/* Streak Badge */}
                {currentStreak > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                    <Flame className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                    <span className="text-xs font-bold text-orange-700 dark:text-orange-300">
                      {currentStreak}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress Bar (Weekly) */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">This week</span>
                  <span className="text-gray-600 dark:text-gray-400">{weeklyProgress}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${weeklyProgress}%` }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className={`h-full rounded-full ${
                      weeklyProgress >= 80
                        ? 'bg-green-500'
                        : weeklyProgress >= 50
                          ? 'bg-yellow-500'
                          : 'bg-orange-500'
                    }`}
                  />
                </div>
              </div>

              {/* Footer - Today's Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {completedToday ? (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <Check className="w-4 h-4" />
                      <span className="text-xs font-medium">Completed today</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Not completed today
                    </span>
                  )}
                </div>

                {onCompleteHabit && !completedToday && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCompleteHabit(habit.id);
                    }}
                    className="px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    Mark Complete
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
