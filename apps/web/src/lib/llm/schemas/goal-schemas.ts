import { z } from 'zod';
import { TimeHorizonSchema, ConfidenceSchema } from './common-schemas';

export const GoalRefinementOutputSchema = z.object({
  refinedTitle: z.string().describe('More specific and actionable goal title'),
  refinedDescription: z.string().describe('Detailed goal description with context'),
  reasoning: z.string().describe('Why these refinements improve the goal'),
  confidence: ConfidenceSchema.describe('Confidence in the refinements'),
  suggestedAdjustments: z.array(z.string()).describe('Additional suggestions'),
});

export type GoalRefinementOutput = z.infer<typeof GoalRefinementOutputSchema>;

export const SuccessCriteriaOutputSchema = z.object({
  criteria: z
    .array(
      z.object({
        criterion: z.string().describe('SMART success criterion'),
        measurable: z.boolean().describe('Whether this is measurable'),
        suggestedMetric: z.string().optional().describe('Optional metric to track this'),
      })
    )
    .describe('Generated success criteria'),
  reasoning: z.string().describe('Why these criteria are appropriate'),
  confidence: ConfidenceSchema.describe('Confidence in the criteria'),
});

export type SuccessCriteriaOutput = z.infer<typeof SuccessCriteriaOutputSchema>;

export const MetricSuggestionsOutputSchema = z.object({
  metrics: z
    .array(
      z.object({
        name: z.string().describe('Metric name'),
        description: z.string().describe('What this metric measures'),
        unit: z.string().describe('Unit of measurement'),
        targetValue: z.number().optional().describe('Suggested target value'),
        frequency: z.enum(['daily', 'weekly', 'monthly']).describe('How often to track'),
        reasoning: z.string().describe('Why this metric is relevant'),
      })
    )
    .describe('Suggested metrics for the goal'),
  overallRationale: z.string().describe('How these metrics connect to the goal'),
  confidence: ConfidenceSchema.describe('Confidence in the suggestions'),
});

export type MetricSuggestionsOutput = z.infer<typeof MetricSuggestionsOutputSchema>;

export const GoalCascadeOutputSchema = z.object({
  parentGoals: z
    .array(
      z.object({
        timeHorizon: TimeHorizonSchema,
        title: z.string(),
        description: z.string(),
        reasoning: z.string(),
      })
    )
    .describe('Suggested parent goals (longer time horizon)'),
  childGoals: z
    .array(
      z.object({
        timeHorizon: TimeHorizonSchema,
        title: z.string(),
        description: z.string(),
        reasoning: z.string(),
      })
    )
    .describe('Suggested child goals (shorter time horizon)'),
  overallStrategy: z.string().describe('How these goals connect strategically'),
  confidence: ConfidenceSchema.describe('Confidence in the cascade structure'),
});

export type GoalCascadeOutput = z.infer<typeof GoalCascadeOutputSchema>;

export const AchievementForecastOutputSchema = z.object({
  probability: z.number().min(0).max(100).describe('Probability of achievement (0-100%)'),
  expectedDate: z.string().optional().describe('Expected completion date'),
  confidenceLevel: z.enum(['low', 'medium', 'high']).describe('Confidence in the forecast'),
  factors: z
    .object({
      positive: z.array(z.string()).describe('Factors increasing likelihood'),
      negative: z.array(z.string()).describe('Factors decreasing likelihood'),
    })
    .describe('Factors affecting achievement'),
  recommendations: z.array(z.string()).describe('Actions to improve likelihood'),
  reasoning: z.string().describe('Detailed forecast explanation'),
});

export type AchievementForecastOutput = z.infer<typeof AchievementForecastOutputSchema>;

export const GoalConflictOutputSchema = z.object({
  hasConflicts: z.boolean().describe('Whether conflicts were detected'),
  conflicts: z
    .array(
      z.object({
        goalId: z.string().describe('ID of conflicting goal'),
        goalTitle: z.string().describe('Title of conflicting goal'),
        conflictType: z
          .enum(['resource', 'timeline', 'priority', 'value'])
          .describe('Type of conflict'),
        description: z.string().describe('Description of the conflict'),
        severity: z.enum(['low', 'medium', 'high']).describe('Severity of conflict'),
        resolution: z.string().describe('Suggested resolution'),
      })
    )
    .describe('Identified conflicts'),
  overallAssessment: z.string().describe('Overall goal alignment assessment'),
  confidence: ConfidenceSchema.describe('Confidence in conflict detection'),
});

export type GoalConflictOutput = z.infer<typeof GoalConflictOutputSchema>;

export const GoalProgressAnalysisOutputSchema = z.object({
  currentProgress: z.number().min(0).max(100).describe('Current progress percentage'),
  trajectory: z.enum(['ahead', 'on-track', 'behind', 'stalled']).describe('Progress trajectory'),
  insights: z.array(z.string()).describe('Key insights about progress'),
  blockers: z.array(z.string()).describe('Identified blockers'),
  strengths: z.array(z.string()).describe('What is working well'),
  recommendations: z.array(z.string()).describe('Recommendations to improve progress'),
  confidence: ConfidenceSchema.describe('Confidence in the analysis'),
});

export type GoalProgressAnalysisOutput = z.infer<typeof GoalProgressAnalysisOutputSchema>;
