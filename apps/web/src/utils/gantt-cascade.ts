import type { CascadedGoalUpdate, Goal, GoalDependency } from '@/types/growth-system';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function goalBarStart(goal: Goal): Date | null {
  return parseDate(goal.startDate) ?? parseDate(goal.createdAt);
}

export function goalBarEnd(goal: Goal): Date | null {
  return parseDate(goal.targetDate);
}

export type GoalDateMap = Record<string, { startDate: string; targetDate: string }>;

/** Build working date map from goals (ISO date strings). */
export function buildGoalDateMap(goals: Goal[]): GoalDateMap {
  const map: GoalDateMap = {};
  for (const g of goals) {
    const start = goalBarStart(g);
    const end = goalBarEnd(g);
    if (start && end) {
      map[g.id] = { startDate: toIsoDate(start), targetDate: toIsoDate(end) };
    }
  }
  return map;
}

/**
 * Rigid forward-only FS cascade (mirrors backend compute_cascade_updates).
 */
export function computeCascadeUpdates(
  dateMap: GoalDateMap,
  dependencies: GoalDependency[],
  seedGoalIds: string[]
): CascadedGoalUpdate[] {
  const incoming = new Map<string, Array<{ predId: string; lagDays: number }>>();
  const outgoing = new Map<string, string[]>();

  for (const dep of dependencies) {
    const list = incoming.get(dep.successorGoalId) ?? [];
    list.push({ predId: dep.predecessorGoalId, lagDays: dep.lagDays });
    incoming.set(dep.successorGoalId, list);

    const outs = outgoing.get(dep.predecessorGoalId) ?? [];
    outs.push(dep.successorGoalId);
    outgoing.set(dep.predecessorGoalId, outs);
  }

  const updatedIds = new Set<string>();
  const queue: string[] = [];

  for (const seed of seedGoalIds) {
    for (const succ of outgoing.get(seed) ?? []) {
      if (!queue.includes(succ)) queue.push(succ);
    }
  }

  const maxIterations = Object.keys(dateMap).length + 1;
  let iterations = 0;

  while (queue.length > 0 && iterations < maxIterations) {
    iterations += 1;
    const succId = queue.shift()!;
    const dates = dateMap[succId];
    if (!dates) continue;

    const succStart = parseDate(dates.startDate);
    const succEnd = parseDate(dates.targetDate);
    if (!succStart || !succEnd) continue;

    const durationDays = Math.max(
      Math.round((succEnd.getTime() - succStart.getTime()) / MS_PER_DAY),
      1
    );

    let maxDesiredStart: Date | null = null;
    for (const { predId, lagDays } of incoming.get(succId) ?? []) {
      const pred = dateMap[predId];
      if (!pred) continue;
      const predEnd = parseDate(pred.targetDate);
      if (!predEnd) continue;
      const desired = new Date(predEnd.getTime() + lagDays * MS_PER_DAY);
      if (!maxDesiredStart || desired > maxDesiredStart) {
        maxDesiredStart = desired;
      }
    }

    if (!maxDesiredStart || maxDesiredStart <= succStart) continue;

    const deltaMs = maxDesiredStart.getTime() - succStart.getTime();
    const newStart = new Date(succStart.getTime() + deltaMs);
    const newEnd = new Date(newStart.getTime() + durationDays * MS_PER_DAY);

    dateMap[succId] = {
      startDate: toIsoDate(newStart),
      targetDate: toIsoDate(newEnd),
    };
    updatedIds.add(succId);

    for (const next of outgoing.get(succId) ?? []) {
      queue.push(next);
    }
  }

  return Array.from(updatedIds).map((id) => ({
    id,
    startDate: dateMap[id].startDate,
    targetDate: dateMap[id].targetDate,
  }));
}

/** Apply cascade preview on top of goal list (for optimistic timeline). */
export function applyCascadeToGoals(goals: Goal[], cascaded: CascadedGoalUpdate[]): Goal[] {
  if (cascaded.length === 0) return goals;
  const byId = new Map(cascaded.map((c) => [c.id, c]));
  return goals.map((g) => {
    const upd = byId.get(g.id);
    if (!upd) return g;
    return {
      ...g,
      ...(upd.startDate !== undefined ? { startDate: upd.startDate } : {}),
      ...(upd.targetDate !== undefined ? { targetDate: upd.targetDate } : {}),
    };
  });
}

/** Whether a dependency edge is currently violated (overlap). */
export function isDependencyViolated(dep: GoalDependency, dateMap: GoalDateMap): boolean {
  const pred = dateMap[dep.predecessorGoalId];
  const succ = dateMap[dep.successorGoalId];
  if (!pred || !succ) return false;
  const predEnd = parseDate(pred.targetDate);
  const succStart = parseDate(succ.startDate);
  if (!predEnd || !succStart) return false;
  const desired = new Date(predEnd.getTime() + dep.lagDays * MS_PER_DAY);
  return succStart < desired;
}
