import { useMemo } from 'react';
import type { GoalDependency } from '@/types/growth-system';
import type { GoalDateMap } from '@/utils/gantt-cascade';
import { isDependencyViolated } from '@/utils/gantt-cascade';
import type { GanttBarLayout } from './GoalGanttBar';

interface DependencyArrowLayerProps {
  dependencies: GoalDependency[];
  layouts: Map<string, GanttBarLayout>;
  dateMap: GoalDateMap;
  containerHeight: number;
  connectPreview?: { fromGoalId: string; toX: number; toY: number } | null;
}

function layoutCenterRight(layout: GanttBarLayout): { x: number; y: number } {
  return {
    x: layout.leftPercent + layout.widthPercent,
    y: layout.topPx + 32,
  };
}

function layoutCenterLeft(layout: GanttBarLayout): { x: number; y: number } {
  return {
    x: layout.leftPercent,
    y: layout.topPx + 32,
  };
}

export function DependencyArrowLayer({
  dependencies,
  layouts,
  dateMap,
  containerHeight,
  connectPreview,
}: DependencyArrowLayerProps) {
  const paths = useMemo(() => {
    return dependencies
      .map((dep) => {
        const fromLayout = layouts.get(dep.predecessorGoalId);
        const toLayout = layouts.get(dep.successorGoalId);
        if (!fromLayout || !toLayout) return null;
        const from = layoutCenterRight(fromLayout);
        const to = layoutCenterLeft(toLayout);
        const violated = isDependencyViolated(dep, dateMap);
        const midX = (from.x + to.x) / 2;
        const d = `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;
        return { id: `${dep.predecessorGoalId}-${dep.successorGoalId}`, d, violated };
      })
      .filter(Boolean) as { id: string; d: string; violated: boolean }[];
  }, [dependencies, layouts, dateMap]);

  const previewPath = useMemo(() => {
    if (!connectPreview) return null;
    const fromLayout = layouts.get(connectPreview.fromGoalId);
    if (!fromLayout) return null;
    const from = layoutCenterRight(fromLayout);
    const toX = (connectPreview.toX / 100) * 100;
    const toY = connectPreview.toY;
    const midX = (from.x + toX) / 2;
    return `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${toY}, ${toX} ${toY}`;
  }, [connectPreview, layouts]);

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-[5]"
      style={{ height: containerHeight, width: '100%' }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <marker id="gantt-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" className="fill-gray-500 dark:fill-gray-400" />
        </marker>
        <marker
          id="gantt-arrow-violation"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 6 3, 0 6" className="fill-red-500" />
        </marker>
      </defs>
      {paths.map((p) => (
        <path
          key={p.id}
          d={p.d}
          fill="none"
          strokeWidth={0.35}
          vectorEffect="non-scaling-stroke"
          className={p.violated ? 'stroke-red-500' : 'stroke-gray-500 dark:stroke-gray-400'}
          markerEnd={p.violated ? 'url(#gantt-arrow-violation)' : 'url(#gantt-arrow)'}
        />
      ))}
      {previewPath && (
        <path
          d={previewPath}
          fill="none"
          strokeWidth={0.35}
          vectorEffect="non-scaling-stroke"
          className="stroke-blue-500 stroke-dasharray-2"
          strokeDasharray="1 1"
        />
      )}
    </svg>
  );
}
