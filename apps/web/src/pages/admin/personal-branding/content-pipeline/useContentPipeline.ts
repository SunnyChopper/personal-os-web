import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { queryKeys } from '@/lib/react-query/query-keys';
import { ROUTES } from '@/routes';
import { personalBrandingService } from '@/services/personal-branding.service';
import type {
  BrandPlatform,
  ContentNode,
  PlatformFitSuggestionsResult,
  RegenerateVariantWithTweaksInput,
  RepurposeJob,
  UpdateVariantDistributionStatusInput,
} from '@/types/api/personal-branding.dto';
import { BRAND_PLATFORM_LABELS } from '@/types/api/personal-branding.dto';
import {
  hasInFlightRepurposeJobs,
  repurposeGenerationBatchJobs,
  repurposeJobInFlight,
  repurposeSkeletonPlatforms,
} from '@/lib/personal-branding/repurpose-generation-progress';
import {
  isBrandProfileSelectableForPipeline,
  collectActiveBrandPillars,
} from '../content-workbench/content-workbench-helpers';
import {
  allTargetPlatformsHaveProfiles,
  buildRepurposeTargets,
  defaultProfileIdForPlatform,
  eligibleProfilesForPlatform,
} from '@/lib/personal-branding/pipeline-profile-selection';
import {
  filterSourceNodesByPillars,
  hasActiveSourcePillarFilter,
  sourcePillarFilterOptions,
} from './source-content-pillar-filters';
import { platformFitApplyButtonLabel, resolvePlatformFitApplyTargets } from './platform-fit-apply';
import { useRepurposeJobSocket } from './useRepurposeJobSocket';

const ALL_PLATFORMS = Object.keys(BRAND_PLATFORM_LABELS) as BrandPlatform[];

function mergePipelineSourceNodes(nodes: ContentNode[]): ContentNode[] {
  const byId = new Map<string, ContentNode>();
  for (const node of nodes) {
    byId.set(node.id, node);
  }
  return [...byId.values()].sort((a, b) => {
    const aTime = a.updatedAt ?? a.createdAt;
    const bTime = b.updatedAt ?? b.createdAt;
    return bTime.localeCompare(aTime);
  });
}

export function useContentPipeline() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [profileByPlatform, setProfileByPlatform] = useState<
    Partial<Record<BrandPlatform, string>>
  >({});
  const [targetPlatforms, setTargetPlatforms] = useState<BrandPlatform[]>(['linkedin', 'x']);
  const [rejectingVariantId, setRejectingVariantId] = useState<string | null>(null);
  const [rejectCritique, setRejectCritique] = useState('');
  const [tweakingVariantId, setTweakingVariantId] = useState<string | null>(null);
  const [platformFitSuggestions, setPlatformFitSuggestions] =
    useState<PlatformFitSuggestionsResult | null>(null);
  const [selectedSourcePillars, setSelectedSourcePillars] = useState<string[]>([]);

  const { liveUpdatesActive, connectionState } = useRepurposeJobSocket(selectedContentId);

  const publishedQ = useQuery({
    queryKey: queryKeys.personalBranding.content.list(1, 100, 'PUBLISHED'),
    queryFn: async () =>
      unwrapList(await personalBrandingService.listContentNodes(1, 100, 'PUBLISHED')),
  });

  const pipelinedQ = useQuery({
    queryKey: queryKeys.personalBranding.content.list(1, 100, 'PIPELINED'),
    queryFn: async () =>
      unwrapList(await personalBrandingService.listContentNodes(1, 100, 'PIPELINED')),
  });

  const profilesQ = useQuery({
    queryKey: queryKeys.personalBranding.profiles.list(1, 100),
    queryFn: async () => unwrapPaginated(await personalBrandingService.listProfiles(1, 100)),
  });

  const jobsQ = useQuery({
    queryKey: queryKeys.personalBranding.content.repurposeJobs(selectedContentId ?? ''),
    queryFn: () => personalBrandingService.listRepurposeJobs(selectedContentId!),
    enabled: Boolean(selectedContentId),
    refetchInterval: (query) => {
      if (liveUpdatesActive) return false;
      return hasInFlightRepurposeJobs(query.state.data) ? 1500 : false;
    },
  });

  const variantsQ = useQuery({
    queryKey: queryKeys.personalBranding.content.variants(selectedContentId ?? ''),
    queryFn: () => personalBrandingService.listContentVariants(selectedContentId!),
    enabled: Boolean(selectedContentId),
    refetchInterval: () => {
      if (liveUpdatesActive) return false;
      return hasInFlightRepurposeJobs(jobsQ.data) ? 1500 : false;
    },
  });

  const allProfiles = profilesQ.data ?? [];
  const profiles = useMemo(
    () => allProfiles.filter(isBrandProfileSelectableForPipeline),
    [allProfiles]
  );
  const variants = variantsQ.data ?? [];
  const repurposeJobs = jobsQ.data ?? [];

  const sourceNodes = useMemo(
    () => mergePipelineSourceNodes([...(publishedQ.data ?? []), ...(pipelinedQ.data ?? [])]),
    [publishedQ.data, pipelinedQ.data]
  );
  const activeProfilePillars = useMemo(() => collectActiveBrandPillars(allProfiles), [allProfiles]);
  const filteredSourceNodes = useMemo(
    () => filterSourceNodesByPillars(sourceNodes, selectedSourcePillars),
    [sourceNodes, selectedSourcePillars]
  );

  useEffect(() => {
    if (selectedContentId || filteredSourceNodes.length === 0) return;
    setSelectedContentId(filteredSourceNodes[0].id);
  }, [filteredSourceNodes, selectedContentId]);

  useEffect(() => {
    if (!selectedContentId || filteredSourceNodes.length === 0) return;
    if (!filteredSourceNodes.some((node) => node.id === selectedContentId)) {
      setSelectedContentId(filteredSourceNodes[0]?.id ?? null);
    }
  }, [selectedContentId, filteredSourceNodes]);

  useEffect(() => {
    if (profiles.length === 0) {
      if (Object.keys(profileByPlatform).length > 0) {
        setProfileByPlatform({});
      }
      return;
    }

    setProfileByPlatform((current) => {
      let changed = false;
      const next: Partial<Record<BrandPlatform, string>> = { ...current };

      for (const platform of targetPlatforms) {
        const eligible = eligibleProfilesForPlatform(profiles, platform);
        const currentId = next[platform];
        if (!currentId || !eligible.some((profile) => profile.id === currentId)) {
          const fallbackId = eligible[0]?.id ?? '';
          if (fallbackId) {
            if (next[platform] !== fallbackId) {
              next[platform] = fallbackId;
              changed = true;
            }
          } else if (currentId) {
            delete next[platform];
            changed = true;
          }
        }
      }

      for (const platform of Object.keys(next) as BrandPlatform[]) {
        if (!targetPlatforms.includes(platform)) {
          delete next[platform];
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [profiles, targetPlatforms]);

  const repurposeTargets = useMemo(
    () => buildRepurposeTargets(targetPlatforms, profileByPlatform),
    [targetPlatforms, profileByPlatform]
  );

  const firstSelectedProfileId = useMemo(() => {
    for (const platform of targetPlatforms) {
      const profileId = profileByPlatform[platform];
      if (profileId) {
        return profileId;
      }
    }
    return '';
  }, [profileByPlatform, targetPlatforms]);

  const profilesByPlatform = useMemo(() => {
    const map: Partial<Record<BrandPlatform, (typeof allProfiles)[number]>> = {};
    for (const platform of targetPlatforms) {
      const profileId = profileByPlatform[platform];
      if (!profileId) continue;
      const profile = allProfiles.find((entry) => entry.id === profileId);
      if (profile) {
        map[platform] = profile;
      }
    }
    return map;
  }, [allProfiles, profileByPlatform, targetPlatforms]);

  const invalidatePipeline = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.personalBranding.content.all() }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.personalBranding.content.variants(selectedContentId ?? ''),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.personalBranding.content.repurposeJobs(selectedContentId ?? ''),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.personalBranding.content.publishQueue(),
      }),
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.personalBranding.content.all(), 'variant-versions'],
      }),
    ]);
  }, [queryClient, selectedContentId]);

  const startRepurposeMutation = useMutation({
    mutationFn: () =>
      personalBrandingService.startRepurpose(selectedContentId!, {
        targets: repurposeTargets,
      }),
    onSuccess: async () => {
      await invalidatePipeline();
    },
  });

  const cancelRepurposeMutation = useMutation({
    mutationFn: () => personalBrandingService.cancelRepurposeJobs(selectedContentId!),
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
        targets: [
          {
            platform,
            brandProfileId: profileByPlatform[platform] ?? '',
          },
        ],
      }),
    onSuccess: async () => {
      await invalidatePipeline();
    },
  });

  const regenerateWithTweaksMutation = useMutation({
    mutationFn: ({
      variantId,
      body,
    }: {
      variantId: string;
      body: RegenerateVariantWithTweaksInput;
    }) => personalBrandingService.regenerateVariantWithTweaks(variantId, body),
    onSuccess: async () => {
      setTweakingVariantId(null);
      await invalidatePipeline();
    },
  });

  const updateDistributionStatusMutation = useMutation({
    mutationFn: ({
      variantId,
      ...body
    }: UpdateVariantDistributionStatusInput & { variantId: string }) =>
      personalBrandingService.updateVariantDistributionStatus(variantId, body),
    onSuccess: (_data, variables) => {
      void invalidatePipeline();
      void queryClient.invalidateQueries({
        queryKey: queryKeys.personalBranding.content.variantPerformanceInsights(
          variables.variantId
        ),
      });
    },
  });

  const saveVariantVersionMutation = useMutation({
    mutationFn: ({ variantId, title, body }: { variantId: string; title: string; body: string }) =>
      personalBrandingService.saveVariantVersion(variantId, { title, body }),
    onSuccess: async () => {
      await invalidatePipeline();
    },
  });

  const activateVariantVersionMutation = useMutation({
    mutationFn: (variantId: string) => personalBrandingService.activateVariantVersion(variantId),
    onSuccess: async () => {
      await invalidatePipeline();
    },
  });

  const selectedContent = useMemo(
    () => sourceNodes.find((n) => n.id === selectedContentId) ?? null,
    [sourceNodes, selectedContentId]
  );

  const selectedProfile = useMemo(() => {
    const firstId = firstSelectedProfileId;
    return allProfiles.find((profile) => profile.id === firstId) ?? null;
  }, [allProfiles, firstSelectedProfileId]);

  const sourcePillarOptions = useMemo(
    () =>
      sourcePillarFilterOptions(sourceNodes, activeProfilePillars, selectedProfile?.pillars ?? []),
    [sourceNodes, activeProfilePillars, selectedProfile]
  );

  const tweakingVariant = useMemo(
    () => variants.find((variant) => variant.id === tweakingVariantId) ?? null,
    [variants, tweakingVariantId]
  );

  const tweakingProfile = useMemo(() => {
    if (!tweakingVariant) return selectedProfile;
    return allProfiles.find((p) => p.id === tweakingVariant.brandProfileId) ?? selectedProfile;
  }, [allProfiles, selectedProfile, tweakingVariant]);

  const sourcePlatform = selectedContent?.platform ?? null;

  useEffect(() => {
    setPlatformFitSuggestions(null);
  }, [selectedContentId, firstSelectedProfileId]);

  const suggestPlatformFitMutation = useMutation({
    mutationFn: () =>
      personalBrandingService.suggestPlatformFit({
        contentId: selectedContentId!,
        brandProfileId: firstSelectedProfileId,
      }),
    onSuccess: (result) => {
      setPlatformFitSuggestions(result);
    },
  });

  const platformFitApplyPreview = useMemo(() => {
    if (!platformFitSuggestions?.recommendations.length) {
      return null;
    }
    const resolved = resolvePlatformFitApplyTargets(
      platformFitSuggestions.recommendations,
      sourcePlatform
    );
    return {
      ...resolved,
      label: platformFitApplyButtonLabel(resolved.mode, resolved.platforms.length),
    };
  }, [platformFitSuggestions, sourcePlatform]);

  const applyPlatformRecommendations = useCallback(() => {
    if (!platformFitApplyPreview?.platforms.length) return [];
    setTargetPlatforms(platformFitApplyPreview.platforms);
    return platformFitApplyPreview.platforms;
  }, [platformFitApplyPreview]);

  useEffect(() => {
    if (!sourcePlatform) return;
    setTargetPlatforms((prev) =>
      prev.includes(sourcePlatform) ? prev.filter((p) => p !== sourcePlatform) : prev
    );
  }, [sourcePlatform]);

  const togglePlatform = (platform: BrandPlatform) => {
    if (platform === sourcePlatform) return;
    setTargetPlatforms((prev) => {
      if (prev.includes(platform)) {
        setProfileByPlatform((map) => {
          const next = { ...map };
          delete next[platform];
          return next;
        });
        return prev.filter((entry) => entry !== platform);
      }
      setProfileByPlatform((map) => ({
        ...map,
        [platform]: map[platform] ?? defaultProfileIdForPlatform(profiles, platform),
      }));
      return [...prev, platform];
    });
  };

  const setProfileForPlatform = useCallback((platform: BrandPlatform, profileId: string) => {
    setProfileByPlatform((current) => ({ ...current, [platform]: profileId }));
  }, []);

  const inFlightJobs = useMemo(
    () => repurposeJobs.filter((job) => repurposeJobInFlight(job.status)),
    [repurposeJobs]
  );

  const generationBatchJobs = useMemo(
    () => repurposeGenerationBatchJobs(repurposeJobs, inFlightJobs),
    [repurposeJobs, inFlightJobs]
  );

  const generatingSkeletonPlatforms = useMemo(
    () =>
      repurposeSkeletonPlatforms(
        inFlightJobs,
        variants.map((variant) => variant.platform)
      ),
    [inFlightJobs, variants]
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
    Boolean(selectedContentId && targetPlatforms.length > 0) &&
    allTargetPlatformsHaveProfiles(targetPlatforms, profileByPlatform, profiles) &&
    !startRepurposeMutation.isPending &&
    busyPlatforms.size === 0;

  const canSuggestPlatforms = Boolean(selectedContentId && firstSelectedProfileId);

  return {
    sourceNodes,
    filteredSourceNodes,
    selectedSourcePillars,
    setSelectedSourcePillars,
    sourcePillarOptions,
    hasActiveSourcePillarFilter: hasActiveSourcePillarFilter(selectedSourcePillars),
    publishedNodes: sourceNodes,
    profiles,
    variants,
    repurposeJobs,
    visibleJobs,
    inFlightJobs,
    generationBatchJobs,
    generatingSkeletonPlatforms,
    selectedContentId,
    setSelectedContentId,
    selectedContent,
    sourcePlatform,
    profileByPlatform,
    setProfileForPlatform,
    profilesByPlatform,
    firstSelectedProfileId,
    selectedProfile,
    targetPlatforms,
    togglePlatform,
    allPlatforms: ALL_PLATFORMS,
    canStart,
    canSuggestPlatforms,
    platformFitSuggestions,
    platformFitApplyPreview,
    suggestPlatformFitMutation,
    applyPlatformRecommendations,
    isLoading: publishedQ.isPending || pipelinedQ.isPending || profilesQ.isPending,
    startRepurposeMutation,
    cancelRepurposeMutation,
    rejectVariantMutation,
    sendToSandboxMutation,
    regeneratePlatformMutation,
    regenerateWithTweaksMutation,
    updateDistributionStatusMutation,
    saveVariantVersionMutation,
    activateVariantVersionMutation,
    rejectingVariantId,
    setRejectingVariantId,
    rejectCritique,
    setRejectCritique,
    tweakingVariantId,
    setTweakingVariantId,
    tweakingVariant,
    tweakingProfile,
    liveUpdatesActive,
    wsConnectionState: connectionState,
    invalidatePipeline,
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
