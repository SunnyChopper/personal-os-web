import { CheckCircle, ExternalLink, MessageSquarePlus, Sparkles } from 'lucide-react';
import Button from '@/components/atoms/Button';
import EngagementRationale from '@/components/molecules/personal-branding/EngagementRationale';
import RecommendedActionBadge from '@/components/molecules/personal-branding/RecommendedActionBadge';
import { ctaLabelForReconPost } from '@/lib/personal-branding/recon-prompter-seed';
import { nextActionCueForRecommendedAction } from '@/lib/personal-branding/recommended-action-display';
import type { ContentOpportunity } from '@/types/api/personal-branding.dto';

function formatAngle(angle?: string | null): string {
  if (!angle?.trim()) return 'Engagement';
  return angle
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export interface SuggestedContentCardProps {
  opportunity: ContentOpportunity;
  onDraftReply: (opportunity: ContentOpportunity) => void;
  onLogCheckIn: (opportunity: ContentOpportunity) => void;
  onComplete: (opportunity: ContentOpportunity) => void;
  onRequestDismiss: (opportunity: ContentOpportunity) => void;
  isCompleting?: boolean;
  isDismissing?: boolean;
  compact?: boolean;
  hideDraftReply?: boolean;
}

export default function SuggestedContentCard({
  opportunity,
  onDraftReply,
  onLogCheckIn,
  onComplete,
  onRequestDismiss,
  isCompleting = false,
  isDismissing = false,
  compact = false,
  hideDraftReply = false,
}: SuggestedContentCardProps) {
  const isBusy = isCompleting || isDismissing;
  const draftLabel = ctaLabelForReconPost({ recommendedAction: opportunity.recommendedAction });
  const nextActionCue = nextActionCueForRecommendedAction(opportunity.recommendedAction);

  return (
    <article
      className={
        compact
          ? 'space-y-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900/40'
          : 'space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700'
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
          {formatAngle(opportunity.socialCapitalAngle)}
        </span>
        <RecommendedActionBadge action={opportunity.recommendedAction} />
      </div>
      {nextActionCue ? (
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{nextActionCue}</p>
      ) : null}
      <p className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-100">
        {opportunity.postText}
      </p>
      <EngagementRationale lead={opportunity.rationale} bullets={opportunity.rationaleBullets} />
      <div className="flex flex-wrap gap-2 pt-1">
        {opportunity.postUrl ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="inline-flex items-center gap-1.5"
            onClick={() => window.open(opportunity.postUrl!, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="size-4" />
            Open on X
          </Button>
        ) : null}
        {!hideDraftReply ? (
          <Button
            type="button"
            size="sm"
            className="inline-flex items-center gap-1.5"
            onClick={() => onDraftReply(opportunity)}
          >
            <Sparkles className="size-4" />
            {draftLabel}
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="inline-flex items-center gap-1.5"
          onClick={() => onLogCheckIn(opportunity)}
        >
          <MessageSquarePlus className="size-4" />
          Log check-in
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={isBusy}
          className="inline-flex items-center gap-1.5"
          onClick={() => onComplete(opportunity)}
        >
          <CheckCircle className="size-4" />
          {isCompleting ? 'Completing…' : 'Mark complete'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={isBusy}
          onClick={() => onRequestDismiss(opportunity)}
        >
          {isDismissing ? 'Dismissing…' : 'Dismiss'}
        </Button>
      </div>
    </article>
  );
}
