import { apiClient } from '@/lib/api-client';
import { apiFailure, withFeatureLlm } from '@/lib/llm/feature-ai-request';
import { llmLogger } from '@/lib/logger';
import type { Goal, Task, GoalProgressBreakdown } from '@/types/growth-system';
import type { ApiResponse } from '@/types/api-contracts';
import type {
  ProgressCoachingOutput,
  GoalHealthScoreOutput,
  GoalDecompositionOutput,
  ConflictDetectionOutput,
} from '@/lib/llm/schemas/goal-ai-schemas';

interface AIResponse<T> {
  result: T;
  confidence: number;
  reasoning?: string;
  provider?: string;
  model?: string;
  cached?: boolean;
}

export const goalAIService = {
  async getProgressCoaching(
    goal: Goal,
    progress: GoalProgressBreakdown,
    linkedTasks: Task[]
  ): Promise<ApiResponse<ProgressCoachingOutput>> {
    try {
      const tasksSummary = linkedTasks.map((t) => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
      }));

      const body = await withFeatureLlm('goalProgress', {
        goalId: goal.id,
        title: goal.title,
        description: goal.description ?? '',
        timeHorizon: goal.timeHorizon,
        targetDate: goal.targetDate,
        currentProgress: progress.overall ?? 0,
        criteria: [],
        linkedTasks: tasksSummary,
        linkedMetrics: [],
        linkedHabits: [],
        recentActivity: [],
      });

      const backendResponse = await apiClient.post<{ data: AIResponse<ProgressCoachingOutput> }>(
        '/ai/goals/progress',
        body
      );

      if (backendResponse.success && backendResponse.data) {
        return {
          data: backendResponse.data.data.result,
          success: true,
        };
      }
      const message = backendResponse.error?.message || 'Failed to get coaching';
      return apiFailure<ProgressCoachingOutput>('goalProgress', message, 'COACHING_ERROR');
    } catch (error) {
      llmLogger.error('Error getting progress coaching', error);
      const message = error instanceof Error ? error.message : 'Failed to get coaching';
      return apiFailure<ProgressCoachingOutput>('goalProgress', message, 'COACHING_ERROR');
    }
  },

  async calculateHealthScore(
    goal: Goal,
    allGoals: Goal[],
    progress: GoalProgressBreakdown
  ): Promise<ApiResponse<GoalHealthScoreOutput>> {
    try {
      const relatedGoalsContext = allGoals
        .filter((g) => g.id !== goal.id && g.area === goal.area && g.status === 'Active')
        .slice(0, 5)
        .map((g) => ({ title: g.title, status: g.status, priority: g.priority }));

      const body = await withFeatureLlm('goalProgress', {
        goalId: goal.id,
        title: goal.title,
        description: goal.description ?? '',
        timeHorizon: goal.timeHorizon,
        targetDate: goal.targetDate,
        currentProgress: progress.overall ?? 0,
        criteria: [],
        linkedTasks: [],
        linkedMetrics: [],
        linkedHabits: [],
        recentActivity: relatedGoalsContext,
      });

      const backendResponse = await apiClient.post<{ data: AIResponse<GoalHealthScoreOutput> }>(
        '/ai/goals/progress',
        body
      );

      if (backendResponse.success && backendResponse.data) {
        const progressResult = backendResponse.data.data.result as unknown as GoalHealthScoreOutput;
        return { data: progressResult, success: true };
      }

      const message = backendResponse.error?.message || 'Failed to calculate health score';
      return apiFailure<GoalHealthScoreOutput>('goalProgress', message, 'HEALTH_SCORE_ERROR');
    } catch (error) {
      llmLogger.error('Error calculating health score', error);
      const message = error instanceof Error ? error.message : 'Failed to calculate health score';
      return apiFailure<GoalHealthScoreOutput>('goalProgress', message, 'HEALTH_SCORE_ERROR');
    }
  },

  async decomposeGoal(goal: Goal): Promise<ApiResponse<GoalDecompositionOutput>> {
    try {
      const body = await withFeatureLlm('goalCascade', {
        goalId: goal.id,
        title: goal.title,
        description: goal.description ?? '',
        timeHorizon: goal.timeHorizon,
      });

      const backendResponse = await apiClient.post<{ data: AIResponse<GoalDecompositionOutput> }>(
        '/ai/goals/cascade',
        body
      );

      if (backendResponse.success && backendResponse.data) {
        return {
          data: backendResponse.data.data.result,
          success: true,
        };
      }

      const message = backendResponse.error?.message || 'Failed to decompose goal';
      return apiFailure<GoalDecompositionOutput>('goalCascade', message, 'DECOMPOSITION_ERROR');
    } catch (error) {
      llmLogger.error('Error decomposing goal', error);
      const message = error instanceof Error ? error.message : 'Failed to decompose goal';
      return apiFailure<GoalDecompositionOutput>('goalCascade', message, 'DECOMPOSITION_ERROR');
    }
  },

  async detectConflicts(goals: Goal[]): Promise<ApiResponse<ConflictDetectionOutput>> {
    try {
      const activeGoals = goals.filter((g) => g.status === 'Active');
      const primary = activeGoals[0];
      if (!primary) {
        return apiFailure<ConflictDetectionOutput>(
          'goalConflict',
          'No active goals to analyze',
          'CONFLICT_DETECTION_ERROR'
        );
      }

      const otherGoals = activeGoals
        .filter((g) => g.id !== primary.id)
        .map((g) => ({
          id: g.id,
          title: g.title,
          description: g.description,
          timeHorizon: g.timeHorizon,
          priority: g.priority,
          status: g.status,
          area: g.area,
          targetDate: g.targetDate,
        }));

      const body = await withFeatureLlm('goalConflict', {
        goalId: primary.id,
        title: primary.title,
        description: primary.description ?? '',
        timeHorizon: primary.timeHorizon,
        area: primary.area,
        otherGoals,
      });

      const backendResponse = await apiClient.post<{ data: AIResponse<ConflictDetectionOutput> }>(
        '/ai/goals/conflicts',
        body
      );

      if (backendResponse.success && backendResponse.data) {
        return {
          data: backendResponse.data.data.result,
          success: true,
        };
      }

      const message = backendResponse.error?.message || 'Failed to detect conflicts';
      return apiFailure<ConflictDetectionOutput>(
        'goalConflict',
        message,
        'CONFLICT_DETECTION_ERROR'
      );
    } catch (error) {
      llmLogger.error('Error detecting conflicts', error);
      const message = error instanceof Error ? error.message : 'Failed to detect conflicts';
      return apiFailure<ConflictDetectionOutput>(
        'goalConflict',
        message,
        'CONFLICT_DETECTION_ERROR'
      );
    }
  },
};
