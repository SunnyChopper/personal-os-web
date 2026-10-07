import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import type {
  ContentVariant,
  ContentVariantDistributionStatus,
  UpdateVariantDistributionStatusInput,
} from '@/types/api/personal-branding.dto';

export function usePublishQueue() {
  const queryClient = useQueryClient();

  const queueQ = useQuery({
    queryKey: queryKeys.personalBranding.content.publishQueue(),
    queryFn: async () => {
      const response = await personalBrandingService.listPublishQueue();
      return response.data;
    },
  });

  const publishedQ = useQuery({
    queryKey: queryKeys.personalBranding.content.list(1, 100, 'PUBLISHED'),
    queryFn: async () => (await personalBrandingService.listContentNodes(1, 100, 'PUBLISHED')).data,
  });

  const pipelinedQ = useQuery({
    queryKey: queryKeys.personalBranding.content.list(1, 100, 'PIPELINED'),
    queryFn: async () => (await personalBrandingService.listContentNodes(1, 100, 'PIPELINED')).data,
  });

  const sourceTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const node of [...(publishedQ.data ?? []), ...(pipelinedQ.data ?? [])]) {
      map.set(node.id, node.title);
    }
    return map;
  }, [publishedQ.data, pipelinedQ.data]);

  const invalidateQueue = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.personalBranding.content.publishQueue(),
      }),
      queryClient.invalidateQueries({ queryKey: queryKeys.personalBranding.content.all() }),
    ]);
  };

  const updateMutation = useMutation({
    mutationFn: ({
      variantId,
      ...body
    }: UpdateVariantDistributionStatusInput & { variantId: string }) =>
      personalBrandingService.updateVariantDistributionStatus(variantId, body),
    onSuccess: () => {
      void invalidateQueue();
    },
  });

  const items: ContentVariant[] = queueQ.data ?? [];

  const updateStatus = (
    variantId: string,
    distributionStatus: ContentVariantDistributionStatus,
    extra?: UpdateVariantDistributionStatusInput
  ) => updateMutation.mutateAsync({ variantId, distributionStatus, ...extra });

  return {
    items,
    isLoading: queueQ.isPending || publishedQ.isPending || pipelinedQ.isPending,
    sourceTitleById,
    updateMutation,
    updateStatus,
  };
}
