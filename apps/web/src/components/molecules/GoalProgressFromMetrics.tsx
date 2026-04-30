import { useMemo } from 'react';
import { Target, TrendingUp } from 'lucide-react';
import type { Goal, Metric, MetricLog } from '@/types/growth-system';
import { calculateProgress } from '@/utils/metric-analytics';
import { ProgressRing } from '@/components/atoms/ProgressRing';

interface GoalProgressFromMetricsProps {
  goal: Goal;
  linkedMetrics: Array<{ metric: Metric; logs: MetricLog[] }>;
}

export function GoalProgressFromMetrics({
  goal: _goal,
  linkedMetrics,
}: GoalProgressFromMetricsProps) {
  const metricContributions = useMemo(() => {
    return linkedMetrics.map(({ metric, logs }) => {
      const latestLog = logs.length > 0 ? logs[0] : null;
      if (!latestLog) {
        return {
          metric,
          progress: 0,
          contribution: 0,
        };
      }

      const progress = calculateProgress(latestLog.value, metric.targetValue, metric.direction);

      // Calculate contribution (equal weight for now, could be weighted)
      const contribution = progress.percentage / linkedMetrics.length;

      return {
        metric,
        progress: progress.percentage,
        contribution,
      };
    });
  }, [linkedMetrics]);

  const totalProgress = useMemo(() => {
    return metricContributions.reduce((sum, mc) => sum + mc.contribution, 0);
  }, [metricContributions]);

  if (linkedMetrics.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm">No metrics linked to this goal</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <div className="flex items-center justify-center">
        <div className="text-center">
          <ProgressRing progress={totalProgress} size="lg" color="blue" showLabel={true} />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Overall Progress from Metrics
          </p>
        </div>
      </div>

      {/* Metric Breakdown */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Metric Contributions
        </h4>
        <div className="space-y-3">
          {metricContributions.map(({ metric, progress, contribution }) => (
            <div
              key={metric.id}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-gray-900 dark:text-white">{metric.name}</h5>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {progress.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 dark:bg-blue-400 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Contributing {contribution.toFixed(1)}% to goal progress
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
