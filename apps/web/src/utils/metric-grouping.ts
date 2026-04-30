import type { Metric, MetricLog, Goal } from '@/types/growth-system';
import { getTrendData, calculateProgress } from './metric-analytics';

export type MetricStatus = 'On Track' | 'At Risk' | 'Stalled' | 'No Target';
export type MetricMomentum = 'Improving' | 'Declining' | 'Stable';

export interface GroupedMetrics {
  [key: string]: Metric[];
}

export interface MetricWithStatus extends Metric {
  calculatedStatus: MetricStatus;
  momentum: MetricMomentum;
  priority: number;
  currentValue: number;
  progress: number;
}

/**
 * Group metrics by area
 */
export function groupByArea(metrics: Metric[]): GroupedMetrics {
  const grouped: GroupedMetrics = {};
  metrics.forEach((metric) => {
    if (!grouped[metric.area]) {
      grouped[metric.area] = [];
    }
    grouped[metric.area].push(metric);
  });
  return grouped;
}

/**
 * Calculate status from progress and target
 */
export function calculateMetricStatus(metric: Metric, logs: MetricLog[]): MetricStatus {
  if (!metric.targetValue) return 'No Target';

  const latestLog = logs.length > 0 ? logs[0] : null;
  if (!latestLog) return 'No Target';

  const progress = calculateProgress(latestLog.value, metric.targetValue, metric.direction);

  if (progress.isOnTrack) return 'On Track';
  if (progress.percentage >= 50) return 'At Risk';
  return 'Stalled';
}

/**
 * Group metrics by calculated status
 */
export function groupByStatus(
  metrics: Metric[],
  allLogs: Map<string, MetricLog[]>
): GroupedMetrics {
  const grouped: GroupedMetrics = {
    'On Track': [],
    'At Risk': [],
    Stalled: [],
    'No Target': [],
  };

  metrics.forEach((metric) => {
    const logs = allLogs.get(metric.id) || [];
    const status = calculateMetricStatus(metric, logs);
    grouped[status].push(metric);
  });

  return grouped;
}

/**
 * Calculate momentum from trend data
 */
export function calculateMomentum(metric: Metric, logs: MetricLog[]): MetricMomentum {
  if (logs.length < 2) return 'Stable';

  const trend = getTrendData(logs, metric);
  if (!trend) return 'Stable';

  // Consider both change and acceleration
  const changeThreshold = 0.05; // 5% change
  const accelerationThreshold = 0.1;

  if (trend.changePercent > changeThreshold && trend.acceleration > accelerationThreshold) {
    return 'Improving';
  } else if (
    trend.changePercent < -changeThreshold &&
    trend.acceleration < -accelerationThreshold
  ) {
    return 'Declining';
  }

  return 'Stable';
}

/**
 * Group metrics by momentum
 */
export function groupByMomentum(
  metrics: Metric[],
  allLogs: Map<string, MetricLog[]>
): GroupedMetrics {
  const grouped: GroupedMetrics = {
    Improving: [],
    Declining: [],
    Stable: [],
  };

  metrics.forEach((metric) => {
    const logs = allLogs.get(metric.id) || [];
    const momentum = calculateMomentum(metric, logs);
    grouped[momentum].push(metric);
  });

  return grouped;
}

/**
 * Calculate priority based on goals, status, and momentum
 */
export function calculatePriority(
  metric: Metric,
  logs: MetricLog[],
  goals: Goal[],
  goalMetrics: Map<string, string[]> // goalId -> metricIds
): number {
  let priority = 50; // Base priority

  // Boost priority if metric is linked to active goals
  const linkedGoals = goals.filter((goal) => {
    const metricIds = goalMetrics.get(goal.id) || [];
    return metricIds.includes(metric.id) && goal.status === 'Active';
  });
  priority += linkedGoals.length * 20;

  // Boost priority if metric is at risk or stalled
  const status = calculateMetricStatus(metric, logs);
  if (status === 'At Risk') priority += 15;
  if (status === 'Stalled') priority += 25;

  // Boost priority if momentum is declining
  const momentum = calculateMomentum(metric, logs);
  if (momentum === 'Declining') priority += 10;

  // Boost priority if metric has target
  if (metric.targetValue) priority += 5;

  // Reduce priority if metric is paused or archived
  if (metric.status === 'Paused') priority -= 20;
  if (metric.status === 'Archived') priority -= 50;

  return Math.max(0, Math.min(100, priority));
}

/**
 * Sort metrics by priority
 */
export function sortByPriority(
  metrics: Metric[],
  allLogs: Map<string, MetricLog[]>,
  goals: Goal[],
  goalMetrics: Map<string, string[]>
): MetricWithStatus[] {
  return metrics
    .map((metric) => {
      const logs = allLogs.get(metric.id) || [];
      const status = calculateMetricStatus(metric, logs);
      const momentum = calculateMomentum(metric, logs);
      const priority = calculatePriority(metric, logs, goals, goalMetrics);
      const latestLog = logs.length > 0 ? logs[0] : null;
      const currentValue = latestLog?.value || 0;
      const progress = metric.targetValue
        ? calculateProgress(currentValue, metric.targetValue, metric.direction).percentage
        : 0;

      return {
        ...metric,
        calculatedStatus: status,
        momentum,
        priority,
        currentValue,
        progress,
      };
    })
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Filter metrics by various criteria
 */
export function filterMetrics(
  metrics: Metric[],
  allLogs: Map<string, MetricLog[]>,
  filters: {
    area?: string;
    status?: string;
    momentum?: string;
    targetProximity?: 'approaching' | 'far' | 'reached';
    loggingFrequency?: 'recent' | 'needs_logging';
    searchQuery?: string;
  }
): Metric[] {
  let filtered = [...metrics];

  // Filter by area
  if (filters.area) {
    filtered = filtered.filter((m) => m.area === filters.area);
  }

  // Filter by calculated status
  if (filters.status) {
    filtered = filtered.filter((m) => {
      const logs = allLogs.get(m.id) || [];
      const status = calculateMetricStatus(m, logs);
      return status === filters.status;
    });
  }

  // Filter by momentum
  if (filters.momentum) {
    filtered = filtered.filter((m) => {
      const logs = allLogs.get(m.id) || [];
      const momentum = calculateMomentum(m, logs);
      return momentum === filters.momentum;
    });
  }

  // Filter by target proximity
  if (filters.targetProximity) {
    filtered = filtered.filter((m) => {
      if (!m.targetValue) return false;
      const logs = allLogs.get(m.id) || [];
      const latestLog = logs.length > 0 ? logs[0] : null;
      if (!latestLog) return false;

      const progress = calculateProgress(latestLog.value, m.targetValue, m.direction);

      if (filters.targetProximity === 'reached') {
        return progress.percentage >= 100;
      } else if (filters.targetProximity === 'approaching') {
        return progress.percentage >= 75 && progress.percentage < 100;
      } else {
        // far
        return progress.percentage < 75;
      }
    });
  }

  // Filter by logging frequency
  if (filters.loggingFrequency) {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    filtered = filtered.filter((m) => {
      const logs = allLogs.get(m.id) || [];
      const latestLog = logs.length > 0 ? logs[0] : null;

      if (filters.loggingFrequency === 'recent') {
        if (!latestLog) return false;
        const logDate = new Date(latestLog.loggedAt);
        return logDate >= sevenDaysAgo;
      } else {
        // needs_logging
        if (!latestLog) return true;
        const logDate = new Date(latestLog.loggedAt);
        return logDate < sevenDaysAgo;
      }
    });
  }

  // Filter by search query
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        (m.description && m.description.toLowerCase().includes(query))
    );
  }

  return filtered;
}
