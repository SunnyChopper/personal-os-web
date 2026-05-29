import type { CascadedProjectUpdate, Project, ProjectDependency } from '@/types/growth-system';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function projectBarStart(project: Project): Date | null {
  return parseDate(project.startDate) ?? parseDate(project.createdAt);
}

export function projectBarEnd(project: Project): Date | null {
  return parseDate(project.targetEndDate);
}

export type ProjectDateMap = Record<string, { startDate: string; targetEndDate: string }>;

/** Build working date map from projects (ISO date strings). */
export function buildProjectDateMap(projects: Project[]): ProjectDateMap {
  const map: ProjectDateMap = {};
  for (const p of projects) {
    const start = projectBarStart(p);
    const end = projectBarEnd(p);
    if (start && end) {
      map[p.id] = { startDate: toIsoDate(start), targetEndDate: toIsoDate(end) };
    }
  }
  return map;
}

/**
 * Rigid forward-only FS cascade (mirrors backend compute_cascade_updates).
 */
export function computeCascadeUpdates(
  dateMap: ProjectDateMap,
  dependencies: ProjectDependency[],
  seedProjectIds: string[]
): CascadedProjectUpdate[] {
  const incoming = new Map<string, Array<{ predId: string; lagDays: number }>>();
  const outgoing = new Map<string, string[]>();

  for (const dep of dependencies) {
    const list = incoming.get(dep.successorProjectId) ?? [];
    list.push({ predId: dep.predecessorProjectId, lagDays: dep.lagDays });
    incoming.set(dep.successorProjectId, list);

    const outs = outgoing.get(dep.predecessorProjectId) ?? [];
    outs.push(dep.successorProjectId);
    outgoing.set(dep.predecessorProjectId, outs);
  }

  const updatedIds = new Set<string>();
  const queue: string[] = [];

  for (const seed of seedProjectIds) {
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
    const succEnd = parseDate(dates.targetEndDate);
    if (!succStart || !succEnd) continue;

    const durationDays = Math.max(
      Math.round((succEnd.getTime() - succStart.getTime()) / MS_PER_DAY),
      1
    );

    let maxDesiredStart: Date | null = null;
    for (const { predId, lagDays } of incoming.get(succId) ?? []) {
      const pred = dateMap[predId];
      if (!pred) continue;
      const predEnd = parseDate(pred.targetEndDate);
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
      targetEndDate: toIsoDate(newEnd),
    };
    updatedIds.add(succId);

    for (const next of outgoing.get(succId) ?? []) {
      queue.push(next);
    }
  }

  return Array.from(updatedIds).map((id) => ({
    id,
    startDate: dateMap[id].startDate,
    targetEndDate: dateMap[id].targetEndDate,
  }));
}

/** Apply cascade preview on top of project list (for optimistic timeline). */
export function applyCascadeToProjects(
  projects: Project[],
  cascaded: CascadedProjectUpdate[]
): Project[] {
  if (cascaded.length === 0) return projects;
  const byId = new Map(cascaded.map((c) => [c.id, c]));
  return projects.map((p) => {
    const upd = byId.get(p.id);
    if (!upd) return p;
    return {
      ...p,
      ...(upd.startDate !== undefined ? { startDate: upd.startDate } : {}),
      ...(upd.targetEndDate !== undefined ? { targetEndDate: upd.targetEndDate } : {}),
    };
  });
}

/** Whether a dependency edge is currently violated (overlap). */
export function isDependencyViolated(dep: ProjectDependency, dateMap: ProjectDateMap): boolean {
  const pred = dateMap[dep.predecessorProjectId];
  const succ = dateMap[dep.successorProjectId];
  if (!pred || !succ) return false;
  const predEnd = parseDate(pred.targetEndDate);
  const succStart = parseDate(succ.startDate);
  if (!predEnd || !succStart) return false;
  const desired = new Date(predEnd.getTime() + dep.lagDays * MS_PER_DAY);
  return succStart < desired;
}
