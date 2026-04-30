import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { rewardsService } from '@/services/rewards';
import { useBackendStatus } from '@/contexts/BackendStatusContext';
import { shouldLoadWalletAndRewards } from '@/lib/route-data-policy';
import { queryKeys } from '@/lib/react-query/query-keys';
import { extractApiError, isNetworkError } from '@/lib/react-query/error-utils';
import {
  applyRewardRedemption,
  applyWalletRedemption,
  coerceRewardWithRedemptionsFromCache,
  removeRewardCache,
  upsertRewardCache,
} from '@/lib/react-query/growth-system-cache';
import type { CreateRewardInput, UpdateRewardInput, RewardCategory } from '@/types/rewards';

/**
 * Hook to fetch all rewards with redemptions
 */
export function useRewards() {
  const { pathname } = useLocation();
  const loadRewards = shouldLoadWalletAndRewards(pathname);
  const { recordError, recordSuccess } = useBackendStatus();

  const { data, isLoading, error, isError } = useQuery({
    queryKey: queryKeys.rewards.withRedemptions(),
    enabled: loadRewards,
    queryFn: async () => {
      try {
        const result = await rewardsService.getAllWithRedemptions();
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
    staleTime: 10 * 60 * 1000, // 10 minutes - rewards rarely change
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  const apiError = error ? extractApiError(error) : null;

  return {
    rewards: data?.data || [],
    isLoading: isLoading && !isError,
    isError,
    error: apiError || error,
  };
}

/**
 * Helper function to get rewards by category
 */
export function useRewardsByCategory(category: RewardCategory) {
  const { rewards } = useRewards();
  return rewards.filter((r) => r.category === category);
}

/**
 * Hook for reward mutations
 */
export function useRewardMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (input: CreateRewardInput) => rewardsService.create(input),
    onSuccess: (response) => {
      if (response.success && response.data) {
        upsertRewardCache(
          queryClient,
          coerceRewardWithRedemptionsFromCache(queryClient, response.data)
        );
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRewardInput }) =>
      rewardsService.update(id, input),
    onSuccess: (response) => {
      if (response.success && response.data) {
        upsertRewardCache(
          queryClient,
          coerceRewardWithRedemptionsFromCache(queryClient, response.data)
        );
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rewardsService.delete(id),
    onSuccess: (_response, rewardId) => {
      removeRewardCache(queryClient, rewardId);
    },
  });

  const redeemMutation = useMutation({
    mutationFn: ({ rewardId, notes }: { rewardId: string; notes?: string }) =>
      rewardsService.redeem({ rewardId, notes }),
    onSuccess: (response) => {
      if (response.success && response.data) {
        applyRewardRedemption(queryClient, response.data);
        applyWalletRedemption(queryClient, response.data);
      }
    },
  });

  return {
    createReward: createMutation.mutateAsync,
    updateReward: updateMutation.mutateAsync,
    deleteReward: deleteMutation.mutateAsync,
    redeemReward: redeemMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isRedeeming: redeemMutation.isPending,
  };
}
