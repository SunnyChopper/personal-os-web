import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BrandPlatformChip } from '@/components/molecules/personal-branding/BrandPlatformChip';
import Button from '@/components/atoms/Button';
import { FormCheckbox } from '@/components/atoms/FormCheckbox';
import { Select } from '@/components/atoms/Select';
import { Textarea } from '@/components/atoms/Textarea';
import MarkdownEditor from '@/components/molecules/MarkdownEditor';
import MarkdownRenderer from '@/components/molecules/MarkdownRenderer';
import { PublishScheduleQuickEditor } from '@/components/molecules/personal-branding/PublishScheduleQuickEditor';
import { ExpandablePlainTextPreview } from '@/components/molecules/personal-branding/ExpandablePlainTextPreview';
import { VariantCardSummaryActions } from '@/components/molecules/personal-branding/VariantCardSummaryActions';
import { VariantImprovementSuggestionsPanel } from '@/components/molecules/personal-branding/VariantImprovementSuggestionsPanel';
import { VariantPerformanceStrip } from '@/components/molecules/personal-branding/VariantPerformanceStrip';
import { ROUTES } from '@/routes';
import { cn } from '@/lib/utils';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import {
  BRAND_PLATFORM_LABELS,
  CONTENT_VARIANT_DISTRIBUTION_STATUS_LABELS,
  type ContentStatus,
  type ContentVariant,
  type ContentVariantDistributionStatus,
  type UpdateVariantDistributionStatusInput,
} from '@/types/api/personal-branding.dto';
import { contentTextStats } from '../content-workbench/content-workbench-helpers';
import {
  pbBodySecondaryClassName,
  pbCardTitleClassName,
  pbMetaClassName,
} from '../personal-branding-ui';
import {
  gridItemCardClassName,
  gridItemCardFocusWithinClassName,
  gridItemCardInteractiveClassName,
  gridItemCardSelectedClassName,
} from '@/lib/personal-branding/personal-branding-surfaces';
import { variantFormatHelperCopy } from './variant-format-helper';
import {
  formatToneMatchPercent,
  hasPerformanceSnapshot,
  variantCopyText,
} from './variant-card-helpers';
import { variantInWorkbench, variantWorkbenchDraftId } from './variant-workbench-helpers';
import { VariantDistributionTrackingForm } from './VariantDistributionTrackingForm';
import { PerformanceFeedbackPanel } from './PerformanceFeedbackPanel';
import { useVariantImprovementSuggestions } from './useVariantImprovementSuggestions';
import VariantVersionHistory from './VariantVersionHistory';
import type { VariantImprovementSuggestion } from '@/types/api/personal-branding.dto';
import type { useContentPipeline } from './useContentPipeline';

type ContentPipelineState = ReturnType<typeof useContentPipeline>;

function workbenchStatusLabel(status: ContentStatus): string {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'PUBLISHED':
      return 'Published';
    case 'FINALIZED':
      return 'Finalized';
    case 'PIPELINED':
      return 'Pipelined';
    case 'SKIPPED':
      return 'Skipped';
    default:
      return status;
  }
}

interface VariantActiveCardProps {
  variant: ContentVariant;
  pipeline: ContentPipelineState;
  onSchedulePublish: (variantId: string, scheduledPublishAt: string) => Promise<void>;
  onAddToQueue: (variantId: string) => void;
  onDistributionStatusChange: (
    variantId: string,
    distributionStatus: ContentVariantDistributionStatus
  ) => void;
  onDistributionTrackingSave: (
    variantId: string,
    body: UpdateVariantDistributionStatusInput
  ) => void;
  onError: (title: string, error: unknown) => void;
  onSuccess: (title: string, message?: string) => void;
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  selectionDisabled?: boolean;
}

export function VariantActiveCard({
  variant,
  pipeline,
  onSchedulePublish,
  onAddToQueue,
  onDistributionStatusChange,
  onDistributionTrackingSave,
  onError,
  onSuccess,
  selected = false,
  onSelectedChange,
  selectionDisabled = false,
}: VariantActiveCardProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(variant.title);
  const [draftBody, setDraftBody] = useState(variant.body);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [comparingVersionId, setComparingVersionId] = useState<string | null>(null);
  const [applyingSuggestionId, setApplyingSuggestionId] = useState<string | null>(null);
  const improvementSuggestions = useVariantImprovementSuggestions(variant.id);

  useEffect(() => {
    setDraftTitle(variant.title);
    setDraftBody(variant.body);
  }, [variant.id, variant.title, variant.body]);

  const isDirty = draftTitle !== variant.title || draftBody !== variant.body;
  const isRejected = variant.status === 'rejected';
  const isReady = variant.distributionStatus === 'READY';
  const isRegenerateDisabled = pipeline.inFlightJobs.some(
    (job) => job.platform === variant.platform
  );

  const versionsQ = useQuery({
    queryKey: queryKeys.personalBranding.content.variantVersions(variant.id),
    queryFn: () => personalBrandingService.listVariantVersions(variant.id),
    enabled: historyOpen,
  });

  const workbenchDraftId = variantWorkbenchDraftId(variant);
  const inWorkbench = variantInWorkbench(variant);
  const workbenchStatus = variant.sandboxContent?.status;
  const formatHelper = useMemo(() => variantFormatHelperCopy(variant.platform), [variant.platform]);

  const summaryMetaLine = useMemo(() => {
    const wordCount = contentTextStats(variant.body).wordCount;
    const parts = [
      `${wordCount} word${wordCount === 1 ? '' : 's'}`,
      `Tone match ${formatToneMatchPercent(variant.confidence)}`,
      `${variant.characterCount}${variant.characterLimit ? ` / ${variant.characterLimit}` : ''} chars`,
      variant.status,
    ];
    if (variant.generationAttempt > 1) parts.push(`attempt ${variant.generationAttempt}`);
    if ((variant.referencedContentIds?.length ?? 0) > 0) {
      parts.push(
        `Referenced ${variant.referencedContentIds!.length} past post${
          variant.referencedContentIds!.length === 1 ? '' : 's'
        }`
      );
    }
    return parts.join(' · ');
  }, [variant]);

  const confirmDiscardDirty = (): boolean => {
    if (!isDirty) return true;
    return window.confirm('Discard unsaved title/body edits?');
  };

  const handleDoneEditing = () => {
    if (!confirmDiscardDirty()) return;
    setIsEditing(false);
  };

  const handleCopy = async () => {
    const text = variantCopyText(variant.title, variant.body);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      onSuccess('Copied', 'Variant copied to clipboard.');
    } catch (error) {
      onError("Couldn't copy", error);
    }
  };

  const handleRegenerateWithTweaks = () => {
    if (!confirmDiscardDirty()) return;
    pipeline.setTweakingVariantId(variant.id);
  };

  const handleSuggestImprovements = () => {
    if (!confirmDiscardDirty()) return;
    improvementSuggestions.suggestMutation.mutate(undefined, {
      onError: (error) => onError("Couldn't get suggestions", error),
    });
  };

  const handleApplyImprovement = async (suggestion: VariantImprovementSuggestion) => {
    if (!confirmDiscardDirty()) return;
    setApplyingSuggestionId(suggestion.id);
    try {
      await pipeline.regenerateWithTweaksMutation.mutateAsync({
        variantId: variant.id,
        body: { tweakInstructions: suggestion.tweakInstructions },
      });
      improvementSuggestions.dismiss();
      onSuccess('Regenerating', `Applying “${suggestion.label}”…`);
    } catch (error) {
      onError("Couldn't apply improvement", error);
    } finally {
      setApplyingSuggestionId(null);
    }
  };

  const handleRegeneratePlatform = () => {
    if (!confirmDiscardDirty()) return;
    pipeline.regeneratePlatformMutation.mutate(variant.platform);
  };

  const handleSaveVersion = async () => {
    try {
      await pipeline.saveVariantVersionMutation.mutateAsync({
        variantId: variant.id,
        title: draftTitle.trim(),
        body: draftBody.trim(),
      });
      onSuccess('Version saved', 'Your manual edit is now in the version history.');
      setIsEditing(false);
    } catch (error) {
      onError("Couldn't save version", error);
    }
  };

  const handleActivate = async (versionId: string) => {
    if (!confirmDiscardDirty()) return;
    try {
      await pipeline.activateVariantVersionMutation.mutateAsync(versionId);
      onSuccess('Version activated', 'Rolled back to the selected version.');
      setComparingVersionId(null);
    } catch (error) {
      onError("Couldn't activate version", error);
    }
  };

  const isDistributionUpdating =
    pipeline.updateDistributionStatusMutation.isPending &&
    pipeline.updateDistributionStatusMutation.variables?.variantId === variant.id;

  return (
    <article
      className={cn(
        gridItemCardClassName,
        gridItemCardInteractiveClassName,
        gridItemCardFocusWithinClassName,
        selected && gridItemCardSelectedClassName,
        isRejected && 'border-red-200 dark:border-red-900/60'
      )}
    >
      {!isEditing ? (
        <>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                {onSelectedChange ? (
                  <label className="flex items-center">
                    <span className="sr-only">
                      Select {BRAND_PLATFORM_LABELS[variant.platform]} variant
                    </span>
                    <FormCheckbox
                      checked={selected}
                      disabled={selectionDisabled}
                      onChange={(event) => onSelectedChange(event.target.checked)}
                    />
                  </label>
                ) : null}
                <BrandPlatformChip platform={variant.platform} />
              </div>
              <h4 className={cn('truncate', pbCardTitleClassName)}>
                {variant.title || 'Untitled variant'}
              </h4>
              {variant.body.trim() ? (
                <ExpandablePlainTextPreview
                  text={variant.body}
                  className={pbBodySecondaryClassName}
                />
              ) : (
                <p className={cn('italic', pbBodySecondaryClassName)}>No body yet</p>
              )}
              <p className={pbMetaClassName}>{summaryMetaLine}</p>
              {inWorkbench ? (
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  In Content Workbench
                  {workbenchStatus ? ` · ${workbenchStatusLabel(workbenchStatus)}` : ''}
                </p>
              ) : null}
              {!isRejected && hasPerformanceSnapshot(variant.engagement) && variant.engagement ? (
                <VariantPerformanceStrip engagement={variant.engagement} />
              ) : null}
            </div>
          </div>

          <VariantCardSummaryActions
            isRejected={isRejected}
            isReady={isReady}
            isDistributionUpdating={isDistributionUpdating}
            inWorkbench={Boolean(inWorkbench && workbenchDraftId)}
            sendToSandboxPending={pipeline.sendToSandboxMutation.isPending}
            regeneratePending={pipeline.regeneratePlatformMutation.isPending}
            regenerateDisabled={isRegenerateDisabled}
            suggestImprovementsPending={improvementSuggestions.suggestMutation.isPending}
            suggestImprovementsDisabled={isRegenerateDisabled}
            onSuggestImprovements={handleSuggestImprovements}
            onEdit={() => setIsEditing(true)}
            onOpenWorkbench={() =>
              navigate(
                `${ROUTES.admin.personalBrandingWorkbench}?tab=sandbox&contentId=${encodeURIComponent(workbenchDraftId!)}`
              )
            }
            onPushToWorkbench={() => pipeline.sendToSandboxMutation.mutate(variant.id)}
            onMarkReady={() => onDistributionStatusChange(variant.id, 'READY')}
            onCopy={() => void handleCopy()}
            onReject={() => pipeline.setRejectingVariantId(variant.id)}
            onRegenerate={handleRegeneratePlatform}
          />
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {onSelectedChange ? (
                <label className="flex items-center">
                  <span className="sr-only">
                    Select {BRAND_PLATFORM_LABELS[variant.platform]} variant
                  </span>
                  <FormCheckbox
                    checked={selected}
                    disabled={selectionDisabled}
                    onChange={(event) => onSelectedChange(event.target.checked)}
                  />
                </label>
              ) : null}
              <BrandPlatformChip platform={variant.platform} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={handleDoneEditing}>
                Done
              </Button>
              {!isRejected ? (
                <>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!isDirty || pipeline.saveVariantVersionMutation.isPending}
                    onClick={() => void handleSaveVersion()}
                  >
                    {pipeline.saveVariantVersionMutation.isPending ? 'Saving…' : 'Save version'}
                  </Button>
                  {isDirty ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setDraftTitle(variant.title);
                        setDraftBody(variant.body);
                      }}
                    >
                      Discard
                    </Button>
                  ) : null}
                  <label className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="sr-only">Distribution status for {variant.title}</span>
                    <Select
                      value={variant.distributionStatus}
                      disabled={isDistributionUpdating}
                      onChange={(e) =>
                        onDistributionStatusChange(
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
                  {variant.distributionStatus !== 'SCHEDULED' ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={isDistributionUpdating}
                        onClick={() => onAddToQueue(variant.id)}
                      >
                        Add to queue
                      </Button>
                      <PublishScheduleQuickEditor
                        scheduledPublishAt={variant.scheduledPublishAt}
                        triggerLabel="Schedule…"
                        isSaving={isDistributionUpdating}
                        onSave={(iso) => onSchedulePublish(variant.id, iso)}
                      />
                    </>
                  ) : null}
                </>
              ) : null}
              {!isRejected ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleSuggestImprovements}
                  disabled={
                    improvementSuggestions.suggestMutation.isPending || isRegenerateDisabled
                  }
                >
                  {improvementSuggestions.suggestMutation.isPending
                    ? 'Suggesting…'
                    : 'Suggest improvements'}
                </Button>
              ) : null}
              {!isRejected ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleRegenerateWithTweaks}
                  disabled={pipeline.regenerateWithTweaksMutation.isPending || isRegenerateDisabled}
                >
                  Regenerate with tweaks
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleRegeneratePlatform}
                  disabled={pipeline.regeneratePlatformMutation.isPending || isRegenerateDisabled}
                >
                  Regenerate
                </Button>
              )}
              {!isRejected ? (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => pipeline.setRejectingVariantId(variant.id)}
                >
                  Reject
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setHistoryOpen((open) => !open)}
              >
                {historyOpen ? 'Hide history' : 'History'}
              </Button>
            </div>
          </div>

          <label className="mt-3 block text-sm">
            <span className="sr-only">Title for {BRAND_PLATFORM_LABELS[variant.platform]}</span>
            <input
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              disabled={isRejected}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-950 dark:text-white"
            />
          </label>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{summaryMetaLine}</p>
          {inWorkbench ? (
            <p className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              In Content Workbench
              {workbenchStatus ? ` · ${workbenchStatusLabel(workbenchStatus)}` : ''}
            </p>
          ) : null}

          {!isRejected ? (
            <VariantDistributionTrackingForm
              variant={variant}
              isSaving={isDistributionUpdating}
              onSave={onDistributionTrackingSave}
            />
          ) : null}

          <PerformanceFeedbackPanel variant={variant} />

          <div className="mt-3 text-sm">
            <span className="sr-only">Body for {BRAND_PLATFORM_LABELS[variant.platform]}</span>
            {formatHelper ? (
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">{formatHelper}</p>
            ) : null}
            {isRejected ? (
              <div
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-950 dark:text-gray-300"
                data-testid="variant-body-readonly"
              >
                <MarkdownRenderer content={variant.body} />
              </div>
            ) : (
              <MarkdownEditor
                value={draftBody}
                onChange={setDraftBody}
                placeholder={`Edit ${BRAND_PLATFORM_LABELS[variant.platform]} body (Markdown supported)`}
                minHeight="280px"
                fullWidth
                enableRichEmbedsToggle={false}
              />
            )}
          </div>

          {historyOpen ? (
            <VariantVersionHistory
              versions={versionsQ.data ?? []}
              isLoading={versionsQ.isPending}
              isActivating={pipeline.activateVariantVersionMutation.isPending}
              isSaving={pipeline.saveVariantVersionMutation.isPending}
              comparingVersionId={comparingVersionId}
              onCompare={setComparingVersionId}
              onActivate={(versionId) => void handleActivate(versionId)}
            />
          ) : null}
        </>
      )}

      {!isRejected && improvementSuggestions.suggestions ? (
        <VariantImprovementSuggestionsPanel
          suggestions={improvementSuggestions.suggestions}
          isApplying={pipeline.regenerateWithTweaksMutation.isPending}
          applyingSuggestionId={applyingSuggestionId}
          onApply={(suggestion) => void handleApplyImprovement(suggestion)}
          onDismiss={improvementSuggestions.dismiss}
        />
      ) : null}

      {variant.critiqueHistory.length > 0 ? (
        <ul className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-400">
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
              disabled={!pipeline.rejectCritique.trim() || pipeline.rejectVariantMutation.isPending}
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
  );
}
