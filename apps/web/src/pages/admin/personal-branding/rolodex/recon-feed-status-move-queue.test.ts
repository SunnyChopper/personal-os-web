import { describe, expect, it } from 'vitest';
import type { ReconPost } from '@/types/api/personal-branding.dto';
import {
  getReconMovePhase,
  isReconPostMoving,
  mergeReconDisplayPosts,
  type ReconFeedStatusMoveMap,
} from './recon-feed-status-move-queue';

function makePost(id: string, text = id, status: ReconPost['status'] = 'NEW'): ReconPost {
  return {
    id,
    connectionId: 'conn-1',
    platformPostId: `tweet-${id}`,
    text,
    likeCount: 0,
    retweetCount: 0,
    replyCount: 0,
    status,
    userId: 'user-1',
    createdAt: '2026-07-21T00:00:00.000Z',
    updatedAt: '2026-07-21T00:00:00.000Z',
  };
}

describe('mergeReconDisplayPosts', () => {
  it('returns query posts unchanged when no holds', () => {
    const posts = [makePost('a'), makePost('b')];
    expect(mergeReconDisplayPosts(posts, {}, 'toProcessed')).toEqual(posts);
  });

  it('appends held cards missing from the query list', () => {
    const queryPosts = [makePost('a')];
    const holds: ReconFeedStatusMoveMap = {
      b: { post: makePost('b', 'held'), direction: 'toProcessed', phase: 'exiting' },
    };
    const merged = mergeReconDisplayPosts(queryPosts, holds, 'toProcessed');
    expect(merged.map((post) => post.id)).toEqual(['a', 'b']);
    expect(merged[1]?.text).toBe('held');
  });

  it('ignores holds for the other direction', () => {
    const queryPosts = [makePost('a')];
    const holds: ReconFeedStatusMoveMap = {
      b: { post: makePost('b'), direction: 'toActive', phase: 'exiting' },
    };
    expect(mergeReconDisplayPosts(queryPosts, holds, 'toProcessed')).toEqual(queryPosts);
  });

  it('overlays hold snapshot onto an existing query item', () => {
    const queryPosts = [makePost('a', 'before')];
    const holds: ReconFeedStatusMoveMap = {
      a: {
        post: { ...makePost('a', 'after'), status: 'DISMISSED' },
        direction: 'toProcessed',
        phase: 'exiting',
      },
    };
    const merged = mergeReconDisplayPosts(queryPosts, holds, 'toProcessed');
    expect(merged[0]?.text).toBe('after');
    expect(merged[0]?.status).toBe('DISMISSED');
  });
});

describe('move helpers', () => {
  const holds: ReconFeedStatusMoveMap = {
    x: { post: makePost('x'), direction: 'toProcessed', phase: 'exiting' },
  };

  it('detects moving posts', () => {
    expect(isReconPostMoving('x', holds)).toBe(true);
    expect(isReconPostMoving('y', holds)).toBe(false);
  });

  it('returns move phase', () => {
    expect(getReconMovePhase('x', holds)).toBe('exiting');
    expect(getReconMovePhase('y', holds)).toBeNull();
  });
});
