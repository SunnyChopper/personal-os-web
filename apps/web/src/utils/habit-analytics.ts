import type { Habit, HabitLog } from '@/types/growth-system';

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
  /** Short human-readable description of how `expected` was derived (lifetime window). */
  expectedExplanation?: string;
}

export interface ConsistencyScoreBreakdown {
  /** Final score capped at 100 */
  total: number;
  baseScore: number;
  recencyBonus: number;
  streakBonus: number;
  /** Completion-rate component as a percent (same as weighted base / 70 × 100) */
  completionRatePercent: number;
  /** Count of logs in last 30 days */
  recentLogsCount: number;
  /** clamped min(1, recentLogsCount / (30 × 0.5)) before × 20 */
  recentWeight: number;
  /** Current streak (days), from getAllStreaks */
  currentStreak: number;
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
}

export interface CalendarDay {
  date: Date;
  day: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  completionCount: number;
  logs: HabitLog[];
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

/**
 * Get all streaks for a habit
 */
export function getAllStreaks(logs: HabitLog[]): StreakData {
  if (logs.length === 0) {
    return { current: 0, longest: 0, allStreaks: [] };
  }

  // Sort logs by date (newest first)
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  // Group logs by date
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

  // Calculate streaks by iterating through dates backwards from today
  const checkDate = new Date(today);
  checkDate.setHours(0, 0, 0, 0);

  let currentStreakStart: string | null = null;
  let currentStreakEnd: string | null = null;
  let isInStreak = false;
  const maxDaysToCheck = 365; // Check up to 1 year back

  const dateIterator = new Date(checkDate);
  for (let i = 0; i < maxDaysToCheck; i++) {
    const dateKey = dateIterator.toISOString().split('T')[0];
    const hasCompletion = logsByDate.has(dateKey);

    if (hasCompletion) {
      if (!isInStreak) {
        // Start a new streak
        isInStreak = true;
        currentStreakStart = dateKey;
        currentStreak = 0;
      }
      currentStreak++;
      currentStreakEnd = dateKey;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      if (isInStreak && currentStreakStart) {
        // End the current streak
        // When walking backward from today, currentStreakStart is the streak's newest day and
        // currentStreakEnd is the oldest; emit chronological bounds for UI/API.
        allStreaks.push({
          startDate: currentStreakEnd!,
          endDate: currentStreakStart,
          length: currentStreak,
          isActive: currentStreakStart === todayKey,
        });
        isInStreak = false;
        currentStreak = 0;
        currentStreakStart = null;
        currentStreakEnd = null;
      }
    }

    // Move to previous day
    dateIterator.setDate(dateIterator.getDate() - 1);
    dateIterator.setHours(0, 0, 0, 0);
  }

  // Add current streak if still active
  if (isInStreak && currentStreakStart) {
    allStreaks.push({
      startDate: currentStreakEnd!,
      endDate: currentStreakStart,
      length: currentStreak,
      isActive: currentStreakStart === todayKey,
    });
  }

  // Find longest streak from all streaks
  const longestFromAll = allStreaks.reduce((max, streak) => Math.max(max, streak.length), 0);
  longestStreak = Math.max(longestStreak, longestFromAll);

  // Get current streak (the active one or the most recent)
  const activeStreak = allStreaks.find((s) => s.isActive);
  currentStreak = activeStreak ? activeStreak.length : 0;

  return {
    current: currentStreak,
    longest: longestStreak,
    allStreaks: allStreaks.sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
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
  endDate?: Date
): CompletionRateData {
  const start = startDate || new Date(habit.createdAt);
  const end = endDate || new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const filteredLogs = logs.filter((log) => {
    const logDate = new Date(log.completedAt);
    return logDate >= start && logDate <= end;
  });

  const actual = filteredLogs.reduce((sum, log) => sum + (log.amount || 1), 0);

  let expected = 0;
  let expectedExplanation = '';

  if (habit.dailyTarget) {
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    expected = daysDiff * habit.dailyTarget;
    expectedExplanation = `Daily target: ${habit.dailyTarget} × ${daysDiff} day span (inclusive)`;
  } else if (habit.weeklyTarget) {
    const weeksDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
    expected = weeksDiff * habit.weeklyTarget;
    expectedExplanation = `Weekly target: ${habit.weeklyTarget} × ${weeksDiff} week span (rounded up)`;
  } else {
    // No target, use frequency
    if (habit.frequency === 'Daily') {
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      expected = daysDiff;
      expectedExplanation = `No numeric target — frequency Daily → expect 1 per day × ${daysDiff} day span`;
    } else if (habit.frequency === 'Weekly') {
      const weeksDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
      expected = weeksDiff;
      expectedExplanation = `No numeric target — frequency Weekly → expect 1 per week × ${weeksDiff} week span`;
    }
  }

  const rate = expected > 0 ? (actual / expected) * 100 : 0;

  return {
    period: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
    actual,
    expected,
    rate: Math.min(100, rate),
    ...(expectedExplanation ? { expectedExplanation } : {}),
  };
}

/**
 * Consistency score with intermediate values for UX copy.
 */
export function calculateConsistencyScoreBreakdown(
  logs: HabitLog[],
  habit: Habit
): ConsistencyScoreBreakdown {
  if (logs.length === 0) {
    return {
      total: 0,
      baseScore: 0,
      recencyBonus: 0,
      streakBonus: 0,
      completionRatePercent: 0,
      recentLogsCount: 0,
      recentWeight: 0,
      currentStreak: 0,
    };
  }

  const completionRate = calculateCompletionRate(logs, habit);
  const baseScore = (completionRate.rate / 100) * 70;

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
  const recencyBonus = recentWeight * 20;

  const streaks = getAllStreaks(logs);
  const streakBonus = Math.min(10, (streaks.current / 30) * 10);
  const total = Math.min(100, baseScore + recencyBonus + streakBonus);

  return {
    total,
    baseScore,
    recencyBonus,
    streakBonus,
    completionRatePercent: completionRate.rate,
    recentLogsCount: recentLogs.length,
    recentWeight,
    currentStreak: streaks.current,
  };
}

/**
 * Calculate consistency score (0-100)
 */
export function calculateConsistencyScore(logs: HabitLog[], habit: Habit): number {
  return calculateConsistencyScoreBreakdown(logs, habit).total;
}

/**
 * Calculate trend data comparing two periods
 */
export function calculateTrend(
  currentLogs: HabitLog[],
  previousLogs: HabitLog[],
  habit: Habit
): TrendData {
  const currentRate = calculateCompletionRate(currentLogs, habit);
  const previousRate = calculateCompletionRate(previousLogs, habit);

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
export function generateHeatmapData(logs: HabitLog[], months: number = 6): HeatmapDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setHours(0, 0, 0, 0);

  // Group logs by date
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

  // Generate all days in range
  const heatmapDays: HeatmapDay[] = [];
  const currentDate = new Date(startDate);
  const maxCount = Math.max(...Array.from(logsByDate.values()), 1);

  while (currentDate <= today) {
    const dateKey = currentDate.toISOString().split('T')[0];
    const count = logsByDate.get(dateKey) || 0;

    // Calculate intensity (0-4)
    let intensity = 0;
    if (count > 0) {
      if (maxCount <= 1) {
        intensity = 1;
      } else {
        intensity = Math.min(4, Math.ceil((count / maxCount) * 4));
      }
    }

    heatmapDays.push({
      date: dateKey,
      count,
      intensity,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return heatmapDays;
}

/**
 * Get logs for a specific date range
 */
export function getLogsForDateRange(logs: HabitLog[], startDate: Date, endDate: Date): HabitLog[] {
  return logs.filter((log) => {
    const logDate = new Date(log.completedAt);
    return logDate >= startDate && logDate <= endDate;
  });
}

/**
 * Get logs grouped by week (Monday-Sunday)
 */
export function getWeeklyData(
  logs: HabitLog[],
  habit: Habit,
  weeks: number = 8
): WeeklyMonthlyData[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekData: WeeklyMonthlyData[] = [];

  for (let i = 0; i < weeks; i++) {
    const anchorDay = new Date(today);
    anchorDay.setDate(today.getDate() - i * 7);

    // Calendar week containing `anchorDay` (Mon-Sun).
    const dayOfWeek = anchorDay.getDay();
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const monday = new Date(anchorDay);
    monday.setDate(anchorDay.getDate() - daysSinceMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const weekLogs = getLogsForDateRange(logs, monday, sunday);
    const completions = weekLogs.reduce((sum, log) => sum + (log.amount || 1), 0);
    const expected = habit.weeklyTarget || (habit.dailyTarget ? habit.dailyTarget * 7 : 7);
    const rate = (completions / expected) * 100;

    weekData.unshift({
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
 * Get logs grouped by month
 */
export function getMonthlyData(
  logs: HabitLog[],
  habit: Habit,
  months: number = 6
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
    const expected = habit.dailyTarget
      ? habit.dailyTarget * daysInMonth
      : habit.weeklyTarget
        ? habit.weeklyTarget * 4
        : daysInMonth;
    const rate = (completions / expected) * 100;

    monthData.unshift({
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
 * Get completion rate data for chart (by day/week/month)
 */
export function getCompletionRateData(
  logs: HabitLog[],
  habit: Habit,
  period: 'day' | 'week' | 'month' = 'day',
  days: number = 30
): CompletionRateData[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const data: CompletionRateData[] = [];

  if (period === 'day') {
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      nextDate.setHours(0, 0, 0, 0);

      const dayLogs = getLogsForDateRange(logs, date, nextDate);
      const actual = dayLogs.reduce((sum, log) => sum + (log.amount || 1), 0);
      const expected = habit.dailyTarget || 1;
      const rate = (actual / expected) * 100;

      data.push({
        period: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        actual,
        expected,
        rate: Math.min(100, rate),
      });
    }
  } else if (period === 'week') {
    return getWeeklyData(logs, habit, Math.ceil(days / 7)).map((week) => ({
      period: week.period,
      actual: week.completions,
      expected: week.expected,
      rate: week.rate,
    }));
  } else {
    return getMonthlyData(logs, habit, Math.ceil(days / 30)).map((month) => ({
      period: month.period,
      actual: month.completions,
      expected: month.expected,
      rate: month.rate,
    }));
  }

  return data;
}

/**
 * Generate calendar days for a specific month
 */
export function generateCalendarDays(year: number, month: number, logs: HabitLog[]): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Group logs by date
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

  // Add empty days for alignment
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

  // Add days of the month
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
    });
  }

  return calendarDays;
}
