import { Loader2, Sparkles } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';
import type {
  BrandPlatform,
  BrandProfile,
  ContentIdea,
  ContentIdeaGenerationContextStats,
} from '@/types/api/personal-branding.dto';
import { BRAND_PLATFORM_LABELS, CONTENT_TYPE_LABELS } from '@/types/api/personal-branding.dto';
import {
  PageCard,
  emptyStateCardClassName,
  gridItemCardClassName,
} from '../PersonalBrandingPageTemplate';
import { cn } from '@/lib/utils';
import { isBrandProfileReadyForIdeation } from './content-workbench-helpers';
import { ContentIdeaWhyCreateSection } from './ContentIdeaWhyCreateSection';

const ALL_PLATFORMS = Object.keys(BRAND_PLATFORM_LABELS) as BrandPlatform[];

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
  isGenerating: boolean;
  generateError: string | null;
  lastGenerationStats: ContentIdeaGenerationContextStats | null;
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
  isGenerating,
  generateError,
  lastGenerationStats,
  onGenerate,
  onApprove,
  onReject,
}: IdeationEngineTabProps) {
  const selectedProfile = profiles.find((p) => p.id === selectedProfileId) ?? null;
  const profileReady = selectedProfile ? isBrandProfileReadyForIdeation(selectedProfile) : false;
  const canGenerate = Boolean(selectedProfileId && profileReady && !isGenerating);

  return (
    <div className="space-y-6">
      <PageCard className="space-y-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Generate ideas</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Uses your Brand Identity pillars, audience, and platform rules. Rejected ideas inform
            future runs.
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

        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Seed ideas <span className="font-normal text-gray-500">(optional)</span>
          </span>
          <Textarea
            value={seedIdeas}
            onChange={(e) => onSeedIdeasChange(e.target.value)}
            rows={3}
            placeholder="Topics, angles, or themes you want the brainstorm to explore…"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
        </label>

        {selectedProfile && !profileReady ? (
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Selected profile needs at least one pillar and a target audience in Brand Identity.
          </p>
        ) : null}

        {generateError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{generateError}</p>
        ) : null}

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
              Generate ideas
            </>
          )}
        </Button>
      </PageCard>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Candidate content ideas
        </h2>

        {lastGenerationStats && lastGenerationStats.referencedPublishedCount > 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Referenced {lastGenerationStats.referencedPublishedCount} past published post
            {lastGenerationStats.referencedPublishedCount === 1 ? '' : 's'} for style and voice.
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
              No candidate ideas yet. Use Generate ideas above, or wait for Radar / other sources.
            </p>
          </PageCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {ideas.map((idea) => (
              <article key={idea.id} className={cn(gridItemCardClassName, 'flex flex-col')}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{idea.title}</h3>
                  <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
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
                  ) : (
                    <span>{idea.sourceType.replace(/_/g, ' ')}</span>
                  )}
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
                    variant="secondary"
                    onClick={() => onReject(idea)}
                    className="border-red-300 text-red-700 hover:border-red-400 hover:bg-red-50 hover:text-red-800 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"
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
