import type { Metric } from '@/types/growth-system';
import { calculateProgress } from '@/utils/metric-analytics';

interface MetricProgressRingProps {
  metric: Metric;
  currentValue: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showTarget?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { dimension: 64, fontSize: 'text-xs', strokeWidth: 6 },
  md: { dimension: 96, fontSize: 'text-sm', strokeWidth: 8 },
  lg: { dimension: 128, fontSize: 'text-base', strokeWidth: 10 },
};

export function MetricProgressRing({
  metric,
  currentValue,
  size = 'md',
  showLabel = true,
  showTarget = true,
  className = '',
}: MetricProgressRingProps) {
  const { dimension, fontSize, strokeWidth } = sizeConfig[size];
  const progress = calculateProgress(currentValue, metric.targetValue, metric.direction);

  const normalizedProgress = Math.min(Math.max(progress.percentage, 0), 100);
  const radius = (dimension - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (normalizedProgress / 100) * circumference;

  // Determine color based on progress and direction
  const getColor = () => {
    if (progress.isOnTrack) {
      return 'text-green-600 dark:text-green-400';
    } else if (progress.percentage >= 50) {
      return 'text-yellow-600 dark:text-yellow-400';
    } else {
      return 'text-red-600 dark:text-red-400';
    }
  };

  const unit = metric.unit === 'custom' ? metric.customUnit || '' : metric.unit;

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <div className="relative inline-flex items-center justify-center">
        <svg width={dimension} height={dimension} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`transition-all duration-500 ease-out ${getColor()}`}
          />
          {/* Target indicator (if target exists) */}
          {metric.targetValue && (
            <circle
              cx={dimension / 2}
              cy={dimension / 2}
              r={radius + strokeWidth / 2 + 2}
              stroke="currentColor"
              strokeWidth={2}
              fill="none"
              strokeDasharray="4 4"
              className="text-gray-400 dark:text-gray-500 opacity-50"
            />
          )}
        </svg>
        {showLabel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`font-bold ${fontSize} text-gray-900 dark:text-white`}>
              {currentValue.toFixed(metric.unit === 'dollars' ? 0 : 1)}
            </span>
            {unit && <span className="text-xs text-gray-500 dark:text-gray-400">{unit}</span>}
          </div>
        )}
      </div>
      {showTarget && metric.targetValue && (
        <div className="mt-2 text-center">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Target: {metric.targetValue.toFixed(metric.unit === 'dollars' ? 0 : 1)} {unit}
          </div>
          <div className={`text-xs font-medium ${getColor()}`}>
            {normalizedProgress.toFixed(0)}% complete
          </div>
        </div>
      )}
    </div>
  );
}
