import {
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  BarChart3,
  Award,
  Clock,
  Smartphone,
  Hand,
  Watch,
  Database,
  Activity,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Metric, MetricLog } from '@/types/growth-system';
import { AreaBadge } from '@/components/atoms/AreaBadge';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { MetricProgressRing } from './MetricProgressRing';
import { MetricSparkline } from './MetricSparkline';
import { MetricHeatmapPreview } from './MetricHeatmapPreview';
import { getTrendData, calculateProgress } from '@/utils/metric-analytics';
import { SUBCATEGORY_LABELS } from '@/constants/growth-system';

interface MetricCardProps {
  metric: Metric;
  logs?: MetricLog[];
  onClick: (metric: Metric) => void;
  onQuickLog?: (metric: Metric) => void;
}

export function MetricCard({ metric, logs = [], onClick, onQuickLog }: MetricCardProps) {
  const latestLog = logs.length > 0 ? logs[0] : null;
  // Only use actual log values for progress calculation, never baseline or cached currentValue
  // Baseline is for comparison only, not for progress display
  const currentValue = latestLog?.value ?? 0;
  const logCount = metric.logCount ?? logs.length;
  const milestoneCount = metric.milestoneCount ?? 0;

  // Let React Compiler handle memoization automatically
  const trend = logs.length < 2 ? null : getTrendData(logs, metric);
  const progress = calculateProgress(currentValue, metric.targetValue, metric.direction);

  const getStatus = () => {
    if (!metric.targetValue) return 'No Target';
    if (progress.isOnTrack) return 'On Track';
    if (progress.percentage >= 50) return 'At Risk';
    return 'Stalled';
  };

  const status = getStatus();
  const statusColors = {
    'On Track': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    'At Risk': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    Stalled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    'No Target': 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  };

  const getVelocityIcon = () => {
    if (!trend) return null;
    if (trend.acceleration > 0.1) {
      return <ArrowUp className="w-3 h-3 text-green-600 dark:text-green-400" />;
    } else if (trend.acceleration < -0.1) {
      return <ArrowDown className="w-3 h-3 text-red-600 dark:text-red-400" />;
    }
    return null;
  };

  const unit = metric.unit === 'custom' ? metric.customUnit || '' : metric.unit;

  // Source icon mapping
  const sourceIcons = {
    App: Smartphone,
    Manual: Hand,
    Device: Watch,
  };
  const SourceIcon = sourceIcons[metric.source as keyof typeof sourceIcons] || Database;

  // Direction icon
  const DirectionIcon =
    metric.direction === 'Higher' ? ArrowUp : metric.direction === 'Lower' ? ArrowDown : Minus;

  // Tracking frequency icon
  const frequencyIcons = {
    Daily: Calendar,
    Weekly: Activity,
    Monthly: Clock,
  };
  const FrequencyIcon =
    metric.trackingFrequency && frequencyIcons[metric.trackingFrequency]
      ? frequencyIcons[metric.trackingFrequency]
      : Clock;

  // Calculate baseline comparison
  const baselineComparison =
    metric.baselineValue !== null &&
    metric.baselineValue !== undefined &&
    metric.baselineValue !== currentValue
      ? ((currentValue - metric.baselineValue) / metric.baselineValue) * 100
      : null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(metric);
    }
  };

  return (
    <motion.div
      className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 md:p-6 cursor-pointer shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 h-full flex flex-col"
      onClick={() => onClick(metric)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      whileHover={{
        scale: 1.01,
        borderColor: 'rgb(59, 130, 246)',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 30 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      layout
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
              {metric.name}
            </h3>
            <AreaBadge area={metric.area} size="sm" />
          </div>
          {metric.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
              {metric.description}
            </p>
          )}
          {metric.subCategory && (
            <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              {SUBCATEGORY_LABELS[metric.subCategory]}
            </span>
          )}
        </div>
        <div
          className={`px-2.5 py-1 text-xs font-medium rounded-full ml-2 flex-shrink-0 ${statusColors[status as keyof typeof statusColors]}`}
        >
          {status}
        </div>
      </div>

      {/* Main Content Area - Flex grow to fill space */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Current Value and Progress Ring */}
        <div className="flex items-start justify-between mb-3 gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
              <span className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                {currentValue.toFixed(metric.unit === 'dollars' ? 0 : 1)}
              </span>
              <span className="text-base md:text-lg text-gray-600 dark:text-gray-400">{unit}</span>
              <DirectionIcon
                className={`w-4 h-4 md:w-5 md:h-5 ${
                  metric.direction === 'Higher'
                    ? 'text-green-600 dark:text-green-400'
                    : metric.direction === 'Lower'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-500 dark:text-gray-400'
                }`}
              />
            </div>

            {/* Trend Indicator */}
            {trend && (
              <div className="flex items-center gap-1.5 mb-2">
                {trend.isImproving ? (
                  <TrendingUp className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                )}
                <span
                  className={`text-xs font-medium ${
                    trend.isImproving
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {trend.changePercent >= 0 ? '+' : ''}
                  {trend.changePercent.toFixed(1)}%
                </span>
                {getVelocityIcon()}
              </div>
            )}

            {/* Baseline Comparison */}
            {baselineComparison !== null && (
              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mb-1">
                <BarChart3 className="w-3 h-3" />
                <span>
                  {baselineComparison >= 0 ? '+' : ''}
                  {baselineComparison.toFixed(1)}% vs baseline (
                  {metric.baselineValue?.toFixed(metric.unit === 'dollars' ? 0 : 1)} {unit})
                </span>
              </div>
            )}

            {/* Last Log Date */}
            {latestLog && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="w-3 h-3" />
                <span>{new Date(latestLog.loggedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          {metric.targetValue && (
            <div className="flex-shrink-0">
              <MetricProgressRing
                metric={metric}
                currentValue={currentValue}
                size="sm"
                showLabel={true}
                showTarget={false}
              />
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {metric.targetValue && (
          <div className="mb-3 flex-shrink-0">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span className="font-medium">{progress.percentage.toFixed(0)}% of target</span>
              {progress.remaining !== null && progress.remaining > 0 && (
                <span className="text-gray-500 dark:text-gray-500">
                  {progress.remaining.toFixed(1)} {unit} to go
                </span>
              )}
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${
                  progress.isOnTrack
                    ? 'bg-green-500 dark:bg-green-400'
                    : progress.percentage >= 50
                      ? 'bg-yellow-500 dark:bg-yellow-400'
                      : 'bg-red-500 dark:bg-red-400'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${progress.percentage}%` }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 200, damping: 25 }}
              />
            </div>
          </div>
        )}

        {/* Sparkline Chart */}
        {logs.length > 0 && (
          <div className="mb-3 flex-shrink-0">
            <MetricSparkline
              logs={logs}
              days={30}
              height={40}
              width={280}
              color="blue"
              showPoints={false}
            />
          </div>
        )}

        {/* Target Info */}
        {metric.targetValue && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3 flex-shrink-0">
            <Target className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              Target: {metric.targetValue.toFixed(metric.unit === 'dollars' ? 0 : 1)} {unit} (
              {metric.direction})
            </span>
          </div>
        )}

        {/* Heatmap Preview - Only show if there are logs */}
        {logs.length > 3 && (
          <div className="mb-3 flex-shrink-0">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">Activity</div>
            <MetricHeatmapPreview logs={logs} months={6} size="sm" />
          </div>
        )}
      </div>

      {/* Footer - Always at bottom */}
      <div className="flex flex-col gap-2 pt-3 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          {/* Source */}
          <div className="flex items-center gap-1.5">
            <SourceIcon className="w-3.5 h-3.5" />
            <span>{metric.source}</span>
          </div>

          {/* Tracking Frequency */}
          {metric.trackingFrequency && (
            <div className="flex items-center gap-1.5">
              <FrequencyIcon className="w-3.5 h-3.5" />
              <span>{metric.trackingFrequency}</span>
            </div>
          )}

          {/* Log Count */}
          {logCount > 0 && (
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              <span>
                {logCount} log{logCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Milestone Count */}
          {milestoneCount > 0 && (
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <Award className="w-3.5 h-3.5" />
              <span>
                {milestoneCount} milestone{milestoneCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Status Row */}
        <div className="flex items-center justify-between">
          <StatusBadge status={metric.status} size="sm" />
          {onQuickLog && metric.status === 'Active' && (
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onQuickLog(metric);
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 flex items-center gap-1.5"
              whileHover={{ scale: 1.05, backgroundColor: 'rgb(37, 99, 235)' }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quick Log</span>
              <span className="sm:hidden">Log</span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
