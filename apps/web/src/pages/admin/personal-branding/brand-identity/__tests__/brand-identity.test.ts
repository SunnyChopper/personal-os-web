import { describe, expect, it } from 'vitest';
import { LOCAL_DRAFT_PROFILE_ID } from '../brand-identity.constants';
import { queryKeys } from '@/lib/react-query/query-keys';

describe('Brand Identity constants', () => {
  it('uses a stable local draft profile id', () => {
    expect(LOCAL_DRAFT_PROFILE_ID).toBe('new-draft-profile');
  });
});

describe('Brand Identity query keys', () => {
  it('builds profile and extraction keys', () => {
    expect(queryKeys.personalBranding.profiles.list()).toEqual([
      'personal-branding',
      'profiles',
      'list',
      1,
      50,
    ]);
    expect(queryKeys.personalBranding.extractions.detail('job-1')).toEqual([
      'personal-branding',
      'extractions',
      'detail',
      'job-1',
    ]);
    expect(queryKeys.personalBranding.profiles.versions('p1')).toEqual([
      'personal-branding',
      'profiles',
      'versions',
      'p1',
    ]);
    expect(queryKeys.personalBranding.platformRules.effective('linkedin', 'p1')).toEqual([
      'personal-branding',
      'platform-rules',
      'effective',
      'linkedin',
      'p1',
    ]);
  });
});
