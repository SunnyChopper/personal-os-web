import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { Plus } from 'lucide-react';
import type { Goal, GoalProgressBreakdown, TimeHorizon } from '@/types/growth-system';
import { AreaBadge } from '@/components/atoms/AreaBadge';
import { ProgressRing } from '@/components/atoms/ProgressRing';
import { PriorityIndicator } from '@/components/atoms/PriorityIndicator';
import { GOAL_MINDMAP_LAYOUT_TOTAL_WIDTH } from '@/components/molecules/goal-mindmap-utils';

export type GoalMindmapNodeData = {
  goal: Goal;
  progress?: GoalProgressBreakdown;
  healthStatus?: 'healthy' | 'at_risk' | 'behind' | 'dormant';
  isRoot?: boolean;
  timeframeLabel: string;
  isOverdue: boolean;
  onAddSubgoal?: (goal: Goal) => void;
};

export type GoalMindmapRfNode = Node<GoalMindmapNodeData, 'goalMindmap'>;

function healthLabel(status: GoalMindmapNodeData['healthStatus']): string {
  switch (status) {
    case 'at_risk':
      return 'At Risk';
    case 'behind':
      return 'Behind';
    case 'dormant':
      return 'Dormant';
    case 'healthy':
    default:
      return 'On Track';
  }
}

function healthClass(status: GoalMindmapNodeData['healthStatus']): string {
  switch (status) {
    case 'healthy':
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
    case 'at_risk':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
    case 'behind':
      return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
    case 'dormant':
      return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
  }
}

function canAddSubgoalForHorizon(timeHorizon: TimeHorizon): boolean {
  return timeHorizon !== 'Weekly' && timeHorizon !== 'Daily';
}

export function GoalMindmapNode({ data, selected }: NodeProps<GoalMindmapRfNode>) {
  const { goal, progress, healthStatus, isRoot, timeframeLabel, isOverdue, onAddSubgoal } = data;
  const overall = progress?.overall ?? 0;
  const showAdd = canAddSubgoalForHorizon(goal.timeHorizon) && onAddSubgoal;

  const borderClass = isOverdue
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
        className={`relative w-[260px] shrink-0 rounded-lg border-2 bg-white p-3 shadow-md transition-colors dark:bg-gray-800 ${borderClass}`}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="!h-2.5 !w-2.5 !border-2 !border-white dark:!border-gray-900 !bg-blue-500"
        />
        <div className="flex gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-start gap-2">
              <PriorityIndicator priority={goal.priority} size="sm" />
              <h3
                className={`line-clamp-2 text-sm font-semibold leading-snug ${
                  isOverdue ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'
                }`}
              >
                {goal.title}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {isRoot ? <AreaBadge area={goal.area} /> : null}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  isOverdue
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}
              >
                {timeframeLabel}
              </span>
              {isOverdue ? (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/40 dark:text-red-300">
                  Overdue
                </span>
              ) : null}
              {healthStatus ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${healthClass(healthStatus)}`}
                >
                  {healthLabel(healthStatus)}
                </span>
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
