import { useState } from 'react';
import { Calendar, MessageSquare, Link as LinkIcon, TrendingUp, AlertCircle } from 'lucide-react';
import type { Metric, MetricLog } from '@/types/growth-system';
import { getTrendData, detectAnomalies } from '@/utils/metric-analytics';

interface MetricLogHistoryProps {
  metric: Metric;
  logs: MetricLog[];
  onLogClick?: (log: MetricLog) => void;
  onDeleteLog?: (logId: string) => void;
  onEditLog?: (log: MetricLog) => void;
}

export function MetricLogHistory({
  metric,
  logs,
  onLogClick,
  onDeleteLog,
  onEditLog: _onEditLog,
}: MetricLogHistoryProps) {
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const toggleExpand = (logId: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

  // Detect anomalies for annotation
  const anomalies = detectAnomalies(logs, 2.0);
  const anomalyLogIds = new Set(anomalies.map((a) => a.logId));

  // Get trend for pattern annotation
  const trend = getTrendData(logs, metric);

  const getPatternAnnotation = (log: MetricLog, index: number) => {
    if (index === 0 && trend && trend.isImproving) {
      return 'Latest value - showing improvement';
    }
    if (anomalyLogIds.has(log.id)) {
      const anomaly = anomalies.find((a) => a.logId === log.id);
      return anomaly ? `Anomaly detected: ${anomaly.severity} severity` : null;
    }
    // Check if it's a Monday peak (example pattern)
    const date = new Date(log.loggedAt);
    if (date.getDay() === 1) {
      return 'Monday value - potential weekly pattern';
    }
    return null;
  };

  const unit = metric.unit === 'custom' ? metric.customUnit || '' : metric.unit;

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="mb-2">No logs yet</p>
        <p className="text-sm">Start tracking by logging your first value</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log, index) => {
        const isExpanded = expandedLogs.has(log.id);
        const annotation = getPatternAnnotation(log, index);
        const isAnomaly = anomalyLogIds.has(log.id);

        return (
          <div
            key={log.id}
            className={`bg-gray-50 dark:bg-gray-700 rounded-lg border transition-all ${
              isAnomaly
                ? 'border-red-200 dark:border-red-800'
                : 'border-gray-200 dark:border-gray-600'
            } ${onLogClick ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600' : ''}`}
            onClick={() => onLogClick?.(log)}
            onKeyDown={(e) => {
              if (onLogClick && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onLogClick(log);
              }
            }}
            role={onLogClick ? 'button' : undefined}
            tabIndex={onLogClick ? 0 : undefined}
            aria-label={
              onLogClick
                ? `View details for log entry from ${new Date(log.loggedAt).toLocaleDateString()}`
                : undefined
            }
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {log.value.toFixed(metric.unit === 'dollars' ? 0 : 1)}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{unit}</span>
                    {isAnomaly && (
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(log.loggedAt).toLocaleDateString()}</span>
                    <span className="text-xs">
                      {new Date(log.loggedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {annotation && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                      <TrendingUp className="w-3 h-3" />
                      <span>{annotation}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {log.notes && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(log.id);
                      }}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  )}
                  {onDeleteLog && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this log entry?')) {
                          onDeleteLog(log.id);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && log.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">{log.notes}</p>
                  </div>
                  {/* Placeholder for related events */}
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <LinkIcon className="w-3 h-3" />
                    <span>Link to logbook entry</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
