import { z } from 'zod';
import { ConfidenceSchema } from './common-schemas';

export const HabitDesignOutputSchema = z.object({
  optimizedTrigger: z.string().describe('Specific, observable cue for the habit'),
  optimizedAction: z.string().describe('Clear, actionable behavior'),
  optimizedReward: z.string().describe('Immediate positive reinforcement'),
  frictionStrategies: z
    .array(
      z.object({
        strategy: z.string(),
        implementation: z.string(),
        effectiveness: z.enum(['low', 'medium', 'high']),
      })
    )
    .describe('Ways to add/remove friction based on habit type'),
  targetFrequency: z.string().describe('Recommended frequency'),
  reasoning: z.string().describe('Why this design works'),
  confidence: ConfidenceSchema,
});

export const HabitStackOutputSchema = z.object({
  stackSuggestions: z.array(
    z.object({
      existingHabit: z.string().describe('Existing habit to stack on'),
      newHabit: z.string().describe('New habit to add'),
      stackingPattern: z.string().describe('How to connect them'),
      rationale: z.string().describe('Why this stack works'),
      difficulty: z.enum(['easy', 'moderate', 'challenging']),
    })
  ),
  timingRecommendations: z.array(
    z.object({
      timeOfDay: z.string(),
      habits: z.array(z.string()),
      reasoning: z.string(),
    })
  ),
  confidence: ConfidenceSchema,
});

export const StreakRecoveryOutputSchema = z.object({
  analysis: z.object({
    currentStreak: z.number(),
    longestStreak: z.number(),
    recentMisses: z.number(),
    pattern: z.string().describe('Pattern of misses'),
  }),
  recoveryPlan: z.array(
    z.object({
      step: z.string(),
      timeframe: z.string(),
      difficulty: z.enum(['easy', 'moderate', 'hard']),
    })
  ),
  motivationalInsights: z.array(z.string()),
  adjustmentSuggestions: z.array(z.string()).describe('Ways to make habit easier'),
  confidence: ConfidenceSchema,
});

export const HabitPatternAnalysisOutputSchema = z.object({
  completionPatterns: z.array(
    z.object({
      pattern: z.string(),
      frequency: z.string(),
      context: z.string(),
      strength: z.enum(['weak', 'moderate', 'strong']),
    })
  ),
  optimalTiming: z.object({
    bestTimeOfDay: z.string(),
    bestDayOfWeek: z.string(),
    reasoning: z.string(),
  }),
  correlations: z.array(
    z.object({
      factor: z.string().describe('Energy level, mood, etc.'),
      impact: z.enum(['positive', 'negative', 'neutral']),
      strength: z.enum(['weak', 'moderate', 'strong']),
      insights: z.string(),
    })
  ),
  recommendations: z.array(z.string()),
  confidence: ConfidenceSchema,
});

export const HabitGoalAlignmentOutputSchema = z.object({
  alignedGoals: z.array(
    z.object({
      goalTitle: z.string(),
      alignmentStrength: z.enum(['weak', 'moderate', 'strong']),
      explanation: z.string(),
      impact: z.string().describe('How habit supports goal'),
    })
  ),
  misalignments: z.array(
    z.object({
      issue: z.string(),
      severity: z.enum(['low', 'medium', 'high']),
      suggestion: z.string(),
    })
  ),
  newHabitSuggestions: z.array(
    z.object({
      habitName: z.string(),
      goalSupported: z.string(),
      rationale: z.string(),
      priority: z.enum(['low', 'medium', 'high']),
    })
  ),
  confidence: ConfidenceSchema,
});

export const TriggerOptimizationOutputSchema = z.object({
  currentTriggerAnalysis: z.object({
    clarity: z.enum(['unclear', 'somewhat clear', 'very clear']),
    observability: z.enum(['hard to notice', 'noticeable', 'obvious']),
    consistency: z.enum(['inconsistent', 'somewhat consistent', 'very consistent']),
    issues: z.array(z.string()),
  }),
  optimizedTriggers: z.array(
    z.object({
      trigger: z.string(),
      type: z.enum(['time', 'location', 'preceding action', 'emotional state', 'person']),
      specificity: z.enum(['vague', 'moderate', 'very specific']),
      effectiveness: z.enum(['low', 'medium', 'high']),
      implementation: z.string(),
    })
  ),
  environmentalCues: z.array(z.string()).describe('Visual or physical reminders'),
  confidence: ConfidenceSchema,
});
