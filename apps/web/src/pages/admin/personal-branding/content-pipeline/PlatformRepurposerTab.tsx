import { AlertCircle, FileText, Loader2, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/atoms/Button';
import { cn } from '@/lib/utils';
import { selectableChipClassName } from '../personal-branding-ui';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';
import { ROUTES } from '@/routes';
import { BRAND_PLATFORM_LABELS } from '@/types/api/personal-branding.dto';
import { PageCard, gridItemCardClassName } from '../PersonalBrandingPageTemplate';
import { useContentPipeline } from './useContentPipeline';

type ContentPipelineState = ReturnType<typeof useContentPipeline>;

interface PlatformRepurposerTabProps {
  pipeline: ContentPipelineState;
}

export default function PlatformRepurposerTab({ pipeline }: PlatformRepurposerTabProps) {
  const navigate = useNavigate();

  const isMissingContent = pipeline.finalizedNodes.length === 0;
  const isMissingProfile = pipeline.profiles.length === 0;

  const goToWorkbench = () => navigate(`${ROUTES.admin.personalBrandingWorkbench}?tab=sandbox`);
  const goToBrandIdentity = () => navigate(ROUTES.admin.personalBrandingBrandIdentity);

  return (
    <div className="space-y-6">
      <PageCard>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Platform Repurposer</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Select finalized workbench content, choose a brand profile, and generate native platform
          variants.
        </p>

        {isMissingContent && isMissingProfile ? (
          <EmptyState
            icon={AlertCircle}
            title="Action required"
            description="Platform Repurposer needs published workbench content and a brand identity profile before you can generate variants."
            actionLabel="Go to Content Workbench"
            onAction={goToWorkbench}
            secondaryActionLabel="Create brand profile"
            onSecondaryAction={goToBrandIdentity}
            className="mt-6"
          />
        ) : isMissingContent ? (
          <EmptyState
            icon={FileText}
            title="No published content yet"
            description="Finalize content in the Content Workbench by marking a draft as published. Published pieces appear here as source content."
            actionLabel="Go to Content Workbench"
            onAction={goToWorkbench}
            className="mt-6"
          />
        ) : isMissingProfile ? (
          <EmptyState
            icon={UserCircle}
            title="Brand identity profile required"
            description="Create a brand profile in Brand Identity so repurposed variants match your voice, tone, and platform rules."
            actionLabel="Go to Brand Identity"
            onAction={goToBrandIdentity}
            className="mt-6"
          />
        ) : (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Source content <span className="text-red-500">*</span>
                </span>
                <Select
                  required
                  value={pipeline.selectedContentId ?? ''}
                  onChange={(e) => pipeline.setSelectedContentId(e.target.value || null)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950"
                >
                  {pipeline.finalizedNodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.title}
                    </option>
                  ))}
                </Select>
              </label>

              <label className="block text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Brand identity profile <span className="text-red-500">*</span>
                </span>
                <Select
                  required
                  value={pipeline.selectedProfileId}
                  onChange={(e) => pipeline.setSelectedProfileId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950"
                >
                  {pipeline.profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </Select>
              </label>
            </div>

            <fieldset className="mt-4">
              <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Target platforms
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {pipeline.allPlatforms.map((platform) => {
                  const selected = pipeline.targetPlatforms.includes(platform);
                  return (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => pipeline.togglePlatform(platform)}
                      className={cn(selectableChipClassName(selected), 'rounded-full px-3 py-1.5')}
                    >
                      {BRAND_PLATFORM_LABELS[platform]}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {pipeline.selectedContent?.body ? (
              <p className="mt-4 line-clamp-3 text-sm text-gray-600 dark:text-gray-400">
                {pipeline.selectedContent.body}
              </p>
            ) : null}

            <Button
              type="button"
              size="sm"
              disabled={!pipeline.canStart}
              onClick={() => pipeline.startRepurposeMutation.mutate()}
              className="mt-6 inline-flex items-center gap-2"
            >
              {pipeline.startRepurposeMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : null}
              Generate variants
            </Button>

            {pipeline.activeJob ? (
              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-900/50">
                <div className="font-medium text-gray-900 dark:text-white">
                  Job {pipeline.activeJob.status}
                </div>
                {pipeline.activeJob.message ? (
                  <p className="mt-1 text-gray-600 dark:text-gray-400">
                    {pipeline.activeJob.message}
                  </p>
                ) : null}
                {pipeline.activeJob.error ? (
                  <p className="mt-1 text-red-600 dark:text-red-400">{pipeline.activeJob.error}</p>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </PageCard>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Generated variants</h3>
        {pipeline.variants.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No variants yet.</p>
        ) : (
          pipeline.variants.map((variant) => (
            <article key={variant.id} className={gridItemCardClassName}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-blue-600 dark:text-blue-400">
                    {BRAND_PLATFORM_LABELS[variant.platform]}
                  </div>
                  <h4 className="mt-1 font-medium text-gray-900 dark:text-white">
                    {variant.title}
                  </h4>
                  <p className="mt-1 text-xs text-gray-500">
                    {variant.characterCount}
                    {variant.characterLimit ? ` / ${variant.characterLimit}` : ''} chars ·{' '}
                    {variant.status}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => pipeline.sendToSandboxMutation.mutate(variant.id)}
                    disabled={pipeline.sendToSandboxMutation.isPending}
                  >
                    Send to Sandbox
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => pipeline.setRejectingVariantId(variant.id)}
                    className="border-red-300 text-red-700 hover:border-red-400 hover:bg-red-50 hover:text-red-800 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"
                  >
                    Reject
                  </Button>
                  {variant.status === 'rejected' ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => pipeline.regeneratePlatformMutation.mutate(variant.platform)}
                      disabled={pipeline.regeneratePlatformMutation.isPending}
                    >
                      Regenerate
                    </Button>
                  ) : null}
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                {variant.body}
              </p>
              {variant.critiqueHistory.length > 0 ? (
                <ul className="mt-3 space-y-1 text-xs text-gray-500">
                  {variant.critiqueHistory.map((entry, idx) => (
                    <li key={`${entry.createdAt}-${idx}`}>Critique: {entry.critique}</li>
                  ))}
                </ul>
              ) : null}

              {pipeline.rejectingVariantId === variant.id ? (
                <div className="mt-4 space-y-2 rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-900 dark:bg-red-950/20">
                  <Textarea
                    value={pipeline.rejectCritique}
                    onChange={(e) => pipeline.setRejectCritique(e.target.value)}
                    placeholder="What fell flat? Hook, tone, length, structure…"
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={
                        !pipeline.rejectCritique.trim() || pipeline.rejectVariantMutation.isPending
                      }
                      onClick={() =>
                        pipeline.rejectVariantMutation.mutate({
                          variantId: variant.id,
                          critique: pipeline.rejectCritique.trim(),
                        })
                      }
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Submit rejection
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        pipeline.setRejectingVariantId(null);
                        pipeline.setRejectCritique('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
