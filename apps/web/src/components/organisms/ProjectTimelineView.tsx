import { useState, useMemo, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Project } from '@/types/growth-system';
import type { ProjectDisplayModel } from '@/utils/project-summary';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { PriorityIndicator } from '@/components/atoms/PriorityIndicator';
import { ProjectSummaryDetails } from '@/components/molecules/ProjectSummaryBlocks';
import type { ProjectHealthSummary } from '@/types/project-health';
interface ProjectTimelineViewProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
  projectHealthMap?: Map<string, ProjectHealthSummary>;
  isHealthLoading?: boolean;
  /** When set, bar colors, badges, and progress use derived completion (e.g. all tasks done). */
  resolveProjectDisplay?: (project: Project) => ProjectDisplayModel;
}

interface TimelineProject {
  project: Project;
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

export function ProjectTimelineView({
  projects,
  onProjectClick,
  projectHealthMap,
  isHealthLoading = false,
  resolveProjectDisplay,
}: ProjectTimelineViewProps) {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('All');
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1000);

  // Filter projects to only those with dates (either startDate or targetEndDate)
  const projectsWithDates = useMemo(() => {
    return projects.filter((p) => p.startDate || p.targetEndDate);
  }, [projects]);

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

  const { timelineProjects, minDate, maxDate, lanes } = useMemo(() => {
    if (projectsWithDates.length === 0) {
      return { timelineProjects: [], minDate: new Date(), maxDate: new Date(), lanes: 0 };
    }

    // Find date range from all project dates
    const allDates: Date[] = [];
    projectsWithDates.forEach((project) => {
      if (project.startDate) allDates.push(new Date(project.startDate));
      if (project.targetEndDate) allDates.push(new Date(project.targetEndDate));
    });

    let minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    let maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

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
    const projectsInRange = projectsWithDates.filter((project) => {
      const start = project.startDate ? new Date(project.startDate) : new Date(project.createdAt);
      const end = project.targetEndDate
        ? new Date(project.targetEndDate)
        : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
      // Project is in range if it overlaps with the visible range
      return end >= minDate && start <= maxDate;
    });

    // Sort by start date for lane assignment
    const sortedProjects = projectsInRange.sort((a, b) => {
      const aStart = a.startDate
        ? new Date(a.startDate).getTime()
        : new Date(a.createdAt).getTime();
      const bStart = b.startDate
        ? new Date(b.startDate).getTime()
        : new Date(b.createdAt).getTime();
      return aStart - bStart;
    });

    interface LaneOccupancy {
      endPosition: number;
      projectId: string;
    }
    const laneOccupancy: LaneOccupancy[][] = [[]];

    const timelineProjects: TimelineProject[] = sortedProjects.map((project) => {
      // Use startDate if available, otherwise use createdAt or minDate
      const startDate = project.startDate
        ? new Date(project.startDate)
        : new Date(project.createdAt) < minDate
          ? minDate
          : new Date(project.createdAt);
      // Use endDate if available, otherwise use maxDate or startDate + 30 days
      let endDate = project.targetEndDate
        ? new Date(project.targetEndDate)
        : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      if (endDate > maxDate) {
        endDate = maxDate;
      }

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

        // Check if this position conflicts with any project in this lane
        const conflicts = laneOccupancy[lane].some((occupancy) => {
          return startPos < occupancy.endPosition + 1; // +1 for small gap
        });

        if (!conflicts) {
          laneOccupancy[lane].push({ endPosition: startPos + width, projectId: project.id });
          placed = true;
        } else {
          lane++;
        }
      }

      return {
        project,
        startDate,
        endDate,
        position: startPos,
        width,
        lane,
      };
    });

    return { timelineProjects, minDate, maxDate, lanes: laneOccupancy.length };
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

  if (projectsWithDates.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
        <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No projects with dates
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Add start or end dates to your projects to see them on the timeline
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
          Project Timeline ({timelineProjects.length} projects)
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
          {/* Today Marker */}
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

          {timelineProjects.map((timelineProject) => {
            const project = timelineProject.project;
            const projectHealth = projectHealthMap?.get(project.id);
            const display = resolveProjectDisplay?.(project);
            const effectiveStatus = display?.effectiveStatus ?? project.status;
            const isWorkComplete = display?.isWorkComplete ?? project.status === 'Completed';
            const progressPercent = display?.progressPercent ?? projectHealth?.percentComplete ?? 0;
            const hasProgressBar =
              display != null || (!!projectHealth && (projectHealth.taskCount ?? 0) > 0);
            const hasHealthData = !!projectHealth || display != null;
            const showDescription = !!project.description && project.description.length <= 120;
            // Determine color based on effective status / derived completion
            let colorClasses =
              'from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 border-blue-600 dark:border-blue-500';

            if (effectiveStatus === 'Completed' || isWorkComplete) {
              colorClasses =
                'from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 border-green-600 dark:border-green-500';
            } else if (effectiveStatus === 'On Hold') {
              colorClasses =
                'from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-yellow-700 border-yellow-600 dark:border-yellow-500';
            } else if (effectiveStatus === 'Cancelled') {
              colorClasses =
                'from-gray-500 to-gray-600 dark:from-gray-600 dark:to-gray-700 border-gray-600 dark:border-gray-500';
            } else if (effectiveStatus === 'Planning') {
              colorClasses =
                'from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 border-purple-600 dark:border-purple-500';
            }

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute h-16"
                style={{
                  left: `${timelineProject.position}%`,
                  width: `${timelineProject.width}%`,
                  top: `${timelineProject.lane * 72 + 24}px`,
                }}
              >
                {/* Project Bar */}
                <div
                  onClick={() => onProjectClick(project)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onProjectClick(project);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`View project: ${project.name}`}
                  className={`h-full p-2 bg-gradient-to-r ${colorClasses} rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer group border relative`}
                >
                  <div className="flex items-center justify-between h-full">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <PriorityIndicator priority={project.priority} size="sm" />
                      <span className="text-xs font-medium text-white truncate">
                        {project.name}
                      </span>
                    </div>
                    <StatusBadge status={effectiveStatus} size="sm" />
                  </div>
                  {hasProgressBar && (
                    <div className="absolute left-2 right-2 bottom-1 h-1 bg-white/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white/80"
                        style={{ width: `${Math.min(100, progressPercent)}%` }}
                        aria-hidden="true"
                      />
                    </div>
                  )}

                  {/* Hover tooltip */}
                  <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block group-focus-within:block z-30 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                      {project.name}
                    </h4>
                    <ProjectSummaryDetails
                      project={project}
                      taskCount={projectHealth?.taskCount}
                      completedTaskCount={projectHealth?.completedTaskCount}
                      hasHealthData={hasHealthData}
                      isHealthLoading={!hasHealthData && isHealthLoading}
                      showDescription={showDescription}
                      descriptionClampLines={1}
                      className="text-xs"
                    />
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
            <div className="w-3 h-3 bg-purple-500 rounded" />
            <span>Planning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span>Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded" />
            <span>On Hold</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded" />
            <span>Cancelled</span>
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
