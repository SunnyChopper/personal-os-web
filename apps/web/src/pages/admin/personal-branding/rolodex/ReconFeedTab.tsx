import {
  ChevronLeft,
  ChevronRight,
  Check,
  ClipboardPaste,
  MoreHorizontal,
  Sparkles,
  ThumbsUp,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '@/components/atoms/Button';
import { Skeleton } from '@/components/atoms/Skeleton';
import DropdownMenuButton from '@/components/molecules/DropdownMenuButton';
import { EmptyState } from '@/components/molecules/EmptyState';
import FollowSuggestionConfidenceModal from '@/components/molecules/personal-branding/FollowSuggestionConfidenceModal';
import EngagementRationale from '@/components/molecules/personal-branding/EngagementRationale';
import { GoodPickAffirmBurst } from '@/components/molecules/GoodPickAffirmBurst';
import { ClampedShowMoreText } from '@/components/molecules/personal-branding/ClampedShowMoreText';
import { EyebrowLabel } from '@/components/molecules/personal-branding/EyebrowLabel';
import RecommendedActionBadge from '@/components/molecules/personal-branding/RecommendedActionBadge';
import LearningCostBadge from '@/components/molecules/personal-branding/LearningCostBadge';
import RejectWithFeedbackModal from '@/components/molecules/personal-branding/RejectWithFeedbackModal';
import ReconFeedRunMonitor from '@/components/organisms/personal-branding/ReconFeedRunMonitor';
import type { Toast } from '@/hooks/use-toast';
import type { useRolodex } from '@/hooks/useRolodex';
import { useActiveReplyRuns, useRolodexReplyRuns } from '@/hooks/useRolodexReplyRuns';
import {
  useReconFeed,
  useReconRunDetail,
  RECON_RUNS_PAGE_SIZE,
  buildReconScarcityMessage,
  isProcessedReconPostStatus,
  type ReconPostListFilters,
} from '@/hooks/useReconFeed';
import { formatRelativeChatTimestamp } from '@/lib/chat/format-relative-time';
import { extractErrorMessage } from '@/lib/react-query/error-utils';
import {
  buildReconPrompterSeed,
  ctaLabelForReconPost,
  type ReconPrompterPrefill,
} from '@/lib/personal-branding/recon-prompter-seed';
import {
  buildReconActiveEmptyPresentation,
  resolveReconActiveEmptyKind,
  type ReconAgePreset,
} from '@/lib/personal-branding/recon-active-empty-state';
import {
  formatReconFeedListSummary,
  isNonDefaultReconFeedFilters,
  type ReconFeedSortField,
} from '@/lib/personal-branding/recon-feed-list-summary';
import {
  formatReconRelevancePercent,
  reconFollowSuggestionActionsClusterClassName,
  reconPostActionsClusterClassName,
  reconPostActionsCompactClusterClassName,
  reconPostActionsWideClusterClassName,
  reconPostAccentBarClassName,
  reconPostContentColumnClassName,
  reconPostHighOpportunityRibbonClassName,
  reconPostLowTierTextClassName,
  reconPostPrimaryCtaClusterClassName,
  reconPostRelevanceTier,
  reconPostRowShellClassName,
  reconPostScoreCaptionClassName,
  reconPostScorePillClassName,
  reconPostScoreValueClassName,
} from '@/lib/personal-branding/recon-post-row-surfaces';
import { nextActionCueForRecommendedAction } from '@/lib/personal-branding/recommended-action-display';
import { formatSocialCapitalAngleLabel } from '@/lib/personal-branding/social-capital-angle';
import { cn } from '@/lib/utils';
import type {
  CreateCreatorConnectionInput,
  CreatorConnection,
  FollowSuggestion,
  ReconPost,
  ReconPostFeedbackCategory,
  ReconPostStatus,
  ReplyGenerationDraft,
  ReplyRejectionFeedbackCategory,
  ReplySuggestion,
  UpdateReconPostInput,
} from '@/types/api/personal-branding.dto';
import { RECON_DISMISS_CATEGORY_LABELS, RECON_DISMISS_CATEGORIES, RECON_POST_STATUS_LABELS } from '@/types/api/personal-branding.dto';
import { PageCard, SectionIntro } from '../PersonalBrandingPageTemplate';
import {
  formatPersonalBrandingDateTime,
  linkAccentClassName,
  pbCompactControlDensityClassName,
  pbDenseListStackClassName,
  pbFocusVisibleRingClassName,
  pbMetaClassName,
  selectableFilterChipClassName,
} from '../personal-branding-ui';
import ConnectionEditorDialog from './ConnectionEditorDialog';
import EntityTypeBadge from './EntityTypeBadge';
import LogInteractionDialog from './LogInteractionDialog';
import ManualPrompterPasteDialog, { PASTE_POST_CTA_HINT } from './ManualPrompterPasteDialog';
import ReconRunDetailDrawer from './ReconRunDetailDrawer';
import RolodexPrompterDrawer from './RolodexPrompterDrawer';
import { hasXHandle } from './rolodex-platform';
import {
  getReconMovePhase,
  mergeReconDisplayPosts,
  RECON_FEED_STATUS_MOVE_MS,
  type ReconFeedStatusMoveDirection,
  type ReconFeedStatusMoveMap,
} from './recon-feed-status-move-queue';

type RolodexHook = ReturnType<typeof useRolodex>;

type ReconSortField = ReconFeedSortField;

const RECON_AGE_PRESETS: { value: ReconAgePreset; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: '1d', label: '1d' },
  { value: '2d', label: '2d' },
  { value: '3d', label: '3d' },
  { value: '7d', label: '7d' },
  { value: '2wk', label: '2wk' },
];

const RECON_SORT_OPTIONS: { value: ReconSortField; label: string }[] = [
  { value: 'relevanceScore', label: 'Relevance' },
  { value: 'postedAt', label: 'Posted' },
];

const RECON_PROCESSED_PANEL_ID = 'recon-processed-panel';

const reconSecondaryGhostButtonClassName = cn(
  pbCompactControlDensityClassName,
  pbFocusVisibleRingClassName,
  'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
);

const reconPrimaryCtaButtonClassName = cn(
  pbFocusVisibleRingClassName,
  'inline-flex items-center gap-1'
);

const reconGoodPickRemoveButtonClassName =
  'opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100';

function postedAfterForPreset(preset: ReconAgePreset): string | undefined {
  if (preset === 'all') return undefined;
  const days =
    preset === '1d' ? 1 : preset === '2d' ? 2 : preset === '3d' ? 3 : preset === '7d' ? 7 : 14;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function formatProcessedCountBadge(loaded: number, total: number): string {
  if (total === 0) return '0';
  if (loaded < total) return `${loaded} of ${total}`;
  return String(total);
}

function formatReconPostedAt(value?: string | null): { label: string; title?: string } {
  if (!value) return { label: '—' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { label: value };
  return {
    label: formatRelativeChatTimestamp(value),
    title: formatPersonalBrandingDateTime(value),
  };
}

const reconGoodPickChipClassName =
  'inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400';

function ReconPostRow({
  post,
  isUpdating,
  variant = 'active',
  onDraft,
  onLogReply,
  onGoodPick,
  onDismiss,
  onRestore,
}: {
  post: ReconPost;
  isUpdating: boolean;
  variant?: 'active' | 'processed';
  onDraft: () => void;
  onLogReply: () => void;
  onGoodPick: () => void;
  onDismiss: () => void;
  onRestore?: () => void;
}) {
  const [goodPickPulseKey, setGoodPickPulseKey] = useState(0);

  const tier = reconPostRelevanceTier(post.relevanceScore);
  const relevancePercent = formatReconRelevancePercent(post.relevanceScore);
  const draftLabel = ctaLabelForReconPost(post);
  const nextActionCue = nextActionCueForRecommendedAction(post.recommendedAction);
  const draftAriaLabel = `${draftLabel} for ${post.connectionName ?? 'connection'}${
    post.authorUsername ? ` @${post.authorUsername}` : ''
  }`;
  const isGoodPick = post.feedbackVerdict === 'GOOD';
  const handleGoodPickClick = () => {
    if (!isGoodPick) {
      setGoodPickPulseKey((key) => key + 1);
    }
    onGoodPick();
  };
  const dismissCategoryLabel =
    post.feedbackCategory && post.feedbackCategory in RECON_DISMISS_CATEGORY_LABELS
      ? RECON_DISMISS_CATEGORY_LABELS[
          post.feedbackCategory as keyof typeof RECON_DISMISS_CATEGORY_LABELS
        ]
      : post.feedbackCategory;
  const postedAtDisplay = formatReconPostedAt(post.postedAt);
  return (
    <div
      data-relevance-tier={tier}
      className={cn(reconPostRowShellClassName({ tier, variant }), 'group')}
    >
      {tier === 'high' ? (
        <span
          className={reconPostHighOpportunityRibbonClassName(tier)}
          data-testid="high-opportunity-ribbon"
        >
          High opportunity
        </span>
      ) : null}
      <span aria-hidden className={reconPostAccentBarClassName(tier)} />
      <div className={cn('flex min-w-0 flex-col', pbDenseListStackClassName)}>
        <div className="flex flex-wrap items-start gap-2">
          <div className={cn(reconPostContentColumnClassName, 'space-y-1.5')}>
            {tier === 'high' ? (
              <div className="flex items-baseline gap-1.5">
                <span
                  className={reconPostScoreValueClassName({ tier, score: post.relevanceScore })}
                  aria-label={`${relevancePercent} relevance`}
                >
                  {relevancePercent}
                </span>
                <span className={reconPostScoreCaptionClassName(tier)}>relevance</span>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {post.connectionName ?? 'Connection'}
              </span>
              {post.authorUsername ? (
                <span className={pbMetaClassName}>@{post.authorUsername}</span>
              ) : null}
              {tier === 'mid' ? (
                <span
                  className={cn(
                    reconPostScorePillClassName({ tier, score: post.relevanceScore }),
                    reconPostScoreValueClassName({ tier, score: post.relevanceScore })
                  )}
                >
                  {`${relevancePercent} relevance`}
                </span>
              ) : null}
              {tier === 'low' ? (
                <span
                  className={cn(
                    reconPostScoreValueClassName({ tier, score: post.relevanceScore }),
                    reconPostScoreCaptionClassName(tier)
                  )}
                >
                  {post.relevanceScore !== null && post.relevanceScore !== undefined
                    ? `${relevancePercent} relevance`
                    : 'Unscored'}
                </span>
              ) : null}
              {post.socialCapitalAngle ? (
                <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                  {formatSocialCapitalAngleLabel(post.socialCapitalAngle)}
                </span>
              ) : null}
              <RecommendedActionBadge action={post.recommendedAction} />
              <LearningCostBadge learningCost={post.learningCost} />
              {post.ingestSource && post.ingestSource !== 'recon' ? (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  via Content Stream
                </span>
              ) : null}
            </div>
          </div>
          <div className={reconPostPrimaryCtaClusterClassName}>
            <Button
              type="button"
              size="sm"
              variant="primary"
              aria-label={draftAriaLabel}
              disabled={isUpdating}
              onClick={onDraft}
              className={reconPrimaryCtaButtonClassName}
            >
              <Sparkles className="size-3.5 shrink-0" />
              {draftLabel}
            </Button>
          </div>
        </div>
        <div className={cn(reconPostContentColumnClassName, 'space-y-1.5')}>
          <ClampedShowMoreText
            text={post.text}
            lines={4}
            className={cn('text-sm', reconPostLowTierTextClassName(tier))}
          />
          {nextActionCue ? (
            <p className={cn(pbMetaClassName, 'font-normal')}>{nextActionCue}</p>
          ) : null}
          <EngagementRationale
            lead={post.relevanceRationale}
            bullets={post.relevanceRationaleBullets}
            leadClassName={pbMetaClassName}
            bulletClassName={pbMetaClassName}
          />
          {variant === 'active' && post.suggestedAngle?.trim() ? (
            <p className={pbMetaClassName}>
              <span className="font-medium text-gray-600 dark:text-gray-300">Angle:</span>{' '}
              {post.suggestedAngle.trim()}
            </p>
          ) : null}
          {variant === 'processed' && dismissCategoryLabel ? (
            <p className={pbMetaClassName}>
              Dismissed: {dismissCategoryLabel}
              {post.feedbackText ? ` — ${post.feedbackText}` : ''}
            </p>
          ) : null}
          {isGoodPick ? (
            <GoodPickAffirmBurst pulseKey={goodPickPulseKey}>
              <span className={reconGoodPickChipClassName} aria-label="Good pick affirmation">
                <Check className="size-3 shrink-0" aria-hidden />
                Good pick
              </span>
            </GoodPickAffirmBurst>
          ) : null}
          <div className={cn('flex flex-wrap items-center gap-3', pbMetaClassName)}>
            <span>{RECON_POST_STATUS_LABELS[post.status]}</span>
            <span title={postedAtDisplay.title}>{postedAtDisplay.label}</span>
            {post.url ? (
              <a href={post.url} target="_blank" rel="noreferrer" className={linkAccentClassName}>
                View post
              </a>
            ) : null}
          </div>
        </div>
        <div className={reconPostActionsClusterClassName}>
          <div className={reconPostActionsWideClusterClassName} data-testid="recon-post-actions-wide">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isUpdating}
              onClick={onLogReply}
              className={reconSecondaryGhostButtonClassName}
            >
              Log reply
            </Button>
            {isGoodPick ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={isUpdating}
                aria-label="Remove good pick"
                onClick={handleGoodPickClick}
                className={cn(reconSecondaryGhostButtonClassName, reconGoodPickRemoveButtonClassName)}
              >
                Remove
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={isUpdating}
                aria-label="Mark as good pick"
                onClick={handleGoodPickClick}
                className={cn('inline-flex items-center gap-1', reconSecondaryGhostButtonClassName)}
              >
                <ThumbsUp className="size-3.5 shrink-0" />
                Good pick
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isUpdating}
              onClick={onDismiss}
              className={reconSecondaryGhostButtonClassName}
            >
              Dismiss
            </Button>
          </div>
          <div className={reconPostActionsCompactClusterClassName} data-testid="recon-post-actions-compact">
            <DropdownMenuButton
              icon={MoreHorizontal}
              ariaLabel="More actions"
              align="end"
              items={[
                {
                  key: 'log-reply',
                  label: 'Log reply',
                  onClick: onLogReply,
                  disabled: isUpdating,
                },
                {
                  key: 'good-pick',
                  label: isGoodPick ? 'Remove good pick' : 'Good pick',
                  icon: ThumbsUp,
                  onClick: handleGoodPickClick,
                  disabled: isUpdating,
                },
                {
                  key: 'dismiss',
                  label: 'Dismiss',
                  onClick: onDismiss,
                  disabled: isUpdating,
                  tone: 'danger',
                },
              ]}
            />
          </div>
          {variant === 'processed' && onRestore ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isUpdating}
              onClick={onRestore}
              className={reconSecondaryGhostButtonClassName}
            >
              Restore to feed
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FollowSuggestionRow({
  suggestion,
  isUpdating,
  isProposing,
  onAdd,
  onDismiss,
  onOpenConfidence,
}: {
  suggestion: FollowSuggestion;
  isUpdating: boolean;
  isProposing: boolean;
  onAdd: () => void;
  onDismiss: () => void;
  onOpenConfidence: () => void;
}) {
  const sharedCount = suggestion.sharedConnectionIds.length;
  const hasConfidence = suggestion.confidence !== null && suggestion.confidence !== undefined;
  return (
    <div className="min-w-0 w-full overflow-hidden rounded-xl border border-gray-200 p-4 dark:border-gray-700">
      <div className="flex flex-wrap items-start gap-2">
        <div className={reconPostContentColumnClassName}>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-medium text-gray-900 dark:text-white">
              {suggestion.displayName ?? `@${suggestion.xUsername}`}
            </h4>
            <EntityTypeBadge entityType={suggestion.entityType} />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            @{suggestion.xUsername}
            {suggestion.followersCount !== null && suggestion.followersCount !== undefined
              ? ` · ${suggestion.followersCount.toLocaleString()} followers`
              : ''}
            {sharedCount > 0 ? ` · followed by ${sharedCount} tracked connection(s)` : ''}
            {hasConfidence ? (
              <>
                {' · '}
                <button
                  type="button"
                  onClick={onOpenConfidence}
                  className={cn(
                    'font-medium underline decoration-dotted underline-offset-2',
                    linkAccentClassName
                  )}
                >
                  {(suggestion.confidence! * 100).toFixed(0)}% confidence
                </button>
              </>
            ) : null}
          </p>
        </div>
        <div className={reconFollowSuggestionActionsClusterClassName}>
          <Button type="button" size="sm" disabled={isUpdating || isProposing} onClick={onAdd}>
            {isProposing ? 'Preparing…' : 'Add to directory'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={isUpdating || isProposing}
            onClick={onDismiss}
          >
            Dismiss
          </Button>
        </div>
      </div>
      {suggestion.bio ? (
        <p className={cn('mt-2 text-sm text-gray-600 dark:text-gray-400', reconPostContentColumnClassName)}>
          {suggestion.bio}
        </p>
      ) : null}
      {suggestion.rationale ? (
        <p className={cn('mt-2 text-xs text-gray-500', reconPostContentColumnClassName)}>
          {suggestion.rationale}
        </p>
      ) : null}
      {suggestion.profileUrl ? (
        <a
          href={suggestion.profileUrl}
          target="_blank"
          rel="noreferrer"
          className={cn('mt-2 inline-block text-sm', linkAccentClassName)}
        >
          {suggestion.profileUrl}
        </a>
      ) : null}
    </div>
  );
}

const RECON_LIST_IO_ROOT_MARGIN = '80px';

function ReconFeedLoadMoreSkeleton() {
  return (
    <div
      data-testid="recon-feed-load-more-skeleton"
      className={cn(
        reconPostRowShellClassName({ tier: 'mid', variant: 'active' }),
        'pointer-events-none'
      )}
      aria-hidden
    >
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-5/6" />
      <Skeleton className="mt-3 h-3 w-2/3" />
    </div>
  );
}

function PaginatedReconListPanel({
  loadedCount,
  total,
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
  onLoadMore,
  agePreset,
  sortField,
  onClearFilters,
  children,
}: {
  loadedCount: number;
  total: number;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  onLoadMore: () => void;
  agePreset?: ReconAgePreset;
  sortField?: ReconSortField;
  onClearFilters?: () => void;
  children: ReactNode;
}) {
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const canAutoLoad = typeof IntersectionObserver !== 'undefined';

  const tryLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) {
      onLoadMore();
    }
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, onLoadMore]);

  useEffect(() => {
    if (!canAutoLoad || !hasNextPage) {
      return undefined;
    }
    const root = scrollRootRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          tryLoadMore();
        }
      },
      { root, rootMargin: RECON_LIST_IO_ROOT_MARGIN, threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [canAutoLoad, hasNextPage, tryLoadMore]);

  useEffect(() => {
    if (!canAutoLoad || !hasNextPage || isFetchingNextPage || isFetchNextPageError) {
      return;
    }
    const root = scrollRootRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) {
      return;
    }
    const rootRect = root.getBoundingClientRect();
    const sentinelRect = sentinel.getBoundingClientRect();
    const marginPx = 80;
    if (sentinelRect.top <= rootRect.bottom + marginPx) {
      tryLoadMore();
    }
  }, [
    canAutoLoad,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
    tryLoadMore,
    loadedCount,
  ]);

  const showFallbackButton = hasNextPage && (!canAutoLoad || isFetchNextPageError);
  const filterAware =
    agePreset !== undefined && sortField !== undefined && onClearFilters !== undefined;
  const showClearFilters =
    filterAware && isNonDefaultReconFeedFilters(agePreset, sortField);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {filterAware
            ? formatReconFeedListSummary({
                loadedCount,
                total,
                agePreset,
                sortField,
              })
            : `Showing ${loadedCount} of ${total}`}
        </p>
        {showClearFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className={cn('text-xs font-medium', linkAccentClassName)}
          >
            Clear filters
          </button>
        ) : null}
      </div>
      <div
        ref={scrollRootRef}
        className="min-w-0 max-h-[32rem] overflow-y-auto overflow-x-hidden pr-1"
        aria-busy={isFetchingNextPage}
      >
        <div className="grid min-w-0 gap-3">
          {children}
          {isFetchingNextPage ? <ReconFeedLoadMoreSkeleton /> : null}
          {hasNextPage ? (
            <div ref={sentinelRef} className="h-px w-full shrink-0" aria-hidden />
          ) : null}
        </div>
      </div>
      {showFallbackButton ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={isFetchingNextPage}
          onClick={onLoadMore}
          className={pbFocusVisibleRingClassName}
        >
          {isFetchNextPageError ? 'Retry' : 'Load more'}
        </Button>
      ) : null}
    </div>
  );
}

function ReconAnimatedPostList({
  posts,
  holdMap,
  holdDirection,
  enteringPostIds,
  prefersReducedMotion,
  variant,
  updatingPostId,
  onDraft,
  onLogReply,
  onGoodPick,
  onDismiss,
  onRestore,
}: {
  posts: ReconPost[];
  holdMap: ReconFeedStatusMoveMap;
  holdDirection: ReconFeedStatusMoveDirection;
  enteringPostIds: ReadonlySet<string>;
  prefersReducedMotion: boolean;
  variant: 'active' | 'processed';
  updatingPostId: string | null;
  onDraft: (post: ReconPost) => void;
  onLogReply: (post: ReconPost) => void;
  onGoodPick: (post: ReconPost) => void;
  onDismiss: (post: ReconPost) => void;
  onRestore?: (post: ReconPost) => void;
}) {
  const displayPosts = useMemo(
    () => mergeReconDisplayPosts(posts, holdMap, holdDirection),
    [posts, holdMap, holdDirection]
  );

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {displayPosts.map((post) => {
        const exiting = getReconMovePhase(post.id, holdMap) === 'exiting';
        const entering = enteringPostIds.has(post.id);
        const isUpdating = updatingPostId === post.id || exiting;
        return (
          <motion.div
            key={post.id}
            layout={!prefersReducedMotion}
            initial={
              entering && !prefersReducedMotion ? { opacity: 0, x: -16, scale: 0.98 } : false
            }
            animate={
              exiting && !prefersReducedMotion
                ? { opacity: 0, x: 24, scale: 0.98 }
                : { opacity: 1, x: 0, scale: 1 }
            }
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 24, scale: 0.98 }}
            transition={{
              duration: RECON_FEED_STATUS_MOVE_MS / 1000,
              ease: 'easeInOut',
            }}
            className={cn('min-w-0', exiting && 'pointer-events-none')}
          >
            <ReconPostRow
              post={post}
              variant={variant}
              isUpdating={isUpdating}
              onDraft={() => onDraft(post)}
              onLogReply={() => onLogReply(post)}
              onGoodPick={() => onGoodPick(post)}
              onDismiss={() => onDismiss(post)}
              onRestore={onRestore ? () => onRestore(post) : undefined}
            />
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}

interface ReconFeedTabProps {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  rolodex: RolodexHook;
  profiles: { id: string; name: string }[];
  selectedProfileId?: string | null;
}

export default function ReconFeedTab({
  showToast,
  rolodex,
  profiles,
  selectedProfileId,
}: ReconFeedTabProps) {
  const connections = rolodex.connections.data?.data ?? [];
  const [agePreset, setAgePreset] = useState<ReconAgePreset>('all');
  const [sortField, setSortField] = useState<ReconSortField>('relevanceScore');
  const [processedOpen, setProcessedOpen] = useState(false);
  const processedHeadingId = useId();
  const [runsPage, setRunsPage] = useState(1);
  const [prompterConnection, setPrompterConnection] = useState<CreatorConnection | null>(null);
  const [prompterPrefill, setPrompterPrefill] = useState<ReconPrompterPrefill | null>(null);
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [checkInConnection, setCheckInConnection] = useState<CreatorConnection | null>(null);
  const [pendingLog, setPendingLog] = useState<{
    connection: CreatorConnection;
    creatorText: string;
    vector: { id: string; label: string; angle: string; draftText: string; rationale: string };
    evidenceUrl?: string | null;
    platform?: string | null;
    platformPostId?: string | null;
    channel?: string | null;
  } | null>(null);
  const replyRuns = useRolodexReplyRuns(activeRunId);
  const activeRun = replyRuns.query.data;
  useActiveReplyRuns();

  const postFilters = useMemo<ReconPostListFilters>(
    () => ({
      postedAfter: postedAfterForPreset(agePreset),
      sortBy: sortField,
      sortOrder: 'desc',
    }),
    [agePreset, sortField]
  );

  const recon = useReconFeed({ postFilters, runsPage, includeProcessedPosts: true });
  const [searchParams, setSearchParams] = useSearchParams();
  const [confidenceSuggestionId, setConfidenceSuggestionId] = useState<string | null>(null);

  const confidenceSuggestion = useMemo(() => {
    if (!confidenceSuggestionId) return null;
    return recon.followSuggestions.items.find((row) => row.id === confidenceSuggestionId) ?? null;
  }, [confidenceSuggestionId, recon.followSuggestions.items]);

  const loadError = useMemo(() => {
    const queries = [recon.posts, recon.processedPosts, recon.followSuggestions, recon.runs];
    const failed = queries.find((q) => q.isError);
    if (!failed?.error) return null;
    return extractErrorMessage(failed.error, 'Failed to load Recon Feed');
  }, [recon.posts, recon.processedPosts, recon.followSuggestions, recon.runs]);

  const prefersReducedMotion = useReducedMotion() ?? false;
  const [holdById, setHoldById] = useState<ReconFeedStatusMoveMap>({});
  const [enteringPostIds, setEnteringPostIds] = useState(() => new Set<string>());
  const exitTimersRef = useRef<Record<string, number>>({});
  const enteringTimersRef = useRef<Record<string, number>>({});

  const posts = recon.posts.items;
  const processedPosts = recon.processedPosts.items;
  const processedCountBadge = formatProcessedCountBadge(
    processedPosts.length,
    recon.processedPosts.total
  );
  const displayActivePosts = useMemo(
    () => mergeReconDisplayPosts(posts, holdById, 'toProcessed'),
    [posts, holdById]
  );
  const suggestions = recon.followSuggestions.items;
  const runs = recon.runs.data?.data ?? [];
  const trackedXHandleCount = useMemo(
    () => connections.filter((connection) => hasXHandle(connection)).length,
    [connections]
  );
  const hasTrackedXHandles = trackedXHandleCount > 0;
  const showScarcityHint =
    recon.scarcity.isSuccess &&
    recon.scarcity.isScarce &&
    recon.scarcity.recentHighSignalCount !== null;
  const scarcityMessage = showScarcityHint
    ? buildReconScarcityMessage(
        recon.scarcity.recentHighSignalCount!,
        recon.scarcity.threshold,
        hasTrackedXHandles
      )
    : null;
  const runsTotal = recon.runs.data?.total ?? 0;
  const runsPageSize = recon.runs.data?.pageSize ?? RECON_RUNS_PAGE_SIZE;
  const runsTotalPages = Math.max(1, Math.ceil(runsTotal / runsPageSize));
  const [dismissingSuggestion, setDismissingSuggestion] = useState<FollowSuggestion | null>(null);
  const [dismissingPost, setDismissingPost] = useState<ReconPost | null>(null);
  const [logReplyPostId, setLogReplyPostId] = useState<string | null>(null);
  const [addingSuggestion, setAddingSuggestion] = useState<FollowSuggestion | null>(null);
  const [connectionPrefill, setConnectionPrefill] = useState<CreateCreatorConnectionInput | null>(
    null
  );
  const [connectionDraftSummary, setConnectionDraftSummary] = useState<string | null>(null);
  const [connectionEditorOpen, setConnectionEditorOpen] = useState(false);
  const [proposingSuggestionId, setProposingSuggestionId] = useState<string | null>(null);
  const [pendingRunAction, setPendingRunAction] = useState<'pause' | 'resume' | 'cancel' | null>(
    null
  );
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const selectedRunDetail = useReconRunDetail(selectedRunId);
  const runDetail = selectedRunDetail.detail.data;
  const runIdFromUrl = searchParams.get('runId');

  const clearStatusMoveTimer = useCallback((postId: string) => {
    const timerId = exitTimersRef.current[postId];
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      delete exitTimersRef.current[postId];
    }
  }, []);

  const clearEnteringTimer = useCallback((postId: string) => {
    const timerId = enteringTimersRef.current[postId];
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      delete enteringTimersRef.current[postId];
    }
  }, []);

  const commitStatusMove = useCallback(
    (postId: string) => {
      clearStatusMoveTimer(postId);
      setHoldById((current) => {
        if (!(postId in current)) return current;
        const next = { ...current };
        delete next[postId];
        return next;
      });
    },
    [clearStatusMoveTimer]
  );

  const scheduleEntering = useCallback(
    (postId: string) => {
      clearEnteringTimer(postId);
      setEnteringPostIds((current) => {
        if (current.has(postId)) return current;
        const next = new Set(current);
        next.add(postId);
        return next;
      });
      enteringTimersRef.current[postId] = window.setTimeout(() => {
        clearEnteringTimer(postId);
        setEnteringPostIds((current) => {
          if (!current.has(postId)) return current;
          const next = new Set(current);
          next.delete(postId);
          return next;
        });
      }, RECON_FEED_STATUS_MOVE_MS);
    },
    [clearEnteringTimer]
  );

  const beginStatusMove = useCallback(
    (post: ReconPost, direction: ReconFeedStatusMoveDirection) => {
      if (prefersReducedMotion) return;
      clearStatusMoveTimer(post.id);
      setHoldById((current) => ({
        ...current,
        [post.id]: { post, direction, phase: 'exiting' },
      }));
      exitTimersRef.current[post.id] = window.setTimeout(() => {
        commitStatusMove(post.id);
      }, RECON_FEED_STATUS_MOVE_MS);
    },
    [clearStatusMoveTimer, commitStatusMove, prefersReducedMotion]
  );

  const clearStatusMove = useCallback(
    (postId: string) => {
      commitStatusMove(postId);
      clearEnteringTimer(postId);
      setEnteringPostIds((current) => {
        if (!current.has(postId)) return current;
        const next = new Set(current);
        next.delete(postId);
        return next;
      });
    },
    [clearEnteringTimer, commitStatusMove]
  );

  const beginStatusMoveIfNeeded = useCallback(
    (post: ReconPost, nextStatus: ReconPostStatus) => {
      const wasActive = post.status === 'NEW';
      const wasProcessed = isProcessedReconPostStatus(post.status);
      if (wasActive && isProcessedReconPostStatus(nextStatus)) {
        beginStatusMove(post, 'toProcessed');
        scheduleEntering(post.id);
      } else if (wasProcessed && nextStatus === 'NEW') {
        beginStatusMove(post, 'toActive');
        scheduleEntering(post.id);
      }
    },
    [beginStatusMove, scheduleEntering]
  );

  const findReconPost = useCallback(
    (postId: string) =>
      posts.find((post) => post.id === postId) ??
      processedPosts.find((post) => post.id === postId),
    [posts, processedPosts]
  );

  useEffect(() => {
    const exitTimers = exitTimersRef.current;
    const enteringTimers = enteringTimersRef.current;
    return () => {
      Object.values(exitTimers).forEach((timerId) => window.clearTimeout(timerId));
      Object.values(enteringTimers).forEach((timerId) => window.clearTimeout(timerId));
    };
  }, []);

  useEffect(() => {
    if (runIdFromUrl) {
      setSelectedRunId(runIdFromUrl);
    }
  }, [runIdFromUrl]);

  const closeRunDrawer = () => {
    setSelectedRunId(null);
    if (searchParams.get('runId')) {
      const next = new URLSearchParams(searchParams);
      next.delete('runId');
      setSearchParams(next, { replace: true });
    }
  };

  const openConnectionDirectory = () => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'directory');
    setSearchParams(next, { replace: true });
  };

  const activeEmptyPresentation = useMemo(() => {
    const kind = resolveReconActiveEmptyKind({
      trackedXHandleCount,
      showScarcityHint,
      lastRunAt: recon.settings.data?.lastRunAt,
      agePreset,
    });
    return buildReconActiveEmptyPresentation({
      kind,
      hasTrackedXHandles,
      scarcityMessage,
      agePreset,
      processedCount: processedPosts.length,
    });
  }, [
    trackedXHandleCount,
    showScarcityHint,
    recon.settings.data?.lastRunAt,
    agePreset,
    scarcityMessage,
    hasTrackedXHandles,
    processedPosts.length,
  ]);

  const runNowDisabled =
    recon.startRun.isPending ||
    !recon.settings.data?.hasRapidApiKey ||
    recon.hasActiveNonPausedRun;

  const closeConnectionEditor = () => {
    setConnectionEditorOpen(false);
    setAddingSuggestion(null);
    setConnectionPrefill(null);
    setConnectionDraftSummary(null);
  };

  const handlePostUpdate = async (post: ReconPost, body: UpdateReconPostInput) => {
    if (body.status) beginStatusMoveIfNeeded(post, body.status);
    try {
      await recon.updatePost.mutateAsync({ postId: post.id, body });
    } catch (err) {
      clearStatusMove(post.id);
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Update failed',
      });
    }
  };

  const handlePostStatus = async (post: ReconPost, status: ReconPostStatus) => {
    await handlePostUpdate(post, { status });
  };

  const handleGoodPick = async (post: ReconPost) => {
    const nextVerdict = post.feedbackVerdict === 'GOOD' ? null : 'GOOD';
    await handlePostUpdate(post, { feedbackVerdict: nextVerdict });
  };

  const submitDismissPost = async (
    feedbackText: string | null,
    feedbackCategory?: string | null
  ) => {
    if (!dismissingPost || !feedbackCategory) return;
    beginStatusMoveIfNeeded(dismissingPost, 'DISMISSED');
    try {
      await recon.updatePost.mutateAsync({
        postId: dismissingPost.id,
        body: {
          status: 'DISMISSED',
          feedbackVerdict: 'BAD',
          feedbackCategory: feedbackCategory as ReconPostFeedbackCategory,
          feedbackText,
        },
      });
      setDismissingPost(null);
    } catch (err) {
      clearStatusMove(dismissingPost.id);
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Dismiss failed',
      });
    }
  };

  const openLogReplyFromPost = (post: ReconPost) => {
    const connection = connections.find((item) => item.id === post.connectionId);
    if (!connection) {
      showToast({
        type: 'error',
        title: 'Connection not found',
        message: 'Add or restore this connection in the Directory, then try again.',
      });
      return;
    }
    setLogReplyPostId(post.id);
    setCheckInConnection(connection);
    setPendingLog({
      connection,
      creatorText: post.text,
      vector: {
        id: 'manual-reply',
        label: 'Manual reply',
        angle: 'log-reply',
        draftText: '',
        rationale: '',
      },
      evidenceUrl: post.url ?? null,
      platform: 'x',
      platformPostId: post.platformPostId,
      channel: 'x',
    });
  };

  const openPrompter = useCallback(
    (connection: CreatorConnection, prefill?: ReconPrompterPrefill | null) => {
      setPrompterConnection(connection);
      setPrompterPrefill(prefill ?? null);
      setActiveRunId(null);
      if (prefill?.creatorText) {
        setPendingLog({
          connection,
          creatorText: prefill.creatorText,
          vector: {
            id: 'manual-paste',
            label: 'From pasted post',
            angle: 'manual-paste',
            draftText: '',
            rationale: '',
          },
          evidenceUrl: prefill.evidenceUrl ?? null,
          platform: 'x',
          platformPostId: prefill.platformPostId ?? null,
          channel: 'x',
        });
      } else {
        setPendingLog(null);
      }
    },
    []
  );

  const openPrompterFromPost = useCallback(
    (post: ReconPost) => {
      const connection = connections.find((item) => item.id === post.connectionId);
      if (!connection) {
        showToast({
          type: 'error',
          title: 'Connection not found',
          message: 'Add or restore this connection in the Directory, then try again.',
        });
        return;
      }
      const { connectionId: _connectionId, ...prefill } = buildReconPrompterSeed(post);
      openPrompter(connection, prefill);
    },
    [connections, openPrompter, showToast]
  );

  const startReplyGeneration = async (
    connection: CreatorConnection,
    payload: {
      creatorText: string;
      platform: import('@/types/api/personal-branding.dto').BrandPlatform;
      interactionIntent?: string;
      platformPostId?: string | null;
      evidenceUrl?: string | null;
    },
    draft: ReplyGenerationDraft,
    resolved: { provider: string; model: string }
  ) => {
    try {
      const run = await replyRuns.startRun.mutateAsync({
        connectionId: connection.id,
        platform: payload.platform,
        creatorText: payload.creatorText,
        platformPostId: payload.platformPostId ?? undefined,
        evidenceUrl: payload.evidenceUrl ?? undefined,
        profileId: draft.profileId || undefined,
        interactionIntent: payload.interactionIntent,
        mode: draft.mode,
        researchEnabled: draft.researchEnabled,
        vaultGroundingEnabled: draft.vaultGroundingEnabled,
        reconPostId: prompterPrefill?.reconPostId,
        includeOperatorBriefing: draft.includeOperatorBriefing,
        provider: resolved.provider,
        model: resolved.model,
        reasoningEffort: draft.reasoningEffort ?? undefined,
        suggestionCount: draft.suggestionCount,
        questionFirstBias: draft.questionFirstBias,
        platformFormat: draft.platformFormat,
        allowFullGenerationOnSparseText: draft.allowFullGenerationOnSparseText ?? false,
        suggestedParamsJson: draft as unknown as Record<string, unknown>,
      });
      setActiveRunId(run.id);
      showToast({
        type: 'info',
        title:
          draft.mode === 'AGENT'
            ? 'Agent run started — drafting in background'
            : 'Reply generation started — drafting in background',
      });
      return run;
    } catch (err) {
      showToast({ type: 'error', title: err instanceof Error ? err.message : 'Generation failed' });
      return undefined;
    }
  };

  const handleAcceptSuggestion = async (
    connection: CreatorConnection,
    suggestion: ReplySuggestion,
    creatorText: string,
    meta?: { evidenceUrl?: string | null; platformPostId?: string | null }
  ) => {
    const activePrefill = prompterPrefill;
    try {
      await replyRuns.updateSuggestion.mutateAsync({
        suggestionId: suggestion.id,
        body: { status: 'ACCEPTED' },
      });
      await navigator.clipboard.writeText(suggestion.draftText);
      showToast({ type: 'success', title: 'Draft copied — log your interaction' });
      setPrompterConnection(null);
      setPrompterPrefill(null);
      setActiveRunId(null);
      setPendingLog({
        connection,
        creatorText,
        vector: suggestion,
        evidenceUrl: meta?.evidenceUrl ?? activePrefill?.evidenceUrl ?? null,
        platform: 'x',
        platformPostId: meta?.platformPostId ?? activePrefill?.platformPostId ?? null,
        channel: 'x',
      });
      setCheckInConnection(connection);
      if (activePrefill?.reconPostId) {
        const reconPost = findReconPost(activePrefill.reconPostId);
        if (reconPost) beginStatusMoveIfNeeded(reconPost, 'ACTIONED');
        try {
          await recon.updatePost.mutateAsync({
            postId: activePrefill.reconPostId,
            body: { status: 'ACTIONED' },
          });
        } catch (err) {
          clearStatusMove(activePrefill.reconPostId);
          showToast({
            type: 'error',
            title: err instanceof Error ? err.message : 'Could not mark Recon post as actioned',
          });
        }
      }
    } catch (err) {
      showToast({ type: 'error', title: err instanceof Error ? err.message : 'Accept failed' });
    }
  };

  const handleRejectSuggestion = async (
    suggestion: ReplySuggestion,
    feedbackText: string | null,
    feedbackCategory: ReplyRejectionFeedbackCategory
  ) => {
    try {
      await replyRuns.updateSuggestion.mutateAsync({
        suggestionId: suggestion.id,
        body: { status: 'REJECTED', feedbackText, feedbackCategory },
      });
      showToast({ type: 'success', title: 'Feedback saved for future runs' });
    } catch (err) {
      showToast({ type: 'error', title: err instanceof Error ? err.message : 'Reject failed' });
    }
  };

  const handleAddSuggestion = async (suggestion: FollowSuggestion) => {
    setProposingSuggestionId(suggestion.id);
    try {
      const proposal = await recon.proposeFollowSuggestionConnection.mutateAsync(suggestion.id);
      setAddingSuggestion(suggestion);
      setConnectionPrefill(proposal.draft);
      setConnectionDraftSummary(proposal.draftSummary ?? null);
      setConnectionEditorOpen(true);
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Could not prepare connection draft',
      });
    } finally {
      setProposingSuggestionId(null);
    }
  };

  const submitAddedConnection = async (body: CreateCreatorConnectionInput) => {
    if (!addingSuggestion) return;
    try {
      await recon.updateFollowSuggestion.mutateAsync({
        suggestionId: addingSuggestion.id,
        body: { status: 'ADDED', connection: body },
      });
      showToast({ type: 'success', title: 'Added to Connection Directory' });
      closeConnectionEditor();
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Add failed',
      });
      throw err;
    }
  };

  const submitDismissSuggestion = async (feedbackText: string | null) => {
    if (!dismissingSuggestion) return;
    try {
      await recon.updateFollowSuggestion.mutateAsync({
        suggestionId: dismissingSuggestion.id,
        body: { status: 'DISMISSED', feedbackText },
      });
      setDismissingSuggestion(null);
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Dismiss failed',
      });
    }
  };

  const handleRunControl = async (
    action: 'pause' | 'resume' | 'cancel',
    runId: string = recon.activeRunId ?? ''
  ) => {
    if (!runId) return;
    setPendingRunAction(action);
    try {
      await recon.controlRun.mutateAsync({ runId, action });
      showToast({
        type: 'success',
        title:
          action === 'pause'
            ? 'Recon run pausing'
            : action === 'resume'
              ? 'Recon run resumed'
              : 'Recon run cancelling',
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Run control failed',
      });
    } finally {
      setPendingRunAction(null);
    }
  };

  const handleStartRun = async () => {
    try {
      await recon.startRun.mutateAsync();
      setRunsPage(1);
      showToast({ type: 'success', title: 'Recon run started' });
      setSelectedRunId(null);
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Failed to start run',
      });
    }
  };

  const handleActiveEmptyAction = useCallback(() => {
    const { kind } = activeEmptyPresentation;
    if (kind === 'scarcity') {
      openConnectionDirectory();
      return;
    }
    if (kind === 'filtered') {
      setAgePreset('all');
      return;
    }
    void handleStartRun();
  }, [activeEmptyPresentation, handleStartRun, openConnectionDirectory]);

  const handleClearReconFilters = useCallback(() => {
    setAgePreset('all');
    setSortField('relevanceScore');
  }, []);

  return (
    <div className="space-y-8">
      {loadError ? (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
        >
          {loadError}
        </div>
      ) : null}

      {recon.activeRunId ? (
        <ReconFeedRunMonitor
          run={recon.activeRun.data}
          isLoading={recon.activeRun.isLoading}
          pendingAction={pendingRunAction}
          onPause={() => void handleRunControl('pause')}
          onResume={() => void handleRunControl('resume')}
          onCancel={() => void handleRunControl('cancel')}
        />
      ) : null}

      <PageCard className="min-w-0 space-y-2">
        <div className="space-y-3">
          <SectionIntro
            title="Active feed"
            description="New posts awaiting review, ranked by LLM relevance for engagement traction."
            actions={
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className={cn('shrink-0', pbCompactControlDensityClassName, pbFocusVisibleRingClassName)}
                title={PASTE_POST_CTA_HINT}
                onClick={() => setPasteDialogOpen(true)}
              >
                <ClipboardPaste className="mr-1.5 size-3.5 shrink-0" />
                Paste post
              </Button>
            }
          />
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <EyebrowLabel as="span">Age</EyebrowLabel>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Filter by post age"
              >
                {RECON_AGE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setAgePreset(preset.value)}
                    className={selectableFilterChipClassName(agePreset === preset.value)}
                    aria-pressed={agePreset === preset.value}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <EyebrowLabel as="span">Sort by</EyebrowLabel>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Sort active feed">
                {RECON_SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSortField(option.value)}
                    className={selectableFilterChipClassName(sortField === option.value)}
                    aria-pressed={sortField === option.value}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        {showScarcityHint && scarcityMessage && posts.length > 0 ? (
          <div
            role="status"
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
          >
            <p>{scarcityMessage}</p>
            <button
              type="button"
              onClick={openConnectionDirectory}
              className={cn(linkAccentClassName, 'mt-2 text-sm font-medium')}
            >
              {hasTrackedXHandles
                ? 'Open Connection Directory'
                : 'Add X handles in Connection Directory'}
            </button>
          </div>
        ) : null}
        {displayActivePosts.length === 0 ? (
          <EmptyState
            density="compact"
            scene={activeEmptyPresentation.scene}
            title={activeEmptyPresentation.title}
            description={activeEmptyPresentation.description}
            actionLabel={activeEmptyPresentation.actionLabel}
            onAction={handleActiveEmptyAction}
            actionDisabled={
              activeEmptyPresentation.kind === 'awaitingIngest' ||
              activeEmptyPresentation.kind === 'caughtUp'
                ? runNowDisabled
                : false
            }
          />
        ) : (
          <PaginatedReconListPanel
            loadedCount={posts.length}
            total={recon.posts.total}
            hasNextPage={Boolean(recon.posts.hasNextPage)}
            isFetchingNextPage={recon.posts.isFetchingNextPage}
            isFetchNextPageError={Boolean(recon.posts.isFetchNextPageError)}
            onLoadMore={() => void recon.posts.fetchNextPage()}
            agePreset={agePreset}
            sortField={sortField}
            onClearFilters={handleClearReconFilters}
          >
            <ReconAnimatedPostList
              posts={posts}
              holdMap={holdById}
              holdDirection="toProcessed"
              enteringPostIds={enteringPostIds}
              prefersReducedMotion={prefersReducedMotion}
              variant="active"
              updatingPostId={recon.updatingPostId}
              onDraft={openPrompterFromPost}
              onLogReply={openLogReplyFromPost}
              onGoodPick={(post) => void handleGoodPick(post)}
              onDismiss={setDismissingPost}
            />
          </PaginatedReconListPanel>
        )}
      </PageCard>

      <PageCard className="min-w-0 space-y-4">
        <button
          type="button"
          onClick={() => setProcessedOpen((prev) => !prev)}
          className={cn(
            'flex w-full items-center gap-2 text-left hover:bg-gray-100/80 dark:hover:bg-gray-800/60',
            pbFocusVisibleRingClassName
          )}
          aria-expanded={processedOpen}
          aria-controls={RECON_PROCESSED_PANEL_ID}
        >
          <ChevronRight
            className={cn(
              'h-5 w-5 shrink-0 text-gray-400',
              !prefersReducedMotion && 'transition-transform duration-200 ease-out',
              processedOpen && 'rotate-90'
            )}
            aria-hidden
          />
          <h2
            id={processedHeadingId}
            className="min-w-0 flex-1 text-lg font-semibold text-gray-900 dark:text-white"
          >
            Processed
          </h2>
          <span
            className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium tabular-nums text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            aria-hidden
          >
            {processedCountBadge}
          </span>
          <span className="sr-only">{processedCountBadge} processed posts</span>
        </button>
        <motion.div
          id={RECON_PROCESSED_PANEL_ID}
          role="region"
          aria-labelledby={processedHeadingId}
          aria-hidden={!processedOpen}
          inert={!processedOpen ? true : undefined}
          initial={false}
          animate={
            prefersReducedMotion
              ? { height: processedOpen ? 'auto' : 0, opacity: processedOpen ? 1 : 0 }
              : processedOpen
                ? 'visible'
                : 'hidden'
          }
          variants={{
            visible: {
              height: 'auto',
              opacity: 1,
              transition: { duration: 0.2, ease: 'easeOut' },
            },
            hidden: {
              height: 0,
              opacity: 0,
              transition: { duration: 0.2, ease: 'easeOut' },
            },
          }}
          className={cn('overflow-hidden', !processedOpen && 'pointer-events-none')}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Posts you actioned or dismissed, plus feedback on good and bad picks. Restore any item
              to return it to the active feed.
            </p>
            {processedPosts.length === 0 ? (
              <p className="text-sm text-gray-500">No processed posts yet.</p>
            ) : (
              <PaginatedReconListPanel
                loadedCount={processedPosts.length}
                total={recon.processedPosts.total}
                hasNextPage={Boolean(recon.processedPosts.hasNextPage)}
                isFetchingNextPage={recon.processedPosts.isFetchingNextPage}
                isFetchNextPageError={Boolean(recon.processedPosts.isFetchNextPageError)}
                onLoadMore={() => void recon.processedPosts.fetchNextPage()}
                agePreset={agePreset}
                sortField={sortField}
                onClearFilters={handleClearReconFilters}
              >
                <ReconAnimatedPostList
                  posts={processedPosts}
                  holdMap={holdById}
                  holdDirection="toActive"
                  enteringPostIds={enteringPostIds}
                  prefersReducedMotion={prefersReducedMotion}
                  variant="processed"
                  updatingPostId={recon.updatingPostId}
                  onDraft={openPrompterFromPost}
                  onLogReply={openLogReplyFromPost}
                  onGoodPick={(post) => void handleGoodPick(post)}
                  onDismiss={setDismissingPost}
                  onRestore={(post) => void handlePostStatus(post, 'NEW')}
                />
              </PaginatedReconListPanel>
            )}
          </div>
        </motion.div>
      </PageCard>

      <PageCard className="min-w-0 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Follow suggestions</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Accounts followed by multiple tracked connections, ranked for brand alignment.
        </p>
        {suggestions.length === 0 ? (
          <p className="text-sm text-gray-500">No follow suggestions yet.</p>
        ) : (
          <PaginatedReconListPanel
            loadedCount={suggestions.length}
            total={recon.followSuggestions.total}
            hasNextPage={Boolean(recon.followSuggestions.hasNextPage)}
            isFetchingNextPage={recon.followSuggestions.isFetchingNextPage}
            isFetchNextPageError={Boolean(recon.followSuggestions.isFetchNextPageError)}
            onLoadMore={() => void recon.followSuggestions.fetchNextPage()}
          >
            {suggestions.map((suggestion) => (
              <FollowSuggestionRow
                key={suggestion.id}
                suggestion={suggestion}
                isUpdating={recon.updateFollowSuggestion.isPending}
                isProposing={proposingSuggestionId === suggestion.id}
                onOpenConfidence={() => setConfidenceSuggestionId(suggestion.id)}
                onAdd={() => void handleAddSuggestion(suggestion)}
                onDismiss={() => setDismissingSuggestion(suggestion)}
              />
            ))}
          </PaginatedReconListPanel>
        )}
      </PageCard>

      <FollowSuggestionConfidenceModal
        isOpen={confidenceSuggestionId !== null}
        suggestion={confidenceSuggestion}
        isExplaining={recon.explainFollowSuggestionConfidence.isPending}
        isSubmittingFeedback={recon.submitFollowSuggestionConfidenceFeedback.isPending}
        onClose={() => setConfidenceSuggestionId(null)}
        onExplain={async () => {
          if (!confidenceSuggestionId) return;
          try {
            await recon.explainFollowSuggestionConfidence.mutateAsync(confidenceSuggestionId);
            showToast({ type: 'success', title: 'Confidence explanation generated' });
          } catch (err) {
            showToast({
              type: 'error',
              title: err instanceof Error ? err.message : 'Explain failed',
            });
          }
        }}
        onSubmitFeedback={async (body) => {
          if (!confidenceSuggestionId) return;
          try {
            await recon.submitFollowSuggestionConfidenceFeedback.mutateAsync({
              suggestionId: confidenceSuggestionId,
              body,
            });
            showToast({ type: 'success', title: 'Calibration feedback saved' });
          } catch (err) {
            showToast({
              type: 'error',
              title: err instanceof Error ? err.message : 'Feedback failed',
            });
          }
        }}
      />

      <PageCard className="min-w-0 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Run history</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Click a run to inspect progress, activity log, and error details.
        </p>
        {runsTotal === 0 && !recon.runs.isLoading ? (
          <p className="text-sm text-gray-500">No runs yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/60">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                    Trigger
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                    Connections
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                    Posts
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                    Suggestions
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                    API calls
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                    Finished
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                    Error
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {runs.map((run) => (
                  <tr
                    key={run.id}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      'cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-900/40',
                      pbFocusVisibleRingClassName,
                      selectedRunId === run.id && 'bg-blue-50/60 dark:bg-blue-950/20'
                    )}
                    onClick={() => setSelectedRunId(run.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedRunId(run.id);
                      }
                    }}
                  >
                    <td className="px-4 py-3 font-mono text-xs">{run.status}</td>
                    <td className="px-4 py-3">{run.trigger}</td>
                    <td className="px-4 py-3">
                      {run.connectionsSucceeded}/{run.connectionsFailed}/{run.connectionsTotal}
                    </td>
                    <td className="px-4 py-3">
                      {run.postsScored}/{run.postsDiscovered}
                    </td>
                    <td className="px-4 py-3">{run.followSuggestionsCreated}</td>
                    <td className="px-4 py-3">{run.apiCallsUsed}</td>
                    <td className="px-4 py-3">{formatPersonalBrandingDateTime(run.finishedAt)}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-xs text-red-600 dark:text-red-300">
                      {run.errorSummary || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {runsTotal > runsPageSize ? (
          <nav
            className="flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700"
            aria-label="Run history pagination"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Page {runsPage} of {runsTotalPages} · {runsTotal} runs
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setRunsPage((page) => Math.max(1, page - 1))}
                disabled={runsPage <= 1 || recon.runs.isFetching}
                aria-label="Previous run history page"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setRunsPage((page) => page + 1)}
                disabled={!recon.runs.data?.hasMore || recon.runs.isFetching}
                aria-label="Next run history page"
              >
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          </nav>
        ) : null}
      </PageCard>

      <ReconRunDetailDrawer
        open={Boolean(selectedRunId)}
        run={runDetail}
        isLoading={selectedRunDetail.detail.isLoading}
        isStartingRun={recon.startRun.isPending}
        pendingAction={pendingRunAction}
        onClose={closeRunDrawer}
        onStartRun={handleStartRun}
        onPause={selectedRunId ? () => void handleRunControl('pause', selectedRunId) : undefined}
        onResume={selectedRunId ? () => void handleRunControl('resume', selectedRunId) : undefined}
        onCancel={selectedRunId ? () => void handleRunControl('cancel', selectedRunId) : undefined}
      />

      <RejectWithFeedbackModal
        isOpen={Boolean(dismissingSuggestion)}
        title="Dismiss suggestion"
        submitLabel="Dismiss"
        subjectLabel={
          dismissingSuggestion
            ? (dismissingSuggestion.displayName ?? `@${dismissingSuggestion.xUsername}`)
            : undefined
        }
        promptText="Tell the system why this account isn't a good follow so future Recon Feed runs can improve."
        isSubmitting={recon.updateFollowSuggestion.isPending}
        onClose={() => setDismissingSuggestion(null)}
        onSubmit={(feedbackText) => {
          void submitDismissSuggestion(feedbackText);
        }}
      />

      <RejectWithFeedbackModal
        isOpen={Boolean(dismissingPost)}
        title="Dismiss post"
        submitLabel="Dismiss"
        subjectLabel={
          dismissingPost
            ? `${dismissingPost.connectionName ?? 'Connection'}${
                dismissingPost.authorUsername ? ` @${dismissingPost.authorUsername}` : ''
              }`
            : undefined
        }
        promptText="Tell the system why this post is not worth engaging with so future Recon Feed scoring can improve."
        categories={RECON_DISMISS_CATEGORIES}
        isSubmitting={recon.updatePost.isPending}
        onClose={() => setDismissingPost(null)}
        onSubmit={(feedbackText, feedbackCategory) => {
          void submitDismissPost(feedbackText, feedbackCategory);
        }}
      />

      <ConnectionEditorDialog
        isOpen={connectionEditorOpen}
        onClose={closeConnectionEditor}
        prefill={connectionPrefill}
        title="Add suggested connection"
        subtitle={
          addingSuggestion
            ? `Review AI-suggested defaults for @${addingSuggestion.xUsername} before adding to your directory.`
            : null
        }
        draftSummary={connectionDraftSummary}
        isSubmitting={recon.updateFollowSuggestion.isPending}
        onCreate={submitAddedConnection}
        onUpdate={async () => {
          /* create-only flow from recon suggestions */
        }}
      />

      <LogInteractionDialog
        isOpen={Boolean(checkInConnection)}
        onClose={() => {
          setCheckInConnection(null);
          setPendingLog(null);
          setLogReplyPostId(null);
        }}
        connectionName={checkInConnection?.name ?? ''}
        followUpCadenceDays={checkInConnection?.followUpCadenceDays}
        isSubmitting={rolodex.logInteraction.isPending || recon.updatePost.isPending}
        initialCreatorText={pendingLog?.creatorText}
        initialResponseVectorId={pendingLog?.vector.id}
        initialEvidenceUrl={pendingLog?.evidenceUrl}
        initialChannel={pendingLog?.channel}
        initialPlatform={pendingLog?.platform}
        initialPlatformPostId={pendingLog?.platformPostId}
        onSubmit={async (body) => {
          if (!checkInConnection) return;
          try {
            await rolodex.logInteraction.mutateAsync({ connectionId: checkInConnection.id, body });
            if (logReplyPostId) {
              const reconPost = findReconPost(logReplyPostId);
              if (reconPost) beginStatusMoveIfNeeded(reconPost, 'ACTIONED');
              try {
                await recon.updatePost.mutateAsync({
                  postId: logReplyPostId,
                  body: { status: 'ACTIONED' },
                });
                setLogReplyPostId(null);
              } catch (err) {
                clearStatusMove(logReplyPostId);
                showToast({
                  type: 'error',
                  title:
                    err instanceof Error ? err.message : 'Could not mark Recon post as actioned',
                });
                throw err;
              }
            }
            showToast({ type: 'success', title: 'Interaction logged' });
            setPendingLog(null);
            setCheckInConnection(null);
          } catch (err) {
            showToast({ type: 'error', title: err instanceof Error ? err.message : 'Save failed' });
            throw err;
          }
        }}
      />

      <RolodexPrompterDrawer
        open={Boolean(prompterConnection)}
        connection={prompterConnection}
        profiles={profiles}
        defaultProfileId={selectedProfileId}
        activeRun={activeRun ?? null}
        isGenerating={
          replyRuns.startRun.isPending ||
          activeRun?.status === 'QUEUED' ||
          activeRun?.status === 'RUNNING'
        }
        isUpdatingSuggestion={replyRuns.updateSuggestion.isPending}
        initialCreatorText={prompterPrefill?.creatorText ?? pendingLog?.creatorText}
        initialInteractionIntent={prompterPrefill?.interactionIntent}
        initialIntentAction={prompterPrefill?.preferredIntentAction}
        initialAuthorHandle={prompterPrefill?.authorHandle}
        initialEvidenceUrl={prompterPrefill?.evidenceUrl ?? pendingLog?.evidenceUrl}
        initialPlatformPostId={prompterPrefill?.platformPostId ?? pendingLog?.platformPostId}
        initialLearningCost={prompterPrefill?.learningCost}
        onClose={() => {
          setPrompterConnection(null);
          setPrompterPrefill(null);
          setActiveRunId(null);
          setPendingLog(null);
        }}
        onGenerate={(payload, draft, resolved) => {
          if (!prompterConnection) return;
          void startReplyGeneration(prompterConnection, payload, draft, resolved);
        }}
        onAcceptSuggestion={(suggestion, creatorText, meta) => {
          if (!prompterConnection) return;
          void handleAcceptSuggestion(prompterConnection, suggestion, creatorText, meta);
        }}
        onRejectSuggestion={(suggestion, feedback, feedbackCategory) => {
          void handleRejectSuggestion(suggestion, feedback, feedbackCategory);
        }}
      />

      <ManualPrompterPasteDialog
        open={pasteDialogOpen}
        connections={connections}
        isCreatingConnection={rolodex.createConnection.isPending}
        onClose={() => setPasteDialogOpen(false)}
        onOpenPrompter={(connection, prefill) => {
          openPrompter(connection, prefill);
        }}
        onCreateConnection={async (body) => rolodex.createConnection.mutateAsync(body)}
        showToast={showToast}
      />
    </div>
  );
}
