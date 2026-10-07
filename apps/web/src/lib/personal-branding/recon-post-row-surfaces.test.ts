import { describe, expect, it } from 'vitest';
import {
  RECON_HIGH_RELEVANCE_SCORE,
  RECON_LOW_RELEVANCE_SCORE,
  formatReconRelevancePercent,
  reconPostAccentBarClassName,
  reconPostHighOpportunityRibbonClassName,
  reconPostRelevanceTier,
  reconFollowSuggestionActionsClusterClassName,
  reconPostActionsClusterClassName,
  reconPostActionsCompactClusterClassName,
  reconPostActionsWideClusterClassName,
  reconPostContentColumnClassName,
  reconPostPrimaryCtaClusterClassName,
  reconPostRowShellClassName,
  reconPostScorePillClassName,
  reconPostScoreValueClassName,
} from './recon-post-row-surfaces';

describe('reconPostRelevanceTier', () => {
  it('classifies high at and above 0.90', () => {
    expect(reconPostRelevanceTier(0.899)).toBe('mid');
    expect(reconPostRelevanceTier(RECON_HIGH_RELEVANCE_SCORE)).toBe('high');
    expect(reconPostRelevanceTier(0.92)).toBe('high');
  });

  it('classifies mid between 0.5 and 0.89', () => {
    expect(reconPostRelevanceTier(RECON_LOW_RELEVANCE_SCORE)).toBe('mid');
    expect(reconPostRelevanceTier(0.7)).toBe('mid');
    expect(reconPostRelevanceTier(0.85)).toBe('mid');
    expect(reconPostRelevanceTier(0.89)).toBe('mid');
  });

  it('classifies low below 0.5 and unscored', () => {
    expect(reconPostRelevanceTier(0.49)).toBe('low');
    expect(reconPostRelevanceTier(0.3)).toBe('low');
    expect(reconPostRelevanceTier(null)).toBe('low');
    expect(reconPostRelevanceTier(undefined)).toBe('low');
  });
});

describe('formatReconRelevancePercent', () => {
  it('formats percent and unscored', () => {
    expect(formatReconRelevancePercent(0.92)).toBe('92%');
    expect(formatReconRelevancePercent(null)).toBe('Unscored');
  });
});

describe('reconPostHighOpportunityRibbonClassName', () => {
  it('shows ribbon styling only for high tier', () => {
    expect(reconPostHighOpportunityRibbonClassName('high')).toContain('bg-emerald-100');
    expect(reconPostHighOpportunityRibbonClassName('high')).not.toContain('hidden');
    expect(reconPostHighOpportunityRibbonClassName('mid')).toContain('hidden');
    expect(reconPostHighOpportunityRibbonClassName('low')).toContain('hidden');
  });
});

describe('reconPostRowShellClassName', () => {
  it('adds emerald border and top padding for high tier', () => {
    const classes = reconPostRowShellClassName({ tier: 'high' });
    expect(classes).toContain('border-emerald-300/80');
    expect(classes).toContain('pt-5');
    expect(classes).toContain('relative');
    expect(classes).toContain('@container');
  });

  it('mutes low tier active cards', () => {
    const classes = reconPostRowShellClassName({ tier: 'low', variant: 'active' });
    expect(classes).toContain('bg-gray-50/90');
    expect(classes).toContain('opacity-90');
  });

  it('keeps processed opacity without extra low mute stacking', () => {
    const classes = reconPostRowShellClassName({ tier: 'low', variant: 'processed' });
    expect(classes).toContain('opacity-80');
    expect(classes).not.toContain('opacity-90');
  });
});

describe('reconPostAccentBarClassName', () => {
  it('shows accent only for high tier', () => {
    expect(reconPostAccentBarClassName('high')).toContain('bg-emerald-500');
    expect(reconPostAccentBarClassName('mid')).toContain('opacity-0');
    expect(reconPostAccentBarClassName('low')).toContain('opacity-0');
  });
});

describe('reconPostScorePillClassName', () => {
  it('returns pill colors for mid tier only', () => {
    expect(reconPostScorePillClassName({ tier: 'mid', score: 0.7 })).toContain('bg-amber-100');
    expect(reconPostScorePillClassName({ tier: 'mid', score: 0.8 })).toContain('bg-green-100');
    expect(reconPostScorePillClassName({ tier: 'high', score: 0.9 })).toBe('');
  });
});

describe('reconPostScoreValueClassName', () => {
  it('uses large semibold for high tier', () => {
    expect(reconPostScoreValueClassName({ tier: 'high', score: 0.9 })).toContain('text-lg');
    expect(reconPostScoreValueClassName({ tier: 'mid', score: 0.7 })).toContain('text-xs');
    expect(reconPostScoreValueClassName({ tier: 'low', score: 0.3 })).toContain('text-gray-500');
  });
});

describe('reconPost layout column tokens', () => {
  it('caps content column width for ultrawide readability', () => {
    expect(reconPostContentColumnClassName).toContain('max-w-4xl');
    expect(reconPostContentColumnClassName).toContain('min-w-0');
    expect(reconPostContentColumnClassName).toContain('flex-1');
  });

  it('keeps trailing action clusters at the card edge', () => {
    expect(reconPostPrimaryCtaClusterClassName).toContain('ml-auto');
    expect(reconPostPrimaryCtaClusterClassName).toContain('shrink-0');
    expect(reconPostActionsClusterClassName).toContain('ml-auto');
    expect(reconPostActionsClusterClassName).toContain('shrink-0');
    expect(reconPostActionsWideClusterClassName).toContain('hidden');
    expect(reconPostActionsWideClusterClassName).toContain('@[40rem]:flex');
    expect(reconPostActionsCompactClusterClassName).toContain('@[40rem]:hidden');
    expect(reconFollowSuggestionActionsClusterClassName).toContain('ml-auto');
    expect(reconFollowSuggestionActionsClusterClassName).toContain('shrink-0');
  });
});
