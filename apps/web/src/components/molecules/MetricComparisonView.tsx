import { useMemo } from 'react';
import type { Metric, MetricLog } from '@/types/growth-system';
import { MetricTimeSeriesChart } from './MetricTimeSeriesChart';
import { getMetricCorrelations } from '@/utils/metric-correlations';
import { calculateCorrelations } from '@/utils/metric-analytics';

interface MetricComparisonViewProps {
  primaryMetric: Metric;
  primaryLogs: MetricLog[];
  allMetrics: Metric[];
  allLogs: Map<string, MetricLog[]>;
  onMetricSelect?: (metric: Metric) => void;
}

export function MetricComparisonView({
  primaryMetric,
  primaryLogs,
  allMetrics,
  allLogs,
  onMetricSelect,
}: MetricComparisonViewProps) {
  const correlations = useMemo(() => {
    return getMetricCorrelations(primaryMetric.id, allMetrics, allLogs);
  }, [primaryMetric.id, allMetrics, allLogs]);

  const strongCorrelations = useMemo(() => {
    return correlations.filter((c) => c.strength === 'moderate' || c.strength === 'strong');
  }, [correlations]);

  return (
    <div className="space-y-6">
      {/* Correlation Matrix */}
      {strongCorrelations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Metrics That Move Together
          </h3>
          <div className="space-y-3">
            {strongCorrelations.map((corr) => {
              const otherLogs = allLogs.get(corr.otherMetric.id) || [];
              const correlationResult = calculateCorrelations(primaryLogs, otherLogs);

              return (
                <div
                  key={corr.otherMetric.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {corr.otherMetric.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {corr.direction === 'positive'
                          ? 'Positive correlation'
                          : 'Negative correlation'}{' '}
                        ({corr.strength})
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${
                          corr.correlation > 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {corr.correlation > 0 ? '+' : ''}
                        {corr.correlation.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {corr.sampleSize} data points
                      </div>
                    </div>
                  </div>
                  {correlationResult && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {correlationResult.strength === 'strong'
                        ? 'Strong relationship: '
                        : 'Moderate relationship: '}
                      When {primaryMetric.name} changes, {corr.otherMetric.name} tends to{' '}
                      {corr.direction === 'positive'
                        ? 'move in the same direction'
                        : 'move in the opposite direction'}
                      .
                    </p>
                  )}
                  {onMetricSelect && (
                    <button
                      onClick={() => onMetricSelect(corr.otherMetric)}
                      className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View {corr.otherMetric.name} →
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Side-by-side comparison */}
      {strongCorrelations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Trend Comparison
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {primaryMetric.name}
              </h4>
              <MetricTimeSeriesChart
                metric={primaryMetric}
                logs={primaryLogs}
                height={200}
                showTarget={true}
                showTrend={true}
                showAnomalies={false}
                showPrediction={false}
                showComparison={false}
              />
            </div>
            {strongCorrelations[0] && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {strongCorrelations[0].otherMetric.name}
                </h4>
                <MetricTimeSeriesChart
                  metric={strongCorrelations[0].otherMetric}
                  logs={allLogs.get(strongCorrelations[0].otherMetric.id) || []}
                  height={200}
                  showTarget={true}
                  showTrend={true}
                  showAnomalies={false}
                  showPrediction={false}
                  showComparison={false}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {strongCorrelations.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="mb-2">No strong correlations found</p>
          <p className="text-sm">
            Track more metrics and log values consistently to discover relationships
          </p>
        </div>
      )}
    </div>
  );
}
