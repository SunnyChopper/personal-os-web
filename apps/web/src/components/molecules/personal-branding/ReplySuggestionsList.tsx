import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import Button from '@/components/atoms/Button';
import RejectWithFeedbackModal from '@/components/molecules/personal-branding/RejectWithFeedbackModal';
import {
  formatMediaBriefForClipboard,
  formatMemeSuggestionForClipboard,
  MEDIA_BRIEF_KIND_LABELS,
} from '@/lib/personal-branding/media-brief';
import { formatSocialCapitalAngleLabel } from '@/lib/personal-branding/social-capital-angle';
import { isConversationStarterLabel } from '@/lib/personal-branding/conversation-starter-label';
import { cn } from '@/lib/utils';
import {
  REPLY_REJECT_CATEGORIES,
  REPLY_REJECT_CATEGORY_LABELS,
  type ReplyRejectionFeedbackCategory,
  type ReplySuggestion,
} from '@/types/api/personal-branding.dto';

const ACCEPT_SUCCESS_DELAY_MS = 650;

const rejectGhostButtonClassName =
  'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100';

export interface ReplySuggestionsListProps {
  suggestions: ReplySuggestion[];
  isUpdating?: boolean;
  onAccept: (suggestion: ReplySuggestion) => void;
  onReject: (
    suggestion: ReplySuggestion,
    feedbackText: string | null,
    feedbackCategory: ReplyRejectionFeedbackCategory
  ) => void;
}

function ReplySuggestionMediaBlocks({ suggestion }: { suggestion: ReplySuggestion }) {
  const { mediaBrief, memeSuggestion } = suggestion;

  if (!mediaBrief && !memeSuggestion) {
    return null;
  }

  return (
    <div className="mt-2 space-y-2">
      {mediaBrief ? (
        <div className="rounded-lg border border-dashed border-sky-300/70 bg-sky-50/60 p-3 text-xs dark:border-sky-800/50 dark:bg-sky-950/20">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-sky-900 dark:text-sky-200">Media brief</p>
            <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sky-900 dark:bg-sky-950/60 dark:text-sky-200">
              {MEDIA_BRIEF_KIND_LABELS[mediaBrief.kind]}
            </span>
          </div>
          <p className="mt-1 text-gray-700 dark:text-gray-300">{mediaBrief.concept}</p>
          <p className="mt-1 text-gray-600 dark:text-gray-400">{mediaBrief.visualBrief}</p>
          {mediaBrief.altText ? (
            <p className="mt-1 text-gray-600 dark:text-gray-400">Alt text: {mediaBrief.altText}</p>
          ) : null}
          {mediaBrief.captionHook ? (
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Caption hook: {mediaBrief.captionHook}
            </p>
          ) : null}
          {mediaBrief.carouselSlides?.length ? (
            <ul className="mt-1 list-inside list-decimal text-gray-600 dark:text-gray-400">
              {mediaBrief.carouselSlides.map((slide) => (
                <li key={slide}>{slide}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      {memeSuggestion ? (
        <div className="rounded-lg border border-dashed border-amber-300/70 bg-amber-50/60 p-3 text-xs dark:border-amber-800/50 dark:bg-amber-950/20">
          <p className="font-medium text-amber-900 dark:text-amber-200">
            Meme idea{memeSuggestion.formatName ? ` — ${memeSuggestion.formatName}` : ''}
          </p>
          <p className="mt-1 text-gray-700 dark:text-gray-300">{memeSuggestion.concept}</p>
          <p className="mt-1 text-gray-600 dark:text-gray-400">{memeSuggestion.visualBrief}</p>
        </div>
      ) : null}
    </div>
  );
}

export default function ReplySuggestionsList({
  suggestions,
  isUpdating = false,
  onAccept,
  onReject,
}: ReplySuggestionsListProps) {
  const [rejecting, setRejecting] = useState<ReplySuggestion | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const acceptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingAcceptRef = useRef<ReplySuggestion | null>(null);
  const prefersReducedMotion = useReducedMotion() ?? false;

  const clearAcceptTimer = useCallback(() => {
    if (acceptTimerRef.current) {
      clearTimeout(acceptTimerRef.current);
      acceptTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearAcceptTimer(), [clearAcceptTimer]);

  const handleAcceptClick = useCallback(
    (suggestion: ReplySuggestion) => {
      if (isUpdating || acceptingId) return;

      setAcceptingId(suggestion.id);
      pendingAcceptRef.current = suggestion;

      const delay = prefersReducedMotion ? 0 : ACCEPT_SUCCESS_DELAY_MS;
      acceptTimerRef.current = setTimeout(() => {
        acceptTimerRef.current = null;
        const pending = pendingAcceptRef.current;
        pendingAcceptRef.current = null;
        setAcceptingId(null);
        if (pending) onAccept(pending);
      }, delay);
    },
    [acceptingId, isUpdating, onAccept, prefersReducedMotion]
  );

  if (!suggestions.length) return null;

  const actionsDisabled = isUpdating || Boolean(acceptingId);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Suggestions</h3>
      {suggestions.map((suggestion) => {
        const isAccepting = acceptingId === suggestion.id;
        const hasMediaBrief = Boolean(suggestion.mediaBrief);
        const hasMemeSuggestion = Boolean(suggestion.memeSuggestion);
        const rejectCategoryLabel =
          suggestion.rejectionFeedbackCategory &&
          suggestion.rejectionFeedbackCategory in REPLY_REJECT_CATEGORY_LABELS
            ? REPLY_REJECT_CATEGORY_LABELS[
                suggestion.rejectionFeedbackCategory as ReplyRejectionFeedbackCategory
              ]
            : (suggestion.rejectionFeedbackCategory ?? null);

        const isConversationStarter = isConversationStarterLabel(suggestion.label);

        return (
          <article
            key={suggestion.id}
            className={cn(
              'rounded-xl border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-900/40',
              !prefersReducedMotion &&
                'transition-transform duration-100 ease-out hover:-translate-y-0.5'
            )}
          >
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                {!isConversationStarter ? (
                  <h4 className="font-medium text-gray-900 dark:text-white">{suggestion.label}</h4>
                ) : null}
                {isConversationStarter ? (
                  <span className="rounded-md bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-800 dark:bg-violet-950/50 dark:text-violet-200">
                    Conversation starter
                  </span>
                ) : null}
              </div>
              <span className="text-xs text-blue-600 dark:text-blue-400">
                {formatSocialCapitalAngleLabel(suggestion.angle)}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
              {suggestion.draftText}
            </p>
            <ReplySuggestionMediaBlocks suggestion={suggestion} />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{suggestion.rationale}</p>
            {suggestion.status === 'SUGGESTED' ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={isAccepting ? 'success' : 'primary'}
                  disabled={actionsDisabled}
                  className="inline-flex items-center gap-1"
                  onClick={() => handleAcceptClick(suggestion)}
                >
                  <Check className="size-4" aria-hidden />
                  {isAccepting ? 'Copied' : 'Accept & copy'}
                </Button>
                {hasMediaBrief ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={actionsDisabled}
                    onClick={() =>
                      navigator.clipboard.writeText(
                        formatMediaBriefForClipboard(suggestion.mediaBrief!)
                      )
                    }
                  >
                    Copy brief
                  </Button>
                ) : null}
                {hasMemeSuggestion ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={actionsDisabled}
                    onClick={() =>
                      navigator.clipboard.writeText(
                        formatMemeSuggestionForClipboard(suggestion.memeSuggestion!)
                      )
                    }
                  >
                    Copy meme
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={actionsDisabled}
                  className={cn('inline-flex items-center gap-1', rejectGhostButtonClassName)}
                  onClick={() => setRejecting(suggestion)}
                >
                  <X className="size-4" aria-hidden />
                  Reject
                </Button>
              </div>
            ) : (
              <p className="mt-2 text-xs uppercase tracking-wide text-gray-500">
                {suggestion.status === 'REJECTED' && rejectCategoryLabel
                  ? `Rejected: ${rejectCategoryLabel}`
                  : suggestion.status}
              </p>
            )}
          </article>
        );
      })}

      <span className="sr-only" aria-live="polite">
        {acceptingId ? 'Copied' : ''}
      </span>

      <RejectWithFeedbackModal
        isOpen={Boolean(rejecting)}
        title="Reject suggestion"
        submitLabel="Reject"
        promptText="What should improve in future reply drafts?"
        categories={REPLY_REJECT_CATEGORIES}
        isSubmitting={isUpdating}
        onClose={() => setRejecting(null)}
        onSubmit={(feedbackText, feedbackCategory) => {
          if (!rejecting || !feedbackCategory) return;
          onReject(rejecting, feedbackText, feedbackCategory as ReplyRejectionFeedbackCategory);
          setRejecting(null);
        }}
      />
    </div>
  );
}
