import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { Habit, HabitLog } from '@/types/growth-system';
import {
  getWeeklyData,
  getMonthlyData,
  calculateTrend,
  getLogsForDateRange,
} from '@/utils/habit-analytics';
import { getHabitTypeColors } from '@/utils/habit-colors';

interface WeeklyMonthlyComparisonProps {
  habit: Habit;
  logs: HabitLog[];
}

type ViewMode = 'week' | 'month';

export function WeeklyMonthlyComparison({ habit, logs }: WeeklyMonthlyComparisonProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  const comparisonData = useMemo(() => {
    if (viewMode === 'week') {
      const weeklyData = getWeeklyData(logs, habit, 8);
      if (weeklyData.length < 2) return null;

      const current = weeklyData[weeklyData.length - 1];
      const previous = weeklyData[weeklyData.length - 2];

      const currentLogs = getLogsForDateRange(
        logs,
        new Date(current.startDate),
        new Date(current.endDate)
      );
      const previousLogs = getLogsForDateRange(
        logs,
        new Date(previous.startDate),
        new Date(previous.endDate)
      );
      const trend = calculateTrend(currentLogs, previousLogs, habit);

      return { current, previous, trend, type: 'week' as const };
    } else {
      const monthlyData = getMonthlyData(logs, habit, 6);
      if (monthlyData.length < 2) return null;

      const current = monthlyData[monthlyData.length - 1];
      const previous = monthlyData[monthlyData.length - 2];

      const currentLogs = getLogsForDateRange(
        logs,
        new Date(current.startDate),
        new Date(current.endDate)
      );
      const previousLogs = getLogsForDateRange(
        logs,
        new Date(previous.startDate),
        new Date(previous.endDate)
      );
      const trend = calculateTrend(currentLogs, previousLogs, habit);

      return { current, previous, trend, type: 'month' as const };
    }
  }, [logs, habit, viewMode]);

  const colors = getHabitTypeColors(habit.habitType);

  if (!comparisonData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Performance Comparison
        </h3>
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="mb-2">Not enough data for comparison yet.</p>
          <p className="text-sm">Keep logging completions to see your progress over time!</p>
        </div>
      </div>
    );
  }

  const { current, previous, trend } = comparisonData;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Performance Comparison
        </h3>

        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
              viewMode === 'week'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
              viewMode === 'month'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Period Card */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">
              Current {viewMode === 'week' ? 'Week' : 'Month'}
            </h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">{current.period}</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Completions</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {current.completions}
                </span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colors.progressFill} rounded-full transition-all`}
                  style={{
                    width: `${Math.min(100, (current.completions / Math.max(current.expected, 1)) * 100)}%`,
                  }}
                />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Target: {current.expected}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Completion Rate</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {current.rate.toFixed(0)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg per Day</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {current.averagePerDay.toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Previous Period Card */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">
              Previous {viewMode === 'week' ? 'Week' : 'Month'}
            </h4>
            <span className="text-xs text-gray-500 dark:text-gray-400">{previous.period}</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Completions</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {previous.completions}
                  </span>
                  {trend.changePercent !== 0 && (
                    <div
                      className={`flex items-center gap-1 text-sm font-semibold ${
                        trend.isImproving
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {trend.isImproving ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span>{Math.abs(trend.changePercent).toFixed(0)}%</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-400 dark:bg-gray-500 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (previous.completions / Math.max(previous.expected, 1)) * 100)}%`,
                  }}
                />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Target: {previous.expected}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Completion Rate</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {previous.rate.toFixed(0)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg per Day</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {previous.averagePerDay.toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center">
          <div className="text-center bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Overall Change</div>
            <div
              className={`flex items-center justify-center gap-2 text-2xl font-bold ${
                trend.isImproving
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {trend.isImproving ? (
                <TrendingUp className="w-6 h-6" />
              ) : (
                <TrendingDown className="w-6 h-6" />
              )}
              <span>{Math.abs(trend.change)}</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {trend.isImproving ? "You're doing better!" : 'Keep pushing!'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {Math.abs(trend.changePercent).toFixed(0)}%{' '}
              {trend.isImproving ? 'increase' : 'decrease'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
