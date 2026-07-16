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
  RepurposeJob,
  RepurposeJobStatus,
} from '@/types/api/personal-branding.dto';
import { BRAND_PLATFORM_LABELS } from '@/types/api/personal-branding.dto';

const ALL_PLATFORMS = Object.keys(BRAND_PLATFORM_LABELS) as BrandPlatform[];
const IN_FLIGHT_JOB_STATUSES: RepurposeJobStatus[] = ['queued', 'running'];

function hasInFlightJobs(jobs: RepurposeJob[] | undefined): boolean {
  return (jobs ?? []).some((job) => IN_FLIGHT_JOB_STATUSES.includes(job.status));
}

export function useContentPipeline() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [targetPlatforms, setTargetPlatforms] = useState<BrandPlatform[]>(['linkedin', 'x']);
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

  const jobsQ = useQuery({
    queryKey: queryKeys.personalBranding.content.repurposeJobs(selectedContentId ?? ''),
    queryFn: () => personalBrandingService.listRepurposeJobs(selectedContentId!),
    enabled: Boolean(selectedContentId),
    refetchInterval: (query) => (hasInFlightJobs(query.state.data) ? 1500 : false),
  });

  const variantsQ = useQuery({
    queryKey: queryKeys.personalBranding.content.variants(selectedContentId ?? ''),
    queryFn: () => personalBrandingService.listContentVariants(selectedContentId!),
    enabled: Boolean(selectedContentId),
    refetchInterval: () => (hasInFlightJobs(jobsQ.data) ? 1500 : false),
  });

  const publishedNodes = publishedQ.data ?? [];
  const profiles = profilesQ.data ?? [];
  const variants = variantsQ.data ?? [];
  const repurposeJobs = jobsQ.data ?? [];

  useEffect(() => {
    if (selectedContentId || publishedNodes.length === 0) return;
    setSelectedContentId(publishedNodes[0].id);
  }, [publishedNodes, selectedContentId]);

  useEffect(() => {
    if (selectedProfileId || profiles.length === 0) return;
    const active = profiles.find((p) => p.status === 'active') ?? profiles[0];
    setSelectedProfileId(active.id);
  }, [profiles, selectedProfileId]);

  const invalidatePipeline = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.personalBranding.content.all() }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.personalBranding.content.variants(selectedContentId ?? ''),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.personalBranding.content.repurposeJobs(selectedContentId ?? ''),
      }),
    ]);
  }, [queryClient, selectedContentId]);

  const startRepurposeMutation = useMutation({
    mutationFn: () =>
      personalBrandingService.startRepurpose(selectedContentId!, {
        brandProfileId: selectedProfileId,
        targetPlatforms,
      }),
    onSuccess: async () => {
      await invalidatePipeline();
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
    onSuccess: async () => {
      await invalidatePipeline();
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

  const selectedContent = useMemo(
    () => publishedNodes.find((n) => n.id === selectedContentId) ?? null,
    [publishedNodes, selectedContentId]
  );

  const sourcePlatform = selectedContent?.platform ?? null;

  useEffect(() => {
    if (!sourcePlatform) return;
    setTargetPlatforms((prev) =>
      prev.includes(sourcePlatform) ? prev.filter((p) => p !== sourcePlatform) : prev
    );
  }, [sourcePlatform]);

  const togglePlatform = (platform: BrandPlatform) => {
    if (platform === sourcePlatform) return;
    setTargetPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const inFlightJobs = useMemo(
    () => repurposeJobs.filter((job) => IN_FLIGHT_JOB_STATUSES.includes(job.status)),
    [repurposeJobs]
  );

  const recentTerminalJobs = useMemo(() => {
    const latestByPlatform = new Map<BrandPlatform, RepurposeJob>();
    for (const job of repurposeJobs) {
      const existing = latestByPlatform.get(job.platform);
      if (!existing || job.createdAt > existing.createdAt) {
        latestByPlatform.set(job.platform, job);
      }
    }
    return [...latestByPlatform.values()].filter(
      (job) => job.status === 'succeeded' || job.status === 'failed'
    );
  }, [repurposeJobs]);

  const visibleJobs = useMemo(() => {
    const byId = new Map<string, RepurposeJob>();
    for (const job of [...inFlightJobs, ...recentTerminalJobs]) {
      byId.set(job.jobId, job);
    }
    return [...byId.values()].sort((a, b) => {
      const platformOrder = BRAND_PLATFORM_LABELS[a.platform].localeCompare(
        BRAND_PLATFORM_LABELS[b.platform]
      );
      if (platformOrder !== 0) return platformOrder;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [inFlightJobs, recentTerminalJobs]);

  const busyPlatforms = useMemo(
    () =>
      new Set(
        inFlightJobs
          .map((job) => job.platform)
          .filter((platform) => targetPlatforms.includes(platform))
      ),
    [inFlightJobs, targetPlatforms]
  );

  const canStart =
    Boolean(selectedContentId && selectedProfileId && targetPlatforms.length > 0) &&
    !startRepurposeMutation.isPending &&
    busyPlatforms.size === 0;

  return {
    publishedNodes,
    profiles,
    variants,
    repurposeJobs,
    visibleJobs,
    inFlightJobs,
    selectedContentId,
    setSelectedContentId,
    selectedContent,
    sourcePlatform,
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
