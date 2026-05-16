import { useMemo } from 'react';

import { Flame, Target, TrendingUp, Award } from 'lucide-react';

import type { Habit, HabitLog } from '@/types/growth-system';
import {
  getAllStreaks,
  calculateCompletionRate,
  calculateConsistencyScoreBreakdown,
  calculateTrend,
  getLogsForDateRange,
} from '@/utils/habit-analytics';

import { HoverMetricHelp } from './HoverMetricHelp';
import { HabitStatCard } from './HabitStatCard';
import { MetricBreakdownTooltip } from './MetricBreakdownTooltip';

interface HabitStatsDashboardProps {
  habit: Habit;
  logs: HabitLog[];
}

function formatLongDate(iso?: string): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function HabitStatsDashboard({ habit, logs }: HabitStatsDashboardProps) {
  const now = useMemo(() => new Date(), []);

  const { currentWeekStart, currentWeekEnd, weeklyCompletions, weeklyTarget } = useMemo(() => {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay() + 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const weekLogs = getLogsForDateRange(logs, start, end);
    const completions = weekLogs.reduce((sum, log) => sum + (log.amount || 1), 0);
    const target = habit.weeklyTarget ?? (habit.dailyTarget ? habit.dailyTarget * 7 : 7);

    return {
      currentWeekStart: start,
      currentWeekEnd: end,
      weeklyCompletions: completions,
      weeklyTarget: target,
    };
  }, [habit.dailyTarget, habit.weeklyTarget, logs, now]);

  const stats = useMemo(() => {
    const streaks = getAllStreaks(logs);
    const completionRate = calculateCompletionRate(logs, habit);
    const consistencyBreakdown = calculateConsistencyScoreBreakdown(logs, habit);
    const consistencyScore = consistencyBreakdown.total;
    const totalCompletions = logs.reduce((sum, log) => sum + (log.amount || 1), 0);

    const currentWeekStartTrend = new Date(now);
    currentWeekStartTrend.setDate(now.getDate() - now.getDay() + 1);
    currentWeekStartTrend.setHours(0, 0, 0, 0);
    const currentWeekEndTrend = new Date(currentWeekStartTrend);
    currentWeekEndTrend.setDate(currentWeekStartTrend.getDate() + 6);
    currentWeekEndTrend.setHours(23, 59, 59, 999);

    const previousWeekStart = new Date(currentWeekStartTrend);
    previousWeekStart.setDate(currentWeekStartTrend.getDate() - 7);
    const previousWeekEnd = new Date(previousWeekStart);
    previousWeekEnd.setDate(previousWeekStart.getDate() + 6);
    previousWeekEnd.setHours(23, 59, 59, 999);

    const currentWeekLogs = getLogsForDateRange(logs, currentWeekStartTrend, currentWeekEndTrend);
    const previousWeekLogs = getLogsForDateRange(logs, previousWeekStart, previousWeekEnd);
    const trend = calculateTrend(currentWeekLogs, previousWeekLogs, habit);

    return {
      streaks,
      completionRate,
      consistencyBreakdown,
      consistencyScore,
      totalCompletions,
      trend,
    };
  }, [habit, logs, now]);

  const activeStreakMeta = stats.streaks.allStreaks.find((s) => s.isActive);
  const activeStreakStartLabel = formatLongDate(activeStreakMeta?.startDate);

  const weeklyTargetSource =
    habit.weeklyTarget != null
      ? 'Uses habit weeklyTarget'
      : habit.dailyTarget != null
        ? 'weeklyTarget absent — dailyTarget × 7'
        : 'No targets set — defaulted to 7 expected completions/week';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <HabitStatCard
          label="Current Streak"
          value={`${stats.streaks.current} days`}
          icon={<Flame className="w-5 h-5 text-orange-500" />}
          tooltip={
            <MetricBreakdownTooltip
              intro="Count of consecutive calendar days with at least one completion, stepping backward day-by-day starting from today (up to 365 days)."
              rows={[
                {
                  term: 'Input',
                  description: 'Log dates grouped by calendar day.',
                },
                {
                  term: 'Output',
                  description: <>Current streak length: {stats.streaks.current} day(s).</>,
                },
                ...(activeStreakStartLabel && stats.streaks.current > 0
                  ? [
                      {
                        term: 'Active streak start',
                        description: activeStreakStartLabel,
                      },
                    ]
                  : []),
              ]}
              result={<span>Displayed value = longest active run ending today.</span>}
            />
          }
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
          tooltip={
            <MetricBreakdownTooltip
              intro="Lifetime measure from habit creation through today unless you customize the analytics window elsewhere."
              rows={[
                {
                  term: 'Window',
                  description: stats.completionRate.period,
                },
                {
                  term: 'Actual',
                  description: (
                    <>
                      Sum of (log.amount or 1) in window →{' '}
                      <strong>{stats.completionRate.actual}</strong>
                    </>
                  ),
                },
                {
                  term: 'Expected',
                  description: (
                    <>
                      {stats.completionRate.expectedExplanation ??
                        'Computed from targets or frequency.'}{' '}
                      → <strong>{stats.completionRate.expected}</strong>
                    </>
                  ),
                },
                {
                  term: 'Rate',
                  description: <>min(100, actual ÷ expected × 100) → rounds for display.</>,
                },
              ]}
              result={
                <>
                  Shown rate: <strong>{stats.completionRate.rate.toFixed(1)}%</strong> (
                  {stats.completionRate.actual}/{stats.completionRate.expected})
                </>
              }
            />
          }
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
          tooltip={
            <MetricBreakdownTooltip
              intro={
                <>
                  Combines lifetime completion strength, activity in the last 30 days, and current
                  streak. Max <strong>100</strong>.
                </>
              }
              rows={[
                {
                  term: 'Base (up to 70)',
                  description: (
                    <>
                      ({stats.consistencyBreakdown.completionRatePercent.toFixed(1)}% completion
                      rate ÷ 100) × 70 ≈{' '}
                      <strong>{stats.consistencyBreakdown.baseScore.toFixed(1)}</strong>
                    </>
                  ),
                },
                {
                  term: 'Recency (up to 20)',
                  description: (
                    <>
                      weight = min(1, {stats.consistencyBreakdown.recentLogsCount} logs in last 30d
                      ÷ 15); weight × 20 ≈{' '}
                      <strong>{stats.consistencyBreakdown.recencyBonus.toFixed(1)}</strong>
                    </>
                  ),
                },
                {
                  term: 'Streak (up to 10)',
                  description: (
                    <>
                      min(10, (current streak {stats.consistencyBreakdown.currentStreak} ÷ 30) × 10)
                      ≈ <strong>{stats.consistencyBreakdown.streakBonus.toFixed(1)}</strong>
                    </>
                  ),
                },
              ]}
              result={
                <>
                  Total = min(100, base + recency + streak) →{' '}
                  <strong>{stats.consistencyBreakdown.total.toFixed(1)}</strong>
                </>
              }
            />
          }
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
          tooltip={
            <MetricBreakdownTooltip
              intro="All-time sum of completion amounts for this habit."
              rows={[
                {
                  term: 'Input',
                  description: (
                    <>{logs.length} log record(s); each log contributes (amount or 1).</>
                  ),
                },
                {
                  term: 'Formula',
                  description: 'Σ (log.amount || 1)',
                },
              ]}
              result={
                <>
                  Output: <strong>{stats.totalCompletions}</strong>
                </>
              }
            />
          }
        />
      </div>

      {(habit.dailyTarget != null || habit.weeklyTarget != null) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">This Week</span>
              <HoverMetricHelp>
                <MetricBreakdownTooltip
                  intro="Progress for the calendar week containing today (Monday 00:00 – Sunday 23:59, local)."
                  rows={[
                    {
                      term: 'Weekly completions',
                      description: (
                        <>
                          Sum of (log.amount or 1) for logs in this range →{' '}
                          <strong>{weeklyCompletions}</strong>
                        </>
                      ),
                    },
                    {
                      term: 'Weekly target',
                      description: (
                        <>
                          <strong>{weeklyTarget}</strong> — {weeklyTargetSource}
                        </>
                      ),
                    },
                    {
                      term: 'Bar fill',
                      description: <>min(100%, weekly completions ÷ weekly target × 100)</>,
                    },
                  ]}
                  result={
                    <>
                      Range:{' '}
                      {currentWeekStart.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                      {' – '}
                      {currentWeekEnd.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </>
                  }
                />
              </HoverMetricHelp>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {weeklyCompletions}/{weeklyTarget}
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 dark:bg-blue-600 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, weeklyTarget > 0 ? (weeklyCompletions / weeklyTarget) * 100 : 0)}%`,
              }}
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
                          width: `${Math.min(
                            100,
                            stats.streaks.longest > 0
                              ? (streak.length / stats.streaks.longest) * 100
                              : 0
                          )}%`,
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
