import { useState, useMemo } from 'react';
import type { Habit, HabitLog } from '@/types/growth-system';
import { getCompletionRateData, type CompletionRateData } from '@/utils/habit-analytics';
import { getHabitTypeColors } from '@/utils/habit-colors';

interface ChartItemProps {
  data: CompletionRateData;
  actualPercent: number;
  expectedPercent: number;
  ratePercent: number;
  colors: ReturnType<typeof getHabitTypeColors>;
}

function ChartItem({ data, actualPercent, expectedPercent, ratePercent, colors }: ChartItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-3 mb-1">
        <div className="w-24 text-xs text-gray-600 dark:text-gray-400 text-right flex-shrink-0">
          {data.period}
        </div>
        <div className="flex-1 relative min-w-0">
          {/* Expected bar (background) */}
          {data.expected > 0 && (
            <div
              className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative"
              style={{ width: `${Math.min(100, expectedPercent)}%` }}
            >
              {/* Actual bar (foreground) */}
              <div
                className={`h-full ${colors.progressFill} rounded-full transition-all duration-300`}
                style={{ width: `${Math.min(100, (actualPercent / expectedPercent) * 100)}%` }}
              />
            </div>
          )}

          {/* If no expected, show actual as standalone */}
          {data.expected === 0 && (
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
              <div
                className={`h-full ${colors.progressFill} rounded-full transition-all duration-300`}
                style={{ width: `${Math.min(100, actualPercent)}%` }}
              />
            </div>
          )}
        </div>
        <div className="w-28 text-xs text-right flex-shrink-0">
          <div className="font-semibold text-gray-900 dark:text-white">
            {data.actual}/{data.expected || 'N/A'}
          </div>
          {data.expected > 0 && (
            <div className="text-gray-500 dark:text-gray-400">{ratePercent.toFixed(0)}%</div>
          )}
        </div>
      </div>

      {/* Hover tooltip */}
      {isHovered && (
        <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
          <div className="font-semibold mb-1">{data.period}</div>
          <div>Actual: {data.actual}</div>
          {data.expected > 0 && (
            <>
              <div>Expected: {data.expected}</div>
              <div>Rate: {ratePercent.toFixed(1)}%</div>
            </>
          )}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
        </div>
      )}
    </div>
  );
}

interface CompletionRateChartProps {
  habit: Habit;
  logs: HabitLog[];
}

type TimeRange = '7d' | '30d' | '90d' | 'all';

export function CompletionRateChart({ habit, logs }: CompletionRateChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const chartData = useMemo(() => {
    let period: 'day' | 'week' | 'month' = 'day';
    let days: number;

    switch (timeRange) {
      case '7d':
        period = 'day';
        days = 7;
        break;
      case '30d':
        period = 'day';
        days = 30;
        break;
      case '90d':
        period = 'week';
        days = 90;
        break;
      case 'all':
        period = 'month';
        days = 365;
        break;
    }

    return getCompletionRateData(logs, habit, period, days);
  }, [logs, habit, timeRange]);

  const maxValue = Math.max(...chartData.map((d) => Math.max(d.actual, d.expected)), 1);

  const colors = getHabitTypeColors(habit.habitType);
  const itemHeight = 40; // Height per item in pixels
  const maxVisibleItems = 15; // Show max 15 items without scrolling
  const containerHeight = Math.min(chartData.length * itemHeight, maxVisibleItems * itemHeight);

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Completion Rate
        </h3>
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="mb-2">No data available for this period.</p>
          <p className="text-sm">Start logging completions to see your progress!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Completion Rate</h3>

        {/* Unified time range selector */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                timeRange === range
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {range === 'all' ? 'All Time' : `Last ${range.toUpperCase()}`}
            </button>
          ))}
        </div>
      </div>

      {/* Fixed height scrollable container */}
      <div
        className="space-y-2 overflow-y-auto"
        style={{
          maxHeight: `${containerHeight}px`,
          minHeight:
            chartData.length <= 5 ? 'auto' : `${Math.min(5, chartData.length) * itemHeight}px`,
        }}
      >
        {chartData.map((data, index) => {
          const actualPercent = (data.actual / maxValue) * 100;
          const expectedPercent = (data.expected / maxValue) * 100;
          const ratePercent = data.rate;

          return (
            <ChartItem
              key={index}
              data={data}
              actualPercent={actualPercent}
              expectedPercent={expectedPercent}
              ratePercent={ratePercent}
              colors={colors}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded ${colors.progressFill}`} />
          <span className="text-xs text-gray-600 dark:text-gray-400">Actual</span>
        </div>
        {habit.dailyTarget || habit.weeklyTarget ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-300 dark:bg-gray-600" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Expected</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
