import { Loader2, Sparkles } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { Select } from '@/components/atoms/Select';
import { MultiSelectVaultCombobox } from '@/components/molecules/MultiSelectVaultCombobox';
import type {
  BrandPlatform,
  BrandProfile,
  ContentIdea,
  ContentIdeaGenerationContextStats,
  ContentIdeationJob,
} from '@/types/api/personal-branding.dto';
import { BRAND_PLATFORM_LABELS, CONTENT_TYPE_LABELS } from '@/types/api/personal-branding.dto';
import ContentIdeationProgressPanel from '@/components/molecules/personal-branding/ContentIdeationProgressPanel';
import {
  emptyStateCardClassName,
  gridItemCardClassName,
} from '@/lib/personal-branding/personal-branding-surfaces';
import { PageCard } from '../PersonalBrandingPageTemplate';
import { cn } from '@/lib/utils';
import { isBrandProfileReadyForIdeation } from './content-workbench-helpers';
import { ContentIdeaWhyCreateSection } from './ContentIdeaWhyCreateSection';

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
  vaultItemLabels: Record<string, string>;
  onVaultItemLabelsChange: (labels: Record<string, string>) => void;
  isGenerating: boolean;
  vaultJob?: ContentIdeationJob | null;
  generateError: string | null;
  lastGenerationStats: ContentIdeaGenerationContextStats | null;
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
  vaultItemLabels,
  onVaultItemLabelsChange,
  isGenerating,
  vaultJob,
  generateError,
  lastGenerationStats,
  onGenerate,
  onApprove,
  onReject,
}: VaultExtractorTabProps) {
  const selectedProfile = profiles.find((p) => p.id === selectedProfileId) ?? null;
  const profileReady = selectedProfile ? isBrandProfileReadyForIdeation(selectedProfile) : false;
  const canGenerate = Boolean(
    selectedProfileId && profileReady && selectedVaultItemIds.length > 0 && !isGenerating
  );

  return (
    <div className="space-y-6">
      <PageCard className="space-y-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Extract ideas from Knowledge Vault
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Select vault notes or documents, combine them with your Brand Identity, and generate
            on-brand content ideas. Rejected ideas inform future runs.
          </p>
        </div>

        {profilesLoading ? (
          <p className="text-sm text-gray-500">Loading brand profiles…</p>
        ) : profiles.length === 0 ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
            Create a Brand Identity profile with core pillars and a target audience before
            generating ideas.
          </p>
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
          />
        </div>

        {selectedProfile && !profileReady ? (
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Selected profile needs at least one pillar and a target audience in Brand Identity.
          </p>
        ) : null}

        {generateError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{generateError}</p>
        ) : null}

        <ContentIdeationProgressPanel job={vaultJob} />

        <Button
          type="button"
          size="sm"
          onClick={onGenerate}
          disabled={!canGenerate}
          className="inline-flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate ideas from vault
            </>
          )}
        </Button>
      </PageCard>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Vault-sourced content ideas
        </h2>

        {lastGenerationStats ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Generated {lastGenerationStats.existingGeneratedCount > 0 ? 'new ' : ''}ideas using{' '}
            {selectedVaultItemIds.length} vault source
            {selectedVaultItemIds.length === 1 ? '' : 's'}
            {lastGenerationStats.rejectedFeedbackCount > 0
              ? ` (${lastGenerationStats.rejectedFeedbackCount} prior rejection${
                  lastGenerationStats.rejectedFeedbackCount === 1 ? '' : 's'
                } applied as hard negatives)`
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
          <PageCard className={cn(emptyStateCardClassName, 'p-10')}>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No vault-sourced ideas yet. Select Knowledge Vault items above and generate ideas.
            </p>
          </PageCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {ideas.map((idea) => (
              <article key={idea.id} className={cn(gridItemCardClassName, 'flex flex-col')}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{idea.title}</h3>
                  <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-900/40 dark:text-violet-200">
                    {CONTENT_TYPE_LABELS[idea.contentType]}
                  </span>
                </div>
                {idea.summary ? (
                  <p className="mt-2 flex-1 text-sm text-gray-600 dark:text-gray-400">
                    {idea.summary}
                  </p>
                ) : null}
                {idea.rationale ? <ContentIdeaWhyCreateSection rationale={idea.rationale} /> : null}
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                  {idea.targetPlatform ? (
                    <span>{BRAND_PLATFORM_LABELS[idea.targetPlatform]}</span>
                  ) : null}
                  {(idea.vaultItemIds ?? []).map((vaultId) => (
                    <span
                      key={vaultId}
                      className="rounded bg-violet-50 px-2 py-0.5 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200"
                    >
                      {vaultItemLabels[vaultId] ?? `Vault ${vaultId.slice(0, 8)}…`}
                    </span>
                  ))}
                  {idea.tags.map((tag) => (
                    <span key={tag} className="rounded bg-gray-100 px-2 py-0.5 dark:bg-gray-800">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onApprove(idea)}
                    disabled={approvingId === idea.id}
                    className="flex-1"
                  >
                    {approvingId === idea.id ? 'Generating…' : 'Generate draft & open in Sandbox'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => onReject(idea)}
                  >
                    Reject
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
