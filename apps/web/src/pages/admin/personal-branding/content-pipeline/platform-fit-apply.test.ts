import { describe, expect, it } from 'vitest';
import type { PlatformFitRecommendation } from '@/types/api/personal-branding.dto';
import {
  platformFitApplyButtonLabel,
  platformFitApplyToastTitle,
  resolvePlatformFitApplyTargets,
} from './platform-fit-apply';

function makeRecommendation(
  platform: PlatformFitRecommendation['platform'],
  fitTier: PlatformFitRecommendation['fitTier']
): PlatformFitRecommendation {
  return {
    platform,
    score: 0.7,
    fitTier,
    rationale: 'test',
    factors: {
      lengthFit: { score: 0.7, detail: '' },
      structureFit: { score: 0.7, detail: '' },
      pillarFit: { score: 0.7, detail: '', matchedPillars: [] },
      rulesFit: { score: 0.7, detail: '', appliedRuleIds: [] },
    },
  };
}

describe('resolvePlatformFitApplyTargets', () => {
  it('selects all high-tier platforms', () => {
    const recommendations = [
      makeRecommendation('x', 'high'),
      makeRecommendation('linkedin', 'high'),
      makeRecommendation('instagram', 'medium'),
    ];

    expect(resolvePlatformFitApplyTargets(recommendations)).toEqual({
      platforms: ['x', 'linkedin'],
      mode: 'high',
    });
  });

  it('falls back to top 2 medium when no high tiers', () => {
    const recommendations = [
      makeRecommendation('x', 'medium'),
      makeRecommendation('linkedin', 'medium'),
      makeRecommendation('instagram', 'medium'),
      makeRecommendation('youtube', 'low'),
    ];

    expect(resolvePlatformFitApplyTargets(recommendations)).toEqual({
      platforms: ['x', 'linkedin'],
      mode: 'medium-top2',
    });
  });

  it('excludes the source platform', () => {
    const recommendations = [
      makeRecommendation('x', 'high'),
      makeRecommendation('linkedin', 'high'),
    ];

    expect(resolvePlatformFitApplyTargets(recommendations, 'x')).toEqual({
      platforms: ['linkedin'],
      mode: 'high',
    });
  });

  it('returns empty platforms when only low tiers remain', () => {
    const recommendations = [
      makeRecommendation('youtube', 'low'),
      makeRecommendation('medium', 'low'),
    ];

    expect(resolvePlatformFitApplyTargets(recommendations)).toEqual({
      platforms: [],
      mode: 'medium-top2',
    });
  });
});

describe('platformFitApplyButtonLabel', () => {
  it('labels high-tier apply actions with count', () => {
    expect(platformFitApplyButtonLabel('high', 1)).toBe('Apply 1 recommended');
    expect(platformFitApplyButtonLabel('high', 3)).toBe('Apply 3 recommended');
  });

  it('labels medium fallback as top 2', () => {
    expect(platformFitApplyButtonLabel('medium-top2', 2)).toBe('Apply top 2');
  });
});

describe('platformFitApplyToastTitle', () => {
  it('lists selected platform labels', () => {
    expect(platformFitApplyToastTitle(['x', 'linkedin'])).toBe('Selected X (Twitter), LinkedIn');
  });

  it('handles empty selection', () => {
    expect(platformFitApplyToastTitle([])).toBe('No platforms selected');
  });
});
