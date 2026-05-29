import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { ExternalLink, Plus, Target } from 'lucide-react';
import type { Goal, GoalHealth, GoalProgressBreakdown, TimeHorizon } from '@/types/growth-system';
import { AreaBadge } from '@/components/atoms/AreaBadge';
import { HealthBadge } from '@/components/atoms/HealthBadge';
import { ProgressRing } from '@/components/atoms/ProgressRing';
import { PriorityIndicator } from '@/components/atoms/PriorityIndicator';
import { GOAL_MINDMAP_LAYOUT_TOTAL_WIDTH } from '@/components/molecules/goal-mindmap-utils';

export type GoalMindmapNodeData = {
  goal: Goal;
  progress?: GoalProgressBreakdown;
  healthStatus?: GoalHealth;
  isRoot?: boolean;
  isDimmed?: boolean;
  isFocused?: boolean;
  timeframeLabel: string;
  isOverdue: boolean;
  onAddSubgoal?: (goal: Goal) => void;
  onOpenDetail?: (goal: Goal) => void;
};

export type GoalMindmapRfNode = Node<GoalMindmapNodeData, 'goalMindmap'>;

function canAddSubgoalForHorizon(timeHorizon: TimeHorizon): boolean {
  return timeHorizon !== 'Weekly' && timeHorizon !== 'Daily';
}

export function GoalMindmapNode({ data, selected }: NodeProps<GoalMindmapRfNode>) {
  const {
    goal,
    progress,
    healthStatus,
    isRoot,
    isDimmed,
    isFocused,
    timeframeLabel,
    isOverdue,
    onAddSubgoal,
    onOpenDetail,
  } = data;
  const overall = progress?.overall ?? 0;
  const showAdd = !isDimmed && canAddSubgoalForHorizon(goal.timeHorizon) && onAddSubgoal;
  const showDimmedDetail = isDimmed && onOpenDetail;

  const borderClass = isDimmed
    ? 'border-gray-300 dark:border-gray-600'
    : isFocused
      ? 'border-blue-500 ring-2 ring-blue-400/50 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-900'
      : isOverdue
        ? 'border-red-500 ring-1 ring-red-500/30 dark:border-red-500'
        : selected
          ? 'border-blue-500 ring-2 ring-blue-400/40 dark:ring-blue-500/30'
          : isRoot
            ? 'border-blue-300 dark:border-blue-600'
            : 'border-gray-200 dark:border-gray-600';

  return (
    <div
      className="flex flex-row items-center gap-2"
      style={{ width: GOAL_MINDMAP_LAYOUT_TOTAL_WIDTH }}
    >
      <div
        className={`relative w-[260px] shrink-0 rounded-lg border-2 bg-white p-3 shadow-md transition-colors dark:bg-gray-800 ${borderClass} ${
          isDimmed ? 'pointer-events-none opacity-40 grayscale' : ''
        }`}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="!h-2.5 !w-2.5 !border-2 !border-white dark:!border-gray-900 !bg-blue-500"
        />
        <div className="flex gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start gap-2">
              {!isDimmed ? <PriorityIndicator priority={goal.priority} size="sm" /> : null}
              {isFocused ? (
                <Target
                  className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400"
                  aria-hidden
                />
              ) : null}
              <h3
                className={`line-clamp-2 text-sm font-semibold leading-snug ${
                  isDimmed
                    ? 'text-gray-600 dark:text-gray-400'
                    : isOverdue
                      ? 'text-red-700 dark:text-red-400'
                      : 'text-gray-900 dark:text-white'
                }`}
              >
                {goal.title}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {isRoot && !isDimmed ? <AreaBadge area={goal.area} /> : null}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  isDimmed
                    ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    : isOverdue
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}
              >
                {timeframeLabel}
              </span>
              {isOverdue && !isDimmed ? (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/40 dark:text-red-300">
                  Overdue
                </span>
              ) : null}
              {!isDimmed && (goal.health ?? healthStatus) && goal.status === 'Active' ? (
                <HealthBadge health={goal.health ?? healthStatus!} />
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-center">
            <ProgressRing progress={overall} size="sm" />
            <span
              className={`mt-0.5 text-[10px] ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}
            >
              {overall}%
            </span>
          </div>
        </div>
        <Handle
          type="source"
          position={Position.Right}
          className="!h-2.5 !w-2.5 !border-2 !border-white dark:!border-gray-900 !bg-blue-500"
        />
      </div>
      <div className="flex h-full w-10 shrink-0 items-center justify-center self-stretch">
        {showDimmedDetail ? (
          <button
            type="button"
            className="nodrag nopan pointer-events-auto flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            title="Open goal details"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(goal);
            }}
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            <span className="sr-only">Open goal details</span>
          </button>
        ) : null}
        {showAdd ? (
          <button
            type="button"
            className="nodrag nopan flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-blue-200 bg-white text-blue-600 shadow-sm transition-colors hover:bg-blue-50 dark:border-blue-700 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-blue-900/30"
            title="Add subgoal for next timeframe"
            onClick={(e) => {
              e.stopPropagation();
              onAddSubgoal(goal);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden />
            <span className="sr-only">Add subgoal</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
