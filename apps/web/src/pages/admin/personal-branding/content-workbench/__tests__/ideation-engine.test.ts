import { describe, expect, it } from 'vitest';
import { isBrandProfileReadyForIdeation } from '../content-workbench-helpers';
import type { BrandProfile } from '@/types/api/personal-branding.dto';

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
