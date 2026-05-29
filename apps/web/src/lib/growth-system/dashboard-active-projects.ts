import type { Project } from '@/types/growth-system';

/** Max rows in the dashboard Active Projects widget (summary card is uncapped). */
export const ACTIVE_PROJECTS_WIDGET_LIMIT = 5;

function parseTimestamp(value: string | null | undefined): number {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

/** Deterministic ordering for dashboard Active Projects widget (newest activity first). */
export function compareActiveProjectsForDashboard(a: Project, b: Project): number {
  const updatedDiff = parseTimestamp(b.updatedAt) - parseTimestamp(a.updatedAt);
  if (updatedDiff !== 0) return updatedDiff;

  const createdDiff = parseTimestamp(b.createdAt) - parseTimestamp(a.createdAt);
  if (createdDiff !== 0) return createdDiff;

  const nameDiff = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  if (nameDiff !== 0) return nameDiff;

  return a.id.localeCompare(b.id);
}

export function sortActiveProjectsForDashboard(projects: readonly Project[]): Project[] {
  return projects
    .filter((p) => p.status === 'Active')
    .slice()
    .sort(compareActiveProjectsForDashboard);
}

export function getActiveProjectsWidgetView(projects: readonly Project[]) {
  const activeProjects = sortActiveProjectsForDashboard(projects);
  const visibleActiveProjects = activeProjects.slice(0, ACTIVE_PROJECTS_WIDGET_LIMIT);
  const hiddenActiveProjectCount = activeProjects.length - visibleActiveProjects.length;

  return { activeProjects, visibleActiveProjects, hiddenActiveProjectCount };
}

export function formatHiddenActiveProjectsLabel(hiddenCount: number): string {
  if (hiddenCount <= 0) return '';
  return hiddenCount === 1 ? '+1 more active project' : `+${hiddenCount} more active projects`;
}
