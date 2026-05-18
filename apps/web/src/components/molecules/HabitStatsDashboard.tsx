import { useMemo } from 'react';
import { Flame, Target, TrendingUp, Award } from 'lucide-react';
import type { Habit, HabitLog } from '@/types/growth-system';
import {
  getAllStreaks,
  calculateCompletionRate,
  calculateConsistencyScore,
  calculateTrend,
  getLogsForDateRange,
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
    const consistencyScore = calculateConsistencyScore(logs, habit);
    const totalCompletions = logs.reduce((sum, log) => sum + (log.amount || 1), 0);

    // Calculate trend for completion rate
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay() + 1);
    currentWeekStart.setHours(0, 0, 0, 0);
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);

    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(currentWeekStart.getDate() - 7);
    const previousWeekEnd = new Date(previousWeekStart);
    previousWeekEnd.setDate(previousWeekStart.getDate() + 6);
    previousWeekEnd.setHours(23, 59, 59, 999);

    const currentWeekLogs = getLogsForDateRange(logs, currentWeekStart, currentWeekEnd);
    const previousWeekLogs = getLogsForDateRange(logs, previousWeekStart, previousWeekEnd);
    const trend = calculateTrend(currentWeekLogs, previousWeekLogs, habit);

    return {
      streaks,
      completionRate,
      consistencyScore,
      totalCompletions,
      trend,
    };
  }, [habit, logs]);

  // Calculate weekly progress for progress indicator
  const now = new Date();
  const currentWeekStart = new Date(now);
  currentWeekStart.setDate(now.getDate() - now.getDay() + 1);
  currentWeekStart.setHours(0, 0, 0, 0);
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
  currentWeekEnd.setHours(23, 59, 59, 999);
  const currentWeekLogs = getLogsForDateRange(logs, currentWeekStart, currentWeekEnd);
  const weeklyCompletions = currentWeekLogs.reduce((sum, log) => sum + (log.amount || 1), 0);
  const weeklyTarget = habit.weeklyTarget || (habit.dailyTarget ? habit.dailyTarget * 7 : 7);

  return (
    <div className="space-y-6">
      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <HabitStatCard
          label="Current Streak"
          value={`${stats.streaks.current} days`}
          icon={<Flame className="w-5 h-5 text-orange-500" />}
          tooltip="Number of consecutive days you've completed this habit. Keep it going!"
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
          tooltip={`You've completed ${stats.completionRate.actual} out of ${stats.completionRate.expected} expected completions (${stats.completionRate.rate.toFixed(1)}%)`}
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
          value={`${stats.consistencyScore.toFixed(0)}/100`}
          icon={<Award className="w-5 h-5 text-purple-500" />}
          tooltip="A score based on completion rate, recency, and streak length. Higher is better!"
          progress={{
            current: stats.consistencyScore,
            target: 100,
            label: 'Score',
          }}
        />

        <HabitStatCard
          label="Total Completions"
          value={stats.totalCompletions}
          icon={<TrendingUp className="w-5 h-5 text-indigo-500" />}
          tooltip="Total number of times you've completed this habit"
        />
      </div>

      {/* Weekly Progress Indicator */}
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

      {/* Streak Visualization */}
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
              const startDate = new Date(streak.startDate);
              const endDate = streak.endDate ? new Date(streak.endDate) : new Date();

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
                      {startDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      {streak.endDate && !streak.isActive && (
                        <>
                          {' '}
                          -{' '}
                          {endDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </>
                      )}
                      {streak.isActive && ' - Present'}
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
