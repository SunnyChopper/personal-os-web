import { createElement, type ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  applyOptimisticReconPostFeedbackUpdate,
  applyOptimisticReconPostStatusUpdate,
  buildReconScarcityMessage,
  flattenReconFeedPages,
  isReconScarce,
  MONITOR_RUN_STATUSES,
  postedAfterForScarcityWindow,
  reconRunPollInterval,
  RECON_SCARCITY_MAX_COUNT,
  RECON_SCARCITY_WINDOW_MS,
  useReconFeed,
} from '@/hooks/useReconFeed';
import type { PaginatedPersonalBranding, ReconPost } from '@/types/api/personal-branding.dto';
import { personalBrandingService } from '@/services/personal-branding.service';

vi.mock('@/services/personal-branding.service', () => ({
  personalBrandingService: {
    getReconFeedSettings: vi.fn(),
    getReconRun: vi.fn(),
    listReconPosts: vi.fn(),
    listReconRuns: vi.fn(),
    listFollowSuggestions: vi.fn(),
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client }, children);
}

function page(
  data: Array<{ id: string; platformPostId?: string | null }>,
  total: number,
  pageNum = 1
): PaginatedPersonalBranding<{ id: string; platformPostId?: string | null }> {
  return {
    data,
    total,
    page: pageNum,
    pageSize: 50,
    hasMore: pageNum * 50 < total,
  };
}

function reconPost(id: string, status: ReconPost['status'] = 'NEW'): ReconPost {
  return {
    id,
    connectionId: 'conn-1',
    platformPostId: `tweet-${id}`,
    text: `Post ${id}`,
    likeCount: 0,
    retweetCount: 0,
    replyCount: 0,
    status,
    userId: 'user-1',
    createdAt: '2026-07-21T00:00:00.000Z',
    updatedAt: '2026-07-21T00:00:00.000Z',
  };
}

function infinitePages(posts: ReconPost[]) {
  return {
    pages: [
      {
        data: posts,
        total: posts.length,
        page: 1,
        pageSize: 50,
        hasMore: false,
      } satisfies PaginatedPersonalBranding<ReconPost>,
    ],
    pageParams: [1],
  };
}

describe('flattenReconFeedPages', () => {
  it('dedupes items by id across pages', () => {
    const pages = [page([{ id: 'a' }, { id: 'b' }], 3, 1), page([{ id: 'b' }, { id: 'c' }], 3, 2)];
    const result = flattenReconFeedPages(pages);
    expect(result.items.map((item) => item.id)).toEqual(['a', 'b', 'c']);
    expect(result.total).toBe(3);
  });

  it('dedupes items by platformPostId across pages', () => {
    const pages = [
      page(
        [
          { id: 'a', platformPostId: 'tweet-1' },
          { id: 'b', platformPostId: 'tweet-2' },
        ],
        2,
        1
      ),
      page([{ id: 'c', platformPostId: 'tweet-1' }], 2, 2),
    ];
    const result = flattenReconFeedPages(pages);
    expect(result.items.map((item) => item.id)).toEqual(['a', 'b']);
    expect(result.total).toBe(2);
  });
});

describe('applyOptimisticReconPostFeedbackUpdate', () => {
  it('patches feedbackVerdict in active and processed caches without moving posts', () => {
    const active = infinitePages([reconPost('a', 'NEW')]);
    const processed = infinitePages([reconPost('b', 'DISMISSED')]);
    const result = applyOptimisticReconPostFeedbackUpdate(active, processed, 'a', {
      feedbackVerdict: 'GOOD',
    });
    expect(result.active?.pages[0].data[0]).toMatchObject({
      id: 'a',
      status: 'NEW',
      feedbackVerdict: 'GOOD',
    });
    expect(result.processed?.pages[0].data[0]).toMatchObject({ id: 'b', status: 'DISMISSED' });
  });

  it('clears feedbackVerdict when toggling good pick off', () => {
    const active = infinitePages([{ ...reconPost('a', 'NEW'), feedbackVerdict: 'GOOD' as const }]);
    const result = applyOptimisticReconPostFeedbackUpdate(active, infinitePages([]), 'a', {
      feedbackVerdict: null,
    });
    expect(result.active?.pages[0].data[0]).toMatchObject({
      id: 'a',
      feedbackVerdict: null,
    });
  });
});

describe('applyOptimisticReconPostStatusUpdate', () => {
  it('moves a NEW post into processed when dismissed', () => {
    const active = infinitePages([reconPost('a', 'NEW')]);
    const processed = infinitePages([]);
    const result = applyOptimisticReconPostStatusUpdate(active, processed, 'a', 'DISMISSED');
    expect(result.active?.pages[0].data).toEqual([]);
    expect(result.processed?.pages[0].data[0]).toMatchObject({ id: 'a', status: 'DISMISSED' });
  });

  it('restores a processed post back to active', () => {
    const active = infinitePages([]);
    const processed = infinitePages([reconPost('a', 'DISMISSED')]);
    const result = applyOptimisticReconPostStatusUpdate(active, processed, 'a', 'NEW');
    expect(result.active?.pages[0].data[0]).toMatchObject({ id: 'a', status: 'NEW' });
    expect(result.processed?.pages[0].data).toEqual([]);
  });

  it('updates status in place within processed', () => {
    const active = infinitePages([]);
    const processed = infinitePages([reconPost('a', 'REVIEWED')]);
    const result = applyOptimisticReconPostStatusUpdate(active, processed, 'a', 'ACTIONED');
    expect(result.processed?.pages[0].data[0]).toMatchObject({ id: 'a', status: 'ACTIONED' });
    expect(result.active?.pages[0].data).toEqual([]);
  });
});

describe('recon scarcity helpers', () => {
  it('postedAfterForScarcityWindow uses a 48h lookback', () => {
    const now = Date.parse('2026-07-23T12:00:00.000Z');
    const postedAfter = postedAfterForScarcityWindow(now);
    expect(postedAfter).toBe('2026-07-21T12:00:00.000Z');
    expect(RECON_SCARCITY_WINDOW_MS).toBe(48 * 60 * 60 * 1000);
  });

  it('isReconScarce is true at or below the max count', () => {
    expect(isReconScarce(0)).toBe(true);
    expect(isReconScarce(RECON_SCARCITY_MAX_COUNT)).toBe(true);
    expect(isReconScarce(RECON_SCARCITY_MAX_COUNT + 1)).toBe(false);
  });

  it('buildReconScarcityMessage varies copy for tracked X handles', () => {
    expect(buildReconScarcityMessage(2, 0.5, true)).toContain(
      'Only 2 posts from the last 48 h scored at or above your relevance threshold (0.5)'
    );
    expect(buildReconScarcityMessage(1, 0.6, false)).toContain('Only 1 post from the last 48 h');
    expect(buildReconScarcityMessage(1, 0.6, false)).toContain(
      'add X handles in Connection Directory'
    );
  });
});

describe('reconRunPollInterval', () => {
  it('does not poll paused runs', () => {
    expect(reconRunPollInterval({ status: 'paused', pollAfterMs: 2500 })).toBe(false);
  });

  it('polls running runs with clamped interval', () => {
    expect(reconRunPollInterval({ status: 'running', pollAfterMs: 100 })).toBe(1500);
    expect(reconRunPollInterval({ status: 'running', pollAfterMs: 4000 })).toBe(4000);
  });
});

describe('MONITOR_RUN_STATUSES', () => {
  it('includes paused for monitor visibility', () => {
    expect(MONITOR_RUN_STATUSES.has('paused')).toBe(true);
    expect(MONITOR_RUN_STATUSES.has('running')).toBe(true);
  });
});

describe('useReconFeed activeRunId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(personalBrandingService.getReconFeedSettings).mockResolvedValue({
      minRelevanceScore: 0.55,
      maxPostsPerConnection: 10,
      maxPostAgeDays: 7,
      syncCadence: 'MANUAL_ONLY',
      enabled: false,
      trendStreamResearchEnabled: false,
      hasRapidApiKey: true,
      syncStartTime: '09:00',
      syncTimezone: 'America/Chicago',
      userId: 'user-1',
      createdAt: '2026-07-21T00:00:00.000Z',
      updatedAt: '2026-07-21T00:00:00.000Z',
    });
    vi.mocked(personalBrandingService.listReconPosts).mockResolvedValue({
      success: true,
      data: { data: [], total: 0, page: 1, pageSize: 50, hasMore: false },
    });
    vi.mocked(personalBrandingService.listFollowSuggestions).mockResolvedValue({
      success: true,
      data: { data: [], total: 0, page: 1, pageSize: 50, hasMore: false },
    });
    vi.mocked(personalBrandingService.getReconRun).mockResolvedValue({
      id: 'run-paused',
      status: 'paused',
      trigger: 'manual',
      connectionsTotal: 5,
      connectionsSucceeded: 2,
      connectionsFailed: 0,
      postsDiscovered: 10,
      postsScored: 3,
      followSuggestionsCreated: 0,
      apiCallsUsed: 5,
      createdAt: '2026-07-21T00:00:00.000Z',
      updatedAt: '2026-07-21T00:00:00.000Z',
    });
  });

  it('sets activeRunId for paused runs while hasActiveNonPausedRun stays false', async () => {
    vi.mocked(personalBrandingService.listReconRuns).mockResolvedValue({
      success: true,
      data: {
        data: [
          {
            id: 'run-paused',
            status: 'paused',
            trigger: 'manual',
            connectionsTotal: 5,
            connectionsSucceeded: 2,
            connectionsFailed: 0,
            postsDiscovered: 10,
            postsScored: 3,
            followSuggestionsCreated: 0,
            apiCallsUsed: 5,
            createdAt: '2026-07-21T00:00:00.000Z',
            updatedAt: '2026-07-21T00:00:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
        hasMore: false,
      },
    });

    const { result } = renderHook(() => useReconFeed(), { wrapper });
    await waitFor(() => expect(result.current.activeRunId).toBe('run-paused'));
    expect(result.current.hasActiveNonPausedRun).toBe(false);
  });
});

describe('useReconFeed scarcity query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(personalBrandingService.getReconFeedSettings).mockResolvedValue({
      minRelevanceScore: 0.55,
      maxPostsPerConnection: 10,
      maxPostAgeDays: 7,
      syncCadence: 'MANUAL_ONLY',
      enabled: false,
      trendStreamResearchEnabled: false,
      hasRapidApiKey: true,
      syncStartTime: '09:00',
      syncTimezone: 'America/Chicago',
      userId: 'user-1',
      createdAt: '2026-07-21T00:00:00.000Z',
      updatedAt: '2026-07-21T00:00:00.000Z',
    });
    vi.mocked(personalBrandingService.listReconPosts).mockResolvedValue({
      success: true,
      data: {
        data: [],
        total: 2,
        page: 1,
        pageSize: 1,
        hasMore: false,
      },
    });
    vi.mocked(personalBrandingService.listReconRuns).mockResolvedValue({
      success: true,
      data: { data: [], total: 0, page: 1, pageSize: 20, hasMore: false },
    });
    vi.mocked(personalBrandingService.listFollowSuggestions).mockResolvedValue({
      success: true,
      data: { data: [], total: 0, page: 1, pageSize: 50, hasMore: false },
    });
  });

  it('loads scarcity stats with 48h postedAfter and settings minScore', async () => {
    const { result } = renderHook(() => useReconFeed(), { wrapper });
    await waitFor(() => expect(result.current.scarcity.isSuccess).toBe(true));

    expect(personalBrandingService.listReconPosts).toHaveBeenCalledWith(
      1,
      1,
      expect.objectContaining({
        status: 'NEW',
        minScore: 0.55,
        postedAfter: expect.any(String),
      })
    );
    expect(result.current.scarcity.recentHighSignalCount).toBe(2);
    expect(result.current.scarcity.isScarce).toBe(true);
    expect(result.current.scarcity.threshold).toBe(0.55);
  });

  it('marks scarcity false when high-signal count exceeds the threshold', async () => {
    vi.mocked(personalBrandingService.listReconPosts).mockResolvedValue({
      success: true,
      data: {
        data: [],
        total: 4,
        page: 1,
        pageSize: 1,
        hasMore: false,
      },
    });

    const { result } = renderHook(() => useReconFeed(), { wrapper });
    await waitFor(() => expect(result.current.scarcity.isSuccess).toBe(true));
    expect(result.current.scarcity.isScarce).toBe(false);
  });
});
