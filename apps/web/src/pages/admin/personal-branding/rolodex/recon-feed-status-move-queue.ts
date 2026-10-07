import type { ReconPost } from '@/types/api/personal-branding.dto';

export const RECON_FEED_STATUS_MOVE_MS = 280;

export type ReconFeedStatusMoveDirection = 'toProcessed' | 'toActive';
export type ReconFeedStatusMovePhase = 'exiting';

export interface ReconFeedStatusMoveEntry {
  post: ReconPost;
  direction: ReconFeedStatusMoveDirection;
  phase: ReconFeedStatusMovePhase;
}

export type ReconFeedStatusMoveMap = Record<string, ReconFeedStatusMoveEntry>;

function holdsForDirection(
  holdMap: ReconFeedStatusMoveMap,
  direction: ReconFeedStatusMoveDirection
): ReconFeedStatusMoveMap {
  const filtered: ReconFeedStatusMoveMap = {};
  for (const [id, entry] of Object.entries(holdMap)) {
    if (entry.direction === direction) filtered[id] = entry;
  }
  return filtered;
}

/** Merge query items with held exiting cards so exit animation can finish after optimistic remove. */
export function mergeReconDisplayPosts(
  queryPosts: ReconPost[],
  holdMap: ReconFeedStatusMoveMap,
  direction: ReconFeedStatusMoveDirection
): ReconPost[] {
  const scopedHolds = holdsForDirection(holdMap, direction);
  if (Object.keys(scopedHolds).length === 0) {
    return queryPosts;
  }

  const byId = new Map(queryPosts.map((post) => [post.id, post]));

  for (const [id, entry] of Object.entries(scopedHolds)) {
    const existing = byId.get(id);
    byId.set(id, existing ? { ...existing, ...entry.post } : entry.post);
  }

  const queryOrder = queryPosts.map((post) => post.id);
  const heldOnlyIds = Object.keys(scopedHolds).filter((id) => !queryOrder.includes(id));

  return [...queryOrder.map((id) => byId.get(id)!), ...heldOnlyIds.map((id) => byId.get(id)!)];
}

export function isReconPostMoving(postId: string, holdMap: ReconFeedStatusMoveMap): boolean {
  return postId in holdMap;
}

export function getReconMovePhase(
  postId: string,
  holdMap: ReconFeedStatusMoveMap
): ReconFeedStatusMovePhase | null {
  return holdMap[postId]?.phase ?? null;
}
