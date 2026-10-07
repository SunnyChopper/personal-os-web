import { useRef } from 'react';
import { Library, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BrandProfileReadinessCallout } from '@/components/molecules/personal-branding/BrandProfileReadinessCallout';
import { brandIdentityHref } from '@/lib/personal-branding/brand-identity-deep-links';
import { useTerminalJobFailureAlert } from '@/hooks/useTerminalJobFailureAlert';
import Button from '@/components/atoms/Button';
import { Select } from '@/components/atoms/Select';
import { MultiSelectVaultCombobox } from '@/components/molecules/MultiSelectVaultCombobox';
import { EmptyState } from '@/components/molecules/EmptyState';
import type {
  BrandPlatform,
  BrandProfile,
  ContentIdea,
  ContentIdeaGenerationContextStats,
  ContentIdeationJob,
} from '@/types/api/personal-branding.dto';
import { BRAND_PLATFORM_LABELS } from '@/types/api/personal-branding.dto';
import ContentIdeationProgressPanel from '@/components/molecules/personal-branding/ContentIdeationProgressPanel';
import ContentIdeaCard from '@/components/organisms/personal-branding/ContentIdeaCard';
import {
  contentIdeationCtaProgressOnly,
  contentIdeationProgressPanelJob,
} from '@/lib/personal-branding/content-ideation-progress';
import { PageCard, SectionIntro } from '../PersonalBrandingPageTemplate';
import {
  pbFeedbackTextClassName,
  pbSectionTitleClassName,
  statusPillClassName,
} from '../personal-branding-ui';
import {
  formatRejectedFeedbackStatsLine,
  IDEATION_IMAGE_SEARCH_HINT,
  isBrandProfileReadyForIdeation,
  VAULT_EXTRACTOR_GENERATE_BUTTON_ID,
  VAULT_EXTRACTOR_VAULT_SEARCH_INPUT_ID,
} from './content-workbench-helpers';

const ALL_PLATFORMS = Object.keys(BRAND_PLATFORM_LABELS) as BrandPlatform[];

interface VaultExtractorTabProps {
  ideas: ContentIdea[];
  isLoading: boolean;
  approvingId: string | null;
  profiles: BrandProfile[];
  profilesLoading: boolean;
  selectedProfileId: string | null;
  onProfileChange: (profileId: string) => void;
  targetPlatform: BrandPlatform;
  onTargetPlatformChange: (platform: BrandPlatform) => void;
  selectedVaultItemIds: string[];
  onVaultSelectionChange: (ids: string[]) => void;
  vaultEnableImageSearch: boolean;
  onVaultEnableImageSearchChange: (value: boolean) => void;
  vaultItemLabels: Record<string, string>;
  onVaultItemLabelsChange: (labels: Record<string, string>) => void;
  isGenerating: boolean;
  vaultJob?: ContentIdeationJob | null;
  vaultClientCancelState?: 'idle' | 'cancelled';
  onCancelVaultJob?: () => void;
  generateError: string | null;
  lastGenerationStats: ContentIdeaGenerationContextStats | null;
  vaultLiveMessage?: string | null;
  onGenerate: () => void;
  onApprove: (idea: ContentIdea) => void;
  onReject: (idea: ContentIdea) => void;
}

export default function VaultExtractorTab({
  ideas,
  isLoading,
  approvingId,
  profiles,
  profilesLoading,
  selectedProfileId,
  onProfileChange,
  targetPlatform,
  onTargetPlatformChange,
  selectedVaultItemIds,
  onVaultSelectionChange,
  vaultEnableImageSearch,
  onVaultEnableImageSearchChange,
  vaultItemLabels,
  onVaultItemLabelsChange,
  isGenerating,
  vaultJob,
  vaultClientCancelState = 'idle',
  onCancelVaultJob,
  generateError,
  lastGenerationStats,
  vaultLiveMessage,
  onGenerate,
  onApprove,
  onReject,
}: VaultExtractorTabProps) {
  const navigate = useNavigate();
  const vaultSearchInputRef = useRef<HTMLInputElement>(null);

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId) ?? null;
  const profileReady = selectedProfile ? isBrandProfileReadyForIdeation(selectedProfile) : false;
  const canGenerate = Boolean(
    selectedProfileId && profileReady && selectedVaultItemIds.length > 0 && !isGenerating
  );

  useTerminalJobFailureAlert({
    feature: 'contentIdeation',
    jobId: vaultJob?.jobId,
    status: vaultJob?.status,
    error: vaultJob?.error,
    message: vaultJob?.message,
    stage: vaultJob?.stage,
    errorCode: vaultJob?.errorCode,
    retryable: vaultJob?.retryable,
  });

  const focusVaultSources = () => {
    const input =
      vaultSearchInputRef.current ?? document.getElementById(VAULT_EXTRACTOR_VAULT_SEARCH_INPUT_ID);
    if (!input || !(input instanceof HTMLElement)) return;
    if (typeof input.scrollIntoView === 'function') {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    input.focus();
  };

  const goToBrandIdentity = () => {
    navigate(brandIdentityHref({ tab: 'core-profile' }));
  };

  const emptyAction =
    profiles.length === 0
      ? { actionLabel: 'Open Brand Identity', onAction: goToBrandIdentity }
      : canGenerate
        ? { actionLabel: 'Generate first ideas', onAction: onGenerate }
        : { actionLabel: 'Select vault sources', onAction: focusVaultSources };

  return (
    <div className="space-y-6">
      <PageCard className="space-y-4">
        <SectionIntro
          title="Extract ideas from Knowledge Vault"
          description="Select vault notes or documents, combine them with your Brand Identity, and generate on-brand content ideas. Rejected ideas inform future runs."
        />

        {profilesLoading ? (
          <p className="text-sm text-gray-500">Loading brand profiles…</p>
        ) : profiles.length === 0 ? (
          <BrandProfileReadinessCallout variant="missing-profile" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-1.5 text-sm">
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

            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">Target platform</span>
              <Select
                value={targetPlatform}
                onChange={(e) => onTargetPlatformChange(e.target.value as BrandPlatform)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              >
                {ALL_PLATFORMS.map((platform) => (
                  <option key={platform} value={platform}>
                    {BRAND_PLATFORM_LABELS[platform]}
                  </option>
                ))}
              </Select>
            </label>
          </div>
        )}

        <label className="flex items-start gap-2 text-sm" title={IDEATION_IMAGE_SEARCH_HINT}>
          <input
            type="checkbox"
            checked={vaultEnableImageSearch}
            onChange={(e) => onVaultEnableImageSearchChange(e.target.checked)}
            disabled={isGenerating}
            className="mt-0.5 shrink-0"
            title={IDEATION_IMAGE_SEARCH_HINT}
          />
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Search &amp; inject images when drafting
          </span>
        </label>

        <div className="space-y-1.5">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Knowledge Vault sources
          </span>
          <MultiSelectVaultCombobox
            selectedIds={selectedVaultItemIds}
            onSelectionChange={onVaultSelectionChange}
            minItems={1}
            maxItems={10}
            labelLookup={vaultItemLabels}
            itemLabel="vault sources"
            onLabelLookupChange={onVaultItemLabelsChange}
            searchInputId={VAULT_EXTRACTOR_VAULT_SEARCH_INPUT_ID}
            searchInputRef={vaultSearchInputRef}
          />
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

        {contentIdeationCtaProgressOnly(vaultJob, isGenerating) ? (
          <ContentIdeationProgressPanel
            job={contentIdeationProgressPanelJob(vaultJob, isGenerating)}
            onCancel={onCancelVaultJob}
          />
        ) : (
          <>
            {vaultJob?.status === 'failed' ? <ContentIdeationProgressPanel job={vaultJob} /> : null}
            {vaultClientCancelState === 'cancelled' ? (
              <ContentIdeationProgressPanel clientCancelled />
            ) : null}
            <Button
              id={VAULT_EXTRACTOR_GENERATE_BUTTON_ID}
              type="button"
              size="sm"
              onClick={onGenerate}
              disabled={!canGenerate}
              className="inline-flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Generate ideas from vault
            </Button>
          </>
        )}
      </PageCard>

      <section className="space-y-3">
        <h2 className={pbSectionTitleClassName}>Vault-sourced content ideas</h2>
        {vaultLiveMessage ? (
          <span className="sr-only" role="status" aria-live="polite">
            {vaultLiveMessage}
          </span>
        ) : null}

        {lastGenerationStats ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Generated {lastGenerationStats.existingGeneratedCount > 0 ? 'new ' : ''}ideas using{' '}
            {selectedVaultItemIds.length} vault source
            {selectedVaultItemIds.length === 1 ? '' : 's'}
            {(() => {
              const rejectionLine = formatRejectedFeedbackStatsLine(lastGenerationStats);
              return rejectionLine ? ` (${rejectionLine})` : '';
            })()}
            {(lastGenerationStats.publishedOutcomesCount ?? 0) > 0
              ? `. Grounded in ${lastGenerationStats.publishedOutcomesCount} recently published post${
                  lastGenerationStats.publishedOutcomesCount === 1 ? '' : 's'
                }`
              : ''}
            .
          </p>
        ) : null}

        {isLoading ? (
          <div className="flex min-h-[200px] items-center justify-center text-gray-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading ideas…
          </div>
        ) : ideas.length === 0 ? (
          <EmptyState
            icon={Library}
            density="compact"
            title="No vault-sourced ideas yet"
            description="Select Knowledge Vault items above and generate ideas."
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
                metaExtras={
                  (idea.vaultItemSnapshots ?? []).length > 0 ||
                  (idea.vaultItemIds ?? []).length > 0 ? (
                    <>
                      {(idea.vaultItemSnapshots ?? []).length > 0
                        ? (idea.vaultItemSnapshots ?? []).map((snapshot) => (
                            <span key={snapshot.id} className={statusPillClassName('neutral')}>
                              {snapshot.title}
                            </span>
                          ))
                        : (idea.vaultItemIds ?? []).map((vaultId) => (
                            <span key={vaultId} className={statusPillClassName('neutral')}>
                              {vaultItemLabels[vaultId] ?? `Vault ${vaultId.slice(0, 8)}…`}
                            </span>
                          ))}
                    </>
                  ) : undefined
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
