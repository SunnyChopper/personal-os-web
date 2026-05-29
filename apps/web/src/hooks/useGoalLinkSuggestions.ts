import { useQuery } from '@tanstack/react-query';
import { goalsService } from '@/services/growth-system/goals.service';
import { queryKeys } from '@/lib/react-query/query-keys';
import type { GoalLinkSuggestions } from '@/types/growth-system';

const EMPTY_SUGGESTIONS: GoalLinkSuggestions = {
  tasks: [],
  habits: [],
  metrics: [],
  projects: [],
};

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export function useGoalLinkSuggestions(goalId: string | undefined, enabled = true) {
  const query = useQuery({
    queryKey: queryKeys.growthSystem.goals.linkSuggestions(goalId ?? ''),
    queryFn: async () => {
      if (!goalId) {
        return EMPTY_SUGGESTIONS;
      }
      const response = await goalsService.fetchLinkSuggestions(goalId, { useCache: true });
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to fetch goal link suggestions');
      }
      return response.data;
    },
    enabled: Boolean(goalId) && enabled,
    staleTime: TWENTY_FOUR_HOURS_MS,
    gcTime: TWENTY_FOUR_HOURS_MS,
  });

  return {
    suggestions: query.data ?? EMPTY_SUGGESTIONS,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
    error: query.error,
  };
}
