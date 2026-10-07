import { describe, expect, it } from 'vitest';

import {
  getGridProjectAccentBarClass,
  projectGridAccentBarClassName,
  projectGridCardShellClassName,
  projectPriorityAccentBgClass,
} from '@/lib/growth-system/project-card-surfaces';

describe('projectPriorityAccentBgClass', () => {
  it('maps P1–P4 to priority accent backgrounds', () => {
    expect(projectPriorityAccentBgClass('P1')).toContain('bg-red-500');
    expect(projectPriorityAccentBgClass('P2')).toContain('bg-orange-500');
    expect(projectPriorityAccentBgClass('P3')).toContain('bg-yellow-500');
    expect(projectPriorityAccentBgClass('P4')).toContain('bg-green-500');
  });

  it('defaults invalid priority to P3', () => {
    expect(projectPriorityAccentBgClass(null)).toContain('bg-yellow-500');
  });
});

describe('getGridProjectAccentBarClass', () => {
  it('returns emerald when work is complete', () => {
    expect(
      getGridProjectAccentBarClass({
        priority: 'P1',
        isWorkComplete: true,
        status: 'Active',
      })
    ).toContain('bg-emerald-500');
  });

  it('returns emerald when status is Completed', () => {
    expect(
      getGridProjectAccentBarClass({
        priority: 'P2',
        isWorkComplete: false,
        status: 'Completed',
      })
    ).toContain('bg-emerald-500');
  });

  it('returns null when cancelled', () => {
    expect(
      getGridProjectAccentBarClass({
        priority: 'P1',
        isWorkComplete: false,
        status: 'Cancelled',
      })
    ).toBeNull();
  });

  it('returns priority accent for active projects', () => {
    expect(
      getGridProjectAccentBarClass({
        priority: 'P1',
        isWorkComplete: false,
        status: 'Active',
      })
    ).toContain('bg-red-500');
  });
});

describe('projectGridCardShellClassName', () => {
  it('uses a compact padded shell with hover border emphasis', () => {
    const idle = projectGridCardShellClassName();
    expect(idle).toContain('p-3');
    expect(idle).toContain('border-gray-200');
    expect(idle).toContain('lg:hover:border-blue-500');
    expect(idle).not.toContain('border-blue-500 ring-1');
  });
});

describe('projectGridAccentBarClassName', () => {
  it('hides accent at rest and reveals on hover or focus', () => {
    const classes = projectGridAccentBarClassName({
      accentBgClass: 'bg-red-500',
    });
    expect(classes).toContain('opacity-0');
    expect(classes).toContain('group-hover:opacity-100');
    expect(classes).toContain('group-focus-within:opacity-100');
  });

  it('returns null when no accent color', () => {
    expect(
      projectGridAccentBarClassName({
        accentBgClass: null,
      })
    ).toBeNull();
  });
});
