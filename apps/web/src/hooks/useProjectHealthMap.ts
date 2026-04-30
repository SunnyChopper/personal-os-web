import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectsService } from '@/services/growth-system/projects.service';
import { queryKeys } from '@/lib/react-query/query-keys';
import { useBackendStatus } from '@/contexts/BackendStatusContext';
import { extractApiError } from '@/lib/react-query/error-utils';
import { logger } from '@/lib/logger';
import type { ApiError } from '@/types/api-contracts';
import type { ProjectHealthSummary } from '@/types/project-health';

const CONCURRENCY_LIMIT = 5;

const runWithLimit = async <T, R>(items: T[], limit: number, task: (item: T) => Promise<R>) => {
  const results: R[] = [];
  let index = 0;
  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      results[currentIndex] = await task(items[currentIndex]);
    }
  });

  await Promise.all(workers);
  return results;
};

export const useProjectHealthMap = (projectIds: string[]) => {
  const { recordError, recordSuccess } = useBackendStatus();
  const ids = useMemo(() => Array.from(new Set(projectIds)).sort(), [projectIds]);

  const query = useQuery({
    queryKey: queryKeys.growthSystem.projects.healthList(ids),
    queryFn: async () => {
      try {
        const results = await runWithLimit(ids, CONCURRENCY_LIMIT, async (projectId) => {
          try {
            const response = await projectsService.getHealth(projectId);
            if (response.success && response.data) {
              return {
                projectId,
                health: {
                  taskCount: response.data.tasksTotal,
                  completedTaskCount: response.data.tasksCompleted,
                  percentComplete: response.data.percentComplete,
                } as ProjectHealthSummary,
              };
            }
          } catch (error) {
            logger.error('Failed to fetch project health', { projectId, error });
          }
          return { projectId, health: null };
        });

        const healthMap = new Map<string, ProjectHealthSummary>();
        results.forEach((result) => {
          if (result.health) {
            healthMap.set(result.projectId, result.health);
          }
        });

        if (results.length > 0) {
          recordSuccess();
        }

        return healthMap;
      } catch (error) {
        const apiError =
          extractApiError(error) ||
          ({
            message: 'Failed to fetch project health',
            code: 'FETCH_ERROR',
          } as ApiError);
        recordError(apiError);
        throw error;
      }
    },
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  return {
    projectHealthMap: query.data || new Map<string, ProjectHealthSummary>(),
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
};
