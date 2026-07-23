import { describe, expect, it } from 'vitest';
import type { BrandProfile } from '@/types/api/personal-branding.dto';
import {
  allTargetPlatformsHaveProfiles,
  buildRepurposeTargets,
  eligibleProfilesForPlatform,
  profileSupportsPlatform,
} from './pipeline-profile-selection';

function profile(overrides: Partial<BrandProfile> = {}): BrandProfile {
  return {
    id: 'profile-1',
    name: 'Voice',
    pillars: [],
    toneMetrics: {},
    bannedPhrases: [],
    status: 'active',
    platforms: [],
    userId: 'user-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('pipeline-profile-selection', () => {
  it('treats empty platforms as all-platform affinity', () => {
    expect(profileSupportsPlatform(profile(), 'x')).toBe(true);
    expect(profileSupportsPlatform(profile(), 'linkedin')).toBe(true);
  });

  it('filters eligible profiles by platform affinity and active status', () => {
    const profiles = [
      profile({ id: 'x-only', platforms: ['x'] }),
      profile({ id: 'all', platforms: [] }),
      profile({ id: 'draft', status: 'draft', platforms: ['x'] }),
    ];

    expect(eligibleProfilesForPlatform(profiles, 'x').map((entry) => entry.id)).toEqual([
      'x-only',
      'all',
    ]);
    expect(eligibleProfilesForPlatform(profiles, 'linkedin').map((entry) => entry.id)).toEqual([
      'all',
    ]);
  });

  it('builds repurpose targets from the per-platform map', () => {
    expect(
      buildRepurposeTargets(['x', 'linkedin'], {
        x: 'profile-x',
        linkedin: 'profile-li',
      })
    ).toEqual([
      { platform: 'x', brandProfileId: 'profile-x' },
      { platform: 'linkedin', brandProfileId: 'profile-li' },
    ]);
  });

  it('requires a valid profile id for every selected platform', () => {
    const profiles = [
      profile({ id: 'x-only', platforms: ['x'] }),
      profile({ id: 'li-only', platforms: ['linkedin'] }),
    ];

    expect(
      allTargetPlatformsHaveProfiles(
        ['x', 'linkedin'],
        { x: 'x-only', linkedin: 'li-only' },
        profiles
      )
    ).toBe(true);
    expect(
      allTargetPlatformsHaveProfiles(
        ['x', 'linkedin'],
        { x: 'x-only', linkedin: 'x-only' },
        profiles
      )
    ).toBe(false);
  });
});
