import { type ReactNode } from 'react';
import { Loader2, PanelsTopLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '@/components/atoms/Button';
import { ClampedExpandableText } from '@/components/molecules/personal-branding/ClampedExpandableText';
import { ContentIdeaTagChips } from '@/components/molecules/personal-branding/ContentIdeaTagChips';
import { ContentIdeaGroundedPillars } from '@/components/molecules/personal-branding/ContentIdeaGroundedPillars';
import { ContentIdeaWhyCreateSection } from '@/components/molecules/personal-branding/ContentIdeaWhyCreateSection';
import {
  GENERATE_DRAFT_CTA_HINT,
  GENERATE_DRAFT_CTA_LABEL,
} from '@/pages/admin/personal-branding/content-workbench/content-workbench-helpers';
import {
  contentTypePillClassName,
  statusPillClassName,
} from '@/pages/admin/personal-branding/personal-branding-ui';
import {
  contentIdeaUsedCardClassName,
  gridItemCardClassName,
  IDEA_CARD_SUMMARY_LINES,
  IDEA_CARD_TITLE_LINES,
} from '@/lib/personal-branding/personal-branding-surfaces';
import { ROUTES } from '@/routes';
import type { BrandPlatform, ContentIdea } from '@/types/api/personal-branding.dto';
import { BRAND_PLATFORM_LABELS, CONTENT_TYPE_LABELS } from '@/types/api/personal-branding.dto';
import { cn } from '@/lib/utils';

function weeklyReviewQuickWinTaskHref(taskId: string): string {
  return `${ROUTES.admin.tasks}?taskId=${encodeURIComponent(taskId)}`;
}

export interface ContentIdeaCardProps {
  idea: ContentIdea;
  isApproving: boolean;
  onApprove: (idea: ContentIdea) => void;
  onReject: (idea: ContentIdea) => void;
  onOpenDraft?: (idea: ContentIdea) => void;
  metaExtras?: ReactNode;
  sourceFallbackLabel?: string;
}

export default function ContentIdeaCard({
  idea,
  isApproving,
  onApprove,
  onReject,
  onOpenDraft,
  metaExtras,
  sourceFallbackLabel,
}: ContentIdeaCardProps) {
  const isUsed = idea.status === 'DRAFTED';
  const showMetaRow =
    Boolean(idea.targetPlatform) ||
    Boolean(sourceFallbackLabel) ||
    idea.sourceType === 'WEEKLY_REVIEW_QUICK_WIN' ||
    metaExtras != null;

  return (
    <article
      className={cn(
        'group flex flex-col',
        isUsed ? contentIdeaUsedCardClassName : gridItemCardClassName
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <ClampedExpandableText
          as="h3"
          lines={IDEA_CARD_TITLE_LINES}
          className="min-w-0 flex-1 font-semibold text-gray-900 dark:text-white"
        >
          {idea.title}
        </ClampedExpandableText>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          {isUsed ? <span className={statusPillClassName('warning')}>Draft generated</span> : null}
          <span className={contentTypePillClassName()}>
            {CONTENT_TYPE_LABELS[idea.contentType]}
          </span>
        </div>
      </div>

      {idea.summary ? (
        <ClampedExpandableText
          lines={IDEA_CARD_SUMMARY_LINES}
          className="mt-2 text-sm text-gray-600 dark:text-gray-400"
        >
          {idea.summary}
        </ClampedExpandableText>
      ) : null}

      {idea.rationale ? <ContentIdeaWhyCreateSection rationale={idea.rationale} /> : null}

      <ContentIdeaGroundedPillars matchedPillars={idea.matchedPillars ?? []} />

      {showMetaRow ? (
        <div className="mt-3 flex min-w-0 flex-wrap items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
          {idea.targetPlatform ? (
            <span className="shrink-0">
              {BRAND_PLATFORM_LABELS[idea.targetPlatform as BrandPlatform]}
            </span>
          ) : sourceFallbackLabel ? (
            <span className="shrink-0">{sourceFallbackLabel}</span>
          ) : null}
          {idea.sourceType === 'WEEKLY_REVIEW_QUICK_WIN' && idea.sourceRefId ? (
            <Link
              to={weeklyReviewQuickWinTaskHref(idea.sourceRefId)}
              className="underline decoration-dotted underline-offset-2 hover:text-gray-700 dark:hover:text-gray-200"
            >
              View source task
            </Link>
          ) : null}
          {metaExtras}
        </div>
      ) : null}

      {idea.tags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
          <ContentIdeaTagChips tags={idea.tags} />
        </div>
      ) : null}

      <div className="mt-auto mt-4 flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => onApprove(idea)}
            disabled={isApproving}
            className="flex-1"
            title={!isUsed && !isApproving ? GENERATE_DRAFT_CTA_HINT : undefined}
            aria-label={!isUsed && !isApproving ? GENERATE_DRAFT_CTA_HINT : undefined}
          >
            {isApproving ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Generating…
              </span>
            ) : isUsed ? (
              'Generate another draft'
            ) : (
              <span className="inline-flex items-center justify-center gap-2">
                {GENERATE_DRAFT_CTA_LABEL}
                <PanelsTopLeft size={14} aria-hidden />
              </span>
            )}
          </Button>
          {!isUsed ? (
            <Button type="button" size="sm" variant="destructive" onClick={() => onReject(idea)}>
              Reject
            </Button>
          ) : null}
        </div>
        {isUsed && idea.draftNodeId && onOpenDraft ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="w-full text-gray-700 dark:text-gray-300"
            onClick={() => onOpenDraft(idea)}
          >
            Open existing draft
          </Button>
        ) : null}
      </div>
    </article>
  );
}
