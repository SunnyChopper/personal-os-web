import { useMemo } from 'react';
import type { ProjectDependency } from '@/types/growth-system';
import type { ProjectDateMap } from '@/utils/project-gantt-cascade';
import { isDependencyViolated } from '@/utils/project-gantt-cascade';
import type { ProjectGanttBarLayout } from './ProjectGanttBar';

interface ProjectDependencyArrowLayerProps {
  dependencies: ProjectDependency[];
  layouts: Map<string, ProjectGanttBarLayout>;
  dateMap: ProjectDateMap;
  containerHeight: number;
  connectPreview?: { fromProjectId: string; toX: number; toY: number } | null;
}

function layoutCenterRight(layout: ProjectGanttBarLayout): { x: number; y: number } {
  return {
    x: layout.leftPercent + layout.widthPercent,
    y: layout.topPx + 32,
  };
}

function layoutCenterLeft(layout: ProjectGanttBarLayout): { x: number; y: number } {
  return {
    x: layout.leftPercent,
    y: layout.topPx + 32,
  };
}

export function ProjectDependencyArrowLayer({
  dependencies,
  layouts,
  dateMap,
  containerHeight,
  connectPreview,
}: ProjectDependencyArrowLayerProps) {
  const paths = useMemo(() => {
    return dependencies
      .map((dep) => {
        const fromLayout = layouts.get(dep.predecessorProjectId);
        const toLayout = layouts.get(dep.successorProjectId);
        if (!fromLayout || !toLayout) return null;
        const from = layoutCenterRight(fromLayout);
        const to = layoutCenterLeft(toLayout);
        const violated = isDependencyViolated(dep, dateMap);
        const midX = (from.x + to.x) / 2;
        const d = `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;
        return {
          id: `${dep.predecessorProjectId}-${dep.successorProjectId}`,
          d,
          violated,
        };
      })
      .filter(Boolean) as { id: string; d: string; violated: boolean }[];
  }, [dependencies, layouts, dateMap]);

  const previewPath = useMemo(() => {
    if (!connectPreview) return null;
    const fromLayout = layouts.get(connectPreview.fromProjectId);
    if (!fromLayout) return null;
    const from = layoutCenterRight(fromLayout);
    const toX = connectPreview.toX;
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
        <marker
          id="project-gantt-arrow"
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 6 3, 0 6" className="fill-gray-500 dark:fill-gray-400" />
        </marker>
        <marker
          id="project-gantt-arrow-violation"
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
          markerEnd={
            p.violated ? 'url(#project-gantt-arrow-violation)' : 'url(#project-gantt-arrow)'
          }
        />
      ))}
      {previewPath && (
        <path
          d={previewPath}
          fill="none"
          strokeWidth={0.35}
          vectorEffect="non-scaling-stroke"
          className="stroke-blue-500"
          strokeDasharray="1 1"
        />
      )}
    </svg>
  );
}
