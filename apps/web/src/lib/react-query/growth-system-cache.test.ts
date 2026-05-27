import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { queryKeys } from '@/lib/react-query/query-keys';
import { removeGoalCache } from '@/lib/react-query/growth-system-cache';

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
});
