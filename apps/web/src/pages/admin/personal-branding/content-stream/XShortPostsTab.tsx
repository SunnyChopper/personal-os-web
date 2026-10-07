import { useState } from 'react';
import { ChevronDown, ChevronUp, ThumbsDown, ThumbsUp } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { InsetPanel } from '@/components/molecules/personal-branding/InsetPanel';
import ContentStreamProgressStrip from '@/components/molecules/personal-branding/ContentStreamProgressStrip';
import {
  ContentStreamPostCardSkeleton,
  resolveContentStreamSkeletonCount,
} from '@/components/molecules/personal-branding/ContentStreamPostCardSkeleton';
import type { Toast } from '@/hooks/use-toast';
import type { ContentStreamHook } from '@/hooks/useContentStream';
import { useContentStreamJob } from '@/hooks/useContentStreamJob';
import { useTerminalJobFailureAlert } from '@/hooks/useTerminalJobFailureAlert';
import {
  contentStreamCtaProgressOnly,
  contentStreamJobInProgress,
  contentStreamProgressPanelJob,
} from '@/lib/personal-branding/content-stream-progress';
import { cn } from '@/lib/utils';
import {
  resolveXShortPostsBodyState,
  resolveXShortPostsJobActive,
} from './x-short-posts-body-state';
import {
  SOCIAL_CURRENCY_ANGLE_LABELS,
  type ContentStreamPost,
  type ContentStreamPrimarySource,
  type ContentStreamThemeSource,
  type ContentStreamThemeSourcePost,
} from '@/types/api/personal-branding.dto';
import { personalBrandingService } from '@/services/personal-branding.service';
import {
  formatMediaBriefForClipboard,
  MEDIA_BRIEF_KIND_LABELS,
} from '@/lib/personal-branding/media-brief';
import { PageCard, SectionIntro } from '../PersonalBrandingPageTemplate';

interface XShortPostsTabProps {
  stream: ContentStreamHook;
  showToast: (toast: Omit<Toast, 'id'>) => void;
  activeJobId: string | null;
  onJobIdChange: (jobId: string | null) => void;
}

function formatPrimarySourceLabel(source: ContentStreamPrimarySource): string {
  const prefix =
    source.kind === 'recon' || source.kind === 'now'
      ? 'X'
      : source.kind === 'radar'
        ? 'Trend'
        : source.kind === 'growth'
          ? 'Growth'
          : 'Vault';
  const label = source.label?.trim();
  return label ? `From ${prefix} · ${label}` : `From ${prefix}`;
}

function formatThemeSourceLabel(theme: ContentStreamThemeSource): string {
  return `Theme: ${theme.conceptName} · ${theme.postCount} posts · ${theme.authorCount} authors`;
}

function ThemeAttribution({ post }: { post: ContentStreamPost }) {
  const [expanded, setExpanded] = useState(false);
  const [sources, setSources] = useState<ContentStreamThemeSourcePost[] | null>(null);
  const [loading, setLoading] = useState(false);

  if (post.themeSource) {
    const theme = post.themeSource;
    const toggle = async () => {
      const next = !expanded;
      setExpanded(next);
      if (next && sources === null && !loading) {
        setLoading(true);
        try {
          const response = await personalBrandingService.getContentStreamThemeSources(post.id);
          setSources(response.posts);
        } catch {
          setSources([]);
        } finally {
          setLoading(false);
        }
      }
    };
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => void toggle()}
          className="inline-flex items-center gap-1 rounded-md bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-900 hover:bg-violet-200/80 dark:bg-violet-950/50 dark:text-violet-200 dark:hover:bg-violet-900/40"
        >
          {formatThemeSourceLabel(theme)}
          {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
        {expanded ? (
          <div className="rounded-lg border border-dashed border-violet-300/70 bg-violet-50/50 p-3 text-xs dark:border-violet-800/50 dark:bg-violet-950/20">
            <p className="text-gray-600 dark:text-gray-400">{theme.stanceSummary}</p>
            {loading ? <p className="mt-2 text-gray-500">Loading sources…</p> : null}
            {sources?.length ? (
              <ul className="mt-2 space-y-2">
                {sources.map((source) => (
                  <li key={source.id} className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">
                      @{source.authorUsername ?? 'unknown'}
                      {source.stance ? ` · ${source.stance}` : ''}
                    </span>
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-1 underline decoration-dotted"
                      >
                        view
                      </a>
                    ) : null}
                    <p className="mt-0.5 whitespace-pre-wrap">{source.claimText || source.text}</p>
                  </li>
                ))}
              </ul>
            ) : null}
            {!loading && sources && sources.length === 0 ? (
              <p className="mt-2 text-gray-500">No contributing posts found.</p>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  if (!post.primarySource) {
    return null;
  }

  return (
    <p className="text-xs text-gray-600 dark:text-gray-400">
      {post.primarySource.url ? (
        <a
          href={post.primarySource.url}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-dotted underline-offset-2 hover:text-gray-900 dark:hover:text-gray-200"
        >
          {formatPrimarySourceLabel(post.primarySource)}
        </a>
      ) : (
        formatPrimarySourceLabel(post.primarySource)
      )}
    </p>
  );
}

function PostCard({
  post,
  onFeedback,
  updating,
}: {
  post: ContentStreamPost;
  onFeedback: (postId: string, feedback: 'up' | 'down') => void;
  updating: boolean;
}) {
  const angleLabel =
    SOCIAL_CURRENCY_ANGLE_LABELS[post.socialCurrencyAngle] ?? post.socialCurrencyAngle;
  const hookOverall = post.engagementScores?.overall;
  const hookPercent = hookOverall != null ? `${Math.round(hookOverall * 100)}%` : null;

  return (
    <InsetPanel
      className={cn(
        'space-y-3',
        post.status === 'kept' && 'border-green-300/60 dark:border-green-800/60',
        post.status === 'discarded' && 'opacity-60'
      )}
      padding="standard"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-900 dark:bg-blue-950/60 dark:text-blue-200">
          {angleLabel}
        </span>
        {hookPercent ? (
          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200">
            Hook {hookPercent}
          </span>
        ) : null}
        {post.status !== 'pending' ? (
          <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{post.status}</span>
        ) : null}
      </div>
      <ThemeAttribution post={post} />
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900 dark:text-gray-100">
        {post.body}
      </p>
      {post.angleRationale ? (
        <p className="text-xs text-gray-600 dark:text-gray-400">{post.angleRationale}</p>
      ) : null}
      {post.mediaBrief ? (
        <div className="rounded-lg border border-dashed border-sky-300/70 bg-sky-50/60 p-3 text-xs dark:border-sky-800/50 dark:bg-sky-950/20">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-sky-900 dark:text-sky-200">Media brief</p>
            <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sky-900 dark:bg-sky-950/60 dark:text-sky-200">
              {MEDIA_BRIEF_KIND_LABELS[post.mediaBrief.kind]}
            </span>
          </div>
          <p className="mt-1 text-gray-700 dark:text-gray-300">{post.mediaBrief.concept}</p>
          <p className="mt-1 text-gray-600 dark:text-gray-400">{post.mediaBrief.visualBrief}</p>
          {post.mediaBrief.altText ? (
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Alt text: {post.mediaBrief.altText}
            </p>
          ) : null}
          {post.mediaBrief.captionHook ? (
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Caption hook: {post.mediaBrief.captionHook}
            </p>
          ) : null}
          {post.mediaBrief.carouselSlides?.length ? (
            <ul className="mt-1 list-inside list-decimal text-gray-600 dark:text-gray-400">
              {post.mediaBrief.carouselSlides.map((slide) => (
                <li key={slide}>{slide}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      {post.memeSuggestion ? (
        <div className="rounded-lg border border-dashed border-amber-300/70 bg-amber-50/60 p-3 text-xs dark:border-amber-800/50 dark:bg-amber-950/20">
          <p className="font-medium text-amber-900 dark:text-amber-200">
            Meme idea{post.memeSuggestion.formatName ? ` — ${post.memeSuggestion.formatName}` : ''}
          </p>
          <p className="mt-1 text-gray-700 dark:text-gray-300">{post.memeSuggestion.concept}</p>
          <p className="mt-1 text-gray-600 dark:text-gray-400">{post.memeSuggestion.visualBrief}</p>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={updating}
          onClick={() => onFeedback(post.id, 'up')}
          aria-label="Thumbs up"
        >
          <ThumbsUp className={cn('size-4', post.status === 'kept' && 'text-green-600')} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={updating}
          onClick={() => onFeedback(post.id, 'down')}
          aria-label="Thumbs down"
        >
          <ThumbsDown className={cn('size-4', post.status === 'discarded' && 'text-red-500')} />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => navigator.clipboard.writeText(post.body)}
        >
          Copy
        </Button>
        {post.mediaBrief ? (
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                navigator.clipboard.writeText(formatMediaBriefForClipboard(post.mediaBrief!))
              }
            >
              Copy brief
            </Button>
            {post.mediaBrief.altText?.trim() ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => navigator.clipboard.writeText(post.mediaBrief!.altText!.trim())}
              >
                Copy alt text
              </Button>
            ) : null}
          </>
        ) : null}
      </div>
    </InsetPanel>
  );
}

export default function XShortPostsTab({
  stream,
  showToast,
  activeJobId,
  onJobIdChange,
}: XShortPostsTabProps) {
  const posts = stream.posts.data?.data ?? [];
  const jobQuery = useContentStreamJob(
    activeJobId,
    (job) => {
      if (job.status === 'succeeded') {
        showToast({
          type: 'success',
          title: `Generated ${job.createdPostIds.length} post(s)`,
        });
        void (async () => {
          await stream.posts.refetch();
          await stream.settings.refetch();
          onJobIdChange(null);
        })();
      } else if (job.status === 'failed') {
        showToast({
          type: 'error',
          title: job.error ?? 'Generation failed',
        });
      }
    },
    () => {
      showToast({ type: 'error', title: 'Generation timed out — check back shortly' });
      onJobIdChange(null);
    }
  );

  useTerminalJobFailureAlert({
    feature: 'contentStream',
    jobId: activeJobId,
    status: jobQuery.data?.status,
    error: jobQuery.data?.error,
    stage: jobQuery.data?.stage,
  });

  const isJobActive = resolveXShortPostsJobActive(
    stream.generate.isPending,
    activeJobId,
    jobQuery.data?.status,
    jobQuery.isLoading
  );

  const isGenerating =
    isJobActive ||
    contentStreamJobInProgress(jobQuery.data) ||
    Boolean(activeJobId && jobQuery.isLoading);

  const showCtaProgressOnly = contentStreamCtaProgressOnly(
    jobQuery.data,
    stream.generate.isPending
  );
  const progressStripClassName = 'w-full min-w-0 sm:min-w-[14rem] sm:max-w-sm';

  const bodyState = resolveXShortPostsBodyState({
    postCount: posts.length,
    isJobActive,
  });

  const skeletonCount = resolveContentStreamSkeletonCount(stream.settings.data);
  const budgetRemaining = stream.settings.data?.remainingDailyBudget ?? 0;
  const budgetExhausted = budgetRemaining <= 0;

  const handleGenerate = async () => {
    try {
      const start = await stream.generate.mutateAsync({});
      onJobIdChange(start.jobId);
      showToast({ type: 'info', title: 'Generating short posts…' });
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Failed to start generation',
      });
    }
  };

  const handleClearAll = async () => {
    if (posts.length === 0) {
      return;
    }
    const confirmed = window.confirm(
      'Delete all Content Stream drafts? This cannot be undone and frees linked sources for reuse.'
    );
    if (!confirmed) {
      return;
    }
    try {
      const result = await stream.clearPosts.mutateAsync();
      showToast({
        type: 'success',
        title: `Cleared ${result.deletedCount} draft(s)`,
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Failed to clear drafts',
      });
    }
  };

  const handleFeedback = async (postId: string, feedback: 'up' | 'down') => {
    try {
      await stream.feedback.mutateAsync({ postId, feedback });
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Feedback failed',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white/90 p-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90">
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">X short-post stream</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {stream.settings.data?.remainingDailyBudget ?? 0} of{' '}
            {stream.settings.data?.postsPerDay ?? 5} daily posts remaining
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClearAll}
            disabled={posts.length === 0 || stream.clearPosts.isPending || isGenerating}
          >
            {stream.clearPosts.isPending ? 'Clearing…' : 'Clear all drafts'}
          </Button>
          {showCtaProgressOnly ? (
            <ContentStreamProgressStrip
              job={contentStreamProgressPanelJob(jobQuery.data, stream.generate.isPending)}
              className={progressStripClassName}
            />
          ) : (
            <div className="flex min-w-0 flex-col items-stretch gap-2 sm:items-end">
              {jobQuery.data?.status === 'failed' ? (
                <ContentStreamProgressStrip
                  job={jobQuery.data}
                  className={progressStripClassName}
                />
              ) : null}
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={budgetExhausted || isGenerating}
                title={budgetExhausted ? 'Daily post budget exhausted' : undefined}
              >
                Generate now
              </Button>
            </div>
          )}
        </div>
      </div>

      {bodyState === 'generating' ? (
        <div
          className="space-y-3"
          aria-busy="true"
          aria-live="polite"
          data-testid="content-stream-draft-skeleton-list"
        >
          {Array.from({ length: skeletonCount }, (_, index) => (
            <ContentStreamPostCardSkeleton key={`generating-draft-${index}`} />
          ))}
        </div>
      ) : bodyState === 'empty' ? (
        <PageCard>
          <SectionIntro
            title="No posts yet"
            description="Configure your X username in Settings, then generate your first batch of short posts."
          />
        </PageCard>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onFeedback={handleFeedback}
              updating={stream.feedback.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
