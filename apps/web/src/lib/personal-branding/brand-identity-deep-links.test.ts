import { describe, expect, it } from 'vitest';
import { ROUTES } from '@/routes';
import { brandIdentityHref } from './brand-identity-deep-links';

describe('brandIdentityHref', () => {
  it('returns bare Brand Identity route when no options', () => {
    expect(brandIdentityHref()).toBe(ROUTES.admin.personalBrandingBrandIdentity);
  });

  it('builds core-profile tab link for missing-profile CTA', () => {
    expect(brandIdentityHref({ tab: 'core-profile' })).toBe(
      `${ROUTES.admin.personalBrandingBrandIdentity}?tab=core-profile`
    );
  });

  it('builds incomplete-profile link with profileId and pillars section', () => {
    expect(
      brandIdentityHref({
        tab: 'core-profile',
        profileId: 'profile-abc',
        section: 'pillars',
      })
    ).toBe(
      `${ROUTES.admin.personalBrandingBrandIdentity}?tab=core-profile&profileId=profile-abc&section=pillars`
    );
  });
});
