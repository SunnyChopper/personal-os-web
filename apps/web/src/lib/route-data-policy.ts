import { isAdminLoginPath, ROUTES } from '@/routes';

/**
 * Knowledge Vault list/courses API is only needed under this prefix.
 * @see KnowledgeVaultProvider — React Query `enabled` uses this.
 */
export function shouldLoadKnowledgeVaultData(pathname: string): boolean {
  return pathname.startsWith(ROUTES.admin.knowledgeVault);
}

/**
 * Wallet + rewards: load on every authenticated admin route.
 *
 * AdminLayout always shows WalletWidget in the header; deferring fetches on growth
 * leaf pages left balance stuck at null with loading=false (permanent "..." state).
 */
export function shouldLoadWalletAndRewards(pathname: string): boolean {
  if (!pathname.startsWith('/admin')) return false;
  if (isAdminLoginPath(pathname)) return false;
  return true;
}
