import { useState, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import type { Metric, MetricLog } from '@/types/growth-system';
import {
  getTimeSeriesData,
  getTrendData,
  detectAnomalies,
  predictTrajectory,
  getPeriodComparison,
} from '@/utils/metric-analytics';

interface MetricTimeSeriesChartProps {
  metric: Metric;
  logs: MetricLog[];
  height?: number;
  showTarget?: boolean;
  showTrend?: boolean;
  showAnomalies?: boolean;
  showPrediction?: boolean;
  showComparison?: boolean;
  className?: string;
}

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

export function MetricTimeSeriesChart({
  metric,
  logs,
  height = 300,
  showTarget = true,
  showTrend = true,
  showAnomalies = true,
  showPrediction = false,
  showComparison = false,
  className = '',
}: MetricTimeSeriesChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const chartData = useMemo(() => {
    let days: number;
    let period: 'day' | 'week' | 'month' = 'day';

    switch (timeRange) {
      case '7d':
        days = 7;
        period = 'day';
        break;
      case '30d':
        days = 30;
        period = 'day';
        break;
      case '90d':
        days = 90;
        period = 'week';
        break;
      case '1y':
        days = 365;
        period = 'month';
        break;
      case 'all':
        days = 365 * 2;
        period = 'month';
        break;
    }

    return getTimeSeriesData(logs, period, days);
  }, [logs, timeRange]);

  const trend = useMemo(() => {
    if (!showTrend || logs.length < 2) return null;
    return getTrendData(logs, metric);
  }, [logs, metric, showTrend]);

  const anomalies = useMemo(() => {
    if (!showAnomalies || logs.length < 3) return [];
    return detectAnomalies(logs, 2.0);
  }, [logs, showAnomalies]);

  const prediction = useMemo(() => {
    if (!showPrediction || logs.length < 3) return null;
    return predictTrajectory(logs, 30);
  }, [logs, showPrediction]);

  const comparison = useMemo(() => {
    if (!showComparison) return null;
    return getPeriodComparison(logs, timeRange === '7d' || timeRange === '30d' ? 'week' : 'month');
  }, [logs, timeRange, showComparison]);

  if (chartData.length === 0) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}
      >
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="mb-2">No data available for this period.</p>
          <p className="text-sm">Start logging values to see your progress!</p>
        </div>
      </div>
    );
  }

  const values = chartData.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = 600;
  const chartHeight = height;
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const xScale = (index: number) =>
    padding.left + (index / (chartData.length - 1 || 1)) * plotWidth;
  const yScale = (value: number) =>
    padding.top + plotHeight - ((value - minValue) / range) * plotHeight;

  // Build path for main line
  const pathData = chartData
    .map((point, index) => {
      const x = xScale(index);
      const y = yScale(point.value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Build area path
  const areaPath = `${pathData} L ${xScale(chartData.length - 1)} ${padding.top + plotHeight} L ${xScale(0)} ${padding.top + plotHeight} Z`;

  // Trend line (linear regression)
  let trendPath = '';
  if (trend && chartData.length >= 2) {
    const firstValue = chartData[0].value;
    const lastValue = chartData[chartData.length - 1].value;
    const startY = yScale(firstValue);
    const endY = yScale(lastValue);
    trendPath = `M ${xScale(0)} ${startY} L ${xScale(chartData.length - 1)} ${endY}`;
  }

  // Prediction line
  let predictionPath = '';
  if (prediction && chartData.length > 0) {
    const lastValue = chartData[chartData.length - 1].value;
    const lastX = xScale(chartData.length - 1);
    const lastY = yScale(lastValue);
    const futureX =
      xScale(chartData.length - 1) +
      (plotWidth / chartData.length) *
        (prediction.daysAhead /
          (timeRange === '7d' ? 1 : timeRange === '30d' ? 1 : timeRange === '90d' ? 7 : 30));
    const futureY = yScale(prediction.futureValue);
    predictionPath = `M ${lastX} ${lastY} L ${futureX} ${futureY}`;
  }

  const unit = metric.unit === 'custom' ? metric.customUnit || '' : metric.unit;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{metric.name} Trend</h3>

        {/* Time range selector */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {(['7d', '30d', '90d', '1y', 'all'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                timeRange === range
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {range === 'all' ? 'All Time' : range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Banner */}
      {comparison && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">{comparison.current.period}:</span>
              <span className="font-semibold text-gray-900 dark:text-white ml-2">
                {comparison.current.average.toFixed(1)} {unit}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-400">
                {comparison.previous.period}:
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {comparison.previous.average.toFixed(1)} {unit}
              </span>
              <span
                className={`font-medium ${
                  comparison.isImproving
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {comparison.changePercent >= 0 ? '+' : ''}
                {comparison.changePercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="relative">
        <svg width={chartWidth} height={chartHeight} className="overflow-visible">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + plotHeight - ratio * plotHeight;
            const value = minValue + ratio * range;
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + plotWidth}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-gray-200 dark:text-gray-700"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-500 dark:fill-gray-400"
                >
                  {value.toFixed(metric.unit === 'dollars' ? 0 : 1)}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} className="fill-blue-50 dark:fill-blue-900/20" />

          {/* Main line */}
          <path
            d={pathData}
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-blue-600 dark:stroke-blue-400"
          />

          {/* Target line */}
          {showTarget && metric.targetValue && (
            <line
              x1={padding.left}
              y1={yScale(metric.targetValue)}
              x2={padding.left + plotWidth}
              y2={yScale(metric.targetValue)}
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="6 6"
              className="text-orange-500 dark:text-orange-400"
            />
          )}

          {/* Trend line */}
          {trendPath && (
            <path
              d={trendPath}
              fill="none"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              className="stroke-green-500 dark:stroke-green-400 opacity-60"
            />
          )}

          {/* Prediction line */}
          {predictionPath && (
            <path
              d={predictionPath}
              fill="none"
              strokeWidth="2"
              strokeDasharray="8 4"
              className="stroke-purple-500 dark:stroke-purple-400 opacity-70"
            />
          )}

          {/* Data points */}
          {chartData.map((point, index) => {
            const x = xScale(index);
            const y = yScale(point.value);
            const isAnomaly = anomalies.some(
              (a) => new Date(a.date).toISOString().split('T')[0] === point.date
            );
            const isHovered = hoveredPoint === index;

            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 6 : 4}
                  className={`transition-all ${
                    isAnomaly
                      ? 'fill-red-500 dark:fill-red-400'
                      : 'fill-blue-600 dark:fill-blue-400'
                  }`}
                  onMouseEnter={() => setHoveredPoint(index)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                {isAnomaly && (
                  <circle cx={x} cy={y - 12} r="6" className="fill-red-500 dark:fill-red-400" />
                )}
              </g>
            );
          })}

          {/* Hover tooltip */}
          {hoveredPoint !== null && (
            <g>
              <rect
                x={xScale(hoveredPoint) - 50}
                y={yScale(chartData[hoveredPoint].value) - 50}
                width="100"
                height="40"
                rx="4"
                className="fill-gray-900 dark:fill-gray-100"
                opacity="0.9"
              />
              <text
                x={xScale(hoveredPoint)}
                y={yScale(chartData[hoveredPoint].value) - 35}
                textAnchor="middle"
                className="text-xs fill-white dark:fill-gray-900 font-medium"
              >
                {chartData[hoveredPoint].value.toFixed(metric.unit === 'dollars' ? 0 : 1)} {unit}
              </text>
              <text
                x={xScale(hoveredPoint)}
                y={yScale(chartData[hoveredPoint].value) - 20}
                textAnchor="middle"
                className="text-xs fill-white dark:fill-gray-900"
              >
                {chartData[hoveredPoint].period}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Actual Values</span>
        </div>
        {showTarget && metric.targetValue && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-orange-500 dark:bg-orange-400 border-dashed border-t-2"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Target</span>
          </div>
        )}
        {trendPath && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-green-500 dark:bg-green-400 border-dashed border-t-2"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Trend</span>
          </div>
        )}
        {predictionPath && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-purple-500 dark:bg-purple-400 border-dashed border-t-2"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Prediction</span>
          </div>
        )}
        {anomalies.length > 0 && (
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Anomalies ({anomalies.length})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
