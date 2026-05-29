import { useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Project } from '@/types/growth-system';
import type { ProjectDisplayModel } from '@/utils/project-summary';
import type { ProjectHealthSummary } from '@/types/project-health';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { PriorityIndicator } from '@/components/atoms/PriorityIndicator';
import { projectBarStart, projectBarEnd } from '@/utils/project-gantt-cascade';
import type { GanttDragMode } from './GoalGanttBar';

export interface ProjectGanttBarLayout {
  projectId: string;
  leftPercent: number;
  widthPercent: number;
  topPx: number;
}

interface ProjectGanttBarProps {
  project: Project;
  layout: ProjectGanttBarLayout;
  colorClasses: string;
  isPreview?: boolean;
  isConnecting?: boolean;
  health?: ProjectHealthSummary;
  isHealthLoading?: boolean;
  display?: ProjectDisplayModel;
  onProjectClick: (project: Project) => void;
  onDragStart: (projectId: string, mode: GanttDragMode, clientX: number) => void;
}

const EDGE_HIT_PX = 6;

export function ProjectGanttBar({
  project,
  layout,
  colorClasses,
  isPreview = false,
  isConnecting = false,
  health,
  isHealthLoading = false,
  display,
  onProjectClick,
  onDragStart,
}: ProjectGanttBarProps) {
  const barRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, mode: GanttDragMode) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      onDragStart(project.id, mode, e.clientX);
    },
    [project.id, onDragStart]
  );

  const start = projectBarStart(project);
  const end = projectBarEnd(project);
  const progress = display?.progressPercent ?? health?.percentComplete ?? 0;

  return (
    <motion.div
      ref={barRef}
      className={`absolute h-16 ${isPreview ? 'opacity-70 z-30' : 'z-10'} ${isConnecting ? 'ring-2 ring-blue-400' : ''}`}
      style={{
        left: `${layout.leftPercent}%`,
        width: `${layout.widthPercent}%`,
        top: `${layout.topPx}px`,
      }}
      initial={false}
      animate={{ opacity: isPreview ? 0.85 : 1 }}
    >
      <div
        className={`h-full relative bg-gradient-to-r ${colorClasses} rounded-lg shadow-md border group ${
          isPreview ? 'border-dashed border-white/60' : ''
        }`}
      >
        <div
          className="absolute left-0 top-0 bottom-0 cursor-ew-resize z-20"
          style={{ width: EDGE_HIT_PX }}
          onPointerDown={(e) => handlePointerDown(e, 'resize-start')}
          aria-hidden
        />
        <div
          className="absolute right-0 top-0 bottom-0 cursor-ew-resize z-20"
          style={{ width: EDGE_HIT_PX }}
          onPointerDown={(e) => handlePointerDown(e, 'resize-end')}
          aria-hidden
        />
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 rounded-full bg-white/90 border-2 border-blue-500 cursor-crosshair z-30 opacity-0 group-hover:opacity-100 transition-opacity"
          onPointerDown={(e) => handlePointerDown(e, 'connect')}
          title="Drag to link dependency"
          aria-label="Draw dependency"
        />
        <div
          className="absolute inset-0 px-2 py-2 cursor-grab active:cursor-grabbing z-10"
          style={{ left: EDGE_HIT_PX, right: EDGE_HIT_PX + 8 }}
          onPointerDown={(e) => handlePointerDown(e, 'move')}
          onClick={() => onProjectClick(project)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onProjectClick(project);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`Project: ${project.name}, ${start?.toLocaleDateString() ?? ''} to ${end?.toLocaleDateString() ?? ''}`}
        >
          <div className="flex items-center justify-between h-full pointer-events-none">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <PriorityIndicator priority={project.priority} size="sm" />
              <span className="text-xs font-medium text-white truncate">{project.name}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!isHealthLoading && (display || health) && (
                <span className="text-[10px] text-white/90 font-medium">{progress}%</span>
              )}
              <StatusBadge
                status={display?.effectiveStatus ?? project.status}
                size="sm"
                appearance="onSolid"
              />
            </div>
          </div>
          {!display && !isHealthLoading && health && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 rounded-b-lg overflow-hidden pointer-events-none">
              <div
                className="h-full bg-white/40 transition-all"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
