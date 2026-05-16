import { type ReactNode } from 'react';

import { HoverMetricHelp } from './HoverMetricHelp';

interface HabitStatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  tooltip?: ReactNode;
  trend?: {
    changePercent: number;
    isImproving: boolean;
  };
  action?: {
    label: string;
    onClick: () => void;
  };
  progress?: {
    current: number;
    target: number;
    label?: string;
  };
  className?: string;
}

export function HabitStatCard({
  label,
  value,
  icon,
  tooltip,
  trend,
  action,
  progress,
  className = '',
}: HabitStatCardProps) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
          {tooltip && <HoverMetricHelp>{tooltip}</HoverMetricHelp>}
        </div>
        {icon}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
        {trend && trend.changePercent !== 0 && (
          <div
            className={`flex items-center gap-1 text-xs ${
              trend.isImproving
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            <span>{trend.isImproving ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.changePercent).toFixed(0)}%</span>
          </div>
        )}
      </div>

      {progress && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>{progress.label || 'Progress'}</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {progress.current}/{progress.target}
            </span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 dark:bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (progress.current / progress.target) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className="w-full mt-2 px-3 py-1.5 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
