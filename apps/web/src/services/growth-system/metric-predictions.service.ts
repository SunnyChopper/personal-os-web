import type { Metric, MetricLog } from '@/types/growth-system';
import type { ApiResponse } from '@/types/api-contracts';
import { logger } from '@/lib/logger';
import { predictTrajectory, getTrendData, calculateProgress } from '@/utils/metric-analytics';

export interface PredictionResult {
  futureValue: number;
  confidence: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  daysAhead: number;
  projectedDate: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface TargetDatePrediction {
  targetDate: string | null;
  confidence: number;
  riskFactors: string[];
  onTrack: boolean;
}

export const metricPredictionsService = {
  /**
   * Predict future value
   */
  async predictValue(
    _metric: Metric,
    logs: MetricLog[],
    daysAhead: number = 30
  ): Promise<ApiResponse<PredictionResult>> {
    try {
      if (logs.length < 3) {
        return {
          data: undefined,
          error: {
            message: 'Insufficient data for prediction (need at least 3 data points)',
            code: 'INSUFFICIENT_DATA',
          },
          success: false,
        };
      }

      const prediction = predictTrajectory(logs, daysAhead);
      if (!prediction) {
        return {
          data: undefined,
          error: {
            message: 'Failed to generate prediction',
            code: 'PREDICTION_ERROR',
          },
          success: false,
        };
      }

      const projectedDate = new Date();
      projectedDate.setDate(projectedDate.getDate() + daysAhead);

      // Calculate risk level
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      const confidenceIntervalRange =
        prediction.confidenceInterval.upper - prediction.confidenceInterval.lower;
      const valueRange =
        Math.max(...logs.map((l) => l.value)) - Math.min(...logs.map((l) => l.value));
      const relativeUncertainty = confidenceIntervalRange / (valueRange || 1);

      if (relativeUncertainty > 0.3) {
        riskLevel = 'high';
      } else if (relativeUncertainty > 0.15) {
        riskLevel = 'medium';
      }

      return {
        data: {
          futureValue: prediction.futureValue,
          confidence: prediction.confidence,
          confidenceInterval: prediction.confidenceInterval,
          daysAhead: prediction.daysAhead,
          projectedDate: projectedDate.toISOString(),
          riskLevel,
        },
        success: true,
      };
    } catch (error) {
      logger.error('Error predicting value', error);
      return {
        data: undefined,
        error: {
          message: error instanceof Error ? error.message : 'Failed to predict value',
          code: 'PREDICTION_ERROR',
        },
        success: false,
      };
    }
  },

  /**
   * Predict when target will be reached
   */
  async predictTargetDate(
    metric: Metric,
    logs: MetricLog[]
  ): Promise<ApiResponse<TargetDatePrediction>> {
    try {
      if (!metric.targetValue) {
        return {
          data: undefined,
          error: {
            message: 'Metric has no target value',
            code: 'NO_TARGET_VALUE',
          },
          success: false,
        };
      }

      if (logs.length < 3) {
        return {
          data: undefined,
          error: {
            message: 'Insufficient data for prediction',
            code: 'INSUFFICIENT_DATA',
          },
          success: false,
        };
      }

      const latestLog = logs[0];
      const progress = calculateProgress(latestLog.value, metric.targetValue, metric.direction);

      if (progress.percentage >= 100) {
        return {
          data: {
            targetDate: new Date().toISOString(),
            confidence: 1.0,
            riskFactors: [],
            onTrack: true,
          },
          success: true,
        };
      }

      const trend = getTrendData(logs, metric);
      if (!trend || trend.velocity === 0) {
        return {
          data: {
            targetDate: null,
            confidence: 0,
            riskFactors: ['No clear trend detected'],
            onTrack: false,
          },
          success: true,
        };
      }

      // Estimate days to target
      const remaining = progress.remaining || 0;
      const daysToTarget = Math.abs(remaining / trend.velocity);

      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysToTarget);

      const riskFactors: string[] = [];
      if (trend.velocity < 0 && metric.direction === 'Higher') {
        riskFactors.push('Value is declining');
      }
      if (trend.velocity > 0 && metric.direction === 'Lower') {
        riskFactors.push('Value is increasing');
      }
      if (daysToTarget > 365) {
        riskFactors.push('Target is very far away');
      }

      return {
        data: {
          targetDate: targetDate.toISOString(),
          confidence: Math.min(0.9, trend.velocity !== 0 ? 0.7 : 0),
          riskFactors,
          onTrack: daysToTarget < 90 && trend.isImproving,
        },
        success: true,
      };
    } catch (error) {
      logger.error('Error predicting target date', error);
      return {
        data: undefined,
        error: {
          message: error instanceof Error ? error.message : 'Failed to predict target date',
          code: 'TARGET_DATE_PREDICTION_ERROR',
        },
        success: false,
      };
    }
  },

  /**
   * Assess risk of not reaching target
   */
  async predictRisk(
    metric: Metric,
    logs: MetricLog[]
  ): Promise<
    ApiResponse<{
      riskLevel: 'low' | 'medium' | 'high';
      riskFactors: string[];
      recommendations: string[];
      confidence: number;
    }>
  > {
    try {
      if (!metric.targetValue) {
        return {
          data: undefined,
          error: {
            message: 'Metric has no target value',
            code: 'NO_TARGET_VALUE',
          },
          success: false,
        };
      }

      const latestLog = logs.length > 0 ? logs[0] : null;
      if (!latestLog) {
        return {
          data: {
            riskLevel: 'high',
            riskFactors: ['No data available'],
            recommendations: ['Start logging values'],
            confidence: 1.0,
          },
          success: true,
        };
      }

      const progress = calculateProgress(latestLog.value, metric.targetValue, metric.direction);

      const trend = getTrendData(logs, metric);
      const riskFactors: string[] = [];
      const recommendations: string[] = [];

      let riskLevel: 'low' | 'medium' | 'high' = 'low';

      if (progress.percentage < 50) {
        riskFactors.push('Less than 50% progress');
        riskLevel = 'high';
      } else if (progress.percentage < 75) {
        riskFactors.push('Less than 75% progress');
        riskLevel = 'medium';
      }

      if (trend && !trend.isImproving) {
        riskFactors.push('Trend is not improving');
        riskLevel = riskLevel === 'low' ? 'medium' : 'high';
        recommendations.push('Focus on improving the trend');
      }

      if (logs.length < 10) {
        riskFactors.push('Limited historical data');
        recommendations.push('Log values more frequently for better predictions');
      }

      if (riskLevel === 'high') {
        recommendations.push('Consider adjusting target or strategy');
      }

      return {
        data: {
          riskLevel,
          riskFactors,
          recommendations,
          confidence: 0.8,
        },
        success: true,
      };
    } catch (error) {
      logger.error('Error predicting risk', error);
      return {
        data: undefined,
        error: {
          message: error instanceof Error ? error.message : 'Failed to predict risk',
          code: 'RISK_PREDICTION_ERROR',
        },
        success: false,
      };
    }
  },
};
