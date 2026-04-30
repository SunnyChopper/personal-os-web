import { useQuery, useQueryClient } from '@tanstack/react-query';
import { growthSystemService } from '@/services/growth-system';
import { useBackendStatus } from '@/contexts/BackendStatusContext';
import { queryKeys } from '@/lib/react-query/query-keys';
import { extractApiError, isNetworkError } from '@/lib/react-query/error-utils';
import type { DashboardSummaryRequest } from '@/types/api-contracts';

/**
 * Hook to fetch all Growth System data from the growth system endpoint.
 * This hook:
 * 1. Fetches all data in a single request
 * 2. Populates individual React Query caches for each data type
 * 3. Allows existing hooks to read from cache without additional requests
 */
export function useGrowthSystemDashboard(options?: DashboardSummaryRequest) {
  const queryClient = useQueryClient();
  const { recordError, recordSuccess } = useBackendStatus();

  const { data, isLoading, error, isError } = useQuery({
    queryKey: queryKeys.growthSystem.data(options as Record<string, unknown>),
    queryFn: async () => {
      try {
        const result = await growthSystemService.getData(options);

        if (result.success && result.data) {
          // Populate individual query caches so existing hooks can read from cache
          const summaryData = result.data;

          // Populate tasks cache
          queryClient.setQueryData(queryKeys.growthSystem.tasks.lists(), {
            success: true,
            data: summaryData.tasks,
          });

          // Populate goals cache
          queryClient.setQueryData(queryKeys.growthSystem.goals.lists(), {
            success: true,
            data: summaryData.goals,
          });

          // Populate projects cache
          queryClient.setQueryData(queryKeys.growthSystem.projects.lists(), {
            success: true,
            data: summaryData.projects,
          });

          // Populate habits cache
          queryClient.setQueryData(queryKeys.growthSystem.habits.lists(), {
            success: true,
            data: summaryData.habits,
          });

          // Populate metrics cache
          queryClient.setQueryData(queryKeys.growthSystem.metrics.lists(), {
            success: true,
            data: summaryData.metrics,
          });

          // Populate logbook cache
          queryClient.setQueryData(queryKeys.growthSystem.logbook.lists(), {
            success: true,
            data: summaryData.logbookEntries,
          });

          // Populate rewards cache
          queryClient.setQueryData(queryKeys.rewards.withRedemptions(), {
            success: true,
            data: summaryData.rewards,
          });

          // Populate wallet balance cache
          queryClient.setQueryData(queryKeys.wallet.balance(), {
            success: true,
            data: summaryData.wallet.balance,
          });

          // Populate wallet transactions cache
          queryClient.setQueryData(queryKeys.wallet.transactions(options?.transactionLimit || 10), {
            success: true,
            data: summaryData.wallet.recentTransactions,
          });

          // Populate rewards cache
          recordSuccess();
        }

        return result;
      } catch (err: unknown) {
        const apiError = extractApiError(err);
        if (apiError && isNetworkError(apiError)) {
          recordError(apiError);
        }
        throw err;
      }
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes - dashboard data changes moderately
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
  });

  const apiError = error ? extractApiError(error) : null;

  return {
    // Individual data arrays
    tasks: data?.data?.tasks || [],
    goals: data?.data?.goals || [],
    projects: data?.data?.projects || [],
    habits: data?.data?.habits || [],
    metrics: data?.data?.metrics || [],
    logbookEntries: data?.data?.logbookEntries || [],
    rewards: data?.data?.rewards || [],
    wallet: data?.data?.wallet || { balance: null, recentTransactions: [] },

    // Loading and error states
    isLoading: isLoading && !isError,
    isError,
    error: apiError || error,

    // Full response for advanced use cases
    data: data?.data,
  };
}
