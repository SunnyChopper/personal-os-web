import { useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandProfileReadinessCallout } from '@/components/molecules/personal-branding/BrandProfileReadinessCallout';
import { brandIdentityHref } from '@/lib/personal-branding/brand-identity-deep-links';
import { useTerminalJobFailureAlert } from '@/hooks/useTerminalJobFailureAlert';
import { ChevronDown, ChevronRight, Lightbulb, Sparkles } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { Select } from '@/components/atoms/Select';
import ExpandOnFocusTextarea from '@/components/molecules/ExpandOnFocusTextarea';
import { BrainstormModelPicker } from '@/components/molecules/assistant/BrainstormModelPicker';
import { EmptyState } from '@/components/molecules/EmptyState';
import type { BrainstormModelPickerValue } from '@/lib/assistant/brainstorm-model-picker';
import type { AssistantModelCatalogData } from '@/types/chatbot';
import type {
  BrandPlatform,
  BrandProfile,
  ContentIdea,
  ContentIdeaGenerationContextStats,
  ContentIdeationJob,
} from '@/types/api/personal-branding.dto';
import { BRAND_PLATFORM_LABELS } from '@/types/api/personal-branding.dto';
import ContentIdeationProgressPanel from '@/components/molecules/personal-branding/ContentIdeationProgressPanel';
import { ContentIdeaGridSkeleton } from '@/components/molecules/personal-branding/ContentIdeaCardSkeleton';
import {
  contentIdeationCtaProgressOnly,
  contentIdeationProgressPanelJob,
} from '@/lib/personal-branding/content-ideation-progress';
import ContentIdeaCard from '@/components/organisms/personal-branding/ContentIdeaCard';
import { PageCard, SectionIntro } from '../PersonalBrandingPageTemplate';
import {
  pbSectionTitleClassName,
  pbFeedbackTextClassName,
  selectableChipClassName,
  statusPillClassName,
} from '../personal-branding-ui';
import { cn } from '@/lib/utils';
import {
  defaultIdeaCountForPlatform,
  ideationIdeaCountPresetsForPlatform,
  IDEATION_ADVANCED_LEARNING_HINT,
  IDEATION_AI_MODEL_AUTO_HINT,
  IDEATION_ENGINE_GENERATE_BUTTON_ID,
  IDEATION_IMAGE_SEARCH_HINT,
  IDEATION_KEYWORD_RESEARCH_HINT,
  IDEATION_SECTION_LEAD,
  hasIdeationAdvancedOptionsActive,
  isBrandProfileReadyForIdeation,
  formatRejectedFeedbackStatsLine,
  formatReferencedPublishedHintLine,
  formatReferencedPublishedStatsLine,
} from './content-workbench-helpers';

const ALL_PLATFORMS = Object.keys(BRAND_PLATFORM_LABELS) as BrandPlatform[];

function contentIdeaSourceLabel(idea: ContentIdea): string {
  if (idea.sourceType === 'WEEKLY_REVIEW_QUICK_WIN') {
    return 'Weekly Review Quick Win';
  }
  if (idea.sourceType === 'GOAL_COMPLETED') {
    return 'Goal completed';
  }
  return idea.sourceType.replace(/_/g, ' ');
}

interface IdeationEngineTabProps {
  ideas: ContentIdea[];
  isLoading: boolean;
  approvingId: string | null;
  profiles: BrandProfile[];
  profilesLoading: boolean;
  selectedProfileId: string | null;
  onProfileChange: (profileId: string) => void;
  targetPlatform: BrandPlatform;
  onTargetPlatformChange: (platform: BrandPlatform) => void;
  seedIdeas: string;
  onSeedIdeasChange: (value: string) => void;
  boostFromRecentPublishes: boolean;
  onBoostFromRecentPublishesChange: (value: boolean) => void;
  enableImageSearch: boolean;
  onEnableImageSearchChange: (value: boolean) => void;
  enableKeywordResearch: boolean;
  onEnableKeywordResearchChange: (value: boolean) => void;
  ideaCount: number;
  onIdeaCountChange: (value: number) => void;
  ideationModelCatalog: AssistantModelCatalogData | null;
  isIdeationModelCatalogLoading: boolean;
  ideationModelPicker: BrainstormModelPickerValue;
  onIdeationModelPickerChange: (value: BrainstormModelPickerValue) => void;
  isGenerating: boolean;
  ideationJob?: ContentIdeationJob | null;
  ideationClientCancelState?: 'idle' | 'cancelled';
  onCancelIdeationJob?: () => void;
  generateError: string | null;
  lastGenerationStats: ContentIdeaGenerationContextStats | null;
  ideationLiveMessage?: string | null;
  onGenerate: () => void;
  onApprove: (idea: ContentIdea) => void;
  onReject: (idea: ContentIdea) => void;
}

export default function IdeationEngineTab({
  ideas,
  isLoading,
  approvingId,
  profiles,
  profilesLoading,
  selectedProfileId,
  onProfileChange,
  targetPlatform,
  onTargetPlatformChange,
  seedIdeas,
  onSeedIdeasChange,
  boostFromRecentPublishes,
  onBoostFromRecentPublishesChange,
  enableImageSearch,
  onEnableImageSearchChange,
  enableKeywordResearch,
  onEnableKeywordResearchChange,
  ideaCount,
  onIdeaCountChange,
  ideationModelCatalog,
  isIdeationModelCatalogLoading,
  ideationModelPicker,
  onIdeationModelPickerChange,
  isGenerating,
  ideationJob,
  ideationClientCancelState = 'idle',
  onCancelIdeationJob,
  generateError,
  lastGenerationStats,
  ideationLiveMessage,
  onGenerate,
  onApprove,
  onReject,
}: IdeationEngineTabProps) {
  const navigate = useNavigate();
  const selectedProfile = profiles.find((p) => p.id === selectedProfileId) ?? null;
  const profileReady = selectedProfile ? isBrandProfileReadyForIdeation(selectedProfile) : false;
  const canGenerate = Boolean(selectedProfileId && profileReady && !isGenerating);

  const focusGenerateButton = () => {
    const button = document.getElementById(IDEATION_ENGINE_GENERATE_BUTTON_ID);
    if (!button) return;
    if (typeof button.scrollIntoView === 'function') {
      button.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    button.focus();
  };

  const goToBrandIdentity = () => {
    navigate(brandIdentityHref({ tab: 'core-profile' }));
  };

  const emptyAction =
    profiles.length === 0
      ? { actionLabel: 'Open Brand Identity', onAction: goToBrandIdentity }
      : canGenerate
        ? { actionLabel: 'Generate first ideas', onAction: onGenerate }
        : { actionLabel: 'Generate first ideas', onAction: focusGenerateButton };

  useTerminalJobFailureAlert({
    feature: 'contentIdeation',
    jobId: ideationJob?.jobId,
    status: ideationJob?.status,
    error: ideationJob?.error,
    message: ideationJob?.message,
    stage: ideationJob?.stage,
    errorCode: ideationJob?.errorCode,
    retryable: ideationJob?.retryable,
  });

  const advancedActive = hasIdeationAdvancedOptionsActive({
    seedIdeas,
    boostFromRecentPublishes,
    enableImageSearch,
    enableKeywordResearch,
    ideationModelPicker,
  });
  const includeReferenceSearch = Boolean(seedIdeas.trim()) || boostFromRecentPublishes;
  const includeKeywordResearch = targetPlatform === 'medium' || enableKeywordResearch;
  const advancedPanelId = useId();
  const [advancedOpen, setAdvancedOpen] = useState(() => advancedActive);

  useEffect(() => {
    if (advancedActive) {
      setAdvancedOpen(true);
    }
  }, [advancedActive]);

  const ideaCountChips = (
    <fieldset className="shrink-0 space-y-1 text-sm">
      <legend className="font-medium text-gray-700 dark:text-gray-300">Ideas</legend>
      <div className="flex gap-1.5">
        {ideationIdeaCountPresetsForPlatform(targetPlatform).map((preset) => {
          const selected = ideaCount === preset;
          return (
            <button
              key={preset}
              type="button"
              aria-pressed={selected}
              onClick={() => onIdeaCountChange(preset)}
              className={selectableChipClassName(selected, 'rounded-md px-2.5 py-1.5 text-xs')}
            >
              {preset}
            </button>
          );
        })}
      </div>
    </fieldset>
  );

  const handleTargetPlatformChange = (next: BrandPlatform) => {
    onTargetPlatformChange(next);
    onIdeaCountChange(defaultIdeaCountForPlatform(next));
  };

  return (
    <div className="space-y-4">
      <PageCard className="space-y-3 p-4 sm:p-5">
        <SectionIntro title="Generate ideas" description={IDEATION_SECTION_LEAD} />

        {profilesLoading ? (
          <p className="text-sm text-gray-500">Loading brand profiles…</p>
        ) : profiles.length === 0 ? (
          <BrandProfileReadinessCallout variant="missing-profile" />
        ) : null}

        {profiles.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">Brand profile</span>
              <Select
                value={selectedProfileId ?? ''}
                onChange={(e) => onProfileChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              >
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                    {!isBrandProfileReadyForIdeation(profile) ? ' (needs pillars + audience)' : ''}
                  </option>
                ))}
              </Select>
            </label>

            <div className="flex items-end gap-3">
              <label className="block min-w-0 flex-1 space-y-1 text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Target platform
                </span>
                <Select
                  value={targetPlatform}
                  onChange={(e) => handleTargetPlatformChange(e.target.value as BrandPlatform)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                >
                  {ALL_PLATFORMS.map((platform) => (
                    <option key={platform} value={platform}>
                      {BRAND_PLATFORM_LABELS[platform]}
                    </option>
                  ))}
                </Select>
              </label>

              {ideaCountChips}
            </div>
          </div>
        ) : (
          ideaCountChips
        )}

        <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
          <button
            type="button"
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left text-sm font-medium text-gray-700',
              'hover:text-gray-900 dark:text-gray-300 dark:hover:text-white',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50'
            )}
            aria-expanded={advancedOpen}
            aria-controls={advancedPanelId}
            onClick={() => setAdvancedOpen((open) => !open)}
          >
            {advancedOpen ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
            )}
            Advanced options
            {!advancedOpen && advancedActive ? (
              <span className={statusPillClassName('info', 'ml-1')}>Active</span>
            ) : null}
          </button>

          {advancedOpen ? (
            <div id={advancedPanelId} className="mt-3 space-y-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {IDEATION_ADVANCED_LEARNING_HINT}
              </p>
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Seed ideas <span className="font-normal text-gray-500">(optional)</span>
                </span>
                <ExpandOnFocusTextarea
                  value={seedIdeas}
                  onChange={(e) => onSeedIdeasChange(e.target.value)}
                  placeholder="Topics, angles, or themes you want the brainstorm to explore…"
                  className="w-full"
                />
              </label>

              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={boostFromRecentPublishes}
                  onChange={(e) => onBoostFromRecentPublishesChange(e.target.checked)}
                  disabled={isGenerating}
                  className="mt-0.5 shrink-0"
                />
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Boost from recent publishes
                </span>
              </label>

              {targetPlatform !== 'medium' ? (
                <label
                  className="flex items-start gap-2 text-sm"
                  title={IDEATION_KEYWORD_RESEARCH_HINT}
                >
                  <input
                    type="checkbox"
                    checked={enableKeywordResearch}
                    onChange={(e) => onEnableKeywordResearchChange(e.target.checked)}
                    disabled={isGenerating}
                    className="mt-0.5 shrink-0"
                    title={IDEATION_KEYWORD_RESEARCH_HINT}
                  />
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Run keyword research (DataForSEO)
                  </span>
                </label>
              ) : null}

              <div className="grid gap-3 lg:grid-cols-2">
                <label
                  className="flex items-start gap-2 text-sm"
                  title={IDEATION_IMAGE_SEARCH_HINT}
                >
                  <input
                    type="checkbox"
                    checked={enableImageSearch}
                    onChange={(e) => onEnableImageSearchChange(e.target.checked)}
                    disabled={isGenerating}
                    className="mt-0.5 shrink-0"
                    title={IDEATION_IMAGE_SEARCH_HINT}
                  />
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Search &amp; inject images when drafting
                  </span>
                </label>

                <div className="space-y-1.5">
                  <h3
                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    title={IDEATION_AI_MODEL_AUTO_HINT}
                  >
                    AI model
                  </h3>
                  <BrainstormModelPicker
                    catalog={ideationModelCatalog}
                    isLoading={isIdeationModelCatalogLoading}
                    value={ideationModelPicker}
                    onChange={onIdeationModelPickerChange}
                    disabled={isGenerating}
                    autoModeDescription={null}
                    modeToggleVariant="quiet"
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {selectedProfile && !profileReady ? (
          <BrandProfileReadinessCallout
            variant="incomplete-profile"
            profileId={selectedProfile.id}
          />
        ) : null}

        {generateError ? (
          <p className={pbFeedbackTextClassName('danger')}>{generateError}</p>
        ) : null}

        {contentIdeationCtaProgressOnly(ideationJob, isGenerating) ? (
          <ContentIdeationProgressPanel
            job={contentIdeationProgressPanelJob(ideationJob, isGenerating)}
            includeReferenceSearch={includeReferenceSearch}
            includeKeywordResearch={includeKeywordResearch}
            onCancel={onCancelIdeationJob}
          />
        ) : (
          <>
            {ideationJob?.status === 'failed' ? (
              <ContentIdeationProgressPanel
                job={ideationJob}
                includeReferenceSearch={includeReferenceSearch}
                includeKeywordResearch={includeKeywordResearch}
              />
            ) : null}
            {ideationClientCancelState === 'cancelled' ? (
              <ContentIdeationProgressPanel clientCancelled />
            ) : null}
            <Button
              id={IDEATION_ENGINE_GENERATE_BUTTON_ID}
              type="button"
              size="sm"
              onClick={onGenerate}
              disabled={!canGenerate}
              className="inline-flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Generate ideas
            </Button>
          </>
        )}
      </PageCard>

      <section className="space-y-3">
        <h2 className={pbSectionTitleClassName}>Candidate content ideas</h2>
        {ideationLiveMessage ? (
          <span className="sr-only" role="status" aria-live="polite">
            {ideationLiveMessage}
          </span>
        ) : null}

        {lastGenerationStats
          ? (() => {
              const referenceLine = formatReferencedPublishedStatsLine(lastGenerationStats);
              return referenceLine ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">{referenceLine}</p>
              ) : null;
            })()
          : null}

        {lastGenerationStats?.referencedPublishedHints?.map((hint) => (
          <p key={hint.contentNodeId} className="text-sm text-gray-600 dark:text-gray-400">
            {formatReferencedPublishedHintLine(hint, BRAND_PLATFORM_LABELS)}
          </p>
        ))}

        {lastGenerationStats && (lastGenerationStats.publishedOutcomesCount ?? 0) > 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Grounded in {lastGenerationStats.publishedOutcomesCount} recently published post
            {lastGenerationStats.publishedOutcomesCount === 1 ? '' : 's'}.
          </p>
        ) : null}

        {lastGenerationStats && (lastGenerationStats.similarityDroppedCount ?? 0) > 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Filtered {lastGenerationStats.similarityDroppedCount} near-duplicate idea
            {lastGenerationStats.similarityDroppedCount === 1 ? '' : 's'} before saving.
          </p>
        ) : null}

        {lastGenerationStats?.refineWarning ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {lastGenerationStats.refineWarning}
          </p>
        ) : null}

        {lastGenerationStats
          ? (() => {
              const rejectionLine = formatRejectedFeedbackStatsLine(lastGenerationStats);
              return rejectionLine ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">{rejectionLine}</p>
              ) : null;
            })()
          : null}

        {isLoading ? (
          <ContentIdeaGridSkeleton />
        ) : ideas.length === 0 ? (
          <EmptyState
            icon={Lightbulb}
            density="compact"
            title="No candidate ideas yet"
            description="Use Generate ideas above, or wait for Radar / other sources."
            actionLabel={emptyAction.actionLabel}
            onAction={emptyAction.onAction}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {ideas.map((idea) => (
              <ContentIdeaCard
                key={idea.id}
                idea={idea}
                isApproving={approvingId === idea.id}
                onApprove={onApprove}
                onReject={onReject}
                sourceFallbackLabel={idea.targetPlatform ? undefined : contentIdeaSourceLabel(idea)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
