import { describe, expect, it } from 'vitest';
import { ROUTES } from '@/routes';
import {
  shouldLoadVaultTaskLinkBadge,
  shouldLoadWeeklyReviewNavBadge,
} from '@/lib/route-data-policy';

describe('shouldLoadVaultTaskLinkBadge', () => {
  it('loads immediately on task-links route', () => {
    expect(shouldLoadVaultTaskLinkBadge(ROUTES.admin.knowledgeVaultTaskLinks, false)).toBe(true);
  });

  it('defers on unrelated admin routes until idle', () => {
    expect(shouldLoadVaultTaskLinkBadge(ROUTES.admin.dashboard, false)).toBe(false);
    expect(shouldLoadVaultTaskLinkBadge(ROUTES.admin.dashboard, true)).toBe(true);
  });

  it('skips login path', () => {
    expect(shouldLoadVaultTaskLinkBadge(ROUTES.admin.login, true)).toBe(false);
  });
});

describe('shouldLoadWeeklyReviewNavBadge', () => {
  it('loads immediately on weekly review route', () => {
    expect(shouldLoadWeeklyReviewNavBadge(ROUTES.admin.weeklyReview, false)).toBe(true);
  });

  it('defers on unrelated admin routes until idle', () => {
    expect(shouldLoadWeeklyReviewNavBadge(ROUTES.admin.dashboard, false)).toBe(false);
    expect(shouldLoadWeeklyReviewNavBadge(ROUTES.admin.dashboard, true)).toBe(true);
  });
});
