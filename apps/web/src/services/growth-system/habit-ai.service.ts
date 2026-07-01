import { apiClient } from '@/lib/api-client';
import { apiFailure, withFeatureLlm } from '@/lib/llm/feature-ai-request';
import type { AIFeature } from '@/lib/llm/config/feature-types';
import { llmLogger } from '@/lib/logger';
import type { ApiResponse } from '@/types/api-contracts';
import type { EstablishedHabitActionType, EstablishedHabitAiEnvelope } from '@/types/habit-ai';

const ACTION_FEATURE: Record<EstablishedHabitActionType, AIFeature> = {
  patternInsight: 'habitPatterns',
  routineTuneUp: 'triggerOptimization',
  recoveryPlan: 'streakRecovery',
  sevenDayExperiment: 'habitDesign',
};

export const habitAIService = {
  async establishedActions(params: {
    habitId: string;
    actionType: EstablishedHabitActionType;
    provider?: string;
    useCache?: boolean;
  }): Promise<ApiResponse<EstablishedHabitAiEnvelope>> {
    const feature = ACTION_FEATURE[params.actionType];
    try {
      const body = await withFeatureLlm(feature, {
        habitId: params.habitId,
        actionType: params.actionType,
        useCache: params.useCache ?? true,
      });

      const response = await apiClient.post<EstablishedHabitAiEnvelope>(
        '/ai/habits/established-actions',
        body
      );

      if (response.success && response.data) {
        return { success: true, data: response.data };
      }

      const message = response.error?.message || 'Failed to run habit AI action';
      return apiFailure<EstablishedHabitAiEnvelope>(feature, message, 'HABIT_AI_ERROR');
    } catch (error) {
      llmLogger.error('Established habit AI action failed', error);
      const message = error instanceof Error ? error.message : 'Failed to run habit AI action';
      return apiFailure<EstablishedHabitAiEnvelope>(feature, message, 'HABIT_AI_ERROR');
    }
  },
};
