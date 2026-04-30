import { z } from 'zod';
import { AreaSchema, SubCategorySchema, PrioritySchema, ConfidenceSchema } from './common-schemas';
import { TaskStoryPointsSchema } from './task-schemas';

export const ProjectHealthIssueSchema = z.object({
  severity: z.enum(['low', 'medium', 'high', 'critical']).describe('Severity level'),
  category: z
    .enum([
      'timeline',
      'scope',
      'dependencies',
      'resources',
      'risk',
      'progress',
      'blockers',
      'team',
    ])
    .describe('Issue category'),
  description: z.string().describe('Description of the issue'),
  impact: z.string().describe('Potential impact if not addressed'),
  recommendation: z.string().describe('Recommended action to address'),
});

export const ProjectHealthOutputSchema = z.object({
  overallHealth: z.number().min(0).max(100).describe('Overall project health score (0-100)'),
  healthCategory: z.enum(['critical', 'at-risk', 'stable', 'healthy', 'excellent']),
  summary: z.string().describe('Executive summary of project health'),
  issues: z.array(ProjectHealthIssueSchema).describe('Identified issues'),
  strengths: z.array(z.string()).describe('Project strengths'),
  recommendations: z.array(z.string()).describe('High-level recommendations'),
  confidence: ConfidenceSchema.describe('Confidence in the analysis'),
  metrics: z
    .object({
      completionRate: z.number().min(0).max(100).optional(),
      blockerCount: z.number().optional(),
      overdueTasks: z.number().optional(),
      averageTaskSize: z.number().optional(),
    })
    .optional()
    .describe('Quantitative metrics'),
});

export type ProjectHealthOutput = z.infer<typeof ProjectHealthOutputSchema>;

export const GeneratedTaskSchema = z.object({
  title: z.string().describe('Task title'),
  description: z.string().describe('Task description'),
  area: AreaSchema.describe('Life area'),
  subCategory: SubCategorySchema.optional().describe('Subcategory'),
  priority: PrioritySchema.describe('Suggested priority'),
  size: TaskStoryPointsSchema.optional().describe('Fibonacci story points'),
  reasoning: z.string().describe('Why this task is needed'),
  dependencies: z.array(z.string()).optional().describe('Task titles this depends on'),
  order: z.number().describe('Suggested execution order'),
});

export const ProjectTaskGenOutputSchema = z.object({
  tasks: z.array(GeneratedTaskSchema).describe('Generated tasks'),
  overallStrategy: z.string().describe('Overall approach and strategy'),
  phaseBreakdown: z
    .array(
      z.object({
        phase: z.string(),
        tasks: z.array(z.string()),
        duration: z.string().optional(),
      })
    )
    .optional()
    .describe('Optional breakdown into phases'),
  confidence: ConfidenceSchema.describe('Confidence in the task generation'),
  estimatedTotalEffort: z.string().optional().describe('Total estimated effort'),
});

export type ProjectTaskGenOutput = z.infer<typeof ProjectTaskGenOutputSchema>;

export const ProjectRiskSchema = z.object({
  category: z
    .enum([
      'technical',
      'timeline',
      'resource',
      'dependency',
      'scope',
      'external',
      'team',
      'quality',
    ])
    .describe('Risk category'),
  description: z.string().describe('Description of the risk'),
  probability: z.enum(['low', 'medium', 'high']).describe('Likelihood of occurring'),
  impact: z.enum(['low', 'medium', 'high', 'critical']).describe('Impact if it occurs'),
  mitigation: z.string().describe('How to mitigate or prevent'),
  contingency: z.string().optional().describe('Backup plan if it occurs'),
});

export const ProjectRiskOutputSchema = z.object({
  overallRiskLevel: z.enum(['low', 'medium', 'high', 'critical']).describe('Overall risk level'),
  summary: z.string().describe('Executive summary of risk assessment'),
  risks: z.array(ProjectRiskSchema).describe('Identified risks'),
  topRisks: z.array(z.string()).describe('Top 3-5 risks to focus on'),
  recommendations: z.array(z.string()).describe('Key risk management recommendations'),
  confidence: ConfidenceSchema.describe('Confidence in the assessment'),
});

export type ProjectRiskOutput = z.infer<typeof ProjectRiskOutputSchema>;
