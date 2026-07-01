import { isAdminLoginPath, ROUTES } from '@/routes';

/**
 * Knowledge Vault list/courses API is only needed under this prefix.
 * @see KnowledgeVaultProvider — React Query `enabled` uses this.
 */
export function shouldLoadKnowledgeVaultData(pathname: string): boolean {
  return pathname.startsWith(ROUTES.admin.knowledgeVault);
}

/**
 * Wallet balance/transactions: every authenticated admin route (header widget).
 *
 * AdminLayout always shows WalletWidget; deferring wallet fetch left balance stuck at null.
 */
export function shouldLoadWallet(pathname: string): boolean {
  if (!pathname.startsWith('/admin')) return false;
  if (isAdminLoginPath(pathname)) return false;
  return true;
}

/**
 * Rewards catalog + redemptions: only routes that use RewardsProvider consumers.
 * Avoids cold `GET /rewards` on unrelated admin pages (see cold-start contract).
 */
export function shouldLoadRewards(pathname: string): boolean {
  if (!shouldLoadWallet(pathname)) return false;
  return (
    pathname.startsWith(ROUTES.admin.rewardsStore) || pathname.startsWith(ROUTES.admin.rewardStudio)
  );
}

/**
 * Vault task-link nav badge: defer until idle unless the user is on the task-links route.
 */
export function shouldLoadVaultTaskLinkBadge(pathname: string, idleReady: boolean): boolean {
  if (!pathname.startsWith('/admin') || isAdminLoginPath(pathname)) return false;
  if (pathname.startsWith(ROUTES.admin.knowledgeVaultTaskLinks)) return true;
  return idleReady;
}

/**
 * Weekly review nav badge: defer until idle unless the user is on weekly review.
 */
export function shouldLoadWeeklyReviewNavBadge(pathname: string, idleReady: boolean): boolean {
  if (!pathname.startsWith('/admin') || isAdminLoginPath(pathname)) return false;
  if (pathname.startsWith(ROUTES.admin.weeklyReview)) return true;
  return idleReady;
}
