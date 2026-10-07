import type { ReconPost } from '@/types/api/personal-branding.dto';
import { isSparseCreatorText } from '@/lib/personal-branding/creator-text-quality';
import {
  buildPrompterInteractionIntent,
  type PrompterIntentAction,
} from '@/lib/personal-branding/manual-prompter-paste';

export const REPLY_INTERACTION_INTENT_MAX = 500;
export const RECON_INTERACTION_INTENT_MAX = REPLY_INTERACTION_INTENT_MAX;

export interface ReconPrompterSeed {
  connectionId: string;
  creatorText: string;
  interactionIntent: string;
  preferredIntentAction?: 'reply' | 'quote';
  limitedTextContext?: boolean;
  authorHandle?: string | null;
  evidenceUrl?: string | null;
  platformPostId?: string | null;
  reconPostId?: string;
  learningCost?: ReconPost['learningCost'];
}

export type ReconPrompterPrefill = Omit<ReconPrompterSeed, 'connectionId'>;

type ReconIntentPost = Pick<ReconPost, 'recommendedAction' | 'authorUsername' | 'suggestedAngle'>;

function recommendedActionToIntentAction(action: string | null | undefined): PrompterIntentAction {
  const normalized = (action ?? '').toLowerCase();
  if (normalized === 'quote') return 'quote';
  if (normalized === 'reply') return 'reply';
  return 'engage';
}

export function preferredIntentActionForReconPost(
  post: Pick<ReconPost, 'recommendedAction'>
): 'reply' | 'quote' {
  return recommendedActionToIntentAction(post.recommendedAction) === 'quote' ? 'quote' : 'reply';
}

export function buildReconInteractionIntent(post: ReconIntentPost): string {
  const angle = post.suggestedAngle?.trim();
  if (angle) {
    return angle.slice(0, REPLY_INTERACTION_INTENT_MAX);
  }
  return buildPrompterInteractionIntent({
    action: recommendedActionToIntentAction(post.recommendedAction),
    authorUsername: post.authorUsername,
  });
}

export function ctaLabelForReconPost(post: Pick<ReconPost, 'recommendedAction'>): string {
  const action = (post.recommendedAction ?? '').toLowerCase();
  if (action === 'quote') return 'Draft quote';
  return 'Draft reply';
}

export function buildReconPrompterSeed(post: ReconPost): ReconPrompterSeed {
  return {
    connectionId: post.connectionId,
    creatorText: post.text,
    interactionIntent: buildReconInteractionIntent(post),
    preferredIntentAction: preferredIntentActionForReconPost(post),
    limitedTextContext: isSparseCreatorText(post.text),
    authorHandle: post.authorUsername,
    evidenceUrl: post.url,
    platformPostId: post.platformPostId,
    reconPostId: post.id,
    learningCost: post.learningCost,
  };
}
