import { BarChart3, Plus, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Metric, MetricLog } from '@/types/growth-system';
import { EmptyState } from './EmptyState';
import Button from '@/components/atoms/Button';

interface MetricWithLogs {
  metric: Metric;
  latestLog: MetricLog | null;
  progress: number;
}

interface GoalMetricsSectionProps {
  metrics: MetricWithLogs[];
  onLinkMetric?: () => void;
  onLogMetric?: (metricId: string) => void;
  onMetricClick?: (metric: Metric) => void;
  showEmpty?: boolean;
}

export function GoalMetricsSection({
  metrics,
  onLinkMetric,
  onLogMetric,
  onMetricClick,
  showEmpty = true,
}: GoalMetricsSectionProps) {
  if (metrics.length === 0 && showEmpty) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Metrics (0)
          </h3>
        </div>
        <EmptyState
          icon={BarChart3}
          title="No metrics linked"
          description="Link metrics to track progress toward this goal automatically"
          actionLabel={onLinkMetric ? 'Link Metric' : undefined}
          onAction={onLinkMetric}
        />
      </div>
    );
  }

  const getProgressColor = (progress: number, direction: string) => {
    if (progress >= 90)
      return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
    if (progress >= 70)
      return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
    if (direction === 'Lower' && progress < 50)
      return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
    return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30';
  };

  const getTrendIcon = (metric: Metric) => {
    // Simplified trend detection - in real app, would compare recent logs
    if (metric.direction === 'Higher') return TrendingUp;
    if (metric.direction === 'Lower') return TrendingDown;
    return Activity;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Metrics ({metrics.length})
        </h3>
        {onLinkMetric && (
          <Button variant="secondary" size="sm" onClick={onLinkMetric}>
            <Plus className="w-4 h-4 mr-1" />
            Link Metric
          </Button>
        )}
      </div>

      {/* Metrics List */}
      <div className="space-y-3 flex-1">
        {metrics.map((item, index) => {
          const { metric, latestLog, progress } = item;
          const TrendIcon = getTrendIcon(metric);
          const progressColor = getProgressColor(progress, metric.direction);

          return (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onMetricClick?.(metric)}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {metric.name}
                  </h4>
                  {metric.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {metric.description}
                    </p>
                  )}
                </div>
                <TrendIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">
                    {latestLog
                      ? `${latestLog.value} ${metric.customUnit || metric.unit}`
                      : 'No data'}
                  </span>
                  {metric.targetValue && (
                    <span className="text-gray-600 dark:text-gray-400">
                      Target: {metric.targetValue}
                    </span>
                  )}
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, progress)}%` }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className={`h-full rounded-full ${progressColor.replace('text-', 'bg-').split(' ')[0]}`}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${progressColor}`}>
                  {progress}% to target
                </span>
                {onLogMetric && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLogMetric(metric.id);
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Quick Log
                  </button>
                )}
              </div>

              {latestLog && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Last logged: {new Date(latestLog.loggedAt).toLocaleDateString()}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
