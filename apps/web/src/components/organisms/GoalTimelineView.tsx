import { useState, useMemo, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Goal } from '@/types/growth-system';
import { AreaBadge } from '@/components/atoms/AreaBadge';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { PriorityIndicator } from '@/components/atoms/PriorityIndicator';
import { formatDateString } from '@/utils/date-formatters';

interface GoalTimelineViewProps {
  goals: Goal[];
  onGoalClick: (goal: Goal) => void;
}

interface TimelineGoal extends Goal {
  startDate: Date;
  endDate: Date;
  position: number;
  width: number;
  lane: number;
}

type ZoomLevel = '1M' | '3M' | '6M' | '1Y' | 'All';

const ZOOM_RANGES: Record<ZoomLevel, number> = {
  '1M': 30 * 24 * 60 * 60 * 1000, // 1 month in ms
  '3M': 90 * 24 * 60 * 60 * 1000, // 3 months
  '6M': 180 * 24 * 60 * 60 * 1000, // 6 months
  '1Y': 365 * 24 * 60 * 60 * 1000, // 1 year
  All: Infinity,
};

export function GoalTimelineView({ goals, onGoalClick }: GoalTimelineViewProps) {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('All');
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1000);

  const goalsWithDates = useMemo(() => {
    return goals.filter((g) => g.targetDate);
  }, [goals]);

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const { timelineGoals, minDate, maxDate, lanes } = useMemo(() => {
    if (goalsWithDates.length === 0) {
      return { timelineGoals: [], minDate: new Date(), maxDate: new Date(), lanes: 0 };
    }

    // Find date range
    const dates = goalsWithDates.map((g) => new Date(g.targetDate!));
    let minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    let maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Apply zoom level
    if (zoomLevel !== 'All') {
      const now = new Date();
      const zoomRange = ZOOM_RANGES[zoomLevel];
      minDate = new Date(now.getTime() - zoomRange / 2);
      maxDate = new Date(now.getTime() + zoomRange / 2);
    } else {
      // Extend range by 5% on each side for "All" view
      const range = maxDate.getTime() - minDate.getTime();
      minDate = new Date(minDate.getTime() - range * 0.05);
      maxDate = new Date(maxDate.getTime() + range * 0.05);
    }

    const totalRange = maxDate.getTime() - minDate.getTime();

    // Minimum width in pixels (enough for title + badges)
    const MIN_WIDTH_PX = 120;
    const MIN_WIDTH_PERCENT = (MIN_WIDTH_PX / containerWidth) * 100;

    // Calculate positions and assign lanes to avoid overlap
    const goalsInRange = goalsWithDates.filter((goal) => {
      const targetDate = new Date(goal.targetDate!);
      const startDate = new Date(goal.createdAt);
      return startDate <= maxDate && targetDate >= minDate;
    });

    // Sort by start date for lane assignment
    const sortedGoals = goalsInRange.sort((a, b) => {
      const aStart = new Date(a.createdAt).getTime();
      const bStart = new Date(b.createdAt).getTime();
      return aStart - bStart;
    });

    interface LaneOccupancy {
      endPosition: number;
      goalId: string;
    }
    const laneOccupancy: LaneOccupancy[][] = [[]];

    const timelineGoals: TimelineGoal[] = sortedGoals.map((goal) => {
      const targetDate = new Date(goal.targetDate!);
      const createdDate = new Date(goal.createdAt);
      const startDate = createdDate < minDate ? minDate : createdDate;
      const endDate = targetDate > maxDate ? maxDate : targetDate;

      let startPos = ((startDate.getTime() - minDate.getTime()) / totalRange) * 100;
      const endPos = ((endDate.getTime() - minDate.getTime()) / totalRange) * 100;
      let width = endPos - startPos;

      // Apply minimum width
      if (width < MIN_WIDTH_PERCENT) {
        width = MIN_WIDTH_PERCENT;
        if (startPos + width > 100) {
          startPos = 100 - width;
        }
      }

      // Find available lane (avoid overlaps)
      let lane = 0;
      let placed = false;

      while (!placed) {
        if (!laneOccupancy[lane]) {
          laneOccupancy[lane] = [];
        }

        // Check if this position conflicts with any goal in this lane
        const conflicts = laneOccupancy[lane].some((occupancy) => {
          return startPos < occupancy.endPosition + 1; // +1 for small gap
        });

        if (!conflicts) {
          laneOccupancy[lane].push({ endPosition: startPos + width, goalId: goal.id });
          placed = true;
        } else {
          lane++;
        }
      }

      return {
        ...goal,
        startDate,
        endDate,
        position: startPos,
        width,
        lane,
      };
    });

    return { timelineGoals, minDate, maxDate, lanes: laneOccupancy.length };
  }, [goalsWithDates, zoomLevel, containerWidth]);

  const monthsBetween = useMemo(() => {
    const months: Date[] = [];
    const current = new Date(minDate);
    current.setDate(1);

    while (current <= maxDate) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  }, [minDate, maxDate]);

  if (goalsWithDates.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
        <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No goals with target dates
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Add target dates to your goals to see them on the timeline
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Timeline Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Goal Timeline ({timelineGoals.length} goals)
        </h3>
        <div className="flex items-center gap-4">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {(['1M', '3M', '6M', '1Y', 'All'] as ZoomLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => setZoomLevel(level)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  zoomLevel === level
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          <span className="text-sm text-gray-600 dark:text-gray-400 px-3">
            {minDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} -{' '}
            {maxDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Timeline Container */}
      <div ref={containerRef} className="relative overflow-x-visible">
        {/* Month Labels */}
        <div className="relative mb-4 h-8 border-b border-gray-200 dark:border-gray-700 overflow-visible">
          {(() => {
            const totalRange = maxDate.getTime() - minDate.getTime();
            const validMonths = monthsBetween
              .map((month) => ({
                month,
                rawPosition: ((month.getTime() - minDate.getTime()) / totalRange) * 100,
              }))
              .filter((m) => m.rawPosition >= 0 && m.rawPosition <= 100);

            const visibleMonths = [];
            for (let i = 0; i < validMonths.length; i++) {
              const current = validMonths[i];
              const isLast = i === validMonths.length - 1;

              if (visibleMonths.length === 0) {
                visibleMonths.push(current);
              } else {
                const lastVisible = visibleMonths[visibleMonths.length - 1];
                const distance = current.rawPosition - lastVisible.rawPosition;

                if (distance >= 8) {
                  visibleMonths.push(current);
                } else if (isLast && visibleMonths.length > 1) {
                  visibleMonths.pop();
                  visibleMonths.push(current);
                }
              }
            }

            return visibleMonths.map(({ month, rawPosition }) => {
              let textStyle: React.CSSProperties = {
                left: '0',
                transform: 'translateX(-50%)',
              };

              if (rawPosition < 5) {
                textStyle = { left: '0.5rem' };
              } else if (rawPosition > 95) {
                textStyle = { right: '0.5rem' };
              }

              return (
                <div
                  key={month.toISOString()}
                  className="absolute top-0 bottom-0"
                  style={{ left: `${rawPosition}%` }}
                >
                  {/* Vertical border line */}
                  <div className="absolute top-0 bottom-0 left-0 border-l border-gray-300 dark:border-gray-600" />

                  {/* Text label */}
                  <span
                    className="absolute top-0 text-xs text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap"
                    style={textStyle}
                  >
                    {month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              );
            });
          })()}
        </div>

        {/* Timeline Bars */}
        <div className="relative" style={{ minHeight: `${lanes * 72 + 24}px` }}>
          {/* Today Marker - positioned absolutely to extend through all goal bars */}
          {(() => {
            const today = new Date();
            const totalRange = maxDate.getTime() - minDate.getTime();
            const todayPos = ((today.getTime() - minDate.getTime()) / totalRange) * 100;
            if (todayPos >= 0 && todayPos <= 100) {
              return (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-blue-500 dark:bg-blue-400 z-20"
                  style={{ left: `${todayPos}%` }}
                >
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 px-2 py-0.5 bg-blue-500 dark:bg-blue-400 text-white text-xs rounded whitespace-nowrap font-medium">
                    Today
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {timelineGoals.map((goal) => {
            // Determine color based on status
            let colorClasses =
              'from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 border-blue-600 dark:border-blue-500';

            if (goal.status === 'Achieved') {
              colorClasses =
                'from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 border-purple-600 dark:border-purple-500';
            } else if (goal.status === 'At Risk') {
              colorClasses =
                'from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 border-orange-600 dark:border-orange-500';
            } else if (goal.status === 'On Track') {
              colorClasses =
                'from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 border-green-600 dark:border-green-500';
            }

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute h-16"
                style={{
                  left: `${goal.position}%`,
                  width: `${goal.width}%`,
                  top: `${goal.lane * 72 + 24}px`,
                }}
              >
                {/* Goal Bar */}
                <div
                  onClick={() => onGoalClick(goal)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onGoalClick(goal);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`View goal: ${goal.title}`}
                  className={`h-full p-2 bg-gradient-to-r ${colorClasses} rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer group border relative`}
                >
                  <div className="flex items-center justify-between h-full">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <PriorityIndicator priority={goal.priority} size="sm" />
                      <span className="text-xs font-medium text-white truncate">{goal.title}</span>
                    </div>
                    <StatusBadge status={goal.status} size="sm" />
                  </div>

                  {/* Hover tooltip */}
                  <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-30 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                      {goal.title}
                    </h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Created:</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {new Date(goal.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Target:</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {formatDateString(goal.targetDate!) || ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {Math.ceil(
                            (new Date(goal.targetDate!).getTime() -
                              new Date(goal.createdAt).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )}{' '}
                          days
                        </span>
                      </div>
                      {goal.description && (
                        <p className="text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                          {goal.description}
                        </p>
                      )}
                      <div className="flex gap-2 pt-2 flex-wrap">
                        <AreaBadge area={goal.area} />
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                          {goal.timeHorizon}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-6 flex-wrap text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span>Active/Planning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span>On Track</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded" />
            <span>At Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded" />
            <span>Achieved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-3 bg-blue-500" />
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}
