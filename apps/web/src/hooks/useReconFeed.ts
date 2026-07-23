import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { queryKeys } from '@/lib/react-query/query-keys';
import { personalBrandingService } from '@/services/personal-branding.service';
import type {
  PaginatedPersonalBranding,
  ReconPost,
  ReconPostStatus,
  ReconRunSummary,
  UpdateFollowSuggestionInput,
  SubmitFollowConfidenceFeedbackInput,
  UpdateReconFeedSettingsInput,
  UpdateReconPostInput,
} from '@/types/api/personal-branding.dto';

const ACTIVE_RUN_STATUSES = new Set(['queued', 'running', 'pausing', 'cancelling']);
const RECON_FEED_PAGE_SIZE = 50;
export const RECON_RUNS_PAGE_SIZE = 20;

export const RECON_ACTIVE_POST_STATUS = 'NEW';
export const RECON_PROCESSED_POST_STATUSES = 'REVIEWED,ACTIONED,DISMISSED';

const PROCESSED_RECON_POST_STATUSES = new Set<ReconPostStatus>([
  'REVIEWED',
  'ACTIONED',
  'DISMISSED',
]);

export type ReconPostListFilters = {
  postedAfter?: string;
  sortBy?: 'relevanceScore' | 'postedAt';
  sortOrder?: 'asc' | 'desc';
  status?: string;
};

type ReconPostPage = PaginatedPersonalBranding<ReconPost>;

export function isProcessedReconPostStatus(status: ReconPostStatus): boolean {
  return PROCESSED_RECON_POST_STATUSES.has(status);
}

export function flattenReconFeedPages<T extends { id: string }>(
  pages: PaginatedPersonalBranding<T>[] | undefined
) {
  const seen = new Set<string>();
  const items: T[] = [];
  for (const page of pages ?? []) {
    for (const item of page.data) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      items.push(item);
    }
  }
  const total = pages?.[pages.length - 1]?.total ?? 0;
  return { items, total };
}

function findPostInPages(
  data: InfiniteData<ReconPostPage> | undefined,
  postId: string
): ReconPost | null {
  for (const page of data?.pages ?? []) {
    const match = page.data.find((post) => post.id === postId);
    if (match) return match;
  }
  return null;
}

function removePostFromPages(
  data: InfiniteData<ReconPostPage> | undefined,
  postId: string
): { next: InfiniteData<ReconPostPage> | undefined; removed: ReconPost | null } {
  if (!data) return { next: data, removed: null };
  let removed: ReconPost | null = null;
  const pages = data.pages.map((page) => {
    const index = page.data.findIndex((post) => post.id === postId);
    if (index === -1) return page;
    removed = page.data[index];
    const nextData = [...page.data.slice(0, index), ...page.data.slice(index + 1)];
    return {
      ...page,
      data: nextData,
      total: Math.max(0, page.total - 1),
    };
  });
  if (!removed) return { next: data, removed: null };
  return { next: { ...data, pages }, removed };
}

function prependPostToPages(
  data: InfiniteData<ReconPostPage> | undefined,
  post: ReconPost
): InfiniteData<ReconPostPage> {
  if (!data?.pages.length) {
    return {
      pages: [
        {
          data: [post],
          total: 1,
          page: 1,
          pageSize: RECON_FEED_PAGE_SIZE,
          hasMore: false,
        },
      ],
      pageParams: [1],
    };
  }
  const [first, ...rest] = data.pages;
  const withoutDuplicate = first.data.filter((item) => item.id !== post.id);
  const added = withoutDuplicate.length === first.data.length;
  return {
    ...data,
    pages: [
      {
        ...first,
        data: [post, ...withoutDuplicate],
        total: first.total + (added ? 1 : 0),
      },
      ...rest,
    ],
  };
}

function updatePostInPages(
  data: InfiniteData<ReconPostPage> | undefined,
  postId: string,
  status: ReconPostStatus
): InfiniteData<ReconPostPage> | undefined {
  if (!data) return data;
  let changed = false;
  const pages = data.pages.map((page) => {
    const index = page.data.findIndex((post) => post.id === postId);
    if (index === -1) return page;
    changed = true;
    const nextData = [...page.data];
    nextData[index] = { ...nextData[index], status };
    return { ...page, data: nextData };
  });
  return changed ? { ...data, pages } : data;
}

export function applyOptimisticReconPostStatusUpdate(
  activeData: InfiniteData<ReconPostPage> | undefined,
  processedData: InfiniteData<ReconPostPage> | undefined,
  postId: string,
  nextStatus: ReconPostStatus
): {
  active: InfiniteData<ReconPostPage> | undefined;
  processed: InfiniteData<ReconPostPage> | undefined;
} {
  const activePost = findPostInPages(activeData, postId);
  const processedPost = findPostInPages(processedData, postId);
  const sourcePost = activePost ?? processedPost;
  if (!sourcePost) {
    return { active: activeData, processed: processedData };
  }

  const updatedPost = { ...sourcePost, status: nextStatus };
  let nextActive = activeData;
  let nextProcessed = processedData;

  if (nextStatus === RECON_ACTIVE_POST_STATUS) {
    const removedProcessed = removePostFromPages(processedData, postId);
    nextProcessed = removedProcessed.next;
    if (activePost) {
      nextActive = updatePostInPages(activeData, postId, nextStatus);
    } else {
      nextActive = prependPostToPages(activeData, updatedPost);
    }
    return { active: nextActive, processed: nextProcessed };
  }

  if (isProcessedReconPostStatus(nextStatus)) {
    const removedActive = removePostFromPages(activeData, postId);
    nextActive = removedActive.next;
    if (processedPost) {
      nextProcessed = updatePostInPages(processedData, postId, nextStatus);
    } else {
      nextProcessed = prependPostToPages(processedData, updatedPost);
    }
    return { active: nextActive, processed: nextProcessed };
  }

  return { active: activeData, processed: processedData };
}

export function reconRunPollInterval(run?: Pick<ReconRunSummary, 'status' | 'pollAfterMs'> | null) {
  if (!run) return false;
  if (!ACTIVE_RUN_STATUSES.has(run.status)) return false;
  return Math.max(1500, Math.min(run.pollAfterMs ?? 2500, 5000));
}

export function useReconRunDetail(runId: string | null) {
  const detail = useQuery({
    queryKey: queryKeys.personalBranding.reconFeed.runDetail(runId ?? ''),
    queryFn: () => personalBrandingService.getReconRun(runId!),
    enabled: Boolean(runId),
    refetchInterval: (query) => reconRunPollInterval(query.state.data),
  });

  return { detail };
}

function useReconPostsInfiniteQuery(filters: ReconPostListFilters, activePollMs: number | false) {
  return useInfiniteQuery({
    queryKey: queryKeys.personalBranding.reconFeed.posts(filters),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res = await personalBrandingService.listReconPosts(
        pageParam,
        RECON_FEED_PAGE_SIZE,
        filters
      );
      if (!res.success || !res.data)
        throw new Error(res.error?.message ?? 'Failed to load recon posts');
      return res.data;
    },
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    refetchInterval: activePollMs,
  });
}

/**
 * React Query bundle for Rolodex Recon Feed (settings, posts, follow suggestions, runs).
 */
export function useReconFeed(options?: {
  postFilters?: ReconPostListFilters;
  runsPage?: number;
  includeProcessedPosts?: boolean;
}) {
  const postFilters = options?.postFilters ?? {};
  const includeProcessedPosts = options?.includeProcessedPosts ?? false;
  const runsPage = Math.max(1, options?.runsPage ?? 1);
  const qc = useQueryClient();
  const [updatingPostId, setUpdatingPostId] = useState<string | null>(null);

  const activePostFilters = useMemo(
    () => ({ ...postFilters, status: RECON_ACTIVE_POST_STATUS }),
    [postFilters]
  );
  const processedPostFilters = useMemo(
    () => ({ ...postFilters, status: RECON_PROCESSED_POST_STATUSES }),
    [postFilters]
  );

  const activePostsQueryKey = useMemo(
    () => queryKeys.personalBranding.reconFeed.posts(activePostFilters),
    [activePostFilters]
  );
  const processedPostsQueryKey = useMemo(
    () => queryKeys.personalBranding.reconFeed.posts(processedPostFilters),
    [processedPostFilters]
  );

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
    queryKey: queryKeys.personalBranding.reconFeed.runs(runsPage, RECON_RUNS_PAGE_SIZE),
    queryFn: async () => {
      const res = await personalBrandingService.listReconRuns(runsPage, RECON_RUNS_PAGE_SIZE);
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

  const runsActiveProbe = useQuery({
    queryKey: queryKeys.personalBranding.reconFeed.runs(1, RECON_RUNS_PAGE_SIZE),
    queryFn: async () => {
      const res = await personalBrandingService.listReconRuns(1, RECON_RUNS_PAGE_SIZE);
      if (!res.success || !res.data)
        throw new Error(res.error?.message ?? 'Failed to load recon runs');
      return res.data;
    },
    enabled: runsPage !== 1,
    refetchInterval: (query) => {
      const rows = query.state.data?.data ?? [];
      const active = rows.find((r) => ACTIVE_RUN_STATUSES.has(r.status));
      return reconRunPollInterval(active);
    },
  });

  const activeRunProbeRows = useMemo(() => {
    if (runsPage === 1) return runs.data?.data ?? [];
    return runsActiveProbe.data?.data ?? [];
  }, [runsPage, runs.data?.data, runsActiveProbe.data?.data]);

  const activeRunId = useMemo(() => {
    return activeRunProbeRows.find((r) => ACTIVE_RUN_STATUSES.has(r.status))?.id ?? null;
  }, [activeRunProbeRows]);

  const activeRun = useQuery({
    queryKey: queryKeys.personalBranding.reconFeed.runDetail(activeRunId ?? ''),
    queryFn: () => personalBrandingService.getReconRun(activeRunId!),
    enabled: Boolean(activeRunId),
    refetchInterval: (query) => reconRunPollInterval(query.state.data),
  });

  const activePollMs = reconRunPollInterval(
    activeRun.data ?? activeRunProbeRows.find((r) => ACTIVE_RUN_STATUSES.has(r.status))
  );

  const postsQuery = useReconPostsInfiniteQuery(activePostFilters, activePollMs);
  const processedPostsQuery = useReconPostsInfiniteQuery(
    processedPostFilters,
    includeProcessedPosts ? activePollMs : false
  );

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

  const processedPostsFlat = useMemo(
    () => flattenReconFeedPages(processedPostsQuery.data?.pages),
    [processedPostsQuery.data?.pages]
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

  const processedPosts = {
    ...processedPostsQuery,
    items: processedPostsFlat.items,
    total: processedPostsFlat.total,
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
    onMutate: async ({ postId, body }) => {
      setUpdatingPostId(postId);
      await qc.cancelQueries({ queryKey: queryKeys.personalBranding.reconFeed.all() });
      const previousActive = qc.getQueryData<InfiniteData<ReconPostPage>>(activePostsQueryKey);
      const previousProcessed =
        qc.getQueryData<InfiniteData<ReconPostPage>>(processedPostsQueryKey);
      const optimistic = applyOptimisticReconPostStatusUpdate(
        previousActive,
        previousProcessed,
        postId,
        body.status
      );
      qc.setQueryData(activePostsQueryKey, optimistic.active);
      qc.setQueryData(processedPostsQueryKey, optimistic.processed);
      return { previousActive, previousProcessed };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousActive) {
        qc.setQueryData(activePostsQueryKey, context.previousActive);
      }
      if (context?.previousProcessed) {
        qc.setQueryData(processedPostsQueryKey, context.previousProcessed);
      }
    },
    onSettled: () => {
      setUpdatingPostId(null);
      void qc.invalidateQueries({ queryKey: activePostsQueryKey });
      void qc.invalidateQueries({ queryKey: processedPostsQueryKey });
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
    return activeRunProbeRows.some((r) => ACTIVE_RUN_STATUSES.has(r.status));
  }, [activeRunProbeRows]);

  return {
    settings,
    posts,
    processedPosts,
    updatingPostId,
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
