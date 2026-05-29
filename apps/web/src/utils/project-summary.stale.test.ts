import { describe, expect, it } from 'vitest';
import type { Project } from '@/types/growth-system';
import { getProjectDisplayModel, isProjectStaleForDisplay } from './project-summary';

function mockProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    name: 'Founder OS',
    description: null,
    area: 'Operations',
    subCategory: null,
    priority: 'P3',
    status: 'Planning',
    impact: 3,
    startDate: '2026-03-01',
    targetEndDate: '2026-04-30',
    actualEndDate: null,
    isStale: true,
    notes: null,
    userId: 'u1',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('isProjectStaleForDisplay', () => {
  it('returns true when backend marks project stale', () => {
    expect(isProjectStaleForDisplay(mockProject(), false)).toBe(true);
  });

  it('suppresses stale when work is complete', () => {
    expect(isProjectStaleForDisplay(mockProject(), true)).toBe(false);
  });

  it('suppresses stale for cancelled projects', () => {
    expect(isProjectStaleForDisplay(mockProject({ status: 'Cancelled' }), false)).toBe(false);
  });
});

describe('getProjectDisplayModel', () => {
  it('includes isStale from backend flag', () => {
    const display = getProjectDisplayModel(mockProject(), 0, 0, []);
    expect(display.isStale).toBe(true);
    expect(display.effectiveStatus).toBe('Planning');
  });
});
