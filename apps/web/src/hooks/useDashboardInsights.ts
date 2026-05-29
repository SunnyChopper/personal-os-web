import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardInsightsService } from '@/services/growth-system/dashboard-insights.service';
import type { DashboardInsightsResponse } from '@/types/growth-system';

export const DASHBOARD_INSIGHTS_QUERY_KEY = ['dashboardInsights'] as const;

export function useDashboardInsights() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: DASHBOARD_INSIGHTS_QUERY_KEY,
    queryFn: async () => {
      const response = await dashboardInsightsService.getLatest();
      return response.data as DashboardInsightsResponse;
    },
    staleTime: 60_000,
  });

  const regenerateMutation = useMutation({
    mutationFn: async (options?: { force?: boolean }) => {
      const response = await dashboardInsightsService.regenerate({
        force: options?.force ?? true,
        useCache: true,
      });
      return response.data as DashboardInsightsResponse;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(DASHBOARD_INSIGHTS_QUERY_KEY, data);
    },
  });

  return {
    insights: query.data?.insights ?? [],
    summary: query.data?.summary,
    generatedAt: query.data?.generatedAt,
    focusAreas: query.data?.focusAreas ?? [],
    status: query.data?.status ?? 'pending',
    cached: query.data?.cached ?? false,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    regenerate: regenerateMutation.mutateAsync,
    isRegenerating: regenerateMutation.isPending,
  };
}
