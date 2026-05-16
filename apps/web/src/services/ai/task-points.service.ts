import type { Area, Priority } from '@/types/growth-system';
import type {
  RewardBrainstormApiResult,
  RewardSuggestionPayload,
  RewardSuggestionResolveApiResult,
} from '@/types/rewards';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client';

const pointCalculationSchema = z.object({
  pointValue: z.number().min(0),
  reasoning: z.string(),
  breakdown: z.object({
    basePoints: z.number(),
    complexityMultiplier: z.number(),
    priorityMultiplier: z.number(),
    skillMultiplier: z.number(),
  }),
});

type PointCalculation = z.infer<typeof pointCalculationSchema>;

export const taskPointsAIService = {
  async calculateTaskPoints(taskData: {
    title: string;
    description?: string;
    area: Area;
    priority: Priority;
    size?: number;
  }): Promise<PointCalculation> {
    const response = await apiClient.post<PointCalculation>(
      '/ai/tasks/calculate-points',
      {
        ...taskData,
        useCache: true,
      },
      pointCalculationSchema
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to calculate task points');
  },

  async calculateRewardPointCost(rewardData: {
    title: string;
    description?: string;
    category: string;
    existingRewards?: Array<{ title: string; pointCost: number; category: string }>;
    typicalTaskPoints?: { min: number; max: number; average: number };
  }): Promise<{ pointCost: number; reasoning: string }> {
    const response = await apiClient.post<{
      data: { result: { pointCost: number; reasoning: string } };
    }>('/ai/rewards/calculate-cost', rewardData);

    if (response.success && response.data) {
      return response.data.data.result;
    }

    throw new Error(response.error?.message || 'Failed to calculate reward point cost');
  },

  /**
   * Server loads existing rewards + feedback history. Optional userPreferences for extra hint text.
   */
  async brainstormRewards(body: {
    count?: number;
    userPreferences?: string;
  }): Promise<RewardBrainstormApiResult> {
    const response = await apiClient.post<RewardBrainstormApiResult>('/ai/rewards/brainstorm', {
      count: body.count ?? 8,
      userPreferences: body.userPreferences,
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to brainstorm rewards');
  },

  async resolveRewardSuggestion(
    suggestionId: string,
    body: {
      approve: boolean;
      feedback?: string;
      resolvedReward?: RewardSuggestionPayload;
    }
  ): Promise<RewardSuggestionResolveApiResult> {
    const response = await apiClient.post<RewardSuggestionResolveApiResult>(
      `/ai/rewards/suggestions/${encodeURIComponent(suggestionId)}/resolve`,
      {
        approve: body.approve,
        ...(body.feedback ? { feedback: body.feedback } : {}),
        ...(body.resolvedReward ? { resolvedReward: body.resolvedReward } : {}),
      }
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to update reward suggestion');
  },
};
