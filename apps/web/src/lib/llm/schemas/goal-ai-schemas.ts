import { z } from 'zod';
import { ConfidenceSchema, PrioritySchema } from './common-schemas';

// Progress Coaching Output
export const ProgressCoachingOutputSchema = z.object({
  overallAssessment: z.string().describe('High-level assessment of current progress'),
  specificAdvice: z
    .array(
      z.object({
        area: z
          .enum(['tasks', 'metrics', 'habits', 'criteria'])
          .describe('Which area this advice targets'),
        action: z.string().describe('Specific action to take'),
        reasoning: z.string().describe('Why this action will help'),
        priority: z.enum(['high', 'medium', 'low']).describe('Priority of this action'),
      })
    )
    .describe('Targeted advice for each progress source'),
  motivationalMessage: z.string().describe('Encouraging message based on progress'),
  nextSteps: z.array(z.string()).describe('Concrete next steps to take'),
  confidence: ConfidenceSchema,
});

export type ProgressCoachingOutput = z.infer<typeof ProgressCoachingOutputSchema>;

// Goal Health Score Output
export const GoalHealthScoreOutputSchema = z.object({
  score: z.number().min(0).max(100).describe('Overall health score (0-100)'),
  rating: z.enum(['excellent', 'good', 'fair', 'poor', 'critical']).describe('Health rating'),
  factors: z
    .object({
      progressVelocity: z.number().min(0).max(100).describe('Progress speed score'),
      activityLevel: z.number().min(0).max(100).describe('Recent activity score'),
      resourceBalance: z.number().min(0).max(100).describe('Balance of linked entities score'),
      timeAlignment: z.number().min(0).max(100).describe('Time vs progress alignment score'),
    })
    .describe('Score breakdown by factor'),
  strengths: z.array(z.string()).describe('What is healthy about this goal'),
  concerns: z.array(z.string()).describe('Health concerns'),
  recommendations: z.array(z.string()).describe('Actions to improve health'),
  confidence: ConfidenceSchema,
});

export type GoalHealthScoreOutput = z.infer<typeof GoalHealthScoreOutputSchema>;

// Goal Decomposition Output
export const GoalDecompositionOutputSchema = z.object({
  subGoals: z
    .array(
      z.object({
        title: z.string().describe('Sub-goal title'),
        description: z.string().describe('Sub-goal description'),
        timeHorizon: z
          .enum(['Monthly', 'Quarterly', 'Weekly'])
          .describe('Time horizon for sub-goal'),
        successCriteria: z.array(z.string()).describe('Success criteria for this sub-goal'),
        reasoning: z.string().describe('Why this sub-goal is important'),
      })
    )
    .describe('Suggested sub-goals to break down the main goal'),
  suggestedTasks: z
    .array(
      z.object({
        title: z.string().describe('Task title'),
        description: z.string().describe('Task description'),
        priority: PrioritySchema,
        estimatedEffort: z.number().describe('Estimated story points'),
        reasoning: z.string().describe('Why this task is needed'),
      })
    )
    .describe('Initial tasks to start working on'),
  suggestedMetrics: z
    .array(
      z.object({
        name: z.string().describe('Metric name'),
        unit: z.string().describe('Unit of measurement'),
        targetValue: z.number().describe('Target value'),
        reasoning: z.string().describe('What this metric tracks'),
      })
    )
    .describe('Metrics to track progress'),
  suggestedHabits: z
    .array(
      z.object({
        name: z.string().describe('Habit name'),
        frequency: z.enum(['Daily', 'Weekly']).describe('How often to perform'),
        target: z.number().describe('Target count per period'),
        reasoning: z.string().describe('How this habit supports the goal'),
      })
    )
    .describe('Habits that support achieving this goal'),
  implementationPlan: z.string().describe('High-level plan for achieving the goal'),
  confidence: ConfidenceSchema,
});

export type GoalDecompositionOutput = z.infer<typeof GoalDecompositionOutputSchema>;

// Conflict Detection Output
export const ConflictDetectionOutputSchema = z.object({
  isOvercommitted: z.boolean().describe('Whether user has too many active goals'),
  overcommitmentScore: z
    .number()
    .min(0)
    .max(100)
    .describe('Overcommitment severity (0=fine, 100=critical)'),
  conflicts: z
    .array(
      z.object({
        goal1Id: z.string().describe('First goal ID'),
        goal1Title: z.string().describe('First goal title'),
        goal2Id: z.string().describe('Second goal ID'),
        goal2Title: z.string().describe('Second goal title'),
        conflictType: z
          .enum(['time', 'resource', 'priority', 'values', 'dependencies'])
          .describe('Type of conflict'),
        description: z.string().describe('Description of the conflict'),
        severity: z.enum(['low', 'medium', 'high', 'critical']).describe('Conflict severity'),
        resolution: z.string().describe('Suggested resolution strategy'),
      })
    )
    .describe('Detected conflicts between goals'),
  capacityAnalysis: z
    .object({
      totalActiveGoals: z.number().describe('Number of active goals'),
      highPriorityGoals: z.number().describe('Number of P1-P2 goals'),
      estimatedWeeklyHours: z.number().describe('Estimated hours needed per week'),
      sustainabilityRating: z
        .enum(['sustainable', 'challenging', 'unsustainable'])
        .describe('Whether workload is sustainable'),
    })
    .describe('Overall capacity analysis'),
  recommendations: z.array(z.string()).describe('Recommendations to resolve conflicts'),
  confidence: ConfidenceSchema,
});

export type ConflictDetectionOutput = z.infer<typeof ConflictDetectionOutputSchema>;
