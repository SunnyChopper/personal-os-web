import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { queryKeys } from '@/lib/react-query/query-keys';
import { ROUTES } from '@/routes';
import { personalBrandingService } from '@/services/personal-branding.service';
import type {
  BrandPlatform,
  ContentNode,
  ContentVariantDistributionStatus,
  RepurposeJobStatus,
} from '@/types/api/personal-branding.dto';
import { BRAND_PLATFORM_LABELS } from '@/types/api/personal-branding.dto';

const ALL_PLATFORMS = Object.keys(BRAND_PLATFORM_LABELS) as BrandPlatform[];

export function useContentPipeline() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [targetPlatforms, setTargetPlatforms] = useState<BrandPlatform[]>(['linkedin', 'x']);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [rejectingVariantId, setRejectingVariantId] = useState<string | null>(null);
  const [rejectCritique, setRejectCritique] = useState('');

  const publishedQ = useQuery({
    queryKey: queryKeys.personalBranding.content.list(1, 100, 'PUBLISHED'),
    queryFn: async () =>
      unwrapList(await personalBrandingService.listContentNodes(1, 100, 'PUBLISHED')),
  });

  const profilesQ = useQuery({
    queryKey: queryKeys.personalBranding.profiles.list(1, 100),
    queryFn: async () => unwrapPaginated(await personalBrandingService.listProfiles(1, 100)),
  });

  const variantsQ = useQuery({
    queryKey: queryKeys.personalBranding.content.variants(selectedContentId ?? ''),
    queryFn: () => personalBrandingService.listContentVariants(selectedContentId!),
    enabled: Boolean(selectedContentId),
  });

  const jobQ = useQuery({
    queryKey: queryKeys.personalBranding.content.repurposeJob(
      selectedContentId ?? '',
      activeJobId ?? ''
    ),
    queryFn: () => personalBrandingService.getRepurposeJob(selectedContentId!, activeJobId!),
    enabled: Boolean(selectedContentId && activeJobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status as RepurposeJobStatus | undefined;
      if (!status || status === 'succeeded' || status === 'failed') return false;
      return 1500;
    },
  });

  const publishedNodes = publishedQ.data ?? [];
  const profiles = profilesQ.data ?? [];
  const variants = variantsQ.data ?? [];
  const activeJob = jobQ.data ?? null;

  useEffect(() => {
    if (selectedContentId || publishedNodes.length === 0) return;
    setSelectedContentId(publishedNodes[0].id);
  }, [publishedNodes, selectedContentId]);

  useEffect(() => {
    if (selectedProfileId || profiles.length === 0) return;
    const active = profiles.find((p) => p.status === 'active') ?? profiles[0];
    setSelectedProfileId(active.id);
  }, [profiles, selectedProfileId]);

  useEffect(() => {
    if (!activeJob) return;
    if (activeJob.status === 'succeeded' || activeJob.status === 'failed') {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.personalBranding.content.variants(selectedContentId ?? ''),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.personalBranding.content.all() });
    }
  }, [activeJob, queryClient, selectedContentId]);

  const invalidatePipeline = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.personalBranding.content.all() }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.personalBranding.content.variants(selectedContentId ?? ''),
      }),
    ]);
  }, [queryClient, selectedContentId]);

  const startRepurposeMutation = useMutation({
    mutationFn: () =>
      personalBrandingService.startRepurpose(selectedContentId!, {
        brandProfileId: selectedProfileId,
        targetPlatforms,
      }),
    onSuccess: (accepted) => {
      setActiveJobId(accepted.jobId);
    },
  });

  const rejectVariantMutation = useMutation({
    mutationFn: ({ variantId, critique }: { variantId: string; critique: string }) =>
      personalBrandingService.rejectContentVariant(variantId, { critique }),
    onSuccess: () => {
      setRejectingVariantId(null);
      setRejectCritique('');
      void invalidatePipeline();
    },
  });

  const sendToSandboxMutation = useMutation({
    mutationFn: (variantId: string) => personalBrandingService.sendVariantToSandbox(variantId),
    onSuccess: ({ draftContent }) => {
      void invalidatePipeline();
      navigate(
        `${ROUTES.admin.personalBrandingWorkbench}?tab=sandbox&contentId=${encodeURIComponent(draftContent.id)}`
      );
    },
  });

  const regeneratePlatformMutation = useMutation({
    mutationFn: (platform: BrandPlatform) =>
      personalBrandingService.startRepurpose(selectedContentId!, {
        brandProfileId: selectedProfileId,
        targetPlatforms: [platform],
      }),
    onSuccess: (accepted) => {
      setActiveJobId(accepted.jobId);
    },
  });

  const updateDistributionStatusMutation = useMutation({
    mutationFn: ({
      variantId,
      distributionStatus,
    }: {
      variantId: string;
      distributionStatus: ContentVariantDistributionStatus;
    }) =>
      personalBrandingService.updateVariantDistributionStatus(variantId, { distributionStatus }),
    onSuccess: () => {
      void invalidatePipeline();
    },
  });

  const togglePlatform = (platform: BrandPlatform) => {
    setTargetPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const selectedContent = useMemo(
    () => publishedNodes.find((n) => n.id === selectedContentId) ?? null,
    [publishedNodes, selectedContentId]
  );

  const canStart =
    Boolean(selectedContentId && selectedProfileId && targetPlatforms.length > 0) &&
    !startRepurposeMutation.isPending &&
    activeJob?.status !== 'running' &&
    activeJob?.status !== 'queued';

  return {
    publishedNodes,
    profiles,
    variants,
    activeJob,
    selectedContentId,
    setSelectedContentId,
    selectedContent,
    selectedProfileId,
    setSelectedProfileId,
    targetPlatforms,
    togglePlatform,
    allPlatforms: ALL_PLATFORMS,
    canStart,
    isLoading: publishedQ.isPending || profilesQ.isPending,
    startRepurposeMutation,
    rejectVariantMutation,
    sendToSandboxMutation,
    regeneratePlatformMutation,
    updateDistributionStatusMutation,
    rejectingVariantId,
    setRejectingVariantId,
    rejectCritique,
    setRejectCritique,
  };
}

function unwrapPaginated<T>(res: {
  success: boolean;
  data?: { data: T[] };
  error?: { message?: string };
}): T[] {
  if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to load');
  return res.data.data;
}

function unwrapList(res: {
  success: boolean;
  data?: { data: ContentNode[] };
  error?: { message?: string };
}) {
  if (!res.success || !res.data) throw new Error(res.error?.message ?? 'Failed to load');
  return res.data.data;
}
