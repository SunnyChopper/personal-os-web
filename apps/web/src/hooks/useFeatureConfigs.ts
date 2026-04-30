import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useBackendStatus } from '@/contexts/BackendStatusContext';
import { queryKeys } from '@/lib/react-query/query-keys';
import { extractApiError, isNetworkError } from '@/lib/react-query/error-utils';
import type { AIFeature, FeatureProviderConfig } from '@/lib/llm/config/feature-types';

/**
 * Hook to fetch all feature configs
 */
export function useFeatureConfigs() {
  const { recordError, recordSuccess } = useBackendStatus();

  const { data, isLoading, error, isError } = useQuery({
    queryKey: queryKeys.featureConfigs.detail(),
    queryFn: async () => {
      try {
        const result = await apiClient.getFeatureConfigs();
        if (result.success) {
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
    staleTime: 5 * 60 * 1000, // 5 minutes - feature configs don't change often
  });

  const apiError = error ? extractApiError(error) : null;

  return {
    featureConfigs: data?.data || ({} as Record<AIFeature, FeatureProviderConfig>),
    isLoading: isLoading && !isError,
    isError,
    error: apiError || error,
  };
}

/**
 * Hook for feature config mutations
 */
export function useFeatureConfigMutations() {
  const queryClient = useQueryClient();

  const setFeatureConfig = useMutation({
    mutationFn: ({ feature, config }: { feature: AIFeature; config: FeatureProviderConfig }) =>
      apiClient.setFeatureConfig(feature, config),
    onSuccess: (_response, variables) => {
      const current = queryClient.getQueryData<{
        success: boolean;
        data?: Record<AIFeature, FeatureProviderConfig>;
      }>(queryKeys.featureConfigs.detail());
      const next = {
        ...(current?.data || ({} as Record<AIFeature, FeatureProviderConfig>)),
        [variables.feature]: variables.config,
      };
      queryClient.setQueryData(queryKeys.featureConfigs.detail(), { success: true, data: next });
    },
  });

  const resetFeatureConfig = useMutation({
    mutationFn: (feature: AIFeature) => apiClient.resetFeatureConfig(feature),
    onSuccess: (_response, feature) => {
      const current = queryClient.getQueryData<{
        success: boolean;
        data?: Record<AIFeature, FeatureProviderConfig>;
      }>(queryKeys.featureConfigs.detail());
      if (!current?.data) return;
      const { [feature]: _removed, ...rest } = current.data;
      queryClient.setQueryData(queryKeys.featureConfigs.detail(), { success: true, data: rest });
    },
  });

  return {
    setFeatureConfig: setFeatureConfig.mutateAsync,
    resetFeatureConfig: resetFeatureConfig.mutateAsync,
    isSetting: setFeatureConfig.isPending,
    isResetting: resetFeatureConfig.isPending,
  };
}
