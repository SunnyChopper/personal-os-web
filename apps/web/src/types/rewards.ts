export type RewardCategory = 'Quick Treat' | 'Daily Delight' | 'Big Unlock' | 'Custom';

export type RewardStatus = 'Active' | 'Locked' | 'Archived';

export interface Reward {
  id: string;
  title: string;
  description: string | null;
  category: RewardCategory;
  pointCost: number;
  icon: string | null;
  imageUrl: string | null;
  isAutomated: boolean;
  automationInstructions: string | null;
  cooldownHours: number | null;
  maxRedemptionsPerDay: number | null;
  status: RewardStatus;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RewardRedemption {
  id: string;
  rewardId: string;
  userId: string;
  pointsSpent: number;
  redeemedAt: string;
  notes: string | null;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'earn' | 'spend' | 'refund' | 'clawback' | 'adjustment';
  source:
    | 'task_completion'
    | 'task_completion_reversal'
    | 'reward_redemption'
    | 'manual'
    | 'system';
  sourceEntityType: 'task' | 'reward' | null;
  sourceEntityId: string | null;
  description: string;
  createdAt: string;
}

export interface WalletBalance {
  userId: string;
  totalPoints: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  updatedAt: string;
}

export interface TaskPointValuation {
  taskId: string;
  basePoints: number;
  sizeMultiplier: number;
  priorityMultiplier: number;
  areaMultiplier: number;
  totalPoints: number;
  calculatedAt: string;
}

export interface CreateRewardInput {
  title: string;
  description?: string;
  category: RewardCategory;
  pointCost: number;
  icon?: string;
  imageUrl?: string;
  isAutomated?: boolean;
  automationInstructions?: string;
  cooldownHours?: number;
  maxRedemptionsPerDay?: number;
  status?: RewardStatus;
}

export interface UpdateRewardInput {
  title?: string;
  description?: string;
  category?: RewardCategory;
  pointCost?: number;
  icon?: string;
  imageUrl?: string;
  isAutomated?: boolean;
  automationInstructions?: string;
  cooldownHours?: number;
  maxRedemptionsPerDay?: number;
  status?: RewardStatus;
}

export interface RedeemRewardInput {
  rewardId: string;
  notes?: string;
}

export interface RewardWithRedemptions extends Reward {
  redemptions: RewardRedemption[];
  lastRedeemedAt: string | null;
  canRedeem: boolean;
  cooldownMessage: string | null;
}

/** AI brainstorm — matches POST /ai/rewards/brainstorm and /resolve responses. */
export interface RewardSuggestionPayload {
  title: string;
  description?: string | null;
  category: RewardCategory;
  pointCost: number;
  icon?: string | null;
  cooldownHours?: number | null;
  maxRedemptionsPerDay?: number | null;
}

export interface RewardSuggestionReasons {
  pointCostReason: string;
  categoryReason: string;
  cooldownHoursReason: string;
  maxRedemptionsPerDayReason: string;
  overall?: string | null;
}

export interface RewardSuggestionItem {
  id: string;
  status: string;
  proposedReward: RewardSuggestionPayload;
  reasons: RewardSuggestionReasons;
  model?: string | null;
  resolutionFeedback?: string | null;
  resolvedReward?: RewardSuggestionPayload | null;
  createdRewardId?: string | null;
  feedbackSignals?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RewardBrainstormApiResult {
  suggestions: RewardSuggestionItem[];
  model: string;
  contextStats: {
    existingRewardCount: number;
    memorySnippetCount: number;
    recentDecisionsCount: number;
  };
}

export interface RewardSuggestionResolveApiResult {
  suggestion: RewardSuggestionItem;
  reward?: Reward | null;
}
