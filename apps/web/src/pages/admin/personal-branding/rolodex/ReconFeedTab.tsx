import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '@/components/atoms/Button';
import FollowSuggestionConfidenceModal from '@/components/molecules/personal-branding/FollowSuggestionConfidenceModal';
import EngagementRationale from '@/components/molecules/personal-branding/EngagementRationale';
import RecommendedActionBadge from '@/components/molecules/personal-branding/RecommendedActionBadge';
import RejectWithFeedbackModal from '@/components/molecules/personal-branding/RejectWithFeedbackModal';
import ReconFeedRunMonitor from '@/components/organisms/personal-branding/ReconFeedRunMonitor';
import type { Toast } from '@/hooks/use-toast';
import type { useRolodex } from '@/hooks/useRolodex';
import { useActiveReplyRuns, useRolodexReplyRuns } from '@/hooks/useRolodexReplyRuns';
import {
  useReconFeed,
  useReconRunDetail,
  RECON_RUNS_PAGE_SIZE,
  type ReconPostListFilters,
} from '@/hooks/useReconFeed';
import { extractErrorMessage } from '@/lib/react-query/error-utils';
import {
  buildReconPrompterSeed,
  ctaLabelForReconPost,
  type ReconPrompterPrefill,
} from '@/lib/personal-branding/recon-prompter-seed';
import { nextActionCueForRecommendedAction } from '@/lib/personal-branding/recommended-action-display';
import { cn } from '@/lib/utils';
import type {
  CreateCreatorConnectionInput,
  CreatorConnection,
  FollowSuggestion,
  ReconPost,
  ReconPostStatus,
  ReplyGenerationDraft,
  ReplySuggestion,
} from '@/types/api/personal-branding.dto';
import { RECON_POST_STATUS_LABELS } from '@/types/api/personal-branding.dto';
import { PageCard } from '../PersonalBrandingPageTemplate';
import { linkAccentClassName, selectableChipClassName } from '../personal-branding-ui';
import ConnectionEditorDialog from './ConnectionEditorDialog';
import EntityTypeBadge from './EntityTypeBadge';
import LogInteractionDialog from './LogInteractionDialog';
import ReconRunDetailDrawer from './ReconRunDetailDrawer';
import RolodexPrompterDrawer from './RolodexPrompterDrawer';

type RolodexHook = ReturnType<typeof useRolodex>;

type ReconAgePreset = 'all' | '1d' | '2d' | '3d' | '7d' | '2wk';
type ReconSortField = 'relevanceScore' | 'postedAt';

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

function postedAfterForPreset(preset: ReconAgePreset): string | undefined {
  if (preset === 'all') return undefined;
  const days =
    preset === '1d' ? 1 : preset === '2d' ? 2 : preset === '3d' ? 3 : preset === '7d' ? 7 : 14;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function scoreBadgeClass(score?: number | null): string {
  if (score === null || score === undefined)
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  if (score >= 0.75) return 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300';
  if (score >= 0.5) return 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300';
  return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
}

function ReconPostRow({
  post,
  isUpdating,
  variant = 'active',
  onStatus,
  onDraft,
  onRestore,
}: {
  post: ReconPost;
  isUpdating: boolean;
  variant?: 'active' | 'processed';
  onStatus: (status: ReconPostStatus) => void;
  onDraft: () => void;
  onRestore?: () => void;
}) {
  const draftLabel = ctaLabelForReconPost(post);
  const nextActionCue = nextActionCueForRecommendedAction(post.recommendedAction);
  const draftAriaLabel = `${draftLabel} for ${post.connectionName ?? 'connection'}${
    post.authorUsername ? ` @${post.authorUsername}` : ''
  }`;
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 p-4 dark:border-gray-700',
        variant === 'processed' && 'opacity-80'
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white">
              {post.connectionName ?? 'Connection'}
            </span>
            {post.authorUsername ? (
              <span className="text-xs text-gray-500">@{post.authorUsername}</span>
            ) : null}
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                scoreBadgeClass(post.relevanceScore)
              )}
            >
              {post.relevanceScore !== null && post.relevanceScore !== undefined
                ? `${(post.relevanceScore * 100).toFixed(0)}% relevance`
                : 'Unscored'}
            </span>
            <RecommendedActionBadge action={post.recommendedAction} />
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
            {post.text}
          </p>
          {nextActionCue ? (
            <p className="mt-2 text-xs font-medium text-gray-700 dark:text-gray-300">
              {nextActionCue}
            </p>
          ) : null}
          <EngagementRationale
            lead={post.relevanceRationale}
            bullets={post.relevanceRationaleBullets}
            className="mt-2"
            leadClassName="text-xs text-gray-500 dark:text-gray-400"
            bulletClassName="text-xs text-gray-500 dark:text-gray-400"
          />
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span>{RECON_POST_STATUS_LABELS[post.status]}</span>
            <span>{formatDate(post.postedAt)}</span>
            {post.url ? (
              <a href={post.url} target="_blank" rel="noreferrer" className={linkAccentClassName}>
                View post
              </a>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Button
            type="button"
            size="sm"
            aria-label={draftAriaLabel}
            disabled={isUpdating}
            onClick={onDraft}
            className="inline-flex items-center gap-1"
          >
            <Sparkles className="size-3.5 shrink-0" />
            {draftLabel}
          </Button>
          <div className="flex flex-wrap justify-end gap-1">
            {(['REVIEWED', 'ACTIONED', 'DISMISSED'] as ReconPostStatus[]).map((status) => (
              <Button
                key={status}
                type="button"
                size="sm"
                variant={post.status === status ? 'primary' : 'secondary'}
                disabled={isUpdating || post.status === status}
                onClick={() => onStatus(status)}
              >
                {RECON_POST_STATUS_LABELS[status]}
              </Button>
            ))}
          </div>
          {variant === 'processed' && onRestore ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={isUpdating}
              onClick={onRestore}
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
    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
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
        <div className="flex gap-1">
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
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{suggestion.bio}</p>
      ) : null}
      {suggestion.rationale ? (
        <p className="mt-2 text-xs text-gray-500">{suggestion.rationale}</p>
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

function PaginatedReconListPanel({
  loadedCount,
  total,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  children,
}: {
  loadedCount: number;
  total: number;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Showing {loadedCount} of {total}
      </p>
      <div className="max-h-[32rem] overflow-y-auto pr-1">
        <div className="grid gap-3">{children}</div>
      </div>
      {hasNextPage ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={isFetchingNextPage}
          onClick={onLoadMore}
        >
          {isFetchingNextPage ? 'Loading…' : 'Load more'}
        </Button>
      ) : null}
    </div>
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
  const [runsPage, setRunsPage] = useState(1);
  const [prompterConnection, setPrompterConnection] = useState<CreatorConnection | null>(null);
  const [prompterPrefill, setPrompterPrefill] = useState<ReconPrompterPrefill | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [checkInConnection, setCheckInConnection] = useState<CreatorConnection | null>(null);
  const [pendingLog, setPendingLog] = useState<{
    connection: CreatorConnection;
    creatorText: string;
    vector: ReplySuggestion;
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

  const posts = recon.posts.items;
  const processedPosts = recon.processedPosts.items;
  const suggestions = recon.followSuggestions.items;
  const runs = recon.runs.data?.data ?? [];
  const runsTotal = recon.runs.data?.total ?? 0;
  const runsPageSize = recon.runs.data?.pageSize ?? RECON_RUNS_PAGE_SIZE;
  const runsTotalPages = Math.max(1, Math.ceil(runsTotal / runsPageSize));
  const [dismissingSuggestion, setDismissingSuggestion] = useState<FollowSuggestion | null>(null);
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

  const closeConnectionEditor = () => {
    setConnectionEditorOpen(false);
    setAddingSuggestion(null);
    setConnectionPrefill(null);
    setConnectionDraftSummary(null);
  };

  const handlePostStatus = async (postId: string, status: ReconPostStatus) => {
    try {
      await recon.updatePost.mutateAsync({ postId, body: { status } });
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Update failed',
      });
    }
  };

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
      setPrompterConnection(connection);
      setPrompterPrefill(prefill);
      setActiveRunId(null);
    },
    [connections, showToast]
  );

  const startReplyGeneration = async (
    connection: CreatorConnection,
    payload: {
      creatorText: string;
      platform: import('@/types/api/personal-branding.dto').BrandPlatform;
      interactionIntent?: string;
    },
    draft: ReplyGenerationDraft,
    resolved: { provider: string; model: string }
  ) => {
    try {
      const run = await replyRuns.startRun.mutateAsync({
        connectionId: connection.id,
        platform: payload.platform,
        creatorText: payload.creatorText,
        profileId: draft.profileId || undefined,
        interactionIntent: payload.interactionIntent,
        mode: draft.mode,
        researchEnabled: draft.researchEnabled,
        provider: resolved.provider,
        model: resolved.model,
        reasoningEffort: draft.reasoningEffort ?? undefined,
        suggestionCount: draft.suggestionCount,
        suggestedParamsJson: draft as unknown as Record<string, unknown>,
      });
      setActiveRunId(run.id);
      if (draft.mode === 'AGENT') {
        showToast({ type: 'info', title: 'Agent run started — drafting in background' });
      }
      return run;
    } catch (err) {
      showToast({ type: 'error', title: err instanceof Error ? err.message : 'Generation failed' });
      throw err;
    }
  };

  const handleAcceptSuggestion = async (
    connection: CreatorConnection,
    suggestion: ReplySuggestion,
    creatorText: string
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
        evidenceUrl: activePrefill?.evidenceUrl ?? null,
        platform: 'x',
        platformPostId: activePrefill?.platformPostId ?? null,
        channel: 'x',
      });
      setCheckInConnection(connection);
      if (activePrefill?.reconPostId) {
        try {
          await recon.updatePost.mutateAsync({
            postId: activePrefill.reconPostId,
            body: { status: 'ACTIONED' },
          });
        } catch (err) {
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
    feedbackText: string | null
  ) => {
    try {
      await replyRuns.updateSuggestion.mutateAsync({
        suggestionId: suggestion.id,
        body: { status: 'REJECTED', feedbackText },
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

      <PageCard className="space-y-4">
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active feed</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              New posts awaiting review, ranked by LLM relevance for engagement traction.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-6">
            <div className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Age
              </span>
              <div className="flex flex-wrap gap-2">
                {RECON_AGE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setAgePreset(preset.value)}
                    className={cn(
                      selectableChipClassName(agePreset === preset.value),
                      'rounded-full px-3 py-1 text-xs'
                    )}
                    aria-pressed={agePreset === preset.value}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Sort by
              </span>
              <div className="flex flex-wrap gap-2">
                {RECON_SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSortField(option.value)}
                    className={cn(
                      selectableChipClassName(sortField === option.value),
                      'rounded-full px-3 py-1 text-xs'
                    )}
                    aria-pressed={sortField === option.value}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        {posts.length === 0 ? (
          <p className="text-sm text-gray-500">
            {agePreset === 'all'
              ? processedPosts.length > 0
                ? 'No new posts to review. Check Processed below or run ingest for fresh items.'
                : 'No recon posts yet. Run ingest after adding X handles.'
              : 'No new posts in this window. Try a wider age filter or run ingest.'}
          </p>
        ) : (
          <PaginatedReconListPanel
            loadedCount={posts.length}
            total={recon.posts.total}
            hasNextPage={Boolean(recon.posts.hasNextPage)}
            isFetchingNextPage={recon.posts.isFetchingNextPage}
            onLoadMore={() => void recon.posts.fetchNextPage()}
          >
            {posts.map((post) => (
              <ReconPostRow
                key={post.id}
                post={post}
                isUpdating={recon.updatingPostId === post.id}
                onDraft={() => openPrompterFromPost(post)}
                onStatus={(status) => void handlePostStatus(post.id, status)}
              />
            ))}
          </PaginatedReconListPanel>
        )}
      </PageCard>

      <PageCard className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Processed</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Posts you reviewed, actioned, or dismissed. Restore any item to return it to the active
            feed.
          </p>
        </div>
        {processedPosts.length === 0 ? (
          <p className="text-sm text-gray-500">No processed posts yet.</p>
        ) : (
          <PaginatedReconListPanel
            loadedCount={processedPosts.length}
            total={recon.processedPosts.total}
            hasNextPage={Boolean(recon.processedPosts.hasNextPage)}
            isFetchingNextPage={recon.processedPosts.isFetchingNextPage}
            onLoadMore={() => void recon.processedPosts.fetchNextPage()}
          >
            {processedPosts.map((post) => (
              <ReconPostRow
                key={post.id}
                post={post}
                variant="processed"
                isUpdating={recon.updatingPostId === post.id}
                onDraft={() => openPrompterFromPost(post)}
                onStatus={(status) => void handlePostStatus(post.id, status)}
                onRestore={() => void handlePostStatus(post.id, 'NEW')}
              />
            ))}
          </PaginatedReconListPanel>
        )}
      </PageCard>

      <PageCard className="space-y-4">
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

      <PageCard className="space-y-4">
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
                    className={cn(
                      'cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-900/40',
                      selectedRunId === run.id && 'bg-blue-50/60 dark:bg-blue-950/20'
                    )}
                    onClick={() => setSelectedRunId(run.id)}
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
                    <td className="px-4 py-3">{formatDate(run.finishedAt)}</td>
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
        }}
        connectionName={checkInConnection?.name ?? ''}
        followUpCadenceDays={checkInConnection?.followUpCadenceDays}
        isSubmitting={rolodex.logInteraction.isPending}
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
            showToast({ type: 'success', title: 'Interaction logged' });
            setPendingLog(null);
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
        isGenerating={replyRuns.startRun.isPending}
        isUpdatingSuggestion={replyRuns.updateSuggestion.isPending}
        initialCreatorText={prompterPrefill?.creatorText ?? pendingLog?.creatorText}
        initialInteractionIntent={prompterPrefill?.interactionIntent}
        initialAuthorHandle={prompterPrefill?.authorHandle}
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
        onAcceptSuggestion={(suggestion, creatorText) => {
          if (!prompterConnection) return;
          void handleAcceptSuggestion(prompterConnection, suggestion, creatorText);
        }}
        onRejectSuggestion={(suggestion, feedback) => {
          void handleRejectSuggestion(suggestion, feedback);
        }}
      />
    </div>
  );
}
