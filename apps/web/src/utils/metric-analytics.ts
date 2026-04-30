import type { Metric, MetricLog, MetricDirection } from '@/types/growth-system';

// Start: Key Data Types
export type TrendData = {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  velocity: number;
  acceleration: number;
  isImproving: boolean;
};

export type TimeSeriesDataPoint = {
  date: string;
  value: number;
  period: string;
};

export type ProgressData = {
  current: number;
  target: number | null;
  percentage: number;
  remaining: number | null;
  isOnTrack: boolean;
  daysToTarget: number | null;
};

export type Anomaly = {
  logId: string;
  value: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
  date: string;
};

export type CorrelationResult = {
  metricId1: string;
  metricId2: string;
  correlation: number;
  strength: 'weak' | 'moderate' | 'strong';
  direction: 'positive' | 'negative';
  sampleSize: number;
};

export type PredictionResult = {
  futureValue: number;
  confidence: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  daysAhead: number;
  method: 'linear' | 'exponential' | 'moving_average';
};

export type HeatmapDay = {
  date: string;
  value: number | null;
  intensity: number;
  hasLog: boolean;
};

export type StreakData = {
  current: number;
  longest: number;
  allStreaks: Array<{
    startDate: string;
    endDate: string | null;
    length: number;
    isActive: boolean;
  }>;
};

export type PeriodComparison = {
  current: {
    period: string;
    average: number;
    total: number;
    count: number;
  };
  previous: {
    period: string;
    average: number;
    total: number;
    count: number;
  };
  change: number;
  changePercent: number;
  isImproving: boolean;
};
// End: Key Data Types

export function getTrendData(logs: MetricLog[], metric: Metric): TrendData | null {
  if (logs.length < 2) return null;

  // Chronologically sort logs
  const sorted = [...logs].sort((a, b) => +new Date(a.loggedAt) - +new Date(b.loggedAt));
  const current = sorted[sorted.length - 1].value;
  const previous = sorted[sorted.length - 2].value;
  const change = current - previous;
  const changePercent = previous !== 0 ? (change / previous) * 100 : 0;

  // Velocity per day
  const currentDate = new Date(sorted[sorted.length - 1].loggedAt);
  const prevDate = new Date(sorted[sorted.length - 2].loggedAt);
  const days = Math.max(1, (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
  const velocity = change / days;

  // Acceleration
  let acceleration = 0;
  if (sorted.length >= 3) {
    const prevPrev = sorted[sorted.length - 3].value;
    const prevPrevDate = new Date(sorted[sorted.length - 3].loggedAt);
    const prevDays = Math.max(
      1,
      (prevDate.getTime() - prevPrevDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const prevVelocity = (previous - prevPrev) / prevDays;
    acceleration = velocity - prevVelocity;
  }

  const isImproving =
    metric.direction === 'Higher' ? change >= 0 : metric.direction === 'Lower' ? change <= 0 : true;

  return { current, previous, change, changePercent, velocity, acceleration, isImproving };
}

export function getTimeSeriesData(
  logs: MetricLog[],
  period: 'day' | 'week' | 'month',
  days: number = 30
): TimeSeriesDataPoint[] {
  if (!logs.length) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Sort
  const sorted = [...logs].sort((a, b) => +new Date(a.loggedAt) - +new Date(b.loggedAt));
  const data: TimeSeriesDataPoint[] = [];

  if (period === 'day') {
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const next = new Date(date);
      next.setDate(date.getDate() + 1);

      const logsInDay = sorted.filter((log) => {
        const d = new Date(log.loggedAt);
        return d >= date && d < next;
      });

      const value = logsInDay.length
        ? logsInDay.reduce((sum, l) => sum + l.value, 0) / logsInDay.length
        : null;

      if (value !== null) {
        data.push({
          date: date.toISOString().split('T')[0],
          value,
          period: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        });
      }
    }
  } else if (period === 'week') {
    const nWeeks = Math.ceil(days / 7);
    for (let i = nWeeks - 1; i >= 0; i--) {
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() - i * 7);
      const dow = weekEnd.getDay();
      const sunday = new Date(weekEnd);
      sunday.setDate(weekEnd.getDate() - (dow === 0 ? 0 : dow));
      sunday.setHours(23, 59, 59, 999);

      const monday = new Date(sunday);
      monday.setDate(sunday.getDate() - 6);
      monday.setHours(0, 0, 0, 0);

      const logsInWeek = sorted.filter((log) => {
        const d = new Date(log.loggedAt);
        return d >= monday && d <= sunday;
      });

      const value = logsInWeek.length
        ? logsInWeek.reduce((sum, l) => sum + l.value, 0) / logsInWeek.length
        : null;

      if (value !== null) {
        data.push({
          date: monday.toISOString().split('T')[0],
          value,
          period: `Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        });
      }
    }
  } else {
    // Month
    const nMonths = Math.ceil(days / 30);
    for (let i = nMonths - 1; i >= 0; i--) {
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);

      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      monthStart.setHours(0, 0, 0, 0);

      const logsInMonth = sorted.filter((log) => {
        const d = new Date(log.loggedAt);
        return d >= monthStart && d <= monthEnd;
      });

      const value = logsInMonth.length
        ? logsInMonth.reduce((sum, l) => sum + l.value, 0) / logsInMonth.length
        : null;

      if (value !== null) {
        data.push({
          date: monthStart.toISOString().split('T')[0],
          value,
          period: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        });
      }
    }
  }

  return data;
}

export function calculateProgress(
  current: number,
  target: number | null,
  direction: MetricDirection
): ProgressData {
  if (!target) {
    return {
      current,
      target: null,
      percentage: 0,
      remaining: null,
      isOnTrack: true,
      daysToTarget: null,
    };
  }

  let percentage: number;
  let remaining: number | null;
  let isOnTrack: boolean;

  if (direction === 'Higher') {
    percentage = Math.min(100, (current / target) * 100);
    remaining = Math.max(0, target - current);
    isOnTrack = current >= target * 0.8;
  } else if (direction === 'Lower') {
    percentage = Math.min(100, (target / current) * 100);
    remaining = Math.max(0, current - target);
    isOnTrack = current <= target * 1.2;
  } else {
    const threshold = target * 0.1;
    const diff = Math.abs(current - target);
    percentage = Math.max(0, 100 - (diff / threshold) * 100);
    remaining = diff;
    isOnTrack = diff <= threshold;
  }

  return {
    current,
    target,
    percentage: Math.max(0, Math.min(100, percentage)),
    remaining,
    isOnTrack,
    daysToTarget: null,
  };
}

export function detectAnomalies(logs: MetricLog[], threshold: number = 2.0): Anomaly[] {
  if (logs.length < 3) return [];

  const values = logs.map((l) => l.value);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);

  const anomalies: Anomaly[] = [];
  logs.forEach((log) => {
    const deviation = Math.abs(log.value - mean) / stdDev;
    if (deviation >= threshold) {
      let severity: 'low' | 'medium' | 'high';
      if (deviation >= 3) severity = 'high';
      else if (deviation >= 2.5) severity = 'medium';
      else severity = 'low';
      anomalies.push({
        logId: log.id,
        value: log.value,
        expectedValue: mean,
        deviation,
        severity,
        date: log.loggedAt,
      });
    }
  });

  return anomalies.sort((a, b) => b.deviation - a.deviation);
}

export function calculateCorrelations(
  metric1Logs: MetricLog[],
  metric2Logs: MetricLog[]
): CorrelationResult | null {
  if (metric1Logs.length < 3 || metric2Logs.length < 3) return null;

  const aligned: Array<{ value1: number; value2: number }> = [];
  metric1Logs.forEach((log1) => {
    const d1 = new Date(log1.loggedAt);
    const closest = metric2Logs.reduce(
      (closest, log2) => {
        const d2 = new Date(log2.loggedAt);
        const diffDays = Math.abs(d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays < closest.diff && diffDays <= 1) {
          return { log: log2, diff: diffDays };
        }
        return closest;
      },
      { log: null as MetricLog | null, diff: Infinity }
    );
    if (closest.log) aligned.push({ value1: log1.value, value2: closest.log.value });
  });

  if (aligned.length < 3) return null;

  const n = aligned.length;
  const sum1 = aligned.reduce((s, p) => s + p.value1, 0);
  const sum2 = aligned.reduce((s, p) => s + p.value2, 0);
  const mean1 = sum1 / n;
  const mean2 = sum2 / n;
  let numerator = 0,
    denom1 = 0,
    denom2 = 0;
  aligned.forEach((p) => {
    const d1 = p.value1 - mean1;
    const d2 = p.value2 - mean2;
    numerator += d1 * d2;
    denom1 += d1 * d1;
    denom2 += d2 * d2;
  });
  const denominator = Math.sqrt(denom1 * denom2);
  const correlation = denominator !== 0 ? numerator / denominator : 0;
  const absCorr = Math.abs(correlation);
  let strength: 'weak' | 'moderate' | 'strong';
  if (absCorr >= 0.7) strength = 'strong';
  else if (absCorr >= 0.4) strength = 'moderate';
  else strength = 'weak';

  return {
    metricId1: metric1Logs[0].metricId,
    metricId2: metric2Logs[0].metricId,
    correlation,
    strength,
    direction: correlation >= 0 ? 'positive' : 'negative',
    sampleSize: n,
  };
}

export function predictTrajectory(logs: MetricLog[], days: number = 30): PredictionResult | null {
  if (logs.length < 3) return null;

  const sorted = [...logs].sort((a, b) => +new Date(a.loggedAt) - +new Date(b.loggedAt));
  const firstDate = new Date(sorted[0].loggedAt);

  const points = sorted.map((l) => {
    const d = new Date(l.loggedAt);
    const x = (d.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
    return { x, y: l.value };
  });

  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);

  const denom = n * sumXX - sumX * sumX;
  const slope = denom ? (n * sumXY - sumX * sumY) / denom : 0;
  const intercept = (sumY - slope * sumX) / n;

  const lastDate = new Date(sorted[sorted.length - 1].loggedAt);
  const lastX = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
  const futureX = lastX + days;
  const futureValue = slope * futureX + intercept;

  const meanY = sumY / n;
  const ssRes = points.reduce((sum, p) => sum + Math.pow(p.y - (slope * p.x + intercept), 2), 0);
  const ssTot = points.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0);
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  const confidence = Math.max(0, Math.min(1, rSquared));
  const stdError = Math.sqrt(ssRes / (n - 2));
  const margin = stdError * 1.96;

  return {
    futureValue,
    confidence,
    confidenceInterval: {
      lower: futureValue - margin,
      upper: futureValue + margin,
    },
    daysAhead: days,
    method: 'linear',
  };
}

export function generateHeatmapData(logs: MetricLog[], months: number = 6): HeatmapDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setHours(0, 0, 0, 0);

  const logsByDate = new Map<string, number[]>();
  logs.forEach((log) => {
    const d = new Date(log.loggedAt);
    d.setHours(0, 0, 0, 0);
    if (d >= startDate) {
      const key = d.toISOString().split('T')[0];
      if (!logsByDate.has(key)) logsByDate.set(key, []);
      logsByDate.get(key)!.push(log.value);
    }
  });

  const allValues = Array.from(logsByDate.values()).flat();
  const maxValue = Math.max(...allValues, 1);
  const minValue = Math.min(...allValues, 0);
  const heatmapDays: HeatmapDay[] = [];
  const currentDate = new Date(startDate);
  while (currentDate <= today) {
    const key = currentDate.toISOString().split('T')[0];
    const dayValues = logsByDate.get(key) || [];
    const hasLog = dayValues.length > 0;
    const avgValue = hasLog ? dayValues.reduce((sum, v) => sum + v, 0) / dayValues.length : null;
    let intensity = 0;
    if (hasLog && avgValue !== null) {
      const range = maxValue - minValue;
      if (range > 0) {
        const normalized = (avgValue - minValue) / range;
        intensity = Math.min(4, Math.ceil(normalized * 4));
      } else {
        intensity = 2;
      }
    }
    heatmapDays.push({
      date: key,
      value: avgValue,
      intensity,
      hasLog,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return heatmapDays;
}

export function calculateStreaks(logs: MetricLog[]): StreakData {
  if (!logs.length) return { current: 0, longest: 0, allStreaks: [] };

  const logsByDate = new Map<string, MetricLog[]>();
  logs.forEach((log) => {
    const d = new Date(log.loggedAt);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().split('T')[0];
    if (!logsByDate.has(key)) logsByDate.set(key, []);
    logsByDate.get(key)!.push(log);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = today.toISOString().split('T')[0];
  const allStreaks: StreakData['allStreaks'] = [];

  let currentStreak = 0;
  let longestStreak = 0;
  let currentStreakStart: string | null = null;
  let currentStreakEnd: string | null = null;
  let isActive = false;

  const maxDays = 365;
  const cursor = new Date(today);
  for (let i = 0; i < maxDays; i++) {
    const key = cursor.toISOString().split('T')[0];
    const exists = logsByDate.has(key);
    if (exists) {
      if (!isActive) {
        isActive = true;
        currentStreakStart = key;
        currentStreak = 0;
      }
      currentStreak++;
      currentStreakEnd = key;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      if (isActive && currentStreakStart) {
        allStreaks.push({
          startDate: currentStreakStart,
          endDate: currentStreakEnd,
          length: currentStreak,
          isActive: currentStreakEnd === todayKey,
        });
        isActive = false;
        currentStreak = 0;
        currentStreakStart = null;
        currentStreakEnd = null;
      }
    }
    cursor.setDate(cursor.getDate() - 1);
    cursor.setHours(0, 0, 0, 0);
  }

  if (isActive && currentStreakStart) {
    allStreaks.push({
      startDate: currentStreakStart,
      endDate: currentStreakEnd,
      length: currentStreak,
      isActive: true,
    });
  }

  const longestFromAll = allStreaks.reduce((m, s) => Math.max(m, s.length), 0);
  longestStreak = Math.max(longestStreak, longestFromAll);
  const active = allStreaks.find((s) => s.isActive);
  currentStreak = active ? active.length : 0;

  return {
    current: currentStreak,
    longest: longestStreak,
    allStreaks: allStreaks.sort((a, b) => +new Date(b.startDate) - +new Date(a.startDate)),
  };
}

export function getPeriodComparison(
  logs: MetricLog[],
  period: 'week' | 'month'
): PeriodComparison | null {
  if (!logs.length) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date;

  if (period === 'week') {
    const dow = today.getDay();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - (dow === 0 ? 0 : dow));
    sunday.setHours(23, 59, 59, 999);

    const monday = new Date(sunday);
    monday.setDate(sunday.getDate() - 6);
    monday.setHours(0, 0, 0, 0);

    currentStart = monday;
    currentEnd = sunday;

    previousEnd = new Date(monday);
    previousEnd.setDate(previousEnd.getDate() - 1);
    previousEnd.setHours(23, 59, 59, 999);

    previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - 6);
    previousStart.setHours(0, 0, 0, 0);
  } else {
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);

    currentStart = monthStart;
    currentEnd = monthEnd;

    previousEnd = new Date(monthStart);
    previousEnd.setDate(previousEnd.getDate() - 1);
    previousEnd.setHours(23, 59, 59, 999);

    previousStart = new Date(previousEnd.getFullYear(), previousEnd.getMonth(), 1);
    previousStart.setHours(0, 0, 0, 0);
  }

  const inRange = (date: Date, from: Date, to: Date) => date >= from && date <= to;
  const currentLogs = logs.filter((log) =>
    inRange(new Date(log.loggedAt), currentStart, currentEnd)
  );
  const previousLogs = logs.filter((log) =>
    inRange(new Date(log.loggedAt), previousStart, previousEnd)
  );

  const getTotal = (arr: MetricLog[]) =>
    arr.length ? arr.reduce((sum, l) => sum + l.value, 0) : 0;
  const getAvg = (arr: MetricLog[]) => (arr.length ? getTotal(arr) / arr.length : 0);
  const currentTotal = getTotal(currentLogs);
  const previousTotal = getTotal(previousLogs);
  const currentAvg = getAvg(currentLogs);
  const previousAvg = getAvg(previousLogs);

  const change = currentAvg - previousAvg;
  const changePercent = previousAvg !== 0 ? (change / previousAvg) * 100 : 0;

  return {
    current: {
      period: period === 'week' ? 'This Week' : 'This Month',
      average: currentAvg,
      total: currentTotal,
      count: currentLogs.length,
    },
    previous: {
      period: period === 'week' ? 'Last Week' : 'Last Month',
      average: previousAvg,
      total: previousTotal,
      count: previousLogs.length,
    },
    change,
    changePercent,
    isImproving: changePercent >= 0,
  };
}
