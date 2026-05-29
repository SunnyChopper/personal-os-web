import { useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Goal } from '@/types/growth-system';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { PriorityIndicator } from '@/components/atoms/PriorityIndicator';
import { goalBarStart, goalBarEnd } from '@/utils/gantt-cascade';

export type GanttDragMode = 'move' | 'resize-start' | 'resize-end' | 'connect';

export interface GanttBarLayout {
  goalId: string;
  leftPercent: number;
  widthPercent: number;
  topPx: number;
}

interface GoalGanttBarProps {
  goal: Goal;
  layout: GanttBarLayout;
  colorClasses: string;
  isPreview?: boolean;
  isConnecting?: boolean;
  onGoalClick: (goal: Goal) => void;
  onDragStart: (goalId: string, mode: GanttDragMode, clientX: number) => void;
}

const EDGE_HIT_PX = 6;

export function GoalGanttBar({
  goal,
  layout,
  colorClasses,
  isPreview = false,
  isConnecting = false,
  onGoalClick,
  onDragStart,
}: GoalGanttBarProps) {
  const barRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, mode: GanttDragMode) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      onDragStart(goal.id, mode, e.clientX);
    },
    [goal.id, onDragStart]
  );

  const start = goalBarStart(goal);
  const end = goalBarEnd(goal);

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
        {/* Left resize */}
        <div
          className="absolute left-0 top-0 bottom-0 cursor-ew-resize z-20"
          style={{ width: EDGE_HIT_PX }}
          onPointerDown={(e) => handlePointerDown(e, 'resize-start')}
          aria-hidden
        />
        {/* Right resize */}
        <div
          className="absolute right-0 top-0 bottom-0 cursor-ew-resize z-20"
          style={{ width: EDGE_HIT_PX }}
          onPointerDown={(e) => handlePointerDown(e, 'resize-end')}
          aria-hidden
        />
        {/* Dependency connector */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 rounded-full bg-white/90 border-2 border-blue-500 cursor-crosshair z-30 opacity-0 group-hover:opacity-100 transition-opacity"
          onPointerDown={(e) => handlePointerDown(e, 'connect')}
          title="Drag to link dependency"
          aria-label="Draw dependency"
        />
        {/* Body drag + click */}
        <div
          className="absolute inset-0 px-2 py-2 cursor-grab active:cursor-grabbing z-10"
          style={{ left: EDGE_HIT_PX, right: EDGE_HIT_PX + 8 }}
          onPointerDown={(e) => handlePointerDown(e, 'move')}
          onClick={(e) => {
            if ((e as unknown as { detail: number }).detail === 1) {
              onGoalClick(goal);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onGoalClick(goal);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`Goal: ${goal.title}, ${start?.toLocaleDateString() ?? ''} to ${end?.toLocaleDateString() ?? ''}`}
        >
          <div className="flex items-center justify-between h-full pointer-events-none">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <PriorityIndicator priority={goal.priority} size="sm" />
              <span className="text-xs font-medium text-white truncate">{goal.title}</span>
            </div>
            <StatusBadge status={goal.status} size="sm" appearance="onSolid" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
