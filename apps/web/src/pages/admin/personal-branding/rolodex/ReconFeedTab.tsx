import { useMemo, useState, type ReactNode } from 'react';
import Button from '@/components/atoms/Button';
import FollowSuggestionConfidenceModal from '@/components/molecules/personal-branding/FollowSuggestionConfidenceModal';
import RejectWithFeedbackModal from '@/components/molecules/personal-branding/RejectWithFeedbackModal';
import ReconFeedRunMonitor from '@/components/organisms/personal-branding/ReconFeedRunMonitor';
import type { Toast } from '@/hooks/use-toast';
import { useReconFeed } from '@/hooks/useReconFeed';
import { extractErrorMessage } from '@/lib/react-query/error-utils';
import { cn } from '@/lib/utils';
import type {
  CreateCreatorConnectionInput,
  FollowSuggestion,
  ReconPost,
  ReconPostStatus,
} from '@/types/api/personal-branding.dto';
import {
  RECON_POST_STATUS_LABELS,
  RECON_RECOMMENDED_ACTION_LABELS,
} from '@/types/api/personal-branding.dto';
import { PageCard } from '../PersonalBrandingPageTemplate';
import { linkAccentClassName } from '../personal-branding-ui';
import ConnectionEditorDialog from './ConnectionEditorDialog';
import EntityTypeBadge from './EntityTypeBadge';

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
  onStatus,
}: {
  post: ReconPost;
  isUpdating: boolean;
  onStatus: (status: ReconPostStatus) => void;
}) {
  const actionLabel =
    RECON_RECOMMENDED_ACTION_LABELS[post.recommendedAction ?? ''] ?? post.recommendedAction ?? '—';
  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
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
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              {actionLabel}
            </span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
            {post.text}
          </p>
          {post.relevanceRationale ? (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {post.relevanceRationale}
            </p>
          ) : null}
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
        <div className="flex shrink-0 flex-wrap gap-1">
          {(['REVIEWED', 'ACTIONED', 'DISMISSED'] as ReconPostStatus[]).map((status) => (
            <Button
              key={status}
              type="button"
              size="sm"
              variant="secondary"
              disabled={isUpdating || post.status === status}
              onClick={() => onStatus(status)}
            >
              {RECON_POST_STATUS_LABELS[status]}
            </Button>
          ))}
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
            disabled={isUpdating}
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
}

export default function ReconFeedTab({ showToast }: ReconFeedTabProps) {
  const recon = useReconFeed();
  const [confidenceSuggestionId, setConfidenceSuggestionId] = useState<string | null>(null);

  const confidenceSuggestion = useMemo(() => {
    if (!confidenceSuggestionId) return null;
    return recon.followSuggestions.items.find((row) => row.id === confidenceSuggestionId) ?? null;
  }, [confidenceSuggestionId, recon.followSuggestions.items]);

  const loadError = useMemo(() => {
    const queries = [recon.posts, recon.followSuggestions, recon.runs];
    const failed = queries.find((q) => q.isError);
    if (!failed?.error) return null;
    return extractErrorMessage(failed.error, 'Failed to load Recon Feed');
  }, [recon.posts, recon.followSuggestions, recon.runs]);

  const posts = recon.posts.items;
  const suggestions = recon.followSuggestions.items;
  const runs = recon.runs.data?.data ?? [];
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

  const closeConnectionEditor = () => {
    setConnectionEditorOpen(false);
    setAddingSuggestion(null);
    setConnectionPrefill(null);
    setConnectionDraftSummary(null);
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

  const handleRunControl = async (action: 'pause' | 'resume' | 'cancel') => {
    if (!recon.activeRunId) return;
    setPendingRunAction(action);
    try {
      await recon.controlRun.mutateAsync({ runId: recon.activeRunId, action });
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
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Scored feed</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          New posts from tracked connections, ranked by LLM relevance for engagement traction.
        </p>
        {posts.length === 0 ? (
          <p className="text-sm text-gray-500">
            No recon posts yet. Run ingest after adding X handles.
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
                isUpdating={recon.updatePost.isPending}
                onStatus={async (status) => {
                  try {
                    await recon.updatePost.mutateAsync({ postId: post.id, body: { status } });
                  } catch (err) {
                    showToast({
                      type: 'error',
                      title: err instanceof Error ? err.message : 'Update failed',
                    });
                  }
                }}
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
        {runs.length === 0 ? (
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
                  <tr key={run.id}>
                    <td className="px-4 py-3 font-mono text-xs">{run.status}</td>
                    <td className="px-4 py-3">{run.trigger}</td>
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
      </PageCard>

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
    </div>
  );
}
