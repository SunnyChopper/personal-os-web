import { describe, expect, it } from 'vitest';
import { applyOptimisticReconPostStatusUpdate, flattenReconFeedPages } from '@/hooks/useReconFeed';
import type { PaginatedPersonalBranding, ReconPost } from '@/types/api/personal-branding.dto';

function page(
  data: Array<{ id: string }>,
  total: number,
  pageNum = 1
): PaginatedPersonalBranding<{ id: string }> {
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
