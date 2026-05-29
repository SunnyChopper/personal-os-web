import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { healthActionService } from '@/services/health-action.service';
import type { HealthActionResponse } from '@/types/fitness';

export const HEALTH_ACTION_QUERY_KEY = ['healthAction'] as const;

export function useHealthAction() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: HEALTH_ACTION_QUERY_KEY,
    queryFn: async () => {
      const response = await healthActionService.getLatest();
      return response.data as HealthActionResponse;
    },
    staleTime: 60_000,
  });

  const regenerateMutation = useMutation({
    mutationFn: async (options?: { force?: boolean }) => {
      const response = await healthActionService.regenerate({
        force: options?.force ?? true,
        useCache: true,
      });
      return response.data as HealthActionResponse;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(HEALTH_ACTION_QUERY_KEY, data);
    },
  });

  return {
    action: query.data?.action ?? null,
    generatedAt: query.data?.generatedAt,
    status: query.data?.status ?? 'pending',
    alternativeCount: query.data?.alternativeCount ?? 0,
    cached: query.data?.cached ?? false,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    regenerate: regenerateMutation.mutateAsync,
    isRegenerating: regenerateMutation.isPending,
  };
}
