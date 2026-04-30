import { useMemo } from 'react';
import { MessageSquare, Link as LinkIcon, Calendar, TrendingUp } from 'lucide-react';
import type { Metric, MetricLog } from '@/types/growth-system';
import { detectAnomalies } from '@/utils/metric-analytics';

interface MetricContextualInsightsProps {
  metric: Metric;
  logs: MetricLog[];
}

export function MetricContextualInsights({ metric, logs }: MetricContextualInsightsProps) {
  const anomalies = useMemo(() => {
    if (logs.length < 3) return [];
    return detectAnomalies(logs, 2.0);
  }, [logs]);

  const anomalyLogIds = new Set(anomalies.map((a) => a.logId));

  if (logs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contextual Insights</h3>
      <div className="space-y-3">
        {logs.slice(0, 10).map((log, index) => {
          const isAnomaly = anomalyLogIds.has(log.id);
          const date = new Date(log.loggedAt);
          const isMonday = date.getDay() === 1;

          const insights = [];
          if (isAnomaly) {
            const anomaly = anomalies.find((a) => a.logId === log.id);
            insights.push({
              type: 'anomaly',
              message: `Unusual value detected (${anomaly?.severity} severity)`,
              icon: TrendingUp,
            });
          }
          if (isMonday && index < 3) {
            insights.push({
              type: 'pattern',
              message: 'Monday value - potential weekly pattern',
              icon: Calendar,
            });
          }

          return (
            <div
              key={log.id}
              className={`p-4 rounded-lg border ${
                isAnomaly
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {log.value.toFixed(metric.unit === 'dollars' ? 0 : 1)}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(log.loggedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {log.notes && (
                    <div className="flex items-start gap-2 mt-2">
                      <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                      <p className="text-sm text-gray-700 dark:text-gray-300">{log.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {insights.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2">
                  {insights.map((insight, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400"
                    >
                      <insight.icon className="w-3 h-3 mt-0.5" />
                      <span>{insight.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Placeholder for related events */}
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <LinkIcon className="w-3 h-3" />
                <span>Link to logbook entry</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
