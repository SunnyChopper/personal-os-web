import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { queryKeys } from '@/lib/react-query/query-keys';
import {
  applyGoalDeletedToCache,
  removeGoalCache,
  upsertTaskCache,
} from '@/lib/react-query/growth-system-cache';
import type { Task } from '@/types/growth-system';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Task one',
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
    projectIds: [],
    goalIds: [],
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('upsertTaskCache', () => {
  it('updates projectIds and goalIds on cached list and dashboard tasks', () => {
    const queryClient = new QueryClient();
    const original = makeTask({ id: 'task-1', projectIds: [], goalIds: [] });
    queryClient.setQueryData(queryKeys.growthSystem.tasks.lists(), {
      success: true,
      data: [original],
    });
    queryClient.setQueryData(queryKeys.growthSystem.data(), {
      success: true,
      data: { tasks: [original] },
    });

    upsertTaskCache(queryClient, makeTask({ id: 'task-1', projectIds: ['p1'], goalIds: ['g1'] }));

    const listCache = queryClient.getQueryData<{ data: Task[] }>(
      queryKeys.growthSystem.tasks.lists()
    );
    expect(listCache?.data?.[0]?.projectIds).toEqual(['p1']);
    expect(listCache?.data?.[0]?.goalIds).toEqual(['g1']);

    const dashboardCache = queryClient.getQueryData<{ data: { tasks: Task[] } }>(
      queryKeys.growthSystem.data()
    );
    expect(dashboardCache?.data?.tasks?.[0]?.projectIds).toEqual(['p1']);
    expect(dashboardCache?.data?.tasks?.[0]?.goalIds).toEqual(['g1']);
  });
});

describe('removeGoalCache', () => {
  it('does not throw when dashboard summary arrays are missing', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.growthSystem.goals.lists(), {
      success: true,
      data: [{ id: 'goal-1', title: 'One' }],
    });
    queryClient.setQueryData(queryKeys.growthSystem.data(), {
      success: true,
      data: {
        goals: [{ id: 'goal-1', title: 'One' }],
      },
    });

    expect(() => removeGoalCache(queryClient, 'goal-1')).not.toThrow();

    const goalsCache = queryClient.getQueryData<{ data: unknown[] }>(
      queryKeys.growthSystem.goals.lists()
    );
    expect(goalsCache?.data).toEqual([]);
  });

  it('applyGoalDeletedToCache cancels in-flight queries before removing the goal', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.growthSystem.goals.lists(), {
      success: true,
      data: [{ id: 'goal-1', title: 'One' }],
    });

    const cancel = vi.spyOn(queryClient, 'cancelQueries');
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    await applyGoalDeletedToCache(queryClient, 'goal-1');

    expect(cancel).toHaveBeenCalledWith({ queryKey: queryKeys.growthSystem.goals.all() });
    expect(cancel).toHaveBeenCalledWith({ queryKey: queryKeys.growthSystem.data() });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.growthSystem.goals.all() });

    const goalsCache = queryClient.getQueryData<{ data: unknown[] }>(
      queryKeys.growthSystem.goals.lists()
    );
    expect(goalsCache?.data).toEqual([]);
  });
});
