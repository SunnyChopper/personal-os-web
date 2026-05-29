import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Calendar } from 'lucide-react';
import type { Project, ProjectDependency } from '@/types/growth-system';
import type { ProjectDisplayModel } from '@/utils/project-summary';
import type { ProjectHealthSummary } from '@/types/project-health';
import {
  getProjectTimelineBarColorClasses,
  PROJECT_TIMELINE_LEGEND,
} from '@/utils/timeline-bar-colors';
import {
  applyCascadeToProjects,
  buildProjectDateMap,
  computeCascadeUpdates,
  projectBarEnd,
  projectBarStart,
} from '@/utils/project-gantt-cascade';
import {
  ProjectGanttBar,
  type ProjectGanttBarLayout,
} from '@/components/organisms/timeline/ProjectGanttBar';
import { ProjectDependencyArrowLayer } from '@/components/organisms/timeline/ProjectDependencyArrowLayer';
import type { GanttDragMode } from '@/components/organisms/timeline/GoalGanttBar';

interface ProjectTimelineViewProps {
  projects: Project[];
  dependencies: ProjectDependency[];
  onProjectClick: (project: Project) => void;
  onProjectDatesChange: (
    projectId: string,
    dates: { startDate: string; targetEndDate: string }
  ) => Promise<void>;
  onAddDependency: (successorProjectId: string, predecessorProjectId: string) => Promise<void>;
  projectHealthMap?: Map<string, ProjectHealthSummary>;
  isHealthLoading?: boolean;
  resolveProjectDisplay?: (project: Project) => ProjectDisplayModel;
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
  projectId: string;
  mode: GanttDragMode;
  startClientX: number;
  originalStart: Date;
  originalEnd: Date;
}

interface ConnectState {
  fromProjectId: string;
}

export function ProjectTimelineView({
  projects,
  dependencies,
  onProjectClick,
  onProjectDatesChange,
  onAddDependency,
  projectHealthMap,
  isHealthLoading = false,
  resolveProjectDisplay,
}: ProjectTimelineViewProps) {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('All');
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1000);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [connectState, setConnectState] = useState<ConnectState | null>(null);
  const [connectPointer, setConnectPointer] = useState<{ x: number; y: number } | null>(null);
  const [previewProjects, setPreviewProjects] = useState<Project[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const displayProjects = previewProjects ?? projects;

  const projectsWithDates = useMemo(
    () => displayProjects.filter((p) => p.targetEndDate && (projectBarStart(p) || p.createdAt)),
    [displayProjects]
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
    if (projectsWithDates.length === 0) {
      return {
        minDate: new Date(),
        maxDate: new Date(),
        layouts: new Map<string, ProjectGanttBarLayout>(),
        laneCount: 0,
        dateMap: {},
      };
    }

    const ends = projectsWithDates.map((p) => projectBarEnd(p)!).filter(Boolean);
    const starts = projectsWithDates.map((p) => projectBarStart(p)!).filter(Boolean);
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

    const sorted = [...projectsWithDates].sort((a, b) => {
      const aS = projectBarStart(a)?.getTime() ?? 0;
      const bS = projectBarStart(b)?.getTime() ?? 0;
      return aS - bS;
    });

    const laneOccupancy: { endPosition: number }[][] = [[]];
    const layoutMap = new Map<string, ProjectGanttBarLayout>();

    for (const project of sorted) {
      const rawStart = projectBarStart(project)!;
      const rawEnd = projectBarEnd(project)!;
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

      layoutMap.set(project.id, {
        projectId: project.id,
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
      dateMap: buildProjectDateMap(projectsWithDates),
    };
  }, [projectsWithDates, zoomLevel, containerWidth]);

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
    (projectId: string, start: Date, end: Date) => {
      const next = projects.map((p) =>
        p.id === projectId
          ? { ...p, startDate: toIsoDate(start), targetEndDate: toIsoDate(end) }
          : p
      );
      const map = buildProjectDateMap(next);
      map[projectId] = { startDate: toIsoDate(start), targetEndDate: toIsoDate(end) };
      const cascaded = computeCascadeUpdates(map, dependencies, [projectId]);
      setPreviewProjects(applyCascadeToProjects(next, cascaded));
    },
    [projects, dependencies]
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
    (projectId: string, mode: GanttDragMode, clientX: number) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      const start = projectBarStart(project);
      const end = projectBarEnd(project);
      if (!start || !end) return;
      setDragState({
        projectId,
        mode,
        startClientX: clientX,
        originalStart: start,
        originalEnd: end,
      });
      if (mode === 'connect') {
        setConnectState({ fromProjectId: projectId });
      }
    },
    [projects]
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
      const { originalStart, originalEnd, mode, projectId } = dragState;

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

      applyPreviewDates(projectId, newStart, newEnd);
    };

    const onUp = async (e: PointerEvent) => {
      if (connectState && chartRef.current) {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const barEl = el?.closest('[data-gantt-project-id]');
        const targetId = barEl?.getAttribute('data-gantt-project-id');
        if (targetId && targetId !== connectState.fromProjectId) {
          setIsSaving(true);
          try {
            await onAddDependency(targetId, connectState.fromProjectId);
          } finally {
            setIsSaving(false);
          }
        }
        setConnectState(null);
        setConnectPointer(null);
        setDragState(null);
        return;
      }

      if (dragState && dragState.mode !== 'connect' && previewProjects) {
        const updated = previewProjects.find((p) => p.id === dragState.projectId);
        const orig = projects.find((p) => p.id === dragState.projectId);
        if (updated && orig) {
          const newStart = projectBarStart(updated);
          const newEnd = projectBarEnd(updated);
          const oldStart = projectBarStart(orig);
          const oldEnd = projectBarEnd(orig);
          if (
            newStart &&
            newEnd &&
            oldStart &&
            oldEnd &&
            (toIsoDate(newStart) !== toIsoDate(oldStart) || toIsoDate(newEnd) !== toIsoDate(oldEnd))
          ) {
            setIsSaving(true);
            try {
              await onProjectDatesChange(dragState.projectId, {
                startDate: toIsoDate(newStart),
                targetEndDate: toIsoDate(newEnd),
              });
            } finally {
              setIsSaving(false);
            }
          }
        }
      }
      setDragState(null);
      setPreviewProjects(null);
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
    previewProjects,
    projects,
    onProjectDatesChange,
    onAddDependency,
  ]);

  if (projects.filter((p) => p.targetEndDate).length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
        <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No projects with target end dates
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Add target end dates to your projects to see them on the timeline. Optional start dates
          refine scheduling.
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
          Project Timeline ({projectsWithDates.length} projects)
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
        Drag bars to reschedule; drag the right connector to another project to add a
        finish-to-start dependency. Downstream projects shift automatically.
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
          <ProjectDependencyArrowLayer
            dependencies={dependencies}
            layouts={layouts}
            dateMap={dateMap}
            containerHeight={chartHeight}
            connectPreview={
              connectState && connectPointer
                ? {
                    fromProjectId: connectState.fromProjectId,
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

          {projectsWithDates.map((project) => {
            const layout = layouts.get(project.id);
            if (!layout) return null;
            const isDragging = dragState?.projectId === project.id;
            const display = resolveProjectDisplay?.(project);
            const health = projectHealthMap?.get(project.id);
            return (
              <div key={project.id} data-gantt-project-id={project.id}>
                <ProjectGanttBar
                  project={project}
                  layout={layout}
                  colorClasses={getProjectTimelineBarColorClasses(project.status, {
                    isStale: display?.isStale ?? project.isStale,
                    isWorkComplete: display?.isWorkComplete,
                  })}
                  isPreview={isDragging && !!previewProjects}
                  isConnecting={connectState?.fromProjectId === project.id}
                  health={health}
                  isHealthLoading={isHealthLoading}
                  display={display}
                  onProjectClick={onProjectClick}
                  onDragStart={handleDragStart}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-6 flex-wrap text-xs text-gray-600 dark:text-gray-400">
          {PROJECT_TIMELINE_LEGEND.map(({ label, swatchClass }) => (
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
