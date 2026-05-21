import { apiClient } from '@/lib/api-client';
import { llmLogger } from '@/lib/logger';
import type { ApiResponse } from '@/types/api-contracts';
import type { EstablishedHabitActionType, EstablishedHabitAiEnvelope } from '@/types/habit-ai';

export const habitAIService = {
  async establishedActions(params: {
    habitId: string;
    actionType: EstablishedHabitActionType;
    provider?: string;
    useCache?: boolean;
  }): Promise<ApiResponse<EstablishedHabitAiEnvelope>> {
    try {
      const response = await apiClient.post<EstablishedHabitAiEnvelope>(
        '/ai/habits/established-actions',
        {
          habitId: params.habitId,
          actionType: params.actionType,
          provider: params.provider,
          useCache: params.useCache ?? true,
        }
      );

      if (response.success && response.data) {
        return { success: true, data: response.data };
      }

      return {
        success: false,
        data: undefined,
        error: {
          message: response.error?.message || 'Failed to run habit AI action',
          code: 'HABIT_AI_ERROR',
        },
      };
    } catch (error) {
      llmLogger.error('Established habit AI action failed', error);
      return {
        success: false,
        data: undefined,
        error: {
          message: error instanceof Error ? error.message : 'Failed to run habit AI action',
          code: 'HABIT_AI_ERROR',
        },
      };
    }
  },
};
