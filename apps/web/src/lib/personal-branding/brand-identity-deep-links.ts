import { ROUTES } from '@/routes';

export type BrandIdentityTab = 'core-profile' | 'platform-rules';
export type BrandIdentitySection = 'pillars';

export interface BrandIdentityHrefOptions {
  tab?: BrandIdentityTab;
  profileId?: string;
  section?: BrandIdentitySection;
}

/** Deep-link into Brand Identity Core Profile or Platform Rules with optional profile + section focus. */
export function brandIdentityHref(options?: BrandIdentityHrefOptions): string {
  const params = new URLSearchParams();
  if (options?.tab) {
    params.set('tab', options.tab);
  }
  if (options?.profileId) {
    params.set('profileId', options.profileId);
  }
  if (options?.section) {
    params.set('section', options.section);
  }
  const query = params.toString();
  return query
    ? `${ROUTES.admin.personalBrandingBrandIdentity}?${query}`
    : ROUTES.admin.personalBrandingBrandIdentity;
}
