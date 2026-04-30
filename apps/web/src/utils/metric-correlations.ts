import type { Metric, MetricLog } from '@/types/growth-system';
import { calculateCorrelations } from './metric-analytics';

export interface CorrelationMatrix {
  metricId1: string;
  metricId2: string;
  correlation: number;
  strength: 'weak' | 'moderate' | 'strong';
  direction: 'positive' | 'negative';
  sampleSize: number;
}

/**
 * Calculate correlation matrix for all metrics
 */
export function calculateCorrelationMatrix(
  metrics: Metric[],
  allLogs: Map<string, MetricLog[]>
): CorrelationMatrix[] {
  const correlations: CorrelationMatrix[] = [];

  for (let i = 0; i < metrics.length; i++) {
    for (let j = i + 1; j < metrics.length; j++) {
      const metric1 = metrics[i];
      const metric2 = metrics[j];
      const logs1 = allLogs.get(metric1.id) || [];
      const logs2 = allLogs.get(metric2.id) || [];

      if (logs1.length >= 3 && logs2.length >= 3) {
        const result = calculateCorrelations(logs1, logs2);
        if (result) {
          correlations.push({
            metricId1: metric1.id,
            metricId2: metric2.id,
            correlation: result.correlation,
            strength: result.strength,
            direction: result.direction,
            sampleSize: result.sampleSize,
          });
        }
      }
    }
  }

  return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
}

/**
 * Find strong correlations (moderate or strong)
 */
export function findStrongCorrelations(
  metrics: Metric[],
  allLogs: Map<string, MetricLog[]>
): CorrelationMatrix[] {
  const allCorrelations = calculateCorrelationMatrix(metrics, allLogs);
  return allCorrelations.filter((c) => c.strength === 'moderate' || c.strength === 'strong');
}

/**
 * Get correlations for a specific metric
 */
export function getMetricCorrelations(
  metricId: string,
  metrics: Metric[],
  allLogs: Map<string, MetricLog[]>
): Array<CorrelationMatrix & { otherMetric: Metric }> {
  const allCorrelations = calculateCorrelationMatrix(metrics, allLogs);
  const metricCorrelations = allCorrelations.filter(
    (c) => c.metricId1 === metricId || c.metricId2 === metricId
  );

  return metricCorrelations.map((corr) => {
    const otherMetricId = corr.metricId1 === metricId ? corr.metricId2 : corr.metricId1;
    const otherMetric = metrics.find((m) => m.id === otherMetricId);
    return {
      ...corr,
      otherMetric: otherMetric!,
    };
  });
}
