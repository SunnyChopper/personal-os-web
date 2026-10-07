import { describe, expect, it } from 'vitest';
import {
  formatReferencedPublishedHintLine,
  isBrandProfileReadyForIdeation,
} from '../content-workbench-helpers';
import type { BrandProfile } from '@/types/api/personal-branding.dto';
import { BRAND_PLATFORM_LABELS } from '@/types/api/personal-branding.dto';

function profile(overrides: Partial<BrandProfile> = {}): BrandProfile {
  const now = '2026-06-09T00:00:00Z';
  return {
    id: 'p1',
    name: 'Voice',
    pillars: ['Tech'],
    targetAudience: 'Engineers',
    toneMetrics: {},
    bannedPhrases: [],
    status: 'active',
    userId: 'u1',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('isBrandProfileReadyForIdeation', () => {
  it('requires pillars and target audience', () => {
    expect(isBrandProfileReadyForIdeation(profile())).toBe(true);
    expect(isBrandProfileReadyForIdeation(profile({ pillars: [] }))).toBe(false);
    expect(isBrandProfileReadyForIdeation(profile({ targetAudience: '  ' }))).toBe(false);
  });
});

describe('formatReferencedPublishedHintLine', () => {
  it('joins platform labels for adapted references', () => {
    expect(
      formatReferencedPublishedHintLine(
        {
          contentNodeId: 'node-1',
          title: 'Agent observability essay',
          adaptedPlatforms: ['linkedin', 'x'],
        },
        BRAND_PLATFORM_LABELS
      )
    ).toBe('Agent observability essay — already adapted to LinkedIn, X (Twitter).');
  });
});
