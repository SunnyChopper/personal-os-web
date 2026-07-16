import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import type {
  PaginatedPersonalBranding,
  ReconRunSummary,
  UpdateFollowSuggestionInput,
  SubmitFollowConfidenceFeedbackInput,
  UpdateReconFeedSettingsInput,
  UpdateReconPostInput,
} from '@/types/api/personal-branding.dto';

const ACTIVE_RUN_STATUSES = new Set(['queued', 'running', 'pausing', 'cancelling']);
const RECON_FEED_PAGE_SIZE = 50;

function flattenReconFeedPages<T>(pages: PaginatedPersonalBranding<T>[] | undefined) {
  const items = pages?.flatMap((page) => page.data) ?? [];
  const total = pages?.[pages.length - 1]?.total ?? 0;
  return { items, total };
}

export function reconRunPollInterval(run?: Pick<ReconRunSummary, 'status' | 'pollAfterMs'> | null) {
  if (!run) return false;
  if (!ACTIVE_RUN_STATUSES.has(run.status)) return false;
  return Math.max(1500, Math.min(run.pollAfterMs ?? 2500, 5000));
}

/**
 * React Query bundle for Rolodex Recon Feed (settings, posts, follow suggestions, runs).
 */
export function useReconFeed() {
  const qc = useQueryClient();

  const invalidateAll = useCallback(
    () => qc.invalidateQueries({ queryKey: queryKeys.personalBranding.reconFeed.all() }),
    [qc]
  );

  const settings = useQuery({
    queryKey: queryKeys.personalBranding.reconFeed.settings(),
    queryFn: async () => {
      const res = await personalBrandingService.getReconFeedSettings();
      return res;
    },
  });

  const runs = useQuery({
    queryKey: queryKeys.personalBranding.reconFeed.runs(),
    queryFn: async () => {
      const res = await personalBrandingService.listReconRuns();
      if (!res.success || !res.data)
        throw new Error(res.error?.message ?? 'Failed to load recon runs');
      return res.data;
    },
    refetchInterval: (query) => {
      const rows = query.state.data?.data ?? [];
      const active = rows.find((r) => ACTIVE_RUN_STATUSES.has(r.status));
      return reconRunPollInterval(active);
    },
  });

  const activeRunId = useMemo(() => {
    const rows = runs.data?.data ?? [];
    return rows.find((r) => ACTIVE_RUN_STATUSES.has(r.status))?.id ?? null;
  }, [runs.data]);

  const activeRun = useQuery({
    queryKey: queryKeys.personalBranding.reconFeed.runDetail(activeRunId ?? ''),
    queryFn: () => personalBrandingService.getReconRun(activeRunId!),
    enabled: Boolean(activeRunId),
    refetchInterval: (query) => reconRunPollInterval(query.state.data),
  });

  const activePollMs = reconRunPollInterval(
    activeRun.data ?? runs.data?.data?.find((r) => ACTIVE_RUN_STATUSES.has(r.status))
  );

  const postsQuery = useInfiniteQuery({
    queryKey: queryKeys.personalBranding.reconFeed.posts(),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await personalBrandingService.listReconPosts(pageParam, RECON_FEED_PAGE_SIZE);
      if (!res.success || !res.data)
        throw new Error(res.error?.message ?? 'Failed to load recon posts');
      return res.data;
    },
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    refetchInterval: activePollMs,
  });

  const followSuggestionsQuery = useInfiniteQuery({
    queryKey: queryKeys.personalBranding.reconFeed.followSuggestions('NEW'),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await personalBrandingService.listFollowSuggestions(
        pageParam,
        RECON_FEED_PAGE_SIZE,
        'NEW'
      );
      if (!res.success || !res.data)
        throw new Error(res.error?.message ?? 'Failed to load follow suggestions');
      return res.data;
    },
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    refetchInterval: activePollMs,
  });

  const postsFlat = useMemo(
    () => flattenReconFeedPages(postsQuery.data?.pages),
    [postsQuery.data?.pages]
  );

  const followSuggestionsFlat = useMemo(
    () => flattenReconFeedPages(followSuggestionsQuery.data?.pages),
    [followSuggestionsQuery.data?.pages]
  );

  const posts = {
    ...postsQuery,
    items: postsFlat.items,
    total: postsFlat.total,
  };

  const followSuggestions = {
    ...followSuggestionsQuery,
    items: followSuggestionsFlat.items,
    total: followSuggestionsFlat.total,
  };

  const updateSettings = useMutation({
    mutationFn: (body: UpdateReconFeedSettingsInput) =>
      personalBrandingService.updateReconFeedSettings(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.personalBranding.reconFeed.settings() });
    },
  });

  const updatePost = useMutation({
    mutationFn: ({ postId, body }: { postId: string; body: UpdateReconPostInput }) =>
      personalBrandingService.updateReconPost(postId, body),
    onSuccess: () => {
      void invalidateAll();
    },
  });

  const updateFollowSuggestion = useMutation({
    mutationFn: ({
      suggestionId,
      body,
    }: {
      suggestionId: string;
      body: UpdateFollowSuggestionInput;
    }) => personalBrandingService.updateFollowSuggestion(suggestionId, body),
    onSuccess: () => {
      void invalidateAll();
      void qc.invalidateQueries({ queryKey: queryKeys.personalBranding.connections.all() });
    },
  });

  const proposeFollowSuggestionConnection = useMutation({
    mutationFn: (suggestionId: string) =>
      personalBrandingService.proposeFollowSuggestionConnection(suggestionId),
  });

  const explainFollowSuggestionConfidence = useMutation({
    mutationFn: (suggestionId: string) =>
      personalBrandingService.explainFollowSuggestionConfidence(suggestionId),
    onSuccess: () => {
      void invalidateAll();
    },
  });

  const submitFollowSuggestionConfidenceFeedback = useMutation({
    mutationFn: ({
      suggestionId,
      body,
    }: {
      suggestionId: string;
      body: SubmitFollowConfidenceFeedbackInput;
    }) => personalBrandingService.submitFollowSuggestionConfidenceFeedback(suggestionId, body),
    onSuccess: () => {
      void invalidateAll();
    },
  });

  const startRun = useMutation({
    mutationFn: () => personalBrandingService.startReconRun(),
    onSuccess: () => {
      void invalidateAll();
    },
  });

  const controlRun = useMutation({
    mutationFn: ({ runId, action }: { runId: string; action: 'pause' | 'resume' | 'cancel' }) => {
      if (action === 'pause') return personalBrandingService.pauseReconRun(runId);
      if (action === 'resume') return personalBrandingService.resumeReconRun(runId);
      return personalBrandingService.cancelReconRun(runId);
    },
    onSuccess: () => {
      void invalidateAll();
    },
  });

  const hasActiveNonPausedRun = useMemo(() => {
    const rows = runs.data?.data ?? [];
    return rows.some((r) => ACTIVE_RUN_STATUSES.has(r.status));
  }, [runs.data]);

  return {
    settings,
    posts,
    followSuggestions,
    runs,
    activeRun,
    activeRunId,
    hasActiveNonPausedRun,
    updateSettings,
    updatePost,
    updateFollowSuggestion,
    proposeFollowSuggestionConnection,
    explainFollowSuggestionConfidence,
    submitFollowSuggestionConfidenceFeedback,
    startRun,
    controlRun,
  };
}
