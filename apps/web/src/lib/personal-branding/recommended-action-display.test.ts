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
  it('returns null for reply and quote (badge + Draft CTA already signal the action)', () => {
    expect(nextActionCueForRecommendedAction('reply')).toBeNull();
    expect(nextActionCueForRecommendedAction('quote')).toBeNull();
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
