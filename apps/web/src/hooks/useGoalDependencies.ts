import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { goalsService } from '@/services/growth-system/goals.service';
import {
  applyCascadedUpdatesToCache,
  applyGoalUpsertToCache,
} from '@/lib/react-query/growth-system-cache';
import { queryKeys } from '@/lib/react-query/query-keys';
import type { Goal, GoalDependency } from '@/types/growth-system';

function applyDependencyMutationResult(
  queryClient: ReturnType<typeof useQueryClient>,
  result: {
    dependency?: GoalDependency;
    cascaded?: { id: string; startDate?: string | null; targetDate?: string | null }[];
  }
) {
  if (result.cascaded?.length) {
    applyCascadedUpdatesToCache(queryClient, result.cascaded);
  }
  void queryClient.invalidateQueries({ queryKey: queryKeys.growthSystem.goals.dependencies() });
}

export function useGoalDependencies(goalIds?: string[]) {
  const queryClient = useQueryClient();
  const filterKey = goalIds?.length ? goalIds.join(',') : 'all';

  const { data, isLoading, error } = useQuery({
    queryKey: [...queryKeys.growthSystem.goals.dependencies(), filterKey],
    queryFn: async () => {
      const response = await goalsService.listAllDependencies(goalIds);
      return response.data ?? [];
    },
    staleTime: 2 * 60 * 1000,
  });

  const addMutation = useMutation({
    mutationFn: async ({
      successorGoalId,
      predecessorGoalId,
      lagDays,
    }: {
      successorGoalId: string;
      predecessorGoalId: string;
      lagDays?: number;
    }) => goalsService.addDependency(successorGoalId, predecessorGoalId, lagDays),
    onSuccess: (response) => {
      if (response.success && response.data) {
        applyDependencyMutationResult(queryClient, response.data);
      }
    },
  });

  const updateLagMutation = useMutation({
    mutationFn: async ({
      successorGoalId,
      predecessorGoalId,
      lagDays,
    }: {
      successorGoalId: string;
      predecessorGoalId: string;
      lagDays: number;
    }) => goalsService.updateDependencyLag(successorGoalId, predecessorGoalId, lagDays),
    onSuccess: (response) => {
      if (response.success && response.data) {
        applyDependencyMutationResult(queryClient, response.data);
      }
    },
  });

  const removeMutation = useMutation({
    mutationFn: async ({
      successorGoalId,
      predecessorGoalId,
    }: {
      successorGoalId: string;
      predecessorGoalId: string;
    }) => goalsService.removeDependency(successorGoalId, predecessorGoalId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.growthSystem.goals.dependencies(),
      });
    },
  });

  return {
    dependencies: data ?? [],
    isLoading,
    error,
    addDependency: addMutation.mutateAsync,
    updateDependencyLag: updateLagMutation.mutateAsync,
    removeDependency: removeMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}

/** Cascade-aware goal date update for timeline Gantt. */
export function useGoalTimelineUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      startDate,
      targetDate,
    }: {
      id: string;
      startDate?: string | null;
      targetDate?: string | null;
    }) => {
      const input: { startDate?: string | null; targetDate?: string | null } = {};
      if (startDate !== undefined) input.startDate = startDate;
      if (targetDate !== undefined) input.targetDate = targetDate;
      return goalsService.update(id, input, { cascade: true });
    },
    onSuccess: async (response) => {
      if (!response.success || !response.data) return;
      if ('goal' in response.data) {
        await applyGoalUpsertToCache(queryClient, response.data.goal);
        applyCascadedUpdatesToCache(queryClient, response.data.cascaded);
      } else {
        await applyGoalUpsertToCache(queryClient, response.data as Goal);
      }
    },
  });
}
