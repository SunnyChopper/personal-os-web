import { useMemo } from 'react';
import { MetricSparkline } from '@/components/molecules/MetricSparkline';
import { useGrowthSystemDashboard } from '@/hooks/useGrowthSystemDashboard';
import type { MetricSeriesWidgetConfig, WeeklyDashboardWidget } from '@/types/weekly-dashboard';

interface MetricSeriesWidgetProps {
  widget: WeeklyDashboardWidget;
}

export function MetricSeriesWidget({ widget }: MetricSeriesWidgetProps) {
  const cfg = widget.config as MetricSeriesWidgetConfig;
  const { metrics } = useGrowthSystemDashboard();
  const metric = metrics.find((m) => m.id === cfg.metricId);
  const weeks = cfg.comparisonWeeks ?? 5;
  const logs = metric?.logs ?? [];

  const hasData = useMemo(() => logs.length > 0, [logs]);

  if (!metric) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
        Metric not found. Update dashboard settings to pick a valid metric.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{metric.name}</h3>
        <span className="text-xs text-gray-500">{weeks} weeks</span>
      </div>
      {hasData ? (
        <MetricSparkline logs={logs} days={weeks * 7} height={64} width={280} color="orange" />
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">No logs in this window yet.</p>
      )}
    </div>
  );
}
