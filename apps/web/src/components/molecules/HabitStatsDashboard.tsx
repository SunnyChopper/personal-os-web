import { useMemo } from 'react';
import { Flame, Target, TrendingUp, Award } from 'lucide-react';
import type { Habit, HabitLog } from '@/types/growth-system';
import {
  getAllStreaks,
  calculateCompletionRate,
  getConsistencyScoreBreakdown,
  calculateTrend,
  getLogsForDateRange,
  getWeekRange,
} from '@/utils/habit-analytics';
import { HabitStatCard } from './HabitStatCard';

interface HabitStatsDashboardProps {
  habit: Habit;
  logs: HabitLog[];
}

export function HabitStatsDashboard({ habit, logs }: HabitStatsDashboardProps) {
  const stats = useMemo(() => {
    const streaks = getAllStreaks(logs);
    const completionRate = calculateCompletionRate(logs, habit);
    const consistency = getConsistencyScoreBreakdown(logs, habit);
    const totalCompletions = logs.reduce((sum, log) => sum + (log.amount || 1), 0);

    const now = new Date();
    const { monday: currentWeekStart, sunday: currentWeekEnd } = getWeekRange(now, 0);
    const { monday: previousWeekStart, sunday: previousWeekEnd } = getWeekRange(now, 1);

    const currentWeekLogs = getLogsForDateRange(logs, currentWeekStart, currentWeekEnd);
    const previousWeekLogs = getLogsForDateRange(logs, previousWeekStart, previousWeekEnd);
    const trend = calculateTrend(
      currentWeekLogs,
      previousWeekLogs,
      habit,
      currentWeekStart,
      currentWeekEnd,
      previousWeekStart,
      previousWeekEnd
    );

    return {
      streaks,
      completionRate,
      consistency,
      totalCompletions,
      trend,
    };
  }, [habit, logs]);

  const now = new Date();
  const { monday: currentWeekStart, sunday: currentWeekEnd } = getWeekRange(now, 0);
  const currentWeekLogs = getLogsForDateRange(logs, currentWeekStart, currentWeekEnd);
  const weeklyCompletions = currentWeekLogs.reduce((sum, log) => sum + (log.amount || 1), 0);
  const weeklyTarget = habit.weeklyTarget || (habit.dailyTarget ? habit.dailyTarget * 7 : 7);

  const completionRateTooltip = [
    `Window: ${stats.completionRate.period}`,
    `Actual: ${stats.completionRate.actual} completions`,
    `Expected: ${stats.completionRate.expected}`,
    `Rate: ${stats.completionRate.rate.toFixed(1)}% (actual ÷ expected, capped at 100%)`,
    stats.trend.changePercent !== 0
      ? `vs last week: ${stats.trend.isImproving ? '+' : ''}${stats.trend.changePercent.toFixed(0)}% completion count`
      : null,
  ]
    .filter(Boolean)
    .join('\n');

  const consistencyTooltip = [
    `Score: ${stats.consistency.score.toFixed(0)}/100`,
    `• Completion rate (70%): ${stats.consistency.completionRateComponent.toFixed(1)} pts from ${stats.consistency.completionRate.rate.toFixed(0)}% lifetime rate`,
    `• Recent activity (20%): ${stats.consistency.recencyComponent.toFixed(1)} pts from completions in the last 30 days`,
    `• Current streak (10%): ${stats.consistency.streakComponent.toFixed(1)} pts from ${stats.streaks.current}-day streak`,
  ].join('\n');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <HabitStatCard
          label="Current Streak"
          value={`${stats.streaks.current} days`}
          icon={<Flame className="w-5 h-5 text-orange-500" />}
          tooltip="Consecutive calendar days with at least one completion, counting back from today."
          progress={
            habit.dailyTarget
              ? undefined
              : {
                  current: stats.streaks.current,
                  target: 30,
                  label: 'Target: 30 days',
                }
          }
        />

        <HabitStatCard
          label="Completion Rate"
          value={`${stats.completionRate.rate.toFixed(0)}%`}
          icon={<Target className="w-5 h-5 text-blue-500" />}
          tooltip={completionRateTooltip}
          trend={
            stats.trend.changePercent !== 0
              ? {
                  changePercent: stats.trend.changePercent,
                  isImproving: stats.trend.isImproving,
                }
              : undefined
          }
        />

        <HabitStatCard
          label="Consistency Score"
          value={`${stats.consistency.score.toFixed(0)}/100`}
          icon={<Award className="w-5 h-5 text-purple-500" />}
          tooltip={consistencyTooltip}
          progress={{
            current: stats.consistency.score,
            target: 100,
            label: 'Score',
          }}
        />

        <HabitStatCard
          label="Total Completions"
          value={stats.totalCompletions}
          icon={<TrendingUp className="w-5 h-5 text-indigo-500" />}
          tooltip="Sum of completion amounts across all logged entries."
        />
      </div>

      {(habit.dailyTarget || habit.weeklyTarget) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">This Week</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {weeklyCompletions}/{weeklyTarget}
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 dark:bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (weeklyCompletions / weeklyTarget) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {stats.streaks.allStreaks.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Streak History</h3>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Longest:{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {stats.streaks.longest} days
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {stats.streaks.allStreaks.slice(0, 5).map((streak, index) => {
              const rangeStart = new Date(streak.startDate);
              const rangeEnd = streak.endDate ? new Date(streak.endDate) : new Date();

              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {streak.isActive ? 'Active Streak' : `Streak ${index + 1}`}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {streak.length} days
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          streak.isActive
                            ? 'bg-orange-500 dark:bg-orange-600'
                            : 'bg-gray-400 dark:bg-gray-500'
                        }`}
                        style={{
                          width: `${Math.min(100, stats.streaks.longest > 0 ? (streak.length / stats.streaks.longest) * 100 : 0)}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {rangeStart.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      {' - '}
                      {streak.isActive
                        ? 'Present'
                        : rangeEnd.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Streak History
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No streaks recorded yet. Start logging completions to build your first streak!
          </p>
        </div>
      )}
    </div>
  );
}
