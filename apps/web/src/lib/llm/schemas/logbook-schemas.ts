import { z } from 'zod';
import { ConfidenceSchema } from './common-schemas';

export const ReflectionPromptsOutputSchema = z.object({
  prompts: z.array(
    z.object({
      question: z.string(),
      category: z.enum(['gratitude', 'learning', 'progress', 'challenges', 'future']),
      depth: z.enum(['surface', 'moderate', 'deep']),
      context: z.string().describe('Why this prompt is relevant now'),
    })
  ),
  focusAreas: z.array(z.string()).describe('Key areas to reflect on'),
  confidence: ConfidenceSchema,
});

export const DailyDigestOutputSchema = z.object({
  summary: z.string().describe('Brief narrative summary of the day'),
  highlights: z.array(
    z.object({
      type: z.enum(['accomplishment', 'learning', 'challenge', 'insight']),
      description: z.string(),
    })
  ),
  metrics: z.object({
    tasksCompleted: z.number(),
    habitsLogged: z.number(),
    energyAverage: z.number().optional(),
    moodSummary: z.string().optional(),
  }),
  momentum: z.enum(['declining', 'stable', 'building']),
  tomorrowFocus: z.array(z.string()).describe('Suggested focus for tomorrow'),
  confidence: ConfidenceSchema,
});

export const LogbookPatternInsightsOutputSchema = z.object({
  patterns: z.array(
    z.object({
      pattern: z.string(),
      frequency: z.string(),
      significance: z.enum(['low', 'medium', 'high']),
      examples: z.array(z.string()).describe('Specific dates or entries'),
      insights: z.string(),
    })
  ),
  trends: z.object({
    energyTrend: z.enum(['declining', 'stable', 'improving']).optional(),
    moodTrend: z.enum(['declining', 'stable', 'improving']).optional(),
    productivityTrend: z.enum(['declining', 'stable', 'improving']).optional(),
  }),
  correlations: z.array(
    z.object({
      factor1: z.string(),
      factor2: z.string(),
      relationship: z.string(),
      strength: z.enum(['weak', 'moderate', 'strong']),
    })
  ),
  recommendations: z.array(z.string()),
  confidence: ConfidenceSchema,
});

export const SentimentAnalysisOutputSchema = z.object({
  overallSentiment: z.enum(['very negative', 'negative', 'neutral', 'positive', 'very positive']),
  sentimentScore: z.number().min(-1).max(1).describe('Score from -1 to 1'),
  emotionalThemes: z.array(
    z.object({
      theme: z.string(),
      frequency: z.enum(['rare', 'occasional', 'frequent']),
      context: z.string(),
    })
  ),
  sentimentTrend: z.enum(['declining', 'stable', 'improving']),
  concerningPatterns: z.array(
    z.object({
      pattern: z.string(),
      severity: z.enum(['low', 'medium', 'high']),
      suggestion: z.string(),
    })
  ),
  positiveMoments: z.array(z.string()).describe('Dates with particularly positive entries'),
  confidence: ConfidenceSchema,
});

export const WeeklyReviewOutputSchema = z.object({
  weekSummary: z.string().describe('Narrative summary of the week'),
  achievements: z.array(
    z.object({
      description: z.string(),
      impact: z.enum(['small', 'moderate', 'significant']),
      category: z.string(),
    })
  ),
  challenges: z.array(
    z.object({
      description: z.string(),
      lessons: z.string(),
      futureAction: z.string(),
    })
  ),
  insights: z.array(z.string()),
  metrics: z.object({
    weeklyProgress: z.string(),
    habitConsistency: z.string(),
    energyPattern: z.string(),
    moodPattern: z.string(),
  }),
  nextWeekFocus: z.array(
    z.object({
      area: z.string(),
      objective: z.string(),
      actions: z.array(z.string()),
    })
  ),
  confidence: ConfidenceSchema,
});

export const ConnectionSuggestionsOutputSchema = z.object({
  suggestedConnections: z.array(
    z.object({
      entityType: z.enum(['task', 'project', 'goal', 'habit', 'metric']),
      entityTitle: z.string(),
      entityId: z.string(),
      relevance: z.enum(['low', 'medium', 'high']),
      reasoning: z.string().describe('Why this connection is relevant'),
    })
  ),
  missingContext: z.array(z.string()).describe('What could be added to entry'),
  relatedDays: z.array(
    z.object({
      date: z.string(),
      similarity: z.enum(['somewhat similar', 'similar', 'very similar']),
      commonThemes: z.array(z.string()),
    })
  ),
  confidence: ConfidenceSchema,
});
