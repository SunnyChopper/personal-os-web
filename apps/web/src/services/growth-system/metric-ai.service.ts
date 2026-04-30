import { apiClient } from '@/lib/api-client';
import { llmLogger } from '@/lib/logger';
import type { Metric, MetricLog, Goal } from '@/types/growth-system';
import type { ApiResponse } from '@/types/api-contracts';
import { z } from 'zod';

interface AIResponse<T> {
  result: T;
  confidence: number;
  reasoning?: string;
  provider?: string;
  model?: string;
  cached?: boolean;
}

// Zod schemas for structured outputs
const PatternSchema = z.object({
  type: z.enum(['trend', 'cycle', 'seasonal', 'spike', 'plateau']),
  description: z.string(),
  significance: z.enum(['low', 'medium', 'high']),
  insights: z.string(),
  recommendations: z.array(z.string()),
});

const PatternsResponseSchema = z.object({
  patterns: z.array(PatternSchema),
  overallTrend: z.enum(['improving', 'declining', 'stable']),
  confidence: z.number().min(0).max(1),
});

const AnomalyResponseSchema = z.object({
  isAnomaly: z.boolean(),
  anomalyType: z.enum(['spike', 'drop', 'outlier']).optional(),
  severity: z.enum(['low', 'medium', 'high']),
  possibleCauses: z.array(z.string()),
  recommendations: z.array(z.string()),
  requiresAttention: z.boolean(),
  confidence: z.number().min(0).max(1),
});

const CorrelationResponseSchema = z.object({
  correlations: z.array(
    z.object({
      metricName: z.string(),
      correlationType: z.enum(['positive', 'negative']),
      strength: z.enum(['weak', 'moderate', 'strong']),
      description: z.string(),
      insights: z.string(),
      actionable: z.boolean(),
    })
  ),
  overallInsights: z.string(),
  confidence: z.number().min(0).max(1),
});

const NarrativeResponseSchema = z.object({
  summary: z.string(),
  keyInsights: z.array(z.string()),
  trends: z.string(),
  recommendations: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

const PredictionResponseSchema = z.object({
  projectedValue: z.number(),
  projectedDate: z.string(),
  confidence: z.number().min(0).max(1),
  riskFactors: z.array(z.string()),
  milestones: z.array(
    z.object({
      value: z.number(),
      date: z.string(),
      description: z.string(),
    })
  ),
});

const RecommendationResponseSchema = z.object({
  recommendations: z.array(
    z.object({
      type: z.enum(['logging', 'target', 'frequency', 'intervention']),
      title: z.string(),
      description: z.string(),
      priority: z.enum(['low', 'medium', 'high']),
      actionable: z.boolean(),
    })
  ),
  confidence: z.number().min(0).max(1),
});

const CoachingResponseSchema = z.object({
  message: z.string(),
  tone: z.enum(['celebration', 'encouragement', 'warning', 'guidance']),
  tips: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export const metricAIService = {
  /**
   * Analyze patterns in metric data
   */
  async analyzePatterns(
    metric: Metric,
    _logs: MetricLog[]
  ): Promise<ApiResponse<z.infer<typeof PatternsResponseSchema>>> {
    try {
      // Try backend endpoint first
      const backendResponse = await apiClient.post<{
        data: AIResponse<z.infer<typeof PatternsResponseSchema>>;
      }>('/ai/metrics/patterns', {
        metricId: metric.id,
      });

      if (backendResponse.success && backendResponse.data) {
        return {
          data: backendResponse.data.data.result,
          success: true,
        };
      }
      return {
        data: undefined,
        error: {
          message: backendResponse.error?.message || 'Failed to analyze patterns',
          code: 'PATTERN_ANALYSIS_ERROR',
        },
        success: false,
      };
    } catch (error) {
      llmLogger.error('Error analyzing patterns', error);
      return {
        data: undefined,
        error: {
          message: error instanceof Error ? error.message : 'Failed to analyze patterns',
          code: 'PATTERN_ANALYSIS_ERROR',
        },
        success: false,
      };
    }
  },

  /**
   * Detect anomalies in metric data
   */
  async detectAnomalies(
    metric: Metric,
    _logs: MetricLog[]
  ): Promise<ApiResponse<z.infer<typeof AnomalyResponseSchema>>> {
    try {
      // Try backend endpoint first
      const backendResponse = await apiClient.post<{
        data: AIResponse<z.infer<typeof AnomalyResponseSchema>>;
      }>('/ai/metrics/anomalies', {
        metricId: metric.id,
      });

      if (backendResponse.success && backendResponse.data) {
        return {
          data: backendResponse.data.data.result,
          success: true,
        };
      }
      return {
        data: undefined,
        error: {
          message: backendResponse.error?.message || 'Failed to detect anomalies',
          code: 'ANOMALY_DETECTION_ERROR',
        },
        success: false,
      };
    } catch (error) {
      llmLogger.error('Error detecting anomalies', error);
      return {
        data: undefined,
        error: {
          message: error instanceof Error ? error.message : 'Failed to detect anomalies',
          code: 'ANOMALY_DETECTION_ERROR',
        },
        success: false,
      };
    }
  },

  /**
   * Find correlations with other metrics
   */
  async findCorrelations(
    metric: Metric,
    _allMetrics: Metric[],
    _allLogs: Map<string, MetricLog[]>
  ): Promise<ApiResponse<z.infer<typeof CorrelationResponseSchema>>> {
    try {
      // Try backend endpoint first
      const backendResponse = await apiClient.post<{
        data: AIResponse<z.infer<typeof CorrelationResponseSchema>>;
      }>('/ai/metrics/correlations', {
        metricId: metric.id,
      });

      if (backendResponse.success && backendResponse.data) {
        return {
          data: backendResponse.data.data.result,
          success: true,
        };
      }
      return {
        data: undefined,
        error: {
          message: backendResponse.error?.message || 'Failed to find correlations',
          code: 'CORRELATION_ERROR',
        },
        success: false,
      };
    } catch (error) {
      llmLogger.error('Error finding correlations', error);
      return {
        data: undefined,
        error: {
          message: error instanceof Error ? error.message : 'Failed to find correlations',
          code: 'CORRELATION_ERROR',
        },
        success: false,
      };
    }
  },

  /**
   * Generate natural language narrative insights
   */
  async generateNarrative(
    metric: Metric,
    logs: MetricLog[],
    insights?: Record<string, unknown>
  ): Promise<ApiResponse<z.infer<typeof NarrativeResponseSchema>>> {
    try {
      const response = await apiClient.post<{
        data: AIResponse<z.infer<typeof NarrativeResponseSchema>>;
      }>('/ai/metrics/narrative', {
        metricId: metric.id,
        logs,
        insights,
      });

      if (response.success && response.data) {
        return {
          data: response.data.data.result,
          success: true,
        };
      }

      return {
        data: undefined,
        error: {
          message: response.error?.message || 'Failed to generate narrative',
          code: 'NARRATIVE_ERROR',
        },
        success: false,
      };
    } catch (error) {
      llmLogger.error('Error generating narrative', error);
      return {
        data: undefined,
        error: {
          message: error instanceof Error ? error.message : 'Failed to generate narrative',
          code: 'NARRATIVE_ERROR',
        },
        success: false,
      };
    }
  },

  /**
   * Predict future trajectory
   */
  async predictTrajectory(
    metric: Metric,
    _logs: MetricLog[]
  ): Promise<ApiResponse<z.infer<typeof PredictionResponseSchema>>> {
    try {
      // Try backend endpoint first
      const backendResponse = await apiClient.post<{
        data: AIResponse<z.infer<typeof PredictionResponseSchema>>;
      }>('/ai/metrics/predict', {
        metricId: metric.id,
      });

      if (backendResponse.success && backendResponse.data) {
        return {
          data: backendResponse.data.data.result,
          success: true,
        };
      }
      return {
        data: undefined,
        error: {
          message: backendResponse.error?.message || 'Failed to predict trajectory',
          code: 'TRAJECTORY_PREDICTION_ERROR',
        },
        success: false,
      };
    } catch (error) {
      llmLogger.error('Error predicting trajectory', error);
      return {
        data: undefined,
        error: {
          message: error instanceof Error ? error.message : 'Failed to predict trajectory',
          code: 'TRAJECTORY_PREDICTION_ERROR',
        },
        success: false,
      };
    }
  },

  /**
   * Generate smart recommendations
   */
  async generateRecommendations(
    metric: Metric,
    logs: MetricLog[],
    goals: Goal[]
  ): Promise<ApiResponse<z.infer<typeof RecommendationResponseSchema>>> {
    try {
      const response = await apiClient.post<{
        data: AIResponse<z.infer<typeof RecommendationResponseSchema>>;
      }>('/ai/metrics/recommendations', {
        metricId: metric.id,
        logs,
        goals,
      });

      if (response.success && response.data) {
        return {
          data: response.data.data.result,
          success: true,
        };
      }

      return {
        data: undefined,
        error: {
          message: response.error?.message || 'Failed to generate recommendations',
          code: 'RECOMMENDATIONS_ERROR',
        },
        success: false,
      };
    } catch (error) {
      llmLogger.error('Error generating recommendations', error);
      return {
        data: undefined,
        error: {
          message: error instanceof Error ? error.message : 'Failed to generate recommendations',
          code: 'RECOMMENDATIONS_ERROR',
        },
        success: false,
      };
    }
  },

  /**
   * Generate contextual coaching messages
   */
  async generateCoaching(
    metric: Metric,
    logs: MetricLog[],
    context?: Record<string, unknown>
  ): Promise<ApiResponse<z.infer<typeof CoachingResponseSchema>>> {
    try {
      const response = await apiClient.post<{
        data: AIResponse<z.infer<typeof CoachingResponseSchema>>;
      }>('/ai/metrics/coaching', {
        metricId: metric.id,
        logs,
        context,
      });

      if (response.success && response.data) {
        return {
          data: response.data.data.result,
          success: true,
        };
      }

      return {
        data: undefined,
        error: {
          message: response.error?.message || 'Failed to generate coaching',
          code: 'COACHING_ERROR',
        },
        success: false,
      };
    } catch (error) {
      llmLogger.error('Error generating coaching', error);
      return {
        data: undefined,
        error: {
          message: error instanceof Error ? error.message : 'Failed to generate coaching',
          code: 'COACHING_ERROR',
        },
        success: false,
      };
    }
  },
};
