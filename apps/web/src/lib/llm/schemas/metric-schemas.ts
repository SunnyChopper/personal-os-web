import { z } from 'zod';
import { ConfidenceSchema } from './common-schemas';

export const MetricSuggestionForGoalOutputSchema = z.object({
  metrics: z
    .array(
      z.object({
        name: z.string().describe('Metric name'),
        description: z.string().describe('What this metric measures'),
        unit: z.string().describe('Unit of measurement'),
        direction: z.enum(['Higher', 'Lower', 'Target']).describe('Direction of improvement'),
        targetValue: z.number().optional().describe('Suggested target value'),
        frequency: z.enum(['daily', 'weekly', 'monthly']).describe('How often to track'),
        reasoning: z.string().describe('Why this metric is relevant'),
      })
    )
    .describe('Suggested metrics'),
  reasoning: z.string().describe('Overall rationale for metric selection'),
  confidence: ConfidenceSchema.describe('Confidence in suggestions'),
});

export type MetricSuggestionForGoalOutput = z.infer<typeof MetricSuggestionForGoalOutputSchema>;

export const PatternRecognitionOutputSchema = z.object({
  patterns: z
    .array(
      z.object({
        type: z
          .enum(['trend', 'cycle', 'correlation', 'anomaly', 'plateau'])
          .describe('Pattern type'),
        description: z.string().describe('Description of the pattern'),
        significance: z.enum(['low', 'medium', 'high']).describe('Pattern significance'),
        startDate: z.string().optional().describe('When pattern started'),
        dataPoints: z.array(z.number()).optional().describe('Relevant data points'),
        insights: z.string().describe('What this pattern means'),
        recommendations: z.array(z.string()).describe('Actions based on this pattern'),
      })
    )
    .describe('Identified patterns'),
  overallTrend: z
    .enum(['improving', 'stable', 'declining', 'volatile'])
    .describe('Overall trend direction'),
  confidence: ConfidenceSchema.describe('Confidence in pattern recognition'),
});

export type PatternRecognitionOutput = z.infer<typeof PatternRecognitionOutputSchema>;

export const AnomalyExplanationOutputSchema = z.object({
  isAnomaly: z.boolean().describe('Whether this is truly an anomaly'),
  anomalyType: z
    .enum(['spike', 'drop', 'outlier', 'gap', 'shift'])
    .optional()
    .describe('Type of anomaly'),
  severity: z.enum(['low', 'medium', 'high']).describe('Severity of anomaly'),
  possibleCauses: z.array(z.string()).describe('Potential explanations'),
  expectedRange: z
    .object({
      min: z.number(),
      max: z.number(),
    })
    .optional()
    .describe('Expected value range'),
  recommendations: z.array(z.string()).describe('Recommended actions'),
  requiresAttention: z.boolean().describe('Whether immediate attention is needed'),
  confidence: ConfidenceSchema.describe('Confidence in the explanation'),
});

export type AnomalyExplanationOutput = z.infer<typeof AnomalyExplanationOutputSchema>;

export const CorrelationDiscoveryOutputSchema = z.object({
  correlations: z
    .array(
      z.object({
        metricId: z.string().optional().describe('ID of correlated metric'),
        metricName: z.string().describe('Name of correlated metric'),
        correlationType: z
          .enum(['positive', 'negative', 'causal', 'coincidental'])
          .describe('Type of correlation'),
        strength: z.enum(['weak', 'moderate', 'strong']).describe('Correlation strength'),
        description: z.string().describe('Description of the correlation'),
        insights: z.string().describe('What this correlation suggests'),
        actionable: z.boolean().describe('Whether this insight is actionable'),
      })
    )
    .describe('Discovered correlations'),
  overallInsights: z.string().describe('Overall insights from correlations'),
  confidence: ConfidenceSchema.describe('Confidence in correlations'),
});

export type CorrelationDiscoveryOutput = z.infer<typeof CorrelationDiscoveryOutputSchema>;

export const TargetRecommendationOutputSchema = z.object({
  recommendedTarget: z.number().describe('Recommended target value'),
  currentValue: z.number().describe('Current/latest value'),
  reasoning: z.string().describe('Why this target is appropriate'),
  achievability: z
    .enum(['easy', 'moderate', 'challenging', 'stretch'])
    .describe('How achievable the target is'),
  timeframe: z.string().describe('Suggested timeframe to reach target'),
  milestones: z
    .array(
      z.object({
        value: z.number(),
        date: z.string(),
        description: z.string(),
      })
    )
    .describe('Suggested milestones'),
  confidence: ConfidenceSchema.describe('Confidence in recommendation'),
});

export type TargetRecommendationOutput = z.infer<typeof TargetRecommendationOutputSchema>;

export const MetricHealthOutputSchema = z.object({
  healthScore: z.number().min(0).max(100).describe('Overall metric health (0-100)'),
  status: z.enum(['excellent', 'good', 'concerning', 'critical']).describe('Health status'),
  alerts: z
    .array(
      z.object({
        severity: z.enum(['info', 'warning', 'critical']),
        message: z.string(),
        recommendation: z.string(),
      })
    )
    .describe('Health alerts'),
  trackingQuality: z
    .enum(['excellent', 'good', 'poor', 'insufficient'])
    .describe('Quality of tracking'),
  dataGaps: z.number().describe('Number of days with missing data'),
  recommendations: z.array(z.string()).describe('Health improvement recommendations'),
  confidence: ConfidenceSchema.describe('Confidence in health assessment'),
});

export type MetricHealthOutput = z.infer<typeof MetricHealthOutputSchema>;
