import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsService } from '@/services/growth-system/projects.service';
import {
  applyCascadedProjectUpdatesToCache,
  upsertProjectCache,
} from '@/lib/react-query/growth-system-cache';
import { queryKeys } from '@/lib/react-query/query-keys';
import type { Project, ProjectDependency, UpdateProjectInput } from '@/types/growth-system';

function applyDependencyMutationResult(
  queryClient: ReturnType<typeof useQueryClient>,
  result: {
    dependency?: ProjectDependency;
    cascaded?: { id: string; startDate?: string | null; targetEndDate?: string | null }[];
  }
) {
  if (result.cascaded?.length) {
    applyCascadedProjectUpdatesToCache(queryClient, result.cascaded);
  }
  void queryClient.invalidateQueries({
    queryKey: queryKeys.growthSystem.projects.dependencies(),
  });
}

export function useProjectDependencies(projectIds?: string[]) {
  const queryClient = useQueryClient();
  const filterKey = projectIds?.length ? projectIds.join(',') : 'all';

  const { data, isLoading, error } = useQuery({
    queryKey: [...queryKeys.growthSystem.projects.dependencies(), filterKey],
    queryFn: async () => {
      const response = await projectsService.listAllDependencies(projectIds);
      return response.data ?? [];
    },
    staleTime: 2 * 60 * 1000,
  });

  const addMutation = useMutation({
    mutationFn: async ({
      successorProjectId,
      predecessorProjectId,
      lagDays,
    }: {
      successorProjectId: string;
      predecessorProjectId: string;
      lagDays?: number;
    }) => projectsService.addDependency(successorProjectId, predecessorProjectId, lagDays),
    onSuccess: (response) => {
      if (response.success && response.data) {
        applyDependencyMutationResult(queryClient, response.data);
      }
    },
  });

  const updateLagMutation = useMutation({
    mutationFn: async ({
      successorProjectId,
      predecessorProjectId,
      lagDays,
    }: {
      successorProjectId: string;
      predecessorProjectId: string;
      lagDays: number;
    }) => projectsService.updateDependencyLag(successorProjectId, predecessorProjectId, lagDays),
    onSuccess: (response) => {
      if (response.success && response.data) {
        applyDependencyMutationResult(queryClient, response.data);
      }
    },
  });

  const removeMutation = useMutation({
    mutationFn: async ({
      successorProjectId,
      predecessorProjectId,
    }: {
      successorProjectId: string;
      predecessorProjectId: string;
    }) => projectsService.removeDependency(successorProjectId, predecessorProjectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.growthSystem.projects.dependencies(),
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

/** Cascade-aware project date update for timeline Gantt. */
export function useProjectTimelineUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      startDate,
      targetEndDate,
    }: {
      id: string;
      startDate?: string | null;
      targetEndDate?: string | null;
    }) => {
      const input: UpdateProjectInput = {};
      if (startDate !== undefined && startDate !== null) input.startDate = startDate;
      if (targetEndDate !== undefined && targetEndDate !== null)
        input.targetEndDate = targetEndDate;
      return projectsService.update(id, input, { cascade: true });
    },
    onSuccess: async (response) => {
      if (!response.success || !response.data) return;
      if ('project' in response.data) {
        upsertProjectCache(queryClient, response.data.project);
        applyCascadedProjectUpdatesToCache(queryClient, response.data.cascaded);
      } else {
        upsertProjectCache(queryClient, response.data as Project);
      }
    },
  });
}
