import { Loader2, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/atoms/Button';
import { FormCheckbox } from '@/components/atoms/FormCheckbox';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { PageCard, SectionIntro } from '../PersonalBrandingPageTemplate';
import {
  linkAccentClassName,
  pbBodySecondaryClassName,
  pbDenseListStackClassName,
  pbFormLabelClassName,
  pbListStackClassName,
  pbMetaClassName,
  pbNestedSectionTitleClassName,
  pbSectionStackClassName,
  selectableChipClassName,
} from '../personal-branding-ui';
import { EmptyState } from '@/components/molecules/EmptyState';
import IconSelect from '@/components/molecules/IconSelect';
import { Select } from '@/components/atoms/Select';
import { ROUTES } from '@/routes';
import { personalBrandingService } from '@/services/personal-branding.service';
import {
  BRAND_PLATFORM_LABELS,
  REPURPOSE_JOB_STAGE_LABELS,
  type BrandPlatform,
  type ContentVariantDistributionStatus,
  type UpdateVariantDistributionStatusInput,
} from '@/types/api/personal-branding.dto';
import { PlatformFitRecommendationCard } from './PlatformFitRecommendationCard';
import { platformFitApplyToastTitle } from './platform-fit-apply';
import { useContentPipeline } from './useContentPipeline';
import { VariantActiveCard } from './VariantActiveCard';
import {
  buildBulkMarkReadyToastMessages,
  buildBulkQueueToastMessages,
  buildBulkRejectToastMessages,
  buildBulkSandboxToastMessages,
  filterEligibleForMarkReady,
  filterEligibleForQueue,
  filterEligibleForReject,
  filterEligibleForSandbox,
  partitionBulkVariantResults,
} from './variant-bulk-actions';
import VariantRegenerateTweaksDrawer from '@/components/organisms/personal-branding/VariantRegenerateTweaksDrawer';
import RepurposeGenerationProgressBanner from '@/components/molecules/personal-branding/RepurposeGenerationProgressBanner';
import { ExpandablePlainTextPreview } from '@/components/molecules/personal-branding/ExpandablePlainTextPreview';
import VariantGeneratingSkeleton from '@/components/molecules/personal-branding/VariantGeneratingSkeleton';
import ProfileStrengthIndicator from '@/components/molecules/personal-branding/ProfileStrengthIndicator';
import {
  PlatformRequirementCountBadge,
  TargetPlatformRequirementsExpandPanel,
} from '@/components/molecules/personal-branding/TargetPlatformRequirementBadges';
import { useTargetPlatformRulesExpansion } from '@/hooks/useTargetPlatformRulesExpansion';
import { repurposeJobInFlight } from '@/lib/personal-branding/repurpose-generation-progress';
import { eligibleProfilesForPlatform } from '@/lib/personal-branding/pipeline-profile-selection';
import GeneratedVariantsFilterBar from './GeneratedVariantsFilterBar';
import { BulkRejectVariantsModal } from '@/components/molecules/personal-branding/BulkRejectVariantsModal';
import BrandPillarMultiSelect from '@/components/molecules/personal-branding/BrandPillarMultiSelect';
import { buildSourceContentSelectOptions } from './source-content-select-label';
import { originallyPublishedOnLabel } from '@/lib/personal-branding/content-node-labels';
import {
  DEFAULT_GENERATED_VARIANTS_SORT,
  EMPTY_GENERATED_VARIANTS_FILTERS,
  filterAndSortGeneratedVariants,
  skeletonPlatformMatchesFilter,
  type GeneratedVariantsFilters,
  type GeneratedVariantsSort,
} from './generated-variants-filters';

type ContentPipelineState = ReturnType<typeof useContentPipeline>;

interface PlatformRepurposerTabProps {
  pipeline: ContentPipelineState;
}

const GENERATE_VARIANTS_BUTTON_ID = 'repurposer-generate-variants';
const PLATFORM_APPLY_FLASH_MS = 600;

export default function PlatformRepurposerTab({ pipeline }: PlatformRepurposerTabProps) {
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();
  const [variantFilters, setVariantFilters] = useState<GeneratedVariantsFilters>(
    EMPTY_GENERATED_VARIANTS_FILTERS
  );
  const [variantSort, setVariantSort] = useState<GeneratedVariantsSort>(
    DEFAULT_GENERATED_VARIANTS_SORT
  );
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);
  const [bulkPending, setBulkPending] = useState(false);
  const [bulkUpdatingIds, setBulkUpdatingIds] = useState<Set<string>>(() => new Set());
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [bulkRejectVariantIds, setBulkRejectVariantIds] = useState<string[]>([]);
  const [generateHighlight, setGenerateHighlight] = useState(false);
  const generateHighlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [appliedFlashPlatforms, setAppliedFlashPlatforms] = useState<BrandPlatform[]>([]);
  const appliedFlashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMissingContent = pipeline.sourceNodes.length === 0;
  const isFilteredSourceEmpty =
    !isMissingContent &&
    pipeline.hasActiveSourcePillarFilter &&
    pipeline.filteredSourceNodes.length === 0;
  const isMissingProfile = pipeline.profiles.length === 0;
  const isFormVisible = !isMissingContent && !isMissingProfile;

  const sourceContentOptions = useMemo(
    () => buildSourceContentSelectOptions(pipeline.filteredSourceNodes),
    [pipeline.filteredSourceNodes]
  );

  const platformRulesSurface = useTargetPlatformRulesExpansion({
    profileByPlatform: pipeline.profileByPlatform,
    targetPlatforms: pipeline.targetPlatforms,
  });

  useEffect(() => {
    return () => {
      if (generateHighlightTimeoutRef.current) {
        clearTimeout(generateHighlightTimeoutRef.current);
      }
      if (appliedFlashTimeoutRef.current) {
        clearTimeout(appliedFlashTimeoutRef.current);
      }
    };
  }, []);

  const flashTargetPlatforms = (platforms: BrandPlatform[]) => {
    if (!platforms.length) return;

    if (appliedFlashTimeoutRef.current) {
      clearTimeout(appliedFlashTimeoutRef.current);
    }
    setAppliedFlashPlatforms(platforms);
    appliedFlashTimeoutRef.current = setTimeout(() => {
      setAppliedFlashPlatforms([]);
      appliedFlashTimeoutRef.current = null;
    }, PLATFORM_APPLY_FLASH_MS);
  };

  const handleApplyPlatformRecommendations = () => {
    const appliedPlatforms = pipeline.applyPlatformRecommendations();
    if (!appliedPlatforms.length) return;

    flashTargetPlatforms(appliedPlatforms);

    showToast({
      type: 'success',
      title: platformFitApplyToastTitle(appliedPlatforms),
    });
  };

  const handleRecommendationPlatformToggle = (platform: BrandPlatform) => {
    const wasSelected = pipeline.targetPlatforms.includes(platform);
    pipeline.togglePlatform(platform);
    if (!wasSelected) {
      flashTargetPlatforms([platform]);
    }
  };

  useEffect(() => {
    setVariantFilters(EMPTY_GENERATED_VARIANTS_FILTERS);
    setVariantSort(DEFAULT_GENERATED_VARIANTS_SORT);
  }, [pipeline.selectedContentId]);

  const visibleVariants = useMemo(
    () => filterAndSortGeneratedVariants(pipeline.variants, variantFilters, variantSort),
    [pipeline.variants, variantFilters, variantSort]
  );

  const visibleSkeletonPlatforms = useMemo(
    () =>
      pipeline.generatingSkeletonPlatforms.filter((platform) =>
        skeletonPlatformMatchesFilter(platform, variantFilters)
      ),
    [pipeline.generatingSkeletonPlatforms, variantFilters]
  );

  const variantIds = useMemo(() => visibleVariants.map((variant) => variant.id), [visibleVariants]);

  useEffect(() => {
    setSelectedVariantIds((current) => current.filter((id) => variantIds.includes(id)));
  }, [variantIds, pipeline.selectedContentId]);

  const allVariantsSelected =
    visibleVariants.length > 0 &&
    visibleVariants.every((variant) => selectedVariantIds.includes(variant.id));

  const toggleVariantSelection = (variantId: string, selected: boolean) => {
    setSelectedVariantIds((current) => {
      if (selected) {
        if (current.includes(variantId)) return current;
        return [...current, variantId];
      }
      return current.filter((id) => id !== variantId);
    });
  };

  const toggleSelectAllVariants = () => {
    if (allVariantsSelected) {
      setSelectedVariantIds([]);
      return;
    }
    setSelectedVariantIds(variantIds);
  };

  const showBulkToasts = (toasts: {
    success?: { title: string; message?: string };
    error?: { title: string };
  }) => {
    if (toasts.success) {
      showToast({
        type: 'success',
        title: toasts.success.title,
        message: toasts.success.message,
      });
    }
    if (toasts.error) {
      showToast({
        type: 'error',
        title: toasts.error.title,
      });
    }
  };

  const handleBulkSendToSandbox = async () => {
    if (selectedVariantIds.length === 0 || bulkPending) return;
    const { eligible, skippedInWorkbench } = filterEligibleForSandbox(
      pipeline.variants,
      selectedVariantIds
    );
    const variantIdsToSend = eligible.map((variant) => variant.id);
    if (variantIdsToSend.length === 0) {
      showBulkToasts(buildBulkSandboxToastMessages(0, 0, skippedInWorkbench));
      return;
    }

    setBulkPending(true);
    setBulkUpdatingIds(new Set(variantIdsToSend));
    try {
      const results = await Promise.allSettled(
        variantIdsToSend.map((variantId) => personalBrandingService.sendVariantToSandbox(variantId))
      );
      const { succeeded, failed } = partitionBulkVariantResults(variantIdsToSend, results);
      const succeededIds = new Set(succeeded.map((entry) => entry.variantId));
      const failedIds = new Set(failed.map((entry) => entry.variantId));

      await pipeline.invalidatePipeline();

      setSelectedVariantIds((current) =>
        current.filter((id) => !succeededIds.has(id) || failedIds.has(id))
      );

      showBulkToasts(
        buildBulkSandboxToastMessages(variantIdsToSend.length, succeeded.length, skippedInWorkbench)
      );
    } catch (error) {
      showToast({
        type: 'error',
        title: "Couldn't push variants to Workbench",
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setBulkPending(false);
      setBulkUpdatingIds(new Set());
    }
  };

  const handleBulkMarkReady = async () => {
    if (selectedVariantIds.length === 0 || bulkPending) return;
    const { eligible, skippedRejected, skippedAlreadyReady } = filterEligibleForMarkReady(
      pipeline.variants,
      selectedVariantIds
    );
    const variantIdsToMark = eligible.map((variant) => variant.id);
    if (variantIdsToMark.length === 0) {
      showBulkToasts(buildBulkMarkReadyToastMessages(0, 0, skippedRejected, skippedAlreadyReady));
      return;
    }

    setBulkPending(true);
    setBulkUpdatingIds(new Set(variantIdsToMark));
    try {
      const results = await Promise.allSettled(
        variantIdsToMark.map((variantId) =>
          personalBrandingService.updateVariantDistributionStatus(variantId, {
            distributionStatus: 'READY',
          })
        )
      );
      const { succeeded, failed } = partitionBulkVariantResults(variantIdsToMark, results);
      const succeededIds = new Set(succeeded.map((entry) => entry.variantId));
      const failedIds = new Set(failed.map((entry) => entry.variantId));

      await pipeline.invalidatePipeline();

      setSelectedVariantIds((current) =>
        current.filter((id) => !succeededIds.has(id) || failedIds.has(id))
      );

      showBulkToasts(
        buildBulkMarkReadyToastMessages(
          variantIdsToMark.length,
          succeeded.length,
          skippedRejected,
          skippedAlreadyReady
        )
      );
    } catch (error) {
      showToast({
        type: 'error',
        title: "Couldn't mark variants ready",
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setBulkPending(false);
      setBulkUpdatingIds(new Set());
    }
  };

  const handleBulkAddToQueue = async () => {
    if (selectedVariantIds.length === 0 || bulkPending) return;
    const { eligible, skippedRejected, skippedAlreadyQueued } = filterEligibleForQueue(
      pipeline.variants,
      selectedVariantIds
    );
    const variantIdsToQueue = eligible.map((variant) => variant.id);
    if (variantIdsToQueue.length === 0) {
      showBulkToasts(buildBulkQueueToastMessages(0, 0, skippedRejected, skippedAlreadyQueued));
      return;
    }

    setBulkPending(true);
    setBulkUpdatingIds(new Set(variantIdsToQueue));
    try {
      const results = await Promise.allSettled(
        variantIdsToQueue.map((variantId) =>
          personalBrandingService.updateVariantDistributionStatus(variantId, {
            distributionStatus: 'SCHEDULED',
          })
        )
      );
      const { succeeded, failed } = partitionBulkVariantResults(variantIdsToQueue, results);
      const succeededIds = new Set(succeeded.map((entry) => entry.variantId));
      const failedIds = new Set(failed.map((entry) => entry.variantId));

      await pipeline.invalidatePipeline();

      setSelectedVariantIds((current) =>
        current.filter((id) => !succeededIds.has(id) || failedIds.has(id))
      );

      showBulkToasts(
        buildBulkQueueToastMessages(
          variantIdsToQueue.length,
          succeeded.length,
          skippedRejected,
          skippedAlreadyQueued
        )
      );
    } catch (error) {
      showToast({
        type: 'error',
        title: "Couldn't add variants to queue",
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setBulkPending(false);
      setBulkUpdatingIds(new Set());
    }
  };

  const handleOpenBulkReject = () => {
    if (selectedVariantIds.length === 0 || bulkPending) return;
    const { eligible, skippedAlreadyRejected } = filterEligibleForReject(
      pipeline.variants,
      selectedVariantIds
    );
    if (eligible.length === 0) {
      showBulkToasts(buildBulkRejectToastMessages(0, 0, skippedAlreadyRejected));
      return;
    }
    setBulkRejectVariantIds(eligible.map((variant) => variant.id));
    setBulkRejectOpen(true);
  };

  const handleBulkReject = async (critique: string) => {
    if (bulkRejectVariantIds.length === 0 || bulkPending) return;
    const { skippedAlreadyRejected } = filterEligibleForReject(
      pipeline.variants,
      selectedVariantIds
    );
    const variantIdsToReject = bulkRejectVariantIds;

    setBulkPending(true);
    setBulkUpdatingIds(new Set(variantIdsToReject));
    try {
      const results = await Promise.allSettled(
        variantIdsToReject.map((variantId) =>
          personalBrandingService.rejectContentVariant(variantId, { critique })
        )
      );
      const { succeeded, failed } = partitionBulkVariantResults(variantIdsToReject, results);
      const succeededIds = new Set(succeeded.map((entry) => entry.variantId));
      const failedIds = new Set(failed.map((entry) => entry.variantId));

      await pipeline.invalidatePipeline();

      setSelectedVariantIds((current) =>
        current.filter((id) => !succeededIds.has(id) || failedIds.has(id))
      );

      showBulkToasts(
        buildBulkRejectToastMessages(
          variantIdsToReject.length,
          succeeded.length,
          skippedAlreadyRejected
        )
      );
      setBulkRejectOpen(false);
      setBulkRejectVariantIds([]);
    } catch (error) {
      showToast({
        type: 'error',
        title: "Couldn't reject variants",
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setBulkPending(false);
      setBulkUpdatingIds(new Set());
    }
  };

  useEffect(() => {
    return () => {
      if (generateHighlightTimeoutRef.current) {
        clearTimeout(generateHighlightTimeoutRef.current);
      }
    };
  }, []);

  const focusGenerateButton = () => {
    const button = document.getElementById(GENERATE_VARIANTS_BUTTON_ID);
    if (!button) return;
    button.scrollIntoView({ behavior: 'smooth', block: 'center' });
    button.focus();
    setGenerateHighlight(true);
    if (generateHighlightTimeoutRef.current) {
      clearTimeout(generateHighlightTimeoutRef.current);
    }
    generateHighlightTimeoutRef.current = setTimeout(() => {
      setGenerateHighlight(false);
      generateHighlightTimeoutRef.current = null;
    }, 1500);
  };

  const variantsEmptyDescription =
    isMissingContent || isMissingProfile
      ? 'Finish setup in Platform Repurposer above. Once content and a brand profile are available, generate variants from there.'
      : pipeline.canStart
        ? 'Choose platforms above if needed, then generate native variants for this source.'
        : 'Select source content, a brand profile, and at least one platform, then use Generate variants.';

  const variantsEmptyActionLabel = isFormVisible
    ? pipeline.canStart
      ? 'Generate variants'
      : 'Go to Generate'
    : undefined;

  const handleVariantsEmptyAction = isFormVisible
    ? pipeline.canStart
      ? () => pipeline.startRepurposeMutation.mutate()
      : focusGenerateButton
    : undefined;

  const goToWorkbench = () => navigate(`${ROUTES.admin.personalBrandingWorkbench}?tab=sandbox`);
  const goToBrandIdentity = () => navigate(ROUTES.admin.personalBrandingBrandIdentity);

  const handleDistributionStatusChange = (
    variantId: string,
    distributionStatus: ContentVariantDistributionStatus
  ) => {
    pipeline.updateDistributionStatusMutation.mutate(
      { variantId, distributionStatus },
      {
        onError: (error) => {
          showToast({
            type: 'error',
            title: "Couldn't update status",
            message: error instanceof Error ? error.message : 'Please try again.',
          });
        },
      }
    );
  };

  const handleDistributionTrackingSave = (
    variantId: string,
    body: UpdateVariantDistributionStatusInput
  ) => {
    pipeline.updateDistributionStatusMutation.mutate(
      { variantId, ...body },
      {
        onError: (error) => {
          showToast({
            type: 'error',
            title: "Couldn't save tracking",
            message: error instanceof Error ? error.message : 'Please try again.',
          });
        },
      }
    );
  };

  const handleAddToQueue = (variantId: string) => {
    pipeline.updateDistributionStatusMutation.mutate(
      { variantId, distributionStatus: 'SCHEDULED' },
      {
        onSuccess: () => {
          showToast({ type: 'success', title: 'Added to publish queue' });
        },
        onError: (error) => {
          showToast({
            type: 'error',
            title: "Couldn't add to queue",
            message: error instanceof Error ? error.message : 'Please try again.',
          });
        },
      }
    );
  };

  const handleSchedulePublish = async (variantId: string, scheduledPublishAt: string) => {
    try {
      await pipeline.updateDistributionStatusMutation.mutateAsync({
        variantId,
        distributionStatus: 'SCHEDULED',
        scheduledPublishAt,
      });
      showToast({ type: 'success', title: 'Scheduled for publish' });
    } catch (error) {
      showToast({
        type: 'error',
        title: "Couldn't schedule",
        message: error instanceof Error ? error.message : 'Please try again.',
      });
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer />
      <PageCard>
        <SectionIntro
          title="Platform Repurposer"
          description="Select published workbench content, choose a brand profile, and generate native platform variants."
        />
        {pipeline.wsConnectionState === 'connected' ? (
          <p className={cn(pbMetaClassName, 'mt-2')}>Live updates connected</p>
        ) : pipeline.wsConnectionState === 'reconnecting' ? (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
            Reconnecting live updates…
          </p>
        ) : pipeline.wsConnectionState === 'failed' ? (
          <p className={cn(pbMetaClassName, 'mt-2')}>
            Live updates unavailable — polling for status
          </p>
        ) : null}

        {isMissingContent && isMissingProfile ? (
          <EmptyState
            scene="actionRequired"
            title="Action required"
            description="Platform Repurposer needs published workbench content and an active Brand Identity profile before you can generate variants."
            actionLabel="Go to Content Workbench"
            onAction={goToWorkbench}
            secondaryActionLabel="Go to Brand Identity"
            onSecondaryAction={goToBrandIdentity}
            className="mt-6"
          />
        ) : isMissingContent ? (
          <EmptyState
            scene="noSource"
            title="No pipeline source content yet"
            description="Publish workbench content to use as a repurposing source. Sources stay available here after variants are generated."
            actionLabel="Go to Content Workbench"
            onAction={goToWorkbench}
            className="mt-6"
          />
        ) : isMissingProfile ? (
          <EmptyState
            scene="noProfile"
            title="Active brand identity profile required"
            description="Finish or activate a Brand Identity profile in Brand Identity so repurposed variants match your voice, tone, and platform rules. Draft and in-progress extraction profiles are not available here."
            actionLabel="Go to Brand Identity"
            onAction={goToBrandIdentity}
            className="mt-6"
          />
        ) : (
          <div className={cn(pbSectionStackClassName, 'mt-6')}>
            {pipeline.sourcePillarOptions.length > 0 ? (
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className={pbFormLabelClassName}>Filter sources by pillar</span>
                  {pipeline.hasActiveSourcePillarFilter ? (
                    <div className={cn('flex items-center gap-2', pbMetaClassName)}>
                      <span>
                        {pipeline.filteredSourceNodes.length} of {pipeline.sourceNodes.length}{' '}
                        sources
                      </span>
                      <button
                        type="button"
                        onClick={() => pipeline.setSelectedSourcePillars([])}
                        className={cn('font-medium hover:underline', linkAccentClassName)}
                      >
                        Clear
                      </button>
                    </div>
                  ) : null}
                </div>
                <BrandPillarMultiSelect
                  options={pipeline.sourcePillarOptions}
                  value={pipeline.selectedSourcePillars}
                  onChange={pipeline.setSelectedSourcePillars}
                  ariaLabel="Filter pipeline sources by brand pillar"
                />
              </div>
            ) : null}

            {isFilteredSourceEmpty ? (
              <EmptyState
                scene="filteredEmpty"
                title="No sources match these pillars"
                description="Try clearing the pillar filter or tag published workbench content with matching pillars."
                actionLabel="Clear pillar filter"
                onAction={() => pipeline.setSelectedSourcePillars([])}
                className="mt-6"
              />
            ) : (
              <div className={pbSectionStackClassName}>
                <label className="block text-sm">
                  <span className={pbFormLabelClassName}>
                    Source content <span className="text-red-500">*</span>
                  </span>
                  <IconSelect
                    aria-label="Source content"
                    value={pipeline.selectedContentId ?? ''}
                    onChange={(next) => pipeline.setSelectedContentId(next || null)}
                    options={sourceContentOptions}
                    className="mt-1"
                  />
                  {pipeline.selectedContent ? (
                    <p className={cn('mt-2', pbBodySecondaryClassName, 'text-xs')}>
                      {pipeline.selectedContent.canonicalUrl &&
                      pipeline.selectedContent.platform ? (
                        <>
                          Originally published on{' '}
                          <a
                            href={pipeline.selectedContent.canonicalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn('font-medium hover:underline', linkAccentClassName)}
                          >
                            {BRAND_PLATFORM_LABELS[pipeline.selectedContent.platform]}
                          </a>
                        </>
                      ) : pipeline.selectedContent.platform ? (
                        originallyPublishedOnLabel(pipeline.selectedContent.platform)
                      ) : (
                        <span className="text-gray-500 dark:text-gray-500">
                          {originallyPublishedOnLabel(null)}
                        </span>
                      )}
                    </p>
                  ) : null}
                </label>

                <fieldset>
                  <legend className={pbFormLabelClassName}>Target platforms</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {pipeline.allPlatforms.map((platform) => {
                      const selected = pipeline.targetPlatforms.includes(platform);
                      const isSourcePlatform = platform === pipeline.sourcePlatform;
                      const requirementCount = platformRulesSurface.getRequirementCount(platform);
                      const panelId = platformRulesSurface.panelId(platform);
                      return (
                        <span
                          key={platform}
                          className={cn(
                            selectableChipClassName(
                              selected,
                              'inline-flex items-center rounded-full py-1.5 pl-3',
                              isSourcePlatform
                            ),
                            selected && requirementCount != null && requirementCount > 0
                              ? 'pr-1'
                              : 'pr-3',
                            appliedFlashPlatforms.includes(platform) &&
                              'ring-2 ring-blue-400/50 dark:ring-blue-500/40'
                          )}
                        >
                          <button
                            type="button"
                            disabled={isSourcePlatform}
                            title={isSourcePlatform ? 'Same as source platform' : undefined}
                            onClick={() => pipeline.togglePlatform(platform)}
                            className="text-inherit disabled:cursor-not-allowed"
                          >
                            {BRAND_PLATFORM_LABELS[platform]}
                          </button>
                          {selected && requirementCount != null && requirementCount > 0 ? (
                            <PlatformRequirementCountBadge
                              platform={platform}
                              count={requirementCount}
                              expanded={platformRulesSurface.expandedPlatform === platform}
                              panelId={panelId}
                              onClick={(event) =>
                                platformRulesSurface.handleBadgeClick(event, platform)
                              }
                            />
                          ) : null}
                        </span>
                      );
                    })}
                  </div>
                  <TargetPlatformRequirementsExpandPanel
                    profileByPlatform={pipeline.profileByPlatform}
                    targetPlatforms={pipeline.targetPlatforms}
                    expandedPlatform={platformRulesSurface.expandedPlatform}
                    byPlatform={platformRulesSurface.byPlatform}
                    panelId={platformRulesSurface.panelId}
                  />
                </fieldset>

                {pipeline.targetPlatforms.length > 0 ? (
                  <div className={pbListStackClassName}>
                    <p className={pbFormLabelClassName}>
                      Brand profile per platform <span className="text-red-500">*</span>
                    </p>
                    {pipeline.targetPlatforms.map((platform) => {
                      const eligible = eligibleProfilesForPlatform(pipeline.profiles, platform);
                      const selectedProfileId = pipeline.profileByPlatform[platform] ?? '';
                      return (
                        <label key={platform} className="block text-sm">
                          <span className={cn('mb-1 block', pbFormLabelClassName)}>
                            {BRAND_PLATFORM_LABELS[platform]}
                          </span>
                          {eligible.length === 0 ? (
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                              No active profile is configured for this platform.{' '}
                              <button
                                type="button"
                                onClick={goToBrandIdentity}
                                className="font-medium underline"
                              >
                                Add one in Brand Identity
                              </button>
                            </p>
                          ) : (
                            <Select
                              required
                              value={selectedProfileId}
                              onChange={(event) =>
                                pipeline.setProfileForPlatform(platform, event.target.value)
                              }
                              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950"
                            >
                              {eligible.map((profile) => (
                                <option key={profile.id} value={profile.id}>
                                  {profile.name}
                                </option>
                              ))}
                            </Select>
                          )}
                        </label>
                      );
                    })}
                    <ProfileStrengthIndicator
                      profilesByPlatform={pipeline.profilesByPlatform}
                      targetPlatforms={pipeline.targetPlatforms}
                    />
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={
                      !pipeline.canSuggestPlatforms || pipeline.suggestPlatformFitMutation.isPending
                    }
                    onClick={() => pipeline.suggestPlatformFitMutation.mutate()}
                    className="inline-flex items-center gap-2"
                  >
                    {pipeline.suggestPlatformFitMutation.isPending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Sparkles size={16} />
                    )}
                    Suggest best platforms
                  </Button>
                  {pipeline.platformFitApplyPreview?.platforms.length ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleApplyPlatformRecommendations}
                    >
                      {pipeline.platformFitApplyPreview.label}
                    </Button>
                  ) : null}
                </div>

                {pipeline.suggestPlatformFitMutation.isError ? (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {pipeline.suggestPlatformFitMutation.error instanceof Error
                      ? pipeline.suggestPlatformFitMutation.error.message
                      : 'Could not load platform suggestions.'}
                  </p>
                ) : null}

                {pipeline.platformFitSuggestions?.recommendations.length ? (
                  <ol className={pbListStackClassName}>
                    {pipeline.platformFitSuggestions.recommendations.map((rec, index) => (
                      <PlatformFitRecommendationCard
                        key={rec.platform}
                        recommendation={rec}
                        rank={index + 1}
                        selected={pipeline.targetPlatforms.includes(rec.platform)}
                        onToggle={() => handleRecommendationPlatformToggle(rec.platform)}
                      />
                    ))}
                  </ol>
                ) : null}

                {pipeline.selectedContent?.body ? (
                  <ExpandablePlainTextPreview
                    text={pipeline.selectedContent.body}
                    className={pbBodySecondaryClassName}
                  />
                ) : null}

                {pipeline.generationBatchJobs.length > 0 ? (
                  <RepurposeGenerationProgressBanner
                    batchJobs={pipeline.generationBatchJobs}
                    isCancelling={pipeline.cancelRepurposeMutation.isPending}
                    onCancel={() => pipeline.cancelRepurposeMutation.mutate()}
                  />
                ) : null}

                <Button
                  id={GENERATE_VARIANTS_BUTTON_ID}
                  type="button"
                  size="sm"
                  disabled={!pipeline.canStart}
                  onClick={() => pipeline.startRepurposeMutation.mutate()}
                  className={cn(
                    'inline-flex items-center gap-2',
                    generateHighlight &&
                      'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900'
                  )}
                >
                  {pipeline.startRepurposeMutation.isPending || pipeline.inFlightJobs.length > 0 ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : null}
                  {pipeline.startRepurposeMutation.isPending || pipeline.inFlightJobs.length > 0
                    ? 'Generating…'
                    : 'Generate variants'}
                </Button>

                {pipeline.visibleJobs.length > 0 ? (
                  <div className={pbDenseListStackClassName}>
                    {pipeline.visibleJobs.map((job) => {
                      const isInFlight = repurposeJobInFlight(job.status);
                      return (
                        <div
                          key={job.jobId}
                          className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-900/50"
                        >
                          <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                            {isInFlight ? (
                              <Loader2
                                size={14}
                                className="animate-spin text-blue-600 dark:text-blue-400"
                              />
                            ) : null}
                            <span>{BRAND_PLATFORM_LABELS[job.platform]}</span>
                            <span className="text-gray-500 dark:text-gray-400">·</span>
                            <span className="capitalize">{job.status}</span>
                            {job.stage ? (
                              <>
                                <span className="text-gray-500 dark:text-gray-400">·</span>
                                <span className="font-normal text-gray-600 dark:text-gray-300">
                                  {REPURPOSE_JOB_STAGE_LABELS[job.stage] ?? job.stage}
                                </span>
                              </>
                            ) : null}
                          </div>
                          {job.keywordResearchWarning ? (
                            <p className="mt-1 text-amber-700 dark:text-amber-300">
                              {job.keywordResearchWarning}
                            </p>
                          ) : null}
                          {job.message ? (
                            <p className="mt-1 text-gray-600 dark:text-gray-400">{job.message}</p>
                          ) : null}
                          {job.error ? (
                            <p className="mt-1 text-red-600 dark:text-red-400">{job.error}</p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </PageCard>

      <section className={pbListStackClassName}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className={pbNestedSectionTitleClassName}>Generated variants</h3>
          {visibleVariants.length > 0 ? (
            <label className={cn('flex items-center gap-2', pbBodySecondaryClassName)}>
              <FormCheckbox checked={allVariantsSelected} onChange={toggleSelectAllVariants} />
              Select all
            </label>
          ) : null}
        </div>
        <GeneratedVariantsFilterBar
          variants={pipeline.variants}
          filters={variantFilters}
          sort={variantSort}
          onFiltersChange={setVariantFilters}
          onSortChange={setVariantSort}
        />
        {selectedVariantIds.length > 0 ? (
          <div className="sticky top-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 shadow-sm dark:border-sky-900/50 dark:bg-sky-950/40">
            <p className="text-sm font-medium text-sky-900 dark:text-sky-100">
              {selectedVariantIds.length} variant{selectedVariantIds.length === 1 ? '' : 's'}{' '}
              selected
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={bulkPending}
                onClick={() => setSelectedVariantIds([])}
              >
                Clear
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={bulkPending}
                onClick={() => void handleBulkMarkReady()}
              >
                Mark Ready
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={bulkPending}
                onClick={() => void handleBulkAddToQueue()}
              >
                Add to Queue
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={bulkPending}
                onClick={() => void handleBulkSendToSandbox()}
              >
                Push to Workbench
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={bulkPending}
                onClick={handleOpenBulkReject}
                className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/40"
              >
                Reject
              </Button>
            </div>
          </div>
        ) : null}
        {visibleSkeletonPlatforms.map((platform, index) => (
          <VariantGeneratingSkeleton
            key={`generating-${platform}`}
            platform={platform}
            index={index}
          />
        ))}
        {pipeline.variants.length === 0 && visibleSkeletonPlatforms.length === 0 ? (
          <EmptyState
            scene="noVariants"
            title="No variants yet"
            description={variantsEmptyDescription}
            {...(variantsEmptyActionLabel && handleVariantsEmptyAction
              ? {
                  actionLabel: variantsEmptyActionLabel,
                  onAction: handleVariantsEmptyAction,
                }
              : {})}
            className="py-8"
          />
        ) : visibleVariants.length === 0 && visibleSkeletonPlatforms.length === 0 ? (
          <EmptyState
            scene="filteredEmpty"
            title="No variants match"
            description="Try adjusting platform, date, or status filters."
            actionLabel="Clear filters"
            onAction={() => {
              setVariantFilters(EMPTY_GENERATED_VARIANTS_FILTERS);
              setVariantSort(DEFAULT_GENERATED_VARIANTS_SORT);
            }}
            className="py-8"
          />
        ) : (
          visibleVariants.map((variant) => (
            <VariantActiveCard
              key={variant.id}
              variant={variant}
              pipeline={pipeline}
              selected={selectedVariantIds.includes(variant.id)}
              onSelectedChange={(selected) => toggleVariantSelection(variant.id, selected)}
              selectionDisabled={bulkPending || bulkUpdatingIds.has(variant.id)}
              onSchedulePublish={handleSchedulePublish}
              onAddToQueue={handleAddToQueue}
              onDistributionStatusChange={handleDistributionStatusChange}
              onDistributionTrackingSave={handleDistributionTrackingSave}
              onError={(title, error) =>
                showToast({
                  type: 'error',
                  title,
                  message: error instanceof Error ? error.message : 'Please try again.',
                })
              }
              onSuccess={(title, message) =>
                showToast({
                  type: 'success',
                  title,
                  message,
                })
              }
            />
          ))
        )}
      </section>

      <VariantRegenerateTweaksDrawer
        open={pipeline.tweakingVariantId != null}
        variant={pipeline.tweakingVariant}
        profile={pipeline.tweakingProfile}
        onClose={() => pipeline.setTweakingVariantId(null)}
        isSubmitting={pipeline.regenerateWithTweaksMutation.isPending}
        onSubmit={async (variantId, body) => {
          try {
            await pipeline.regenerateWithTweaksMutation.mutateAsync({ variantId, body });
            showToast({
              type: 'success',
              title: 'Regeneration queued',
              message: 'A new variant will appear when adaptation completes.',
            });
          } catch (error) {
            showToast({
              type: 'error',
              title: "Couldn't regenerate",
              message: error instanceof Error ? error.message : 'Please try again.',
            });
          }
        }}
      />

      <BulkRejectVariantsModal
        isOpen={bulkRejectOpen}
        variantCount={bulkRejectVariantIds.length}
        isSubmitting={bulkPending}
        onClose={() => {
          if (bulkPending) return;
          setBulkRejectOpen(false);
          setBulkRejectVariantIds([]);
        }}
        onSubmit={(critique) => void handleBulkReject(critique)}
      />
    </div>
  );
}
