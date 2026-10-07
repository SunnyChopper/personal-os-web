import { describe, expect, it } from 'vitest';
import {
  buildTaskEditFormSnapshot,
  taskEditFormSnapshotsEqual,
} from '@/lib/growth-system/task-edit-form-snapshot';

describe('task-edit-form-snapshot', () => {
  const base = buildTaskEditFormSnapshot({
    title: 'Ship feature',
    description: 'Details here',
    notes: '',
    area: 'Operations',
    subCategory: undefined,
    priority: 'P2',
    status: 'Backlog',
    size: 3,
    dueDate: '2026-08-01',
    scheduledDate: '',
    pointValue: 10,
    energyLevel: 'Deep Work',
    executionWindow: 'Morning Peak',
    projectIds: ['p2', 'p1'],
    goalIds: ['g1'],
    dependencyIds: ['d2', 'd1'],
  });

  it('detects dirty when notes change', () => {
    const current = buildTaskEditFormSnapshot({
      ...base,
      notes: 'Follow up with team',
    });
    expect(taskEditFormSnapshotsEqual(base, current)).toBe(false);
  });

  it('treats trimmed notes as equal', () => {
    const a = buildTaskEditFormSnapshot({
      ...base,
      notes: ' Note ',
    });
    const b = buildTaskEditFormSnapshot({
      ...base,
      notes: 'Note',
    });
    expect(taskEditFormSnapshotsEqual(a, b)).toBe(true);
  });

  it('detects dirty when title changes', () => {
    const current = buildTaskEditFormSnapshot({
      ...base,
      title: 'Ship feature v2',
    });
    expect(taskEditFormSnapshotsEqual(base, current)).toBe(false);
  });

  it('treats trimmed strings as equal', () => {
    const a = buildTaskEditFormSnapshot({
      ...base,
      title: ' Title ',
      description: ' Details ',
      dueDate: ' 2026-08-01 ',
    });
    const b = buildTaskEditFormSnapshot({
      ...base,
      title: 'Title',
      description: 'Details',
      dueDate: '2026-08-01',
    });
    expect(taskEditFormSnapshotsEqual(a, b)).toBe(true);
  });

  it('sorts link ids for stable compare', () => {
    const a = buildTaskEditFormSnapshot({
      ...base,
      projectIds: ['p2', 'p1'],
      goalIds: ['g1'],
      dependencyIds: ['d2', 'd1'],
    });
    const b = buildTaskEditFormSnapshot({
      ...base,
      projectIds: ['p1', 'p2'],
      goalIds: ['g1'],
      dependencyIds: ['d1', 'd2'],
    });
    expect(taskEditFormSnapshotsEqual(a, b)).toBe(true);
  });
});
