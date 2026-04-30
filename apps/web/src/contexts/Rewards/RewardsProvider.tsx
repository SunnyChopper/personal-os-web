import { useCallback } from 'react';
import type { ReactNode } from 'react';
import { useRewards, useRewardMutations } from '@/hooks/useRewards';
import { useWallet } from '@/contexts/Wallet';
import { useQueryClient } from '@tanstack/react-query';
import {
  RewardsContext,
  type RewardsContextType,
  type Reward,
  type RewardCategory,
  type CreateRewardInput,
  type UpdateRewardInput,
} from './types';

interface RewardsProviderProps {
  children: ReactNode;
}

export const RewardsProvider = ({ children }: RewardsProviderProps) => {
  const { rewards, isLoading, error } = useRewards();
  const { spendPoints } = useWallet();
  const {
    createReward: createRewardMutation,
    updateReward: updateRewardMutation,
    deleteReward: deleteRewardMutation,
    redeemReward: redeemRewardMutation,
  } = useRewardMutations();
  const queryClient = useQueryClient();

  const refreshRewards = useCallback(async () => {
    // Invalidate queries to trigger refetch
    await queryClient.invalidateQueries({ queryKey: ['rewards'] });
  }, [queryClient]);

  const getRewardsByCategory = useCallback(
    (category: RewardCategory) => {
      return rewards.filter((r) => r.category === category);
    },
    [rewards]
  );

  const createReward = useCallback(
    async (input: CreateRewardInput): Promise<Reward> => {
      const response = await createRewardMutation(input);
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to create reward');
      }
    },
    [createRewardMutation]
  );

  const updateReward = useCallback(
    async (id: string, input: UpdateRewardInput): Promise<Reward> => {
      const response = await updateRewardMutation({ id, input });
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to update reward');
      }
    },
    [updateRewardMutation]
  );

  const deleteReward = useCallback(
    async (id: string): Promise<void> => {
      const response = await deleteRewardMutation(id);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to delete reward');
      }
    },
    [deleteRewardMutation]
  );

  const redeemReward = useCallback(
    async (rewardId: string, notes?: string): Promise<void> => {
      const reward = rewards.find((r) => r.id === rewardId);
      if (!reward) {
        throw new Error('Reward not found');
      }

      if (!reward.canRedeem) {
        throw new Error(reward.cooldownMessage || 'Cannot redeem this reward');
      }

      // Redeem the reward (this will invalidate both rewards and wallet queries)
      const redemptionResponse = await redeemRewardMutation({ rewardId, notes });

      if (!redemptionResponse.success || !redemptionResponse.data) {
        throw new Error(redemptionResponse.error?.message || 'Failed to redeem reward');
      }

      // Spend points (this will also invalidate wallet queries)
      await spendPoints(
        reward.pointCost,
        'reward_redemption',
        `Redeemed: ${reward.title}`,
        'reward',
        rewardId
      );
    },
    [rewards, spendPoints, redeemRewardMutation]
  );

  const value: RewardsContextType = {
    rewards,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    refreshRewards,
    getRewardsByCategory,
    createReward,
    updateReward,
    deleteReward,
    redeemReward,
  };

  return <RewardsContext.Provider value={value}>{children}</RewardsContext.Provider>;
};
