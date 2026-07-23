import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';

export function useVariantPerformanceInsights(variantId: string | null, enabled = true) {
  const queryClient = useQueryClient();

  const insightsQ = useQuery({
    queryKey: queryKeys.personalBranding.content.variantPerformanceInsights(variantId ?? ''),
    queryFn: () => personalBrandingService.getVariantPerformanceInsights(variantId!),
    enabled: Boolean(variantId) && enabled,
  });

  const applyMutation = useMutation({
    mutationFn: (suggestionId: string) =>
      personalBrandingService.applyVariantPerformanceSuggestion(variantId!, suggestionId),
    onSuccess: async () => {
      if (!variantId) return;
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.personalBranding.content.variantPerformanceInsights(variantId),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.personalBranding.content.all() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.personalBranding.profiles.all() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.personalBranding.platformRules.all() }),
      ]);
    },
  });

  return {
    insightsQ,
    applyMutation,
  };
}
