import type { Habit, HabitLog } from '@/types/growth-system';
import { getHabitLogCalendarDay, toLocalDateKey } from '@/utils/date-formatters';

export interface StreakData {
  current: number;
  longest: number;
  allStreaks: Array<{
    startDate: string;
    endDate: string | null;
    length: number;
    isActive: boolean;
  }>;
}

export interface CompletionRateData {
  period: string;
  actual: number;
  expected: number;
  rate: number;
}

export interface TrendData {
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  isImproving: boolean;
}

export interface HeatmapDay {
  date: string;
  count: number;
  intensity: number; // 0-4 for color intensity
  isOffDay?: boolean;
}

export interface CalendarDay {
  date: Date;
  day: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  completionCount: number;
  logs: HabitLog[];
  isOffDay?: boolean;
}

export interface WeeklyMonthlyData {
  period: string;
  startDate: string;
  endDate: string;
  completions: number;
  expected: number;
  rate: number;
  averagePerDay: number;
}

export interface WeekRange {
  monday: Date;
  sunday: Date;
}

export interface ConsistencyScoreBreakdown {
  score: number;
  completionRateComponent: number;
  recencyComponent: number;
  streakComponent: number;
  completionRate: CompletionRateData;
}

export type EstablishedHabitReadiness = 'starter' | 'established' | 'strongSignal';

/** True when every calendar day after streakNewest through today is OOO standby (protected). */
function isStreakActiveThroughToday(
  streakNewest: string,
  todayKey: string,
  protectedDates?: Set<string>
): boolean {
  if (streakNewest === todayKey) return true;
  if (!protectedDates?.size) return false;

  const newest = new Date(`${streakNewest}T12:00:00`);
  const today = new Date(`${todayKey}T12:00:00`);
  if (newest > today) return false;

  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  newest.setHours(0, 0, 0, 0);
  while (cursor > newest) {
    const key = cursor.toISOString().split('T')[0];
    if (!protectedDates.has(key)) return false;
    cursor.setDate(cursor.getDate() - 1);
    cursor.setHours(0, 0, 0, 0);
  }
  return true;
}

function countProtectedDaysInRange(start: Date, end: Date, protectedDates?: Set<string>): number {
  if (!protectedDates?.size) return 0;
  let count = 0;
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const endCopy = new Date(end);
  endCopy.setHours(0, 0, 0, 0);
  while (cur <= endCopy) {
    const key = toLocalDateKey(cur);
    if (protectedDates.has(key)) count += 1;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

/**
 * Monday 00:00:00 through Sunday 23:59:59 for the week containing referenceDate,
 * shifted back by `weekOffset` full weeks (0 = current week).
 */
export function getWeekRange(referenceDate: Date, weekOffset: number = 0): WeekRange {
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  const dayOfWeek = ref.getDay();
  const monday = new Date(ref);
  monday.setDate(ref.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setDate(monday.getDate() - weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
}

/** Client-side readiness tiers (UX gating; backend is authoritative on API). */
export function computeHabitReadiness(habit: Habit, logs: HabitLog[]): EstablishedHabitReadiness {
  const created = new Date(habit.createdAt);
  const ageDays = Math.max(0, Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)));
  const completionCount = logs.length;

  if (completionCount < 5 || ageDays < 7) {
    return 'starter';
  }
  if (completionCount >= 14 || ageDays >= 30) {
    return 'strongSignal';
  }
  if (completionCount >= 5 || (ageDays >= 14 && completionCount >= 1)) {
    return 'established';
  }
  return 'starter';
}

/**
 * Get all streaks for a habit. startDate = older day, endDate = newer day in range.
 */
export function getAllStreaks(logs: HabitLog[], protectedDates?: Set<string>): StreakData {
  if (logs.length === 0) {
    return { current: 0, longest: 0, allStreaks: [] };
  }

  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  const logsByDate = new Map<string, HabitLog[]>();
  sortedLogs.forEach((log) => {
    const date = new Date(log.completedAt);
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toISOString().split('T')[0];
    if (!logsByDate.has(dateKey)) {
      logsByDate.set(dateKey, []);
    }
    logsByDate.get(dateKey)!.push(log);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = today.toISOString().split('T')[0];

  const allStreaks: StreakData['allStreaks'] = [];
  let currentStreak = 0;
  let longestStreak = 0;

  const checkDate = new Date(today);
  checkDate.setHours(0, 0, 0, 0);

  let streakNewest: string | null = null;
  let streakOldest: string | null = null;
  let isInStreak = false;
  const maxDaysToCheck = 365;

  const dateIterator = new Date(checkDate);
  for (let i = 0; i < maxDaysToCheck; i++) {
    const dateKey = dateIterator.toISOString().split('T')[0];
    const hasCompletion = logsByDate.has(dateKey);

    if (hasCompletion) {
      if (!isInStreak) {
        isInStreak = true;
        streakNewest = dateKey;
        currentStreak = 0;
      }
      currentStreak++;
      streakOldest = dateKey;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else if (protectedDates?.has(dateKey)) {
      // OOO Standby: neutral day — do not break an active streak
    } else if (isInStreak && streakNewest && streakOldest) {
      allStreaks.push({
        startDate: streakOldest,
        endDate: streakNewest,
        length: currentStreak,
        isActive: isStreakActiveThroughToday(streakNewest, todayKey, protectedDates),
      });
      isInStreak = false;
      currentStreak = 0;
      streakNewest = null;
      streakOldest = null;
    }

    dateIterator.setDate(dateIterator.getDate() - 1);
    dateIterator.setHours(0, 0, 0, 0);
  }

  if (isInStreak && streakNewest && streakOldest) {
    allStreaks.push({
      startDate: streakOldest,
      endDate: streakNewest,
      length: currentStreak,
      isActive: isStreakActiveThroughToday(streakNewest, todayKey, protectedDates),
    });
  }

  const longestFromAll = allStreaks.reduce((max, streak) => Math.max(max, streak.length), 0);
  longestStreak = Math.max(longestStreak, longestFromAll);

  const activeStreak = allStreaks.find((s) => s.isActive);
  const currentStreakValue = activeStreak ? activeStreak.length : 0;

  return {
    current: currentStreakValue,
    longest: longestStreak,
    allStreaks: allStreaks.sort(
      (a, b) =>
        new Date(b.endDate ?? b.startDate).getTime() - new Date(a.endDate ?? a.startDate).getTime()
    ),
  };
}

/**
 * Calculate completion rate for a habit
 */
export function calculateCompletionRate(
  logs: HabitLog[],
  habit: Habit,
  startDate?: Date,
  endDate?: Date,
  protectedDates?: Set<string>
): CompletionRateData {
  const start = startDate ? new Date(startDate) : new Date(habit.createdAt);
  const end = endDate ? new Date(endDate) : new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const filteredLogs = logs.filter((log) => {
    const logDate = new Date(log.completedAt);
    return logDate >= start && logDate <= end;
  });

  const actual = filteredLogs.reduce((sum, log) => sum + (log.amount || 1), 0);

  const protectedCount = countProtectedDaysInRange(start, end, protectedDates);
  let expected = 0;
  if (habit.dailyTarget) {
    const daysDiff =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1 - protectedCount;
    expected = Math.max(0, daysDiff) * habit.dailyTarget;
  } else if (habit.weeklyTarget) {
    const weeksDiff = Math.ceil(
      Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1 - protectedCount) /
        7
    );
    expected = weeksDiff * habit.weeklyTarget;
  } else {
    if (habit.frequency === 'Daily') {
      const daysDiff =
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1 - protectedCount;
      expected = Math.max(0, daysDiff);
    } else if (habit.frequency === 'Weekly') {
      const weeksDiff = Math.ceil(
        Math.max(
          0,
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1 - protectedCount
        ) / 7
      );
      expected = weeksDiff;
    }
  }

  const rate = expected > 0 ? (actual / expected) * 100 : 0;

  return {
    period: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
    actual,
    expected,
    rate: Math.min(100, rate),
  };
}

/**
 * Calculate consistency score (0-100) with breakdown for tooltips.
 */
export function getConsistencyScoreBreakdown(
  logs: HabitLog[],
  habit: Habit,
  protectedDates?: Set<string>
): ConsistencyScoreBreakdown {
  if (logs.length === 0) {
    const emptyRate = calculateCompletionRate(logs, habit, undefined, undefined, protectedDates);
    return {
      score: 0,
      completionRateComponent: 0,
      recencyComponent: 0,
      streakComponent: 0,
      completionRate: emptyRate,
    };
  }

  const completionRate = calculateCompletionRate(logs, habit, undefined, undefined, protectedDates);
  const completionRateComponent = (completionRate.rate / 100) * 70;

  const now = new Date();
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
  const recentDays = 30;
  const recentLogs = sortedLogs.filter((log) => {
    const logDate = new Date(log.completedAt);
    const daysAgo = Math.ceil((now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysAgo <= recentDays;
  });
  const recentWeight = Math.min(1, recentLogs.length / (recentDays * 0.5));
  const recencyComponent = recentWeight * 20;

  const streaks = getAllStreaks(logs, protectedDates);
  const streakComponent = Math.min(10, (streaks.current / 30) * 10);

  const score = Math.min(100, completionRateComponent + recencyComponent + streakComponent);

  return {
    score,
    completionRateComponent,
    recencyComponent,
    streakComponent,
    completionRate,
  };
}

export function calculateConsistencyScore(logs: HabitLog[], habit: Habit): number {
  return getConsistencyScoreBreakdown(logs, habit).score;
}

/**
 * Compare two periods using completion counts and aligned rate windows when habit provided.
 */
export function calculateTrend(
  currentLogs: HabitLog[],
  previousLogs: HabitLog[],
  habit: Habit,
  currentStart?: Date,
  currentEnd?: Date,
  previousStart?: Date,
  previousEnd?: Date
): TrendData {
  const currentRate =
    currentStart && currentEnd
      ? calculateCompletionRate(currentLogs, habit, currentStart, currentEnd)
      : calculateCompletionRate(currentLogs, habit);
  const previousRate =
    previousStart && previousEnd
      ? calculateCompletionRate(previousLogs, habit, previousStart, previousEnd)
      : calculateCompletionRate(previousLogs, habit);

  const change = currentRate.actual - previousRate.actual;
  const changePercent =
    previousRate.actual > 0
      ? ((currentRate.actual - previousRate.actual) / previousRate.actual) * 100
      : currentRate.actual > 0
        ? 100
        : 0;

  return {
    value: currentRate.actual,
    previousValue: previousRate.actual,
    change,
    changePercent,
    isImproving: changePercent >= 0,
  };
}

/**
 * Generate heatmap data for calendar visualization
 */
export function generateHeatmapData(
  logs: HabitLog[],
  months: number = 6,
  offDayDates?: Set<string>
): HeatmapDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setHours(0, 0, 0, 0);

  const logsByDate = new Map<string, number>();
  logs.forEach((log) => {
    const logDate = new Date(log.completedAt);
    logDate.setHours(0, 0, 0, 0);
    if (logDate >= startDate) {
      const dateKey = logDate.toISOString().split('T')[0];
      const currentCount = logsByDate.get(dateKey) || 0;
      logsByDate.set(dateKey, currentCount + (log.amount || 1));
    }
  });

  const heatmapDays: HeatmapDay[] = [];
  const currentDate = new Date(startDate);
  const maxCount = Math.max(...Array.from(logsByDate.values()), 1);

  while (currentDate <= today) {
    const dateKey = currentDate.toISOString().split('T')[0];
    const count = logsByDate.get(dateKey) || 0;

    let intensity = 0;
    if (count > 0) {
      if (maxCount <= 1) {
        intensity = 1;
      } else {
        intensity = Math.min(4, Math.ceil((count / maxCount) * 4));
      }
    }

    const isOffDay = offDayDates?.has(dateKey) ?? false;
    heatmapDays.push({
      date: dateKey,
      count: isOffDay ? 0 : count,
      intensity: isOffDay ? 0 : intensity,
      isOffDay,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return heatmapDays;
}

/**
 * Get logs for a specific date range
 */
export function getLogsForDateRange(logs: HabitLog[], startDate: Date, endDate: Date): HabitLog[] {
  const startKey = toLocalDateKey(startDate);
  const endKey = toLocalDateKey(endDate);
  return logs.filter((log) => {
    const logKey = getHabitLogCalendarDay(log.completedAt);
    return logKey >= startKey && logKey <= endKey;
  });
}

/**
 * Get logs grouped by week (Monday-Sunday), newest week first.
 */
export function getWeeklyData(
  logs: HabitLog[],
  habit: Habit,
  weeks: number = 8,
  protectedDates?: Set<string>
): WeeklyMonthlyData[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekData: WeeklyMonthlyData[] = [];

  for (let i = 0; i < weeks; i++) {
    const { monday, sunday } = getWeekRange(today, i);

    const weekLogs = getLogsForDateRange(logs, monday, sunday);
    const completions = weekLogs.reduce((sum, log) => sum + (log.amount || 1), 0);
    const protectedInWeek = countProtectedDaysInRange(monday, sunday, protectedDates);
    const availableDays = Math.max(1, 7 - protectedInWeek);
    const expected =
      habit.weeklyTarget || (habit.dailyTarget ? habit.dailyTarget * availableDays : availableDays);
    const rate = expected > 0 ? (completions / expected) * 100 : 0;

    weekData.push({
      period: `Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      startDate: monday.toISOString(),
      endDate: sunday.toISOString(),
      completions,
      expected,
      rate: Math.min(100, rate),
      averagePerDay: completions / 7,
    });
  }

  return weekData;
}

/**
 * Get logs grouped by month, newest month first.
 */
export function getMonthlyData(
  logs: HabitLog[],
  habit: Habit,
  months: number = 6,
  protectedDates?: Set<string>
): WeeklyMonthlyData[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthData: WeeklyMonthlyData[] = [];

  for (let i = 0; i < months; i++) {
    const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
    monthStart.setHours(0, 0, 0, 0);

    const monthLogs = getLogsForDateRange(logs, monthStart, monthEnd);
    const completions = monthLogs.reduce((sum, log) => sum + (log.amount || 1), 0);
    const daysInMonth = monthEnd.getDate();
    const protectedInMonth = countProtectedDaysInRange(monthStart, monthEnd, protectedDates);
    const availableDays = Math.max(1, daysInMonth - protectedInMonth);
    const expected = habit.dailyTarget
      ? habit.dailyTarget * availableDays
      : habit.weeklyTarget
        ? habit.weeklyTarget * Math.max(1, Math.ceil(availableDays / 7))
        : availableDays;
    const rate = expected > 0 ? (completions / expected) * 100 : 0;

    monthData.push({
      period: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      startDate: monthStart.toISOString(),
      endDate: monthEnd.toISOString(),
      completions,
      expected,
      rate: Math.min(100, rate),
      averagePerDay: completions / daysInMonth,
    });
  }

  return monthData;
}

/**
 * Get completion rate data for chart (by day/week/month), newest first.
 */
export function getCompletionRateData(
  logs: HabitLog[],
  habit: Habit,
  period: 'day' | 'week' | 'month' = 'day',
  days: number = 30,
  protectedDates?: Set<string>
): CompletionRateData[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (period === 'day') {
    const data: CompletionRateData[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      nextDate.setHours(0, 0, 0, 0);

      const dayLogs = getLogsForDateRange(logs, date, nextDate);
      const actual = dayLogs.reduce((sum, log) => sum + (log.amount || 1), 0);
      const dateKey = toLocalDateKey(date);
      const isProtected = protectedDates?.has(dateKey) ?? false;
      const expected = isProtected ? 0 : habit.dailyTarget || 1;
      const rate = isProtected || expected === 0 ? 0 : (actual / expected) * 100;

      data.push({
        period: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        actual,
        expected,
        rate: Math.min(100, rate),
      });
    }
    return data;
  }

  if (period === 'week') {
    return getWeeklyData(logs, habit, Math.ceil(days / 7), protectedDates).map((week) => ({
      period: week.period,
      actual: week.completions,
      expected: week.expected,
      rate: week.rate,
    }));
  }

  return getMonthlyData(logs, habit, Math.ceil(days / 30), protectedDates).map((month) => ({
    period: month.period,
    actual: month.completions,
    expected: month.expected,
    rate: month.rate,
  }));
}

/**
 * Generate calendar days for a specific month
 */
export function generateCalendarDays(
  year: number,
  month: number,
  logs: HabitLog[],
  offDayDates?: Set<string>
): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const logsByDate = new Map<string, HabitLog[]>();
  logs.forEach((log) => {
    const logDate = new Date(log.completedAt);
    logDate.setHours(0, 0, 0, 0);
    const dateKey = logDate.toISOString().split('T')[0];
    if (!logsByDate.has(dateKey)) {
      logsByDate.set(dateKey, []);
    }
    logsByDate.get(dateKey)!.push(log);
  });

  const calendarDays: CalendarDay[] = [];

  for (let i = 0; i < startingDayOfWeek; i++) {
    const date = new Date(year, month, 1 - (startingDayOfWeek - i));
    calendarDays.push({
      date,
      day: date.getDate(),
      isToday: false,
      isCurrentMonth: false,
      completionCount: 0,
      logs: [],
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toISOString().split('T')[0];
    const dayLogs = logsByDate.get(dateKey) || [];
    const completionCount = dayLogs.reduce((sum, log) => sum + (log.amount || 1), 0);
    const isToday = date.getTime() === today.getTime();

    calendarDays.push({
      date,
      day,
      isToday,
      isCurrentMonth: true,
      completionCount,
      logs: dayLogs,
      isOffDay: offDayDates?.has(dateKey) ?? false,
    });
  }

  return calendarDays;
}
