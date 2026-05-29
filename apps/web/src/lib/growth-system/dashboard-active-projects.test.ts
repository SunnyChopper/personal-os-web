import { describe, expect, it } from 'vitest';

import type { Project } from '@/types/growth-system';

import {
  ACTIVE_PROJECTS_WIDGET_LIMIT,
  compareActiveProjectsForDashboard,
  formatHiddenActiveProjectsLabel,
  getActiveProjectsWidgetView,
  sortActiveProjectsForDashboard,
} from './dashboard-active-projects';

function makeProject(overrides: Partial<Project> & Pick<Project, 'id' | 'name'>): Project {
  return {
    description: null,
    area: 'Operations',
    subCategory: null,
    priority: 'P3',
    status: 'Active',
    impact: 1,
    startDate: null,
    targetEndDate: null,
    actualEndDate: null,
    notes: null,
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('dashboard-active-projects', () => {
  it('sorts by updatedAt desc, then createdAt, name, id', () => {
    const projects = [
      makeProject({ id: 'b', name: 'Bravo', updatedAt: '2026-05-01T00:00:00Z' }),
      makeProject({ id: 'a', name: 'Alpha', updatedAt: '2026-05-10T00:00:00Z' }),
      makeProject({ id: 'c', name: 'Charlie', updatedAt: '2026-05-10T00:00:00Z' }),
    ];

    expect(sortActiveProjectsForDashboard(projects).map((p) => p.id)).toEqual(['a', 'c', 'b']);
    expect(compareActiveProjectsForDashboard(projects[1], projects[2])).toBeLessThan(0);
  });

  it('excludes non-active projects from widget view', () => {
    const projects = [
      makeProject({ id: 'active-1', name: 'Active One' }),
      makeProject({ id: 'planning-1', name: 'Planning One', status: 'Planning' }),
    ];

    const view = getActiveProjectsWidgetView(projects);
    expect(view.activeProjects).toHaveLength(1);
    expect(view.visibleActiveProjects[0]?.id).toBe('active-1');
    expect(view.hiddenActiveProjectCount).toBe(0);
  });

  it('caps visible rows and reports hidden count', () => {
    const projects = Array.from({ length: ACTIVE_PROJECTS_WIDGET_LIMIT + 1 }, (_, i) =>
      makeProject({
        id: `p-${i}`,
        name: `Project ${i}`,
        updatedAt: `2026-05-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
      })
    );

    const view = getActiveProjectsWidgetView(projects);
    expect(view.activeProjects).toHaveLength(ACTIVE_PROJECTS_WIDGET_LIMIT + 1);
    expect(view.visibleActiveProjects).toHaveLength(ACTIVE_PROJECTS_WIDGET_LIMIT);
    expect(view.hiddenActiveProjectCount).toBe(1);
    expect(view.visibleActiveProjects.map((p) => p.id)).not.toContain('p-0');
  });

  it('formats hidden label for singular and plural', () => {
    expect(formatHiddenActiveProjectsLabel(0)).toBe('');
    expect(formatHiddenActiveProjectsLabel(1)).toBe('+1 more active project');
    expect(formatHiddenActiveProjectsLabel(3)).toBe('+3 more active projects');
  });
});
