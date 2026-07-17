import { AlertCircle, FileText, Loader2, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/atoms/Button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { selectableChipClassName } from '../personal-branding-ui';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';
import { ROUTES } from '@/routes';
import {
  BRAND_PLATFORM_LABELS,
  CONTENT_VARIANT_DISTRIBUTION_STATUS_LABELS,
  type ContentVariantDistributionStatus,
} from '@/types/api/personal-branding.dto';
import { PageCard, gridItemCardClassName } from '../PersonalBrandingPageTemplate';
import { useContentPipeline } from './useContentPipeline';

type ContentPipelineState = ReturnType<typeof useContentPipeline>;

interface PlatformRepurposerTabProps {
  pipeline: ContentPipelineState;
}

export default function PlatformRepurposerTab({ pipeline }: PlatformRepurposerTabProps) {
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();

  const isMissingContent = pipeline.publishedNodes.length === 0;
  const isMissingProfile = pipeline.profiles.length === 0;

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

  return (
    <div className="space-y-6">
      <ToastContainer />
      <PageCard>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Platform Repurposer</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Select published workbench content, choose a brand profile, and generate native platform
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
              <div className="block text-sm">
                <label className="font-medium text-gray-700 dark:text-gray-300">
                  Source content <span className="text-red-500">*</span>
                </label>
                <Select
                  required
                  value={pipeline.selectedContentId ?? ''}
                  onChange={(e) => pipeline.setSelectedContentId(e.target.value || null)}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-950"
                >
                  {pipeline.publishedNodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.title}
                    </option>
                  ))}
                </Select>
                {pipeline.sourcePlatform ? (
                  <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-400">
                    Originally published on{' '}
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {BRAND_PLATFORM_LABELS[pipeline.sourcePlatform]}
                    </span>
                  </p>
                ) : null}
              </div>

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
                  const isSourcePlatform = platform === pipeline.sourcePlatform;
                  return (
                    <button
                      key={platform}
                      type="button"
                      disabled={isSourcePlatform}
                      title={isSourcePlatform ? 'Same as source platform' : undefined}
                      onClick={() => pipeline.togglePlatform(platform)}
                      className={cn(
                        selectableChipClassName(
                          selected,
                          'rounded-full px-3 py-1.5',
                          isSourcePlatform
                        )
                      )}
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

            {pipeline.visibleJobs.length > 0 ? (
              <div className="mt-4 space-y-2">
                {pipeline.visibleJobs.map((job) => {
                  const isInFlight = job.status === 'queued' || job.status === 'running';
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
                      </div>
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
                    {(variant.referencedContentIds?.length ?? 0) > 0
                      ? ` · Referenced ${variant.referencedContentIds!.length} past post${
                          variant.referencedContentIds!.length === 1 ? '' : 's'
                        }`
                      : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {variant.status !== 'rejected' ? (
                    <label className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="sr-only">Distribution status for {variant.title}</span>
                      <Select
                        value={variant.distributionStatus}
                        disabled={
                          pipeline.updateDistributionStatusMutation.isPending &&
                          pipeline.updateDistributionStatusMutation.variables?.variantId ===
                            variant.id
                        }
                        onChange={(e) =>
                          handleDistributionStatusChange(
                            variant.id,
                            e.target.value as ContentVariantDistributionStatus
                          )
                        }
                        className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-950"
                        aria-label={`Distribution status for ${BRAND_PLATFORM_LABELS[variant.platform]}`}
                      >
                        {(
                          Object.keys(
                            CONTENT_VARIANT_DISTRIBUTION_STATUS_LABELS
                          ) as ContentVariantDistributionStatus[]
                        ).map((status) => (
                          <option key={status} value={status}>
                            {CONTENT_VARIANT_DISTRIBUTION_STATUS_LABELS[status]}
                          </option>
                        ))}
                      </Select>
                    </label>
                  ) : null}
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
                      disabled={
                        pipeline.regeneratePlatformMutation.isPending ||
                        pipeline.inFlightJobs.some((job) => job.platform === variant.platform)
                      }
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
