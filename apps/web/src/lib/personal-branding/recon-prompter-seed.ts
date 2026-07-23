import type { ReconPost } from '@/types/api/personal-branding.dto';

export interface ReconPrompterSeed {
  connectionId: string;
  creatorText: string;
  interactionIntent: string;
  authorHandle?: string | null;
  evidenceUrl?: string | null;
  platformPostId?: string | null;
  reconPostId: string;
}

export type ReconPrompterPrefill = Omit<ReconPrompterSeed, 'connectionId'>;

export function ctaLabelForReconPost(post: Pick<ReconPost, 'recommendedAction'>): string {
  const action = (post.recommendedAction ?? '').toLowerCase();
  if (action === 'quote') return 'Draft quote';
  return 'Draft reply';
}

export function buildReconInteractionIntent(
  post: Pick<ReconPost, 'recommendedAction' | 'authorUsername'>
): string {
  const action = (post.recommendedAction ?? '').toLowerCase();
  const handle = post.authorUsername ? `@${post.authorUsername}` : 'the creator';

  if (action === 'reply') {
    return `Draft a thoughtful reply to ${handle}'s post. Add value to the conversation while staying on-brand.`;
  }
  if (action === 'quote') {
    return `Draft a quote post that adds your perspective to ${handle}'s post.`;
  }
  return `Engage thoughtfully with ${handle}'s post in a way that builds the relationship.`;
}

export function buildReconPrompterSeed(post: ReconPost): ReconPrompterSeed {
  return {
    connectionId: post.connectionId,
    creatorText: post.text,
    interactionIntent: buildReconInteractionIntent(post),
    authorHandle: post.authorUsername,
    evidenceUrl: post.url,
    platformPostId: post.platformPostId,
    reconPostId: post.id,
  };
}
