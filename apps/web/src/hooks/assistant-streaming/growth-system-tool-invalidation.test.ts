import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { queryKeys } from '@/lib/react-query/query-keys';
import {
  invalidateGrowthSystemCachesAfterGoalTool,
  invalidateGrowthSystemCachesAfterMutationTool,
  invalidateGrowthSystemCachesAfterTaskTool,
} from '@/hooks/assistant-streaming/growth-system-tool-invalidation';

describe('invalidateGrowthSystemCachesAfterTaskTool', () => {
  it('invalidates growth system tasks, dashboard, and wallet after a successful task tool', () => {
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    invalidateGrowthSystemCachesAfterTaskTool(queryClient, {
      toolName: 'complete_task',
      status: 'ok',
    });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.growthSystem.tasks.all() });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.growthSystem.data() });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.wallet.all });
  });

  it('does nothing when tool status is not ok', () => {
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    invalidateGrowthSystemCachesAfterTaskTool(queryClient, {
      toolName: 'complete_task',
      status: 'error',
    });

    expect(invalidate).not.toHaveBeenCalled();
  });

  it('does nothing for unrelated tools', () => {
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    invalidateGrowthSystemCachesAfterTaskTool(queryClient, {
      toolName: 'list_tasks',
      status: 'ok',
    });

    expect(invalidate).not.toHaveBeenCalled();
  });
});

describe('invalidateGrowthSystemCachesAfterGoalTool', () => {
  it('removes deleted goal from caches and invalidates goals + dashboard', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.growthSystem.goals.lists(), {
      success: true,
      data: [
        {
          id: 'goal-a',
          title: 'A',
          area: 'Operations',
          timeHorizon: 'Quarterly',
          status: 'Active',
        },
        {
          id: 'goal-b',
          title: 'B',
          area: 'Operations',
          timeHorizon: 'Quarterly',
          status: 'Active',
        },
      ],
    });
    queryClient.setQueryData(queryKeys.growthSystem.data(), {
      success: true,
      data: {
        goals: [
          {
            id: 'goal-a',
            title: 'A',
            area: 'Operations',
            timeHorizon: 'Quarterly',
            status: 'Active',
          },
          {
            id: 'goal-b',
            title: 'B',
            area: 'Operations',
            timeHorizon: 'Quarterly',
            status: 'Active',
          },
        ],
        tasks: [],
        projects: [],
        habits: [],
        metrics: [],
        logbookEntries: [],
        rewards: [],
        wallet: { balance: null, recentTransactions: [] },
      },
    });

    const cancel = vi.spyOn(queryClient, 'cancelQueries');
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    await invalidateGrowthSystemCachesAfterGoalTool(queryClient, {
      toolName: 'delete_goal',
      status: 'ok',
      arguments: { goalId: 'goal-b' },
    });

    const goalsCache = queryClient.getQueryData<{ data: { id: string }[] }>(
      queryKeys.growthSystem.goals.lists()
    );
    expect(goalsCache?.data.map((g) => g.id)).toEqual(['goal-a']);

    expect(cancel).toHaveBeenCalledWith({ queryKey: queryKeys.growthSystem.goals.all() });
    expect(cancel).toHaveBeenCalledWith({ queryKey: queryKeys.growthSystem.data() });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.growthSystem.goals.all() });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.growthSystem.data() });
  });

  it('does nothing for list_goals', async () => {
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    await invalidateGrowthSystemCachesAfterGoalTool(queryClient, {
      toolName: 'list_goals',
      status: 'ok',
      arguments: {},
    });

    expect(invalidate).not.toHaveBeenCalled();
  });
});

describe('invalidateGrowthSystemCachesAfterMutationTool', () => {
  it('runs both task and goal handlers', async () => {
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    await invalidateGrowthSystemCachesAfterMutationTool(queryClient, {
      toolName: 'delete_goal',
      status: 'ok',
      arguments: { goalId: 'goal-x' },
    });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.growthSystem.goals.all() });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.growthSystem.data() });
  });
});
