import { z } from 'zod';
import { TASK_STORY_POINTS_FIBONACCI } from '@/constants/growth-system';
import { AreaSchema, SubCategorySchema, PrioritySchema, ConfidenceSchema } from './common-schemas';

const isFibonacciStoryPoint = (n: number) => TASK_STORY_POINTS_FIBONACCI.includes(n);

export const TaskStoryPointsSchema = z
  .number()
  .int()
  .refine(isFibonacciStoryPoint, { message: 'Must be a Fibonacci story point (1,2,3,5,8,13,21)' });

export const ParseTaskOutputSchema = z.object({
  title: z.string().describe('The task title extracted from natural language'),
  description: z.string().optional().describe('Optional task description'),
  area: AreaSchema.describe('The life area this task belongs to'),
  subCategory: SubCategorySchema.optional().describe('Optional subcategory within the area'),
  priority: PrioritySchema.default('P3').describe('Suggested priority level'),
  dueDate: z.string().optional().describe('ISO date string if a deadline was mentioned'),
  scheduledDate: z.string().optional().describe('ISO date string if a specific date was mentioned'),
  size: TaskStoryPointsSchema.optional().describe('Fibonacci story points if inferable'),
  confidence: ConfidenceSchema.describe('Confidence in the parsing accuracy'),
});

export type ParseTaskOutput = z.infer<typeof ParseTaskOutputSchema>;

export const SubtaskSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  storyPoints: TaskStoryPointsSchema.optional(),
  order: z.number(),
});

export const TaskBreakdownOutputSchema = z.object({
  subtasks: z.array(SubtaskSchema).describe('List of subtasks in logical order'),
  reasoning: z.string().describe('Explanation of how the task was broken down'),
  confidence: ConfidenceSchema.describe('Confidence in the breakdown quality'),
  totalStoryPoints: z.number().int().optional().describe('Total story points across all subtasks'),
});

export type TaskBreakdownOutput = z.infer<typeof TaskBreakdownOutputSchema>;

export const PriorityAdvisorOutputSchema = z.object({
  recommendedPriority: PrioritySchema.describe('Recommended priority level'),
  reasoning: z.string().describe('Detailed explanation for the recommendation'),
  urgencyScore: z.number().min(0).max(10).describe('Urgency rating (0-10)'),
  impactScore: z.number().min(0).max(10).describe('Impact rating (0-10)'),
  confidence: ConfidenceSchema.describe('Confidence in the recommendation'),
  factors: z.array(z.string()).describe('Key factors considered in the decision'),
});

export type PriorityAdvisorOutput = z.infer<typeof PriorityAdvisorOutputSchema>;

export const EffortEstimationOutputSchema = z.object({
  storyPoints: TaskStoryPointsSchema.describe('Fibonacci story point estimate'),
  confidence: z.enum(['low', 'medium', 'high']).describe('Confidence in the estimate'),
  complexityFactors: z.array(z.string()).describe('Factors affecting complexity'),
  assumptions: z.array(z.string()).describe('Assumptions made'),
});

export type EffortEstimationOutputZ = z.infer<typeof EffortEstimationOutputSchema>;

export const TaskCategorizationOutputSchema = z.object({
  area: AreaSchema.describe('Recommended life area'),
  subCategory: SubCategorySchema.optional().describe('Recommended subcategory'),
  reasoning: z.string().describe('Explanation for the categorization'),
  confidence: ConfidenceSchema.describe('Confidence in the categorization'),
  alternativeCategories: z
    .array(
      z.object({
        area: AreaSchema,
        subCategory: SubCategorySchema.optional(),
        reasoning: z.string(),
      })
    )
    .optional()
    .describe('Alternative categorizations with lower confidence'),
});

export type TaskCategorizationOutput = z.infer<typeof TaskCategorizationOutputSchema>;

export const DependencySuggestionSchema = z.object({
  taskId: z.string().describe('ID of the task that should be a dependency'),
  taskTitle: z.string().describe('Title of the dependency task'),
  reasoning: z.string().describe('Why this dependency makes sense'),
  isBlocking: z.boolean().describe('Whether this is a blocking dependency'),
});

export const DependencyDetectionOutputSchema = z.object({
  suggestions: z.array(DependencySuggestionSchema).describe('Suggested dependencies'),
  reasoning: z.string().describe('Overall analysis of task dependencies'),
  confidence: ConfidenceSchema.describe('Confidence in the suggestions'),
  newTasksSuggested: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        reasoning: z.string(),
      })
    )
    .optional()
    .describe('New tasks that should be created as prerequisites'),
});

export type DependencyDetectionOutput = z.infer<typeof DependencyDetectionOutputSchema>;

export const BlockerResolutionOutputSchema = z.object({
  blockerAnalysis: z.string().describe('Analysis of what is blocking the task'),
  suggestedActions: z.array(z.string()).describe('Concrete steps to unblock'),
  newTasks: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        priority: PrioritySchema,
      })
    )
    .optional()
    .describe('New tasks to create to resolve the blocker'),
  estimatedTimeToResolve: z.string().optional().describe('Estimate of how long to unblock'),
  confidence: ConfidenceSchema.describe('Confidence in the resolution plan'),
});

export type BlockerResolutionOutput = z.infer<typeof BlockerResolutionOutputSchema>;
