import type { Area, Priority } from '@/types/growth-system';
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
    const response = await apiClient.post<{ data: { result: PointCalculation } }>(
      '/ai/tasks/calculate-points',
      taskData
    );

    if (response.success && response.data) {
      return response.data.data.result;
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

  async brainstormRewards(context: {
    existingRewards: Array<{ title: string; category: string }>;
    userInterests?: string;
    count?: number;
  }): Promise<
    Array<{ title: string; description: string; category: string; suggestedPointCost: number }>
  > {
    const response = await apiClient.post<{
      data: {
        result: Array<{
          title: string;
          description: string;
          category: string;
          suggestedPointCost: number;
        }>;
      };
    }>('/ai/rewards/brainstorm', context);

    if (response.success && response.data) {
      return response.data.data.result;
    }

    throw new Error(response.error?.message || 'Failed to brainstorm rewards');
  },
};
