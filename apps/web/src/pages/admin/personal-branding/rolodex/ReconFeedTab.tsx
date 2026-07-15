import { useEffect, useMemo, useState } from 'react';
import { Loader2, Play, Radar } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useReconFeed } from '@/hooks/useReconFeed';
import { extractErrorMessage } from '@/lib/react-query/error-utils';
import {
  RECON_POST_STATUS_LABELS,
  RECON_RECOMMENDED_ACTION_LABELS,
  type ReconPost,
  type ReconPostStatus,
  type FollowSuggestion,
} from '@/types/api/personal-branding.dto';
import { PageCard } from '../PersonalBrandingPageTemplate';
import { linkAccentClassName } from '../personal-branding-ui';

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
  onAdd,
  onDismiss,
}: {
  suggestion: FollowSuggestion;
  isUpdating: boolean;
  onAdd: () => void;
  onDismiss: () => void;
}) {
  const sharedCount = suggestion.sharedConnectionIds.length;
  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">
            {suggestion.displayName ?? `@${suggestion.xUsername}`}
          </h4>
          <p className="mt-1 text-xs text-gray-500">
            @{suggestion.xUsername}
            {suggestion.followersCount !== null && suggestion.followersCount !== undefined
              ? ` · ${suggestion.followersCount.toLocaleString()} followers`
              : ''}
            {sharedCount > 0 ? ` · followed by ${sharedCount} tracked connection(s)` : ''}
            {suggestion.confidence !== null && suggestion.confidence !== undefined
              ? ` · ${(suggestion.confidence * 100).toFixed(0)}% confidence`
              : ''}
          </p>
        </div>
        <div className="flex gap-1">
          <Button type="button" size="sm" disabled={isUpdating} onClick={onAdd}>
            Add to directory
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

export default function ReconFeedTab() {
  const recon = useReconFeed();
  const { showToast, ToastContainer } = useToast();
  const settings = recon.settings.data;

  const loadError = useMemo(() => {
    const queries = [recon.settings, recon.posts, recon.followSuggestions, recon.runs];
    const failed = queries.find((q) => q.isError);
    if (!failed?.error) return null;
    return extractErrorMessage(failed.error, 'Failed to load Recon Feed');
  }, [recon.settings, recon.posts, recon.followSuggestions, recon.runs]);

  const [enabled, setEnabled] = useState(true);
  const [minScore, setMinScore] = useState(0.5);
  const [maxPosts, setMaxPosts] = useState(5);
  const [rapidApiKey, setRapidApiKey] = useState('');

  useEffect(() => {
    if (!settings) return;
    setEnabled(settings.enabled);
    setMinScore(settings.minRelevanceScore);
    setMaxPosts(settings.maxPostsPerConnection);
  }, [settings]);

  const posts = recon.posts.data?.data ?? [];
  const suggestions = recon.followSuggestions.data?.data ?? [];
  const runs = recon.runs.data?.data ?? [];

  const handleSaveSettings = async () => {
    try {
      const body: Parameters<typeof recon.updateSettings.mutateAsync>[0] = {
        enabled,
        minRelevanceScore: minScore,
        maxPostsPerConnection: maxPosts,
      };
      if (rapidApiKey.trim()) {
        body.rapidApiKey = rapidApiKey.trim();
      }
      await recon.updateSettings.mutateAsync(body);
      setRapidApiKey('');
      showToast({ type: 'success', title: 'Recon Feed settings saved' });
    } catch (err) {
      showToast({ type: 'error', title: err instanceof Error ? err.message : 'Save failed' });
    }
  };

  const handleStartRun = async () => {
    try {
      await recon.startRun.mutateAsync();
      showToast({ type: 'success', title: 'Recon Feed run started' });
    } catch (err) {
      showToast({
        type: 'error',
        title: err instanceof Error ? err.message : 'Run failed to start',
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
      <PageCard className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recon settings</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Pull X posts for Connection Directory entries with an X handle. Requires a RapidAPI
              Twitter / X API key.
            </p>
          </div>
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-xs',
              settings?.hasRapidApiKey
                ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-300'
                : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
            )}
          >
            <Radar className="size-3.5" aria-hidden />
            <span className="font-medium">RapidAPI</span>
            <span className="rounded px-1.5 py-0.5 font-medium">
              {settings?.hasRapidApiKey ? 'Connected' : 'Not configured'}
            </span>
          </span>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="rounded border-gray-300"
          />
          Enable daily scheduled ingest
        </label>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Min relevance score
            </label>
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Max posts per connection
            </label>
            <input
              type="number"
              min={1}
              max={40}
              value={maxPosts}
              onChange={(e) => setMaxPosts(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              RapidAPI key
            </label>
            <input
              type="password"
              value={rapidApiKey}
              onChange={(e) => setRapidApiKey(e.target.value)}
              placeholder={
                settings?.hasRapidApiKey ? '•••••••• (leave blank to keep)' : 'Paste key'
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
          </div>
        </div>

        {settings ? (
          <p className="text-xs text-gray-500">Last run {formatDate(settings.lastRunAt)}</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => void handleSaveSettings()}
            disabled={recon.updateSettings.isPending}
          >
            {recon.updateSettings.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            ) : null}
            Save settings
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => void handleStartRun()}
            disabled={recon.startRun.isPending || !settings?.hasRapidApiKey}
            className="inline-flex items-center gap-2"
          >
            {recon.startRun.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Play className="size-4" aria-hidden />
            )}
            Run now
          </Button>
        </div>
      </PageCard>

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
          <div className="grid gap-3">
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
          </div>
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
          <div className="grid gap-3">
            {suggestions.map((suggestion) => (
              <FollowSuggestionRow
                key={suggestion.id}
                suggestion={suggestion}
                isUpdating={recon.updateFollowSuggestion.isPending}
                onAdd={async () => {
                  try {
                    await recon.updateFollowSuggestion.mutateAsync({
                      suggestionId: suggestion.id,
                      body: { status: 'ADDED' },
                    });
                    showToast({ type: 'success', title: 'Added to Connection Directory' });
                  } catch (err) {
                    showToast({
                      type: 'error',
                      title: err instanceof Error ? err.message : 'Add failed',
                    });
                  }
                }}
                onDismiss={async () => {
                  try {
                    await recon.updateFollowSuggestion.mutateAsync({
                      suggestionId: suggestion.id,
                      body: { status: 'DISMISSED' },
                    });
                  } catch (err) {
                    showToast({
                      type: 'error',
                      title: err instanceof Error ? err.message : 'Dismiss failed',
                    });
                  }
                }}
              />
            ))}
          </div>
        )}
      </PageCard>

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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageCard>

      <ToastContainer />
    </div>
  );
}
