import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Calendar } from 'lucide-react';
import type { Goal, GoalDependency } from '@/types/growth-system';
import { getGoalTimelineBarColorClasses, GOAL_TIMELINE_LEGEND } from '@/utils/timeline-bar-colors';
import {
  applyCascadeToGoals,
  buildGoalDateMap,
  computeCascadeUpdates,
  goalBarEnd,
  goalBarStart,
} from '@/utils/gantt-cascade';
import {
  GoalGanttBar,
  type GanttBarLayout,
  type GanttDragMode,
} from '@/components/organisms/timeline/GoalGanttBar';
import { DependencyArrowLayer } from '@/components/organisms/timeline/DependencyArrowLayer';

interface GoalTimelineViewProps {
  goals: Goal[];
  dependencies: GoalDependency[];
  onGoalClick: (goal: Goal) => void;
  onGoalDatesChange: (
    goalId: string,
    dates: { startDate: string; targetDate: string }
  ) => Promise<void>;
  onAddDependency: (successorGoalId: string, predecessorGoalId: string) => Promise<void>;
}

type ZoomLevel = '1M' | '3M' | '6M' | '1Y' | 'All';

const ZOOM_RANGES: Record<ZoomLevel, number> = {
  '1M': 30 * 24 * 60 * 60 * 1000,
  '3M': 90 * 24 * 60 * 60 * 1000,
  '6M': 180 * 24 * 60 * 60 * 1000,
  '1Y': 365 * 24 * 60 * 60 * 1000,
  All: Infinity,
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MIN_WIDTH_PX = 120;
const LANE_HEIGHT = 72;

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * MS_PER_DAY);
}

interface DragState {
  goalId: string;
  mode: GanttDragMode;
  startClientX: number;
  originalStart: Date;
  originalEnd: Date;
}

interface ConnectState {
  fromGoalId: string;
}

export function GoalTimelineView({
  goals,
  dependencies,
  onGoalClick,
  onGoalDatesChange,
  onAddDependency,
}: GoalTimelineViewProps) {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('All');
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1000);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [connectState, setConnectState] = useState<ConnectState | null>(null);
  const [connectPointer, setConnectPointer] = useState<{ x: number; y: number } | null>(null);
  const [previewGoals, setPreviewGoals] = useState<Goal[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const displayGoals = previewGoals ?? goals;

  const goalsWithDates = useMemo(
    () => displayGoals.filter((g) => g.targetDate && (goalBarStart(g) || g.createdAt)),
    [displayGoals]
  );

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

  const { minDate, maxDate, layouts, laneCount, dateMap } = useMemo(() => {
    if (goalsWithDates.length === 0) {
      return {
        minDate: new Date(),
        maxDate: new Date(),
        layouts: new Map<string, GanttBarLayout>(),
        laneCount: 0,
        dateMap: {},
      };
    }

    const ends = goalsWithDates.map((g) => goalBarEnd(g)!).filter(Boolean);
    const starts = goalsWithDates.map((g) => goalBarStart(g)!).filter(Boolean);
    let minD = new Date(Math.min(...starts.map((d) => d.getTime())));
    let maxD = new Date(Math.max(...ends.map((d) => d.getTime())));

    if (zoomLevel !== 'All') {
      const now = new Date();
      const zoomRange = ZOOM_RANGES[zoomLevel];
      minD = new Date(now.getTime() - zoomRange / 2);
      maxD = new Date(now.getTime() + zoomRange / 2);
    } else {
      const range = maxD.getTime() - minD.getTime();
      minD = new Date(minD.getTime() - range * 0.05);
      maxD = new Date(maxD.getTime() + range * 0.05);
    }

    const totalRange = maxD.getTime() - minD.getTime();
    const minWidthPercent = (MIN_WIDTH_PX / containerWidth) * 100;

    const sorted = [...goalsWithDates].sort((a, b) => {
      const aS = goalBarStart(a)?.getTime() ?? 0;
      const bS = goalBarStart(b)?.getTime() ?? 0;
      return aS - bS;
    });

    const laneOccupancy: { endPosition: number }[][] = [[]];
    const layoutMap = new Map<string, GanttBarLayout>();

    for (const goal of sorted) {
      const rawStart = goalBarStart(goal)!;
      const rawEnd = goalBarEnd(goal)!;
      const startDate = rawStart < minD ? minD : rawStart;
      const endDate = rawEnd > maxD ? maxD : rawEnd;

      let startPos = ((startDate.getTime() - minD.getTime()) / totalRange) * 100;
      const endPos = ((endDate.getTime() - minD.getTime()) / totalRange) * 100;
      let width = endPos - startPos;
      if (width < minWidthPercent) {
        width = minWidthPercent;
        if (startPos + width > 100) startPos = 100 - width;
      }

      let lane = 0;
      let placed = false;
      while (!placed) {
        if (!laneOccupancy[lane]) laneOccupancy[lane] = [];
        const conflicts = laneOccupancy[lane].some((o) => startPos < o.endPosition + 1);
        if (!conflicts) {
          laneOccupancy[lane].push({ endPosition: startPos + width });
          placed = true;
        } else {
          lane++;
        }
      }

      layoutMap.set(goal.id, {
        goalId: goal.id,
        leftPercent: startPos,
        widthPercent: width,
        topPx: lane * LANE_HEIGHT + 24,
      });
    }

    return {
      minDate: minD,
      maxDate: maxD,
      layouts: layoutMap,
      laneCount: laneOccupancy.length,
      dateMap: buildGoalDateMap(goalsWithDates),
    };
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

  const applyPreviewDates = useCallback(
    (goalId: string, start: Date, end: Date) => {
      const next = goals.map((g) =>
        g.id === goalId ? { ...g, startDate: toIsoDate(start), targetDate: toIsoDate(end) } : g
      );
      const map = buildGoalDateMap(next);
      map[goalId] = { startDate: toIsoDate(start), targetDate: toIsoDate(end) };
      const cascaded = computeCascadeUpdates(map, dependencies, [goalId]);
      setPreviewGoals(applyCascadeToGoals(next, cascaded));
    },
    [goals, dependencies]
  );

  const clientXToDayDelta = useCallback(
    (clientX: number, originX: number): number => {
      const el = chartRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const totalRange = maxDate.getTime() - minDate.getTime();
      const pxPerMs = rect.width / totalRange;
      const deltaPx = clientX - originX;
      return Math.round(deltaPx / pxPerMs / MS_PER_DAY);
    },
    [minDate, maxDate]
  );

  const handleDragStart = useCallback(
    (goalId: string, mode: GanttDragMode, clientX: number) => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;
      const start = goalBarStart(goal);
      const end = goalBarEnd(goal);
      if (!start || !end) return;
      setDragState({
        goalId,
        mode,
        startClientX: clientX,
        originalStart: start,
        originalEnd: end,
      });
      if (mode === 'connect') {
        setConnectState({ fromGoalId: goalId });
      }
    },
    [goals]
  );

  useEffect(() => {
    if (!dragState && !connectState) return;

    const onMove = (e: PointerEvent) => {
      if (connectState && chartRef.current) {
        const rect = chartRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = e.clientY - rect.top;
        setConnectPointer({ x, y });
        return;
      }

      if (!dragState || dragState.mode === 'connect') return;
      const dayDelta = clientXToDayDelta(e.clientX, dragState.startClientX);
      const { originalStart, originalEnd, mode, goalId } = dragState;
      const durationDays = Math.max(
        Math.round((originalEnd.getTime() - originalStart.getTime()) / MS_PER_DAY),
        1
      );

      let newStart = originalStart;
      let newEnd = originalEnd;

      if (mode === 'move') {
        newStart = addDays(originalStart, dayDelta);
        newEnd = addDays(originalEnd, dayDelta);
      } else if (mode === 'resize-start') {
        newStart = addDays(originalStart, dayDelta);
        if (newStart >= originalEnd) {
          newStart = addDays(originalEnd, -1);
        }
        newEnd = originalEnd;
      } else if (mode === 'resize-end') {
        newEnd = addDays(originalEnd, dayDelta);
        if (newEnd <= originalStart) {
          newEnd = addDays(originalStart, 1);
        }
        newStart = originalStart;
      }

      void durationDays;
      applyPreviewDates(goalId, newStart, newEnd);
    };

    const onUp = async (e: PointerEvent) => {
      if (connectState && chartRef.current) {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const barEl = el?.closest('[data-gantt-goal-id]');
        const targetId = barEl?.getAttribute('data-gantt-goal-id');
        if (targetId && targetId !== connectState.fromGoalId) {
          setIsSaving(true);
          try {
            await onAddDependency(targetId, connectState.fromGoalId);
          } finally {
            setIsSaving(false);
          }
        }
        setConnectState(null);
        setConnectPointer(null);
        setDragState(null);
        return;
      }

      if (dragState && dragState.mode !== 'connect' && previewGoals) {
        const updated = previewGoals.find((g) => g.id === dragState.goalId);
        const orig = goals.find((g) => g.id === dragState.goalId);
        if (updated && orig) {
          const newStart = goalBarStart(updated);
          const newEnd = goalBarEnd(updated);
          const oldStart = goalBarStart(orig);
          const oldEnd = goalBarEnd(orig);
          if (
            newStart &&
            newEnd &&
            (toIsoDate(newStart) !== toIsoDate(oldStart!) ||
              toIsoDate(newEnd) !== toIsoDate(oldEnd!))
          ) {
            setIsSaving(true);
            try {
              await onGoalDatesChange(dragState.goalId, {
                startDate: toIsoDate(newStart),
                targetDate: toIsoDate(newEnd),
              });
            } finally {
              setIsSaving(false);
            }
          }
        }
      }
      setDragState(null);
      setPreviewGoals(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [
    dragState,
    connectState,
    clientXToDayDelta,
    applyPreviewDates,
    previewGoals,
    goals,
    onGoalDatesChange,
    onAddDependency,
  ]);

  if (goals.filter((g) => g.targetDate).length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
        <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No goals with target dates
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Add target dates to your goals to see them on the timeline. Optional start dates refine
          scheduling.
        </p>
      </div>
    );
  }

  const chartHeight = laneCount * LANE_HEIGHT + 24;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Goal Timeline ({goalsWithDates.length} goals)
          {isSaving && (
            <span className="text-xs font-normal text-blue-600 dark:text-blue-400">Saving…</span>
          )}
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {(['1M', '3M', '6M', '1Y', 'All'] as ZoomLevel[]).map((level) => (
              <button
                key={level}
                type="button"
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

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Drag bars to reschedule; drag the right connector to another goal to add a finish-to-start
        dependency. Downstream goals shift automatically.
      </p>

      <div ref={containerRef} className="relative overflow-x-visible">
        <div className="relative mb-4 h-8 border-b border-gray-200 dark:border-gray-700">
          {(() => {
            const totalRange = maxDate.getTime() - minDate.getTime();
            const validMonths = monthsBetween
              .map((month) => ({
                month,
                rawPosition: ((month.getTime() - minDate.getTime()) / totalRange) * 100,
              }))
              .filter((m) => m.rawPosition >= 0 && m.rawPosition <= 100);
            const visibleMonths: typeof validMonths = [];
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
              if (rawPosition < 5) textStyle = { left: '0.5rem' };
              else if (rawPosition > 95) textStyle = { right: '0.5rem' };
              return (
                <div
                  key={month.toISOString()}
                  className="absolute top-0 bottom-0"
                  style={{ left: `${rawPosition}%` }}
                >
                  <div className="absolute top-0 bottom-0 left-0 border-l border-gray-300 dark:border-gray-600" />
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

        <div ref={chartRef} className="relative select-none" style={{ minHeight: chartHeight }}>
          <DependencyArrowLayer
            dependencies={dependencies}
            layouts={layouts}
            dateMap={dateMap}
            containerHeight={chartHeight}
            connectPreview={
              connectState && connectPointer
                ? {
                    fromGoalId: connectState.fromGoalId,
                    toX: connectPointer.x,
                    toY: connectPointer.y,
                  }
                : null
            }
          />

          {(() => {
            const today = new Date();
            const totalRange = maxDate.getTime() - minDate.getTime();
            const todayPos = ((today.getTime() - minDate.getTime()) / totalRange) * 100;
            if (todayPos >= 0 && todayPos <= 100) {
              return (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-blue-500 dark:bg-blue-400 z-20 pointer-events-none"
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

          {goalsWithDates.map((goal) => {
            const layout = layouts.get(goal.id);
            if (!layout) return null;
            const isDragging = dragState?.goalId === goal.id;
            return (
              <div key={goal.id} data-gantt-goal-id={goal.id}>
                <GoalGanttBar
                  goal={goal}
                  layout={layout}
                  colorClasses={getGoalTimelineBarColorClasses(goal.status)}
                  isPreview={isDragging && !!previewGoals}
                  isConnecting={connectState?.fromGoalId === goal.id}
                  onGoalClick={onGoalClick}
                  onDragStart={handleDragStart}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-6 flex-wrap text-xs text-gray-600 dark:text-gray-400">
          {GOAL_TIMELINE_LEGEND.map(({ label, swatchClass }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-3 h-3 ${swatchClass} rounded`} />
              <span>{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-3 bg-blue-500" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-500">—</span>
            <span>Violated dependency</span>
          </div>
        </div>
      </div>
    </div>
  );
}
