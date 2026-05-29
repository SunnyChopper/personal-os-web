import type { Goal, GoalHealth, TimeHorizon } from '@/types/growth-system';

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** ISO week number for a local calendar date */
function getISOWeek(date: Date): number {
  const t = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function formatGoalMindmapTimeframe(goal: Goal): string {
  const { timeHorizon, targetDate } = goal;
  if (!targetDate) {
    return timeHorizon;
  }
  const d = new Date(targetDate);
  if (Number.isNaN(d.getTime())) {
    return timeHorizon;
  }
  const y = d.getFullYear();
  const m = d.getMonth();
  const q = Math.floor(m / 3) + 1;

  switch (timeHorizon as TimeHorizon) {
    case 'Yearly':
      return `Yearly - ${y}`;
    case 'Quarterly':
      return `Quarterly - Q${q}`;
    case 'Monthly':
      return `Monthly - ${MONTHS_SHORT[m]}`;
    case 'Weekly':
      return `Weekly - W${getISOWeek(d).toString().padStart(2, '0')}`;
    case 'Daily':
      return `Daily - ${MONTHS_SHORT[m]} ${d.getDate()}`;
    default:
      return timeHorizon;
  }
}

/** Total node width for mindmap layout (card + gap + add control). Keep in sync with GoalMindmapView dagre. */
export const GOAL_MINDMAP_LAYOUT_TOTAL_WIDTH = 260 + 8 + 40;

export function compareGoalsByTargetDate(a: Goal, b: Goal): number {
  if (!a.targetDate && !b.targetDate) return 0;
  if (!a.targetDate) return 1;
  if (!b.targetDate) return -1;
  return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
}

export function buildGoalsByParentMap(allGoals: Goal[]): Map<string | null, Goal[]> {
  const byParent = new Map<string | null, Goal[]>();
  for (const g of allGoals) {
    const p = g.parentGoalId;
    if (!byParent.has(p)) byParent.set(p, []);
    byParent.get(p)!.push(g);
  }
  for (const [, arr] of byParent) {
    arr.sort(compareGoalsByTargetDate);
  }
  return byParent;
}

/**
 * Drop goals whose parent chain includes a goal outside `matchingGoals` (flat filter leak).
 */
export function retainGoalsWithMatchingAncestors(matchingGoals: Goal[], allGoals: Goal[]): Goal[] {
  const matchingIds = new Set(matchingGoals.map((g) => g.id));
  const parentById = new Map(allGoals.map((g) => [g.id, g.parentGoalId]));

  return matchingGoals.filter((goal) => {
    let parentId = parentById.get(goal.id) ?? goal.parentGoalId;
    while (parentId) {
      if (!matchingIds.has(parentId)) return false;
      parentId = parentById.get(parentId) ?? null;
    }
    return true;
  });
}

/** Topmost goals in the hierarchy that pass the active filter (for mindmap focus picker). */
export function listTopMatchingRootGoals(allGoals: Goal[], matchingIds: Set<string>): Goal[] {
  const parentById = new Map(allGoals.map((g) => [g.id, g.parentGoalId]));
  return allGoals
    .filter((g) => {
      if (!matchingIds.has(g.id)) return false;
      const parentId = parentById.get(g.id) ?? g.parentGoalId;
      return !parentId || !matchingIds.has(parentId);
    })
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title));
}

type MindmapHealthEntry = {
  momentum?: 'active' | 'dormant';
  status?: GoalHealth;
};

function isArchivedOrInactiveGoal(
  goal: Goal,
  goalsHealth: Map<string, MindmapHealthEntry>
): boolean {
  if (goal.status === 'Achieved' || goal.status === 'Abandoned') return true;
  const health = goalsHealth.get(goal.id);
  return health?.momentum === 'dormant' || health?.status === 'dormant';
}

function shouldIncludeChildInMindmap(
  parent: Goal,
  child: Goal,
  matchingIds: Set<string>,
  goalsHealth: Map<string, MindmapHealthEntry>
): boolean {
  if (!matchingIds.has(child.id)) return false;
  if (
    isArchivedOrInactiveGoal(parent, goalsHealth) &&
    goalsHealth.get(child.id)?.momentum === 'active'
  ) {
    return false;
  }
  return true;
}

/**
 * Collect descendants of `rootId` that pass the filter and sit under a fully matching ancestor chain.
 * Uses the full goal tree for parent/child links so gaps in flat filters do not surface orphan nodes.
 */
export function collectMatchingSubtreeGoals(
  rootId: string,
  allGoals: Goal[],
  matchingIds: Set<string>,
  goalsHealth: Map<string, MindmapHealthEntry> = new Map()
): Goal[] {
  const byParent = buildGoalsByParentMap(allGoals);
  const out: Goal[] = [];

  const visit = (id: string, parent: Goal | undefined) => {
    if (!matchingIds.has(id)) return;
    const goal = allGoals.find((x) => x.id === id);
    if (!goal) return;
    if (parent && !shouldIncludeChildInMindmap(parent, goal, matchingIds, goalsHealth)) {
      return;
    }
    out.push(goal);
    for (const child of byParent.get(id) ?? []) {
      visit(child.id, goal);
    }
  };

  visit(rootId, undefined);
  return out;
}

/** Remove nodes whose parent is missing from the subtree (layout safety net). */
export function pruneSubtreeOrphans(subtree: Goal[]): Goal[] {
  const ids = new Set(subtree.map((g) => g.id));
  return subtree.filter((g) => !g.parentGoalId || ids.has(g.parentGoalId));
}

export type PipelineSubtreeResult = {
  subtree: Goal[];
  rootId: string | null;
  ancestorIds: Set<string>;
  leafId: string;
};

/**
 * Walk `parentGoalId` from `leafId` to the top; returns chain ordered root → leaf.
 */
export function collectAncestorChain(leafId: string, allGoals: Goal[]): Goal[] {
  const byId = new Map(allGoals.map((g) => [g.id, g]));
  const chain: Goal[] = [];
  const visited = new Set<string>();
  let currentId: string | null = leafId;

  while (currentId) {
    if (visited.has(currentId)) break;
    visited.add(currentId);
    const goal = byId.get(currentId);
    if (!goal) break;
    chain.unshift(goal);
    currentId = goal.parentGoalId;
  }

  return chain;
}

/**
 * Focus pipeline: focused leaf plus ancestors only (no siblings or descendants).
 */
export function buildPipelineSubtree(leafId: string, allGoals: Goal[]): PipelineSubtreeResult {
  const empty: PipelineSubtreeResult = {
    subtree: [],
    rootId: null,
    ancestorIds: new Set(),
    leafId,
  };

  const byId = new Map(allGoals.map((g) => [g.id, g]));
  if (!byId.has(leafId)) return empty;

  const chain = collectAncestorChain(leafId, allGoals);
  if (chain.length === 0) return empty;

  const ancestorIds = new Set(chain.slice(0, -1).map((g) => g.id));
  const rootId = chain[0]!.id;

  return {
    subtree: chain,
    rootId,
    ancestorIds,
    leafId,
  };
}

const TIME_HORIZON_PIPELINE_ORDER: Record<TimeHorizon, number> = {
  Daily: 0,
  Weekly: 1,
  Monthly: 2,
  Quarterly: 3,
  Yearly: 4,
};

/** Leaf goals (no children) sorted for the Focus Pipeline filter picker. */
export function listPipelineLeafGoals(allGoals: Goal[]): Goal[] {
  const parentIds = new Set(
    allGoals.map((g) => g.parentGoalId).filter((id): id is string => id != null)
  );

  return allGoals
    .filter((g) => !parentIds.has(g.id))
    .slice()
    .sort((a, b) => {
      const horizonDiff =
        TIME_HORIZON_PIPELINE_ORDER[a.timeHorizon] - TIME_HORIZON_PIPELINE_ORDER[b.timeHorizon];
      if (horizonDiff !== 0) return horizonDiff;
      const dateCmp = compareGoalsByTargetDate(a, b);
      if (dateCmp !== 0) return dateCmp;
      return a.title.localeCompare(b.title);
    });
}
