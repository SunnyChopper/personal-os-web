import { describe, expect, it } from 'vitest';
import {
  buildRadarDiscoveryInput,
  effectiveRadarDiscoveryTopics,
  radarDiscoveryCandidateFilterParams,
  validateRadarDiscoveryInput,
} from './radar-discovery';
import type { BrandProfile } from '@/types/api/personal-branding.dto';

const profile: BrandProfile = {
  id: 'profile-1',
  name: 'Builder',
  description: 'Builds durable AI products',
  pillars: ['AI Systems', 'Product Craft'],
  targetAudience: 'Technical founders',
  toneMetrics: {},
  bannedPhrases: [],
  status: 'active',
  userId: 'user-1',
  createdAt: '2026-07-01T00:00:00Z',
  updatedAt: '2026-07-01T00:00:00Z',
};

describe('radar discovery setup helpers', () => {
  it('deduplicates effective topics across pillars and custom topics case-insensitively', () => {
    const input = buildRadarDiscoveryInput(
      [profile.id],
      { [profile.id]: ['AI Systems', 'Product Craft'] },
      [' ai systems ', 'Durable Agents', 'durable agents']
    );

    expect(input.customTopics).toEqual(['ai systems', 'Durable Agents']);
    expect(effectiveRadarDiscoveryTopics(input.profileSelections, input.customTopics)).toEqual([
      'AI Systems',
      'Product Craft',
      'Durable Agents',
    ]);
  });

  it('requires a profile and at least one selected pillar for each profile', () => {
    expect(
      validateRadarDiscoveryInput({ profileSelections: [], customTopics: ['AI'] }, [profile])
    ).toBe('Select at least one brand profile.');

    expect(
      validateRadarDiscoveryInput(
        {
          profileSelections: [{ profileId: profile.id, pillars: [] }],
          customTopics: ['AI'],
        },
        [profile]
      )
    ).toBe('Select at least one pillar for Builder.');
  });

  it('maps review filters to backend status and verdict parameters', () => {
    expect(radarDiscoveryCandidateFilterParams('all')).toEqual({});
    expect(radarDiscoveryCandidateFilterParams('relevant')).toEqual({ verdict: 'relevant' });
    expect(radarDiscoveryCandidateFilterParams('irrelevant')).toEqual({ verdict: 'not_relevant' });
    expect(radarDiscoveryCandidateFilterParams('duplicate')).toEqual({});
    expect(radarDiscoveryCandidateFilterParams('errors')).toEqual({ status: 'failed' });
  });
});
