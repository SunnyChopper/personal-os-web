import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { queryKeys } from '@/lib/react-query/query-keys';
import { invalidateGrowthSystemCachesAfterTaskTool } from '@/hooks/assistant-streaming/growth-system-tool-invalidation';

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
