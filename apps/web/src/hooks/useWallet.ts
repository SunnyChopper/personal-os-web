import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { walletService } from '@/services/rewards';
import { useBackendStatus } from '@/contexts/BackendStatusContext';
import { shouldLoadWallet } from '@/lib/route-data-policy';
import { queryKeys } from '@/lib/react-query/query-keys';
import { extractApiError, isNetworkError } from '@/lib/react-query/error-utils';
import { applyWalletUpdate } from '@/lib/react-query/growth-system-cache';
import type { WalletTransaction } from '@/types/rewards';

/** Single `/wallet` fetch shared by balance + transactions observers. */
function useWalletDetailQuery() {
  const { pathname } = useLocation();
  const loadWallet = shouldLoadWallet(pathname);
  const { recordError, recordSuccess } = useBackendStatus();

  return useQuery({
    queryKey: queryKeys.wallet.detail(),
    enabled: loadWallet,
    queryFn: async () => {
      try {
        const result = await walletService.fetchWalletDetail();
        if (result.success && result.data) {
          recordSuccess();
        }
        return result;
      } catch (err: unknown) {
        const apiError = extractApiError(err);
        if (apiError && isNetworkError(apiError)) {
          recordError(apiError);
        }
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch wallet balance
 */
export function useWalletBalance() {
  const { data, isLoading, isFetching, isPending, error, isError } = useWalletDetailQuery();

  const apiError = error ? extractApiError(error) : null;

  /** True while refetching with cached data (e.g. after task reopen invalidates wallet). */
  const isRefreshing = isFetching && !isPending && !isError;

  return {
    balance: data?.success && data.data ? data.data.balance : null,
    isLoading: isLoading && !isError,
    isRefreshing,
    isError,
    error: apiError || error,
  };
}

/**
 * Hook to fetch wallet transactions
 */
export function useWalletTransactions(limit: number = 50) {
  const { data, isLoading, isFetching, isPending, error, isError } = useWalletDetailQuery();

  const transactions = useMemo(() => {
    if (!data?.success || !data.data) return [];
    return data.data.transactions.slice(0, limit);
  }, [data, limit]);

  const apiError = error ? extractApiError(error) : null;

  const isRefreshing = isFetching && !isPending && !isError;

  return {
    transactions,
    isLoading: isLoading && !isError,
    isRefreshing,
    isError,
    error: apiError || error,
  };
}

/**
 * Combined hook for wallet balance and transactions
 */
export function useWallet() {
  const balanceQuery = useWalletBalance();
  const transactionsQuery = useWalletTransactions(50);

  return {
    balance: balanceQuery.balance,
    transactions: transactionsQuery.transactions,
    loading: balanceQuery.isLoading || transactionsQuery.isLoading,
    /** Background refetch (invalidate) — show compact loading on balance badge */
    isRefreshing: balanceQuery.isRefreshing || transactionsQuery.isRefreshing,
    error: balanceQuery.error || transactionsQuery.error,
    isError: balanceQuery.isError || transactionsQuery.isError,
  };
}

/**
 * Hook for wallet mutations (add/spend points)
 */
export function useWalletMutations() {
  const queryClient = useQueryClient();

  const addPointsMutation = useMutation({
    mutationFn: async ({
      amount,
      source,
      description,
      sourceEntityType,
      sourceEntityId,
    }: {
      amount: number;
      source: WalletTransaction['source'];
      description: string;
      sourceEntityType?: 'task' | 'reward' | null;
      sourceEntityId?: string | null;
    }) => {
      return walletService.addPoints(amount, source, description, sourceEntityType, sourceEntityId);
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        applyWalletUpdate(queryClient, response.data);
      }
    },
  });

  const spendPointsMutation = useMutation({
    mutationFn: async ({
      amount,
      source,
      description,
      sourceEntityType,
      sourceEntityId,
    }: {
      amount: number;
      source: WalletTransaction['source'];
      description: string;
      sourceEntityType?: 'task' | 'reward' | null;
      sourceEntityId?: string | null;
    }) => {
      return walletService.spendPoints(
        amount,
        source,
        description,
        sourceEntityType,
        sourceEntityId
      );
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        applyWalletUpdate(queryClient, response.data);
      }
    },
  });

  return {
    addPoints: addPointsMutation.mutateAsync,
    spendPoints: spendPointsMutation.mutateAsync,
    isAdding: addPointsMutation.isPending,
    isSpending: spendPointsMutation.isPending,
  };
}
