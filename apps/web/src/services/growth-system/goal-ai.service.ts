import { apiClient } from '@/lib/api-client';
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
  /**
   * Get AI-powered progress coaching for a specific goal
   */
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

      const backendResponse = await apiClient.post<{ data: AIResponse<ProgressCoachingOutput> }>(
        '/ai/goals/progress-coaching',
        {
          goalId: goal.id,
          goalTitle: goal.title,
          goalDescription: goal.description,
          timeHorizon: goal.timeHorizon,
          targetDate: goal.targetDate,
          status: goal.status,
          progress,
          linkedTasks: tasksSummary,
        }
      );

      if (backendResponse.success && backendResponse.data) {
        return {
          data: backendResponse.data.data.result,
          success: true,
        };
      }

      return {
        data: undefined,
        error: {
          message: backendResponse.error?.message || 'Failed to get coaching',
          code: 'COACHING_ERROR',
        },
        success: false,
      };
    } catch (error) {
      llmLogger.error('Error getting progress coaching', error);
      return {
        data: undefined,
        error: {
          message: error instanceof Error ? error.message : 'Failed to get coaching',
          code: 'COACHING_ERROR',
        },
        success: false,
      };
    }
  },

  /**
   * Calculate AI-powered goal health score
   */
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

      const backendResponse = await apiClient.post<{ data: AIResponse<GoalHealthScoreOutput> }>(
        '/ai/goals/health-score',
        {
          goalId: goal.id,
          goalTitle: goal.title,
          timeHorizon: goal.timeHorizon,
          priority: goal.priority,
          status: goal.status,
          createdAt: goal.createdAt,
          targetDate: goal.targetDate,
          lastActivityAt: goal.lastActivityAt,
          progress,
          relatedGoals: relatedGoalsContext,
        }
      );

      if (backendResponse.success && backendResponse.data) {
        return {
          data: backendResponse.data.data.result,
          success: true,
        };
      }

      return {
        data: undefined,
        error: {
          message: backendResponse.error?.message || 'Failed to calculate health score',
          code: 'HEALTH_SCORE_ERROR',
        },
        success: false,
      };
    } catch (error) {
      llmLogger.error('Error calculating health score', error);
      return {
        data: undefined,
        error: {
          message: error instanceof Error ? error.message : 'Failed to calculate health score',
          code: 'HEALTH_SCORE_ERROR',
        },
        success: false,
      };
    }
  },

  /**
   * Decompose a goal into sub-goals, tasks, metrics, and habits
   */
  async decomposeGoal(goal: Goal): Promise<ApiResponse<GoalDecompositionOutput>> {
    try {
      // Try backend endpoint first
      const backendResponse = await apiClient.post<{ data: AIResponse<GoalDecompositionOutput> }>(
        '/ai/goals/cascade',
        {
          goalId: goal.id,
          goalTitle: goal.title,
          goalDescription: goal.description,
        }
      );

      if (backendResponse.success && backendResponse.data) {
        return {
          data: backendResponse.data.data.result,
          success: true,
        };
      }

      return {
        data: undefined,
        error: {
          message: backendResponse.error?.message || 'Failed to decompose goal',
          code: 'DECOMPOSITION_ERROR',
        },
        success: false,
      };
    } catch (error) {
      llmLogger.error('Error decomposing goal', error);
      return {
        data: undefined,
        error: {
          message: error instanceof Error ? error.message : 'Failed to decompose goal',
          code: 'DECOMPOSITION_ERROR',
        },
        success: false,
      };
    }
  },

  /**
   * Detect conflicts and overcommitment across all goals
   */
  async detectConflicts(goals: Goal[]): Promise<ApiResponse<ConflictDetectionOutput>> {
    try {
      const activeGoals = goals.filter(
        (g) => g.status === 'Active' || g.status === 'On Track' || g.status === 'At Risk'
      );

      const goalsSummary = activeGoals.map((g) => ({
        id: g.id,
        title: g.title,
        description: g.description,
        timeHorizon: g.timeHorizon,
        priority: g.priority,
        status: g.status,
        area: g.area,
        targetDate: g.targetDate,
      }));

      const backendResponse = await apiClient.post<{ data: AIResponse<ConflictDetectionOutput> }>(
        '/ai/goals/conflicts',
        {
          goals: goalsSummary,
        }
      );

      if (backendResponse.success && backendResponse.data) {
        return {
          data: backendResponse.data.data.result,
          success: true,
        };
      }

      return {
        data: undefined,
        error: {
          message: backendResponse.error?.message || 'Failed to detect conflicts',
          code: 'CONFLICT_DETECTION_ERROR',
        },
        success: false,
      };
    } catch (error) {
      llmLogger.error('Error detecting conflicts', error);
      return {
        data: undefined,
        error: {
          message: error instanceof Error ? error.message : 'Failed to detect conflicts',
          code: 'CONFLICT_DETECTION_ERROR',
        },
        success: false,
      };
    }
  },
};
