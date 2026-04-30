import { createContext } from 'react';
import type {
  Reward,
  RewardWithRedemptions,
  CreateRewardInput,
  UpdateRewardInput,
  RewardCategory,
} from '@/types/rewards';

export interface RewardsContextType {
  rewards: RewardWithRedemptions[];
  loading: boolean;
  error: string | null;
  refreshRewards: () => Promise<void>;
  getRewardsByCategory: (category: RewardCategory) => RewardWithRedemptions[];
  createReward: (input: CreateRewardInput) => Promise<Reward>;
  updateReward: (id: string, input: UpdateRewardInput) => Promise<Reward>;
  deleteReward: (id: string) => Promise<void>;
  redeemReward: (rewardId: string, notes?: string) => Promise<void>;
}

export const RewardsContext = createContext<RewardsContextType | undefined>(undefined);

// Re-export types for convenience
export type { Reward, RewardWithRedemptions, CreateRewardInput, UpdateRewardInput, RewardCategory };
