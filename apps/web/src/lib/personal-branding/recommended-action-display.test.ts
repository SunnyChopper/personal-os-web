import { describe, expect, it } from 'vitest';
import {
  nextActionCueForRecommendedAction,
  recommendedActionBadgeClassName,
  recommendedActionIconKind,
} from './recommended-action-display';

describe('recommendedActionIconKind', () => {
  it('normalizes reply and quote', () => {
    expect(recommendedActionIconKind('reply')).toBe('reply');
    expect(recommendedActionIconKind('QUOTE')).toBe('quote');
  });

  it('falls back to other for unknown values', () => {
    expect(recommendedActionIconKind(null)).toBe('other');
    expect(recommendedActionIconKind('engage')).toBe('other');
  });
});

describe('nextActionCueForRecommendedAction', () => {
  it('returns distinct cues for reply and quote', () => {
    expect(nextActionCueForRecommendedAction('reply')).toBe('Next: Reply in-thread');
    expect(nextActionCueForRecommendedAction('quote')).toBe('Next: Quote-tweet with your take');
  });

  it('returns passive cues for like and monitor', () => {
    expect(nextActionCueForRecommendedAction('like')).toContain('Like');
    expect(nextActionCueForRecommendedAction('monitor')).toContain('Monitor');
  });

  it('returns null for skip and unknown', () => {
    expect(nextActionCueForRecommendedAction('skip')).toBeNull();
    expect(nextActionCueForRecommendedAction(undefined)).toBeNull();
  });
});

describe('recommendedActionBadgeClassName', () => {
  it('uses distinct tones for reply and quote', () => {
    expect(recommendedActionBadgeClassName('reply')).toContain('sky');
    expect(recommendedActionBadgeClassName('quote')).toContain('teal');
  });

  it('uses muted gray for unknown actions', () => {
    expect(recommendedActionBadgeClassName('unknown')).toContain('gray');
  });
});
