import { describe, expect, it } from 'vitest';
import type { Task } from '@/types/growth-system';
import { buildKanbanColumnItems } from '../build-kanban-column-items';

function task(id: string, projectIds: string[] = []): Task {
  return {
    id,
    title: `Task ${id}`,
    description: null,
    extendedDescription: null,
    area: 'Operations',
    subCategory: null,
    priority: 'P2',
    status: 'Backlog',
    size: 3,
    dueDate: null,
    scheduledDate: null,
    completedDate: null,
    notes: null,
    isRecurring: false,
    recurrenceRule: null,
    pointValue: null,
    pointsAwarded: null,
    projectIds,
    goalIds: [],
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };
}

describe('buildKanbanColumnItems', () => {
  it('returns standalone items when only one task shares a project', () => {
    const items = buildKanbanColumnItems([task('a', ['p1']), task('b', ['p2'])]);
    expect(items).toHaveLength(2);
    expect(items.every((item) => item.kind === 'standalone')).toBe(true);
  });

  it('rolls up when two or more tasks share the same first project in the column', () => {
    const items = buildKanbanColumnItems([task('a', ['p1']), task('b', ['p2']), task('c', ['p1'])]);
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      kind: 'rollup',
      projectId: 'p1',
      tasks: [expect.objectContaining({ id: 'a' }), expect.objectContaining({ id: 'c' })],
    });
    expect(items[1]).toMatchObject({
      kind: 'standalone',
      task: expect.objectContaining({ id: 'b' }),
    });
  });

  it('keeps tasks without a project as standalone cards', () => {
    const items = buildKanbanColumnItems([task('a'), task('b'), task('c', ['p1'])]);
    const standalone = items.filter((item) => item.kind === 'standalone');
    expect(standalone).toHaveLength(3);
    expect(items.some((item) => item.kind === 'rollup')).toBe(false);
  });

  it('includes a newly linked task in an existing project rollup', () => {
    const before = buildKanbanColumnItems([task('a', ['p1']), task('b', ['p1']), task('solo', [])]);
    expect(before.filter((item) => item.kind === 'rollup')).toHaveLength(1);

    const after = buildKanbanColumnItems([
      task('a', ['p1']),
      task('b', ['p1']),
      task('solo', ['p1']),
    ]);
    const rollup = after.find((item) => item.kind === 'rollup');
    expect(rollup).toMatchObject({
      kind: 'rollup',
      projectId: 'p1',
    });
    if (rollup?.kind === 'rollup') {
      expect(rollup.tasks.map((t) => t.id)).toEqual(['a', 'b', 'solo']);
    }
  });

  it('preserves first-seen group order in the column', () => {
    const items = buildKanbanColumnItems([
      task('solo', ['p2']),
      task('a', ['p1']),
      task('b', ['p1']),
    ]);
    expect(items[0]).toMatchObject({
      kind: 'standalone',
      task: expect.objectContaining({ id: 'solo' }),
    });
    expect(items[1]).toMatchObject({ kind: 'rollup', projectId: 'p1' });
  });
});
