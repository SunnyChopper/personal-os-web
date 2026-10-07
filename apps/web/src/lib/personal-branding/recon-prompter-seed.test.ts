import { describe, expect, it } from 'vitest';
import type { ReconPost } from '@/types/api/personal-branding.dto';
import { buildPrompterInteractionIntent } from '@/lib/personal-branding/manual-prompter-paste';
import {
  buildReconInteractionIntent,
  buildReconPrompterSeed,
  ctaLabelForReconPost,
  preferredIntentActionForReconPost,
  RECON_INTERACTION_INTENT_MAX,
} from './recon-prompter-seed';

const basePost: ReconPost = {
  id: 'post-1',
  connectionId: 'conn-1',
  connectionName: 'Alice',
  platformPostId: '123',
  authorUsername: 'alice',
  text: 'We shipped a new observability pipeline with structured logs and trace correlation across services.',
  url: 'https://x.com/alice/status/123',
  postedAt: '2026-07-21T12:00:00.000Z',
  likeCount: 1,
  retweetCount: 0,
  replyCount: 0,
  relevanceScore: 0.9,
  recommendedAction: 'reply',
  status: 'NEW',
  userId: 'user-1',
  createdAt: '2026-07-21T12:00:00.000Z',
  updatedAt: '2026-07-21T12:00:00.000Z',
};

describe('ctaLabelForReconPost', () => {
  it('returns Draft quote for quote action', () => {
    expect(ctaLabelForReconPost({ recommendedAction: 'quote' })).toBe('Draft quote');
  });

  it('returns Draft reply for reply and other actions', () => {
    expect(ctaLabelForReconPost({ recommendedAction: 'reply' })).toBe('Draft reply');
    expect(ctaLabelForReconPost({ recommendedAction: 'like' })).toBe('Draft reply');
    expect(ctaLabelForReconPost({ recommendedAction: null })).toBe('Draft reply');
  });
});

describe('preferredIntentActionForReconPost', () => {
  it('maps quote to quote and other actions to reply', () => {
    expect(preferredIntentActionForReconPost({ recommendedAction: 'quote' })).toBe('quote');
    expect(preferredIntentActionForReconPost({ recommendedAction: 'reply' })).toBe('reply');
    expect(preferredIntentActionForReconPost({ recommendedAction: 'monitor' })).toBe('reply');
  });
});

describe('buildReconInteractionIntent', () => {
  it('prefers suggestedAngle when set', () => {
    const intent = buildReconInteractionIntent({
      recommendedAction: 'reply',
      authorUsername: 'alice',
      suggestedAngle: 'Add a contrarian insight on their AI thesis to spark debate.',
    });
    expect(intent).toBe('Add a contrarian insight on their AI thesis to spark debate.');
    expect(intent).not.toContain('@alice');
  });

  it('truncates suggestedAngle to reply-run max', () => {
    const longAngle = 'x'.repeat(RECON_INTERACTION_INTENT_MAX + 50);
    const intent = buildReconInteractionIntent({
      recommendedAction: 'reply',
      authorUsername: 'alice',
      suggestedAngle: longAngle,
    });
    expect(intent.length).toBe(RECON_INTERACTION_INTENT_MAX);
    expect(intent).toBe(longAngle.slice(0, RECON_INTERACTION_INTENT_MAX));
  });

  it('ignores rationale, bullets, and post excerpt when suggestedAngle is empty', () => {
    const intent = buildReconInteractionIntent({
      recommendedAction: 'reply',
      authorUsername: 'alice',
      suggestedAngle: '',
    });
    expect(intent).toBe(
      buildPrompterInteractionIntent({ action: 'reply', authorUsername: 'alice' })
    );
    expect(intent).not.toContain('contrarian');
    expect(intent).not.toContain('Opportunity:');
    expect(intent).not.toContain('React to:');
  });

  it('uses reply chip framing for reply action when no suggestedAngle', () => {
    const intent = buildReconInteractionIntent({
      recommendedAction: 'reply',
      authorUsername: 'alice',
    });
    expect(intent).toContain('@alice');
    expect(intent).toContain('thoughtful reply');
  });

  it('uses quote chip framing for quote action when no suggestedAngle', () => {
    const intent = buildReconInteractionIntent({
      recommendedAction: 'quote',
      authorUsername: 'bob',
    });
    expect(intent).toBe(buildPrompterInteractionIntent({ action: 'quote', authorUsername: 'bob' }));
    expect(intent).toContain('@bob');
    expect(intent).toContain('quote post');
  });

  it('uses engage framing for monitor and other actions when no suggestedAngle', () => {
    expect(
      buildReconInteractionIntent({
        recommendedAction: 'monitor',
        authorUsername: null,
      })
    ).toBe(buildPrompterInteractionIntent({ action: 'engage', authorUsername: null }));
    expect(
      buildReconInteractionIntent({
        recommendedAction: 'monitor',
        authorUsername: null,
      })
    ).toContain('the creator');
  });
});

describe('buildReconPrompterSeed', () => {
  it('maps post fields into a prompter seed', () => {
    const seed = buildReconPrompterSeed(basePost);
    expect(seed).toEqual({
      connectionId: 'conn-1',
      creatorText:
        'We shipped a new observability pipeline with structured logs and trace correlation across services.',
      interactionIntent: buildReconInteractionIntent(basePost),
      preferredIntentAction: 'reply',
      limitedTextContext: false,
      authorHandle: 'alice',
      evidenceUrl: 'https://x.com/alice/status/123',
      platformPostId: '123',
      reconPostId: 'post-1',
      learningCost: undefined,
    });
  });

  it('includes suggestedAngle in interactionIntent when present', () => {
    const post: ReconPost = {
      ...basePost,
      suggestedAngle: 'Share a concrete infra lesson from your own rollout.',
    };
    const seed = buildReconPrompterSeed(post);
    expect(seed.interactionIntent).toBe('Share a concrete infra lesson from your own rollout.');
    expect(seed.preferredIntentAction).toBe('reply');
  });

  it('flags limitedTextContext for sparse post bodies', () => {
    const post: ReconPost = {
      ...basePost,
      text: 'lol',
    };
    const seed = buildReconPrompterSeed(post);
    expect(seed.limitedTextContext).toBe(true);
  });

  it('passes learningCost through for briefing toggle defaults', () => {
    const post: ReconPost = {
      ...basePost,
      learningCost: 'high',
    };
    const seed = buildReconPrompterSeed(post);
    expect(seed.learningCost).toBe('high');
  });
});
