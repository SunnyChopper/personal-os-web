import { GOAL_TIME_HORIZONS } from '@/constants/growth-system';
import type { Goal, GoalStatus } from '@/types/growth-system';

/** Timeline Gantt: hide Abandoned unless the user explicitly filters by status. */
export function filterGoalsForTimeline(goals: Goal[], statusFilter?: GoalStatus): Goal[] {
  if (statusFilter) return goals;
  return goals.filter((goal) => goal.status !== 'Abandoned');
}

/** Direct children of a parent goal, sorted by time horizon (Daily → Yearly) then title. */
export function childGoalsForParent(goals: Goal[], parentId: string): Goal[] {
  return goals
    .filter((goal) => goal.parentGoalId === parentId)
    .sort((a, b) => {
      const aIndex = GOAL_TIME_HORIZONS.indexOf(a.timeHorizon);
      const bIndex = GOAL_TIME_HORIZONS.indexOf(b.timeHorizon);
      const aRank = aIndex >= 0 ? aIndex : GOAL_TIME_HORIZONS.length;
      const bRank = bIndex >= 0 ? bIndex : GOAL_TIME_HORIZONS.length;
      if (aRank !== bRank) return aRank - bRank;
      return a.title.localeCompare(b.title);
    });
}
