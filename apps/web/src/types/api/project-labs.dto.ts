import type { Area } from '@/types/growth-system';
import type { Project } from '@/types/growth-system';

export type ProjectLabIdeaStatus = 'GENERATED' | 'SAVED' | 'DISMISSED' | 'CONVERTED';

export interface ProjectLabIdea {
  id: string;
  title: string;
  pitch?: string | null;
  problemStatement?: string | null;
  rationale?: string | null;
  suggestedSteps: string[];
  estimatedEffort?: string | null;
  difficulty?: string | null;
  tags: string[];
  sourceItemIds: string[];
  sourceItemTypes: Record<string, string>;
  brandProfileId?: string | null;
  brandAngle?: string | null;
  status: ProjectLabIdeaStatus;
  batchId?: string | null;
  convertedProjectId?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateProjectLabIdeasInput {
  sourceItemIds: string[];
  brandProfileId?: string | null;
  direction?: string | null;
  count?: number;
  provider?: string;
  model?: string;
}

export interface ProjectLabIdeaGenerationContextStats {
  sourceCount: number;
  rejectedFeedbackCount: number;
  existingGeneratedCount: number;
  brandProfileUsed: boolean;
}

export interface GenerateProjectLabIdeasResult {
  ideas: ProjectLabIdea[];
  batchId: string;
  contextStats: ProjectLabIdeaGenerationContextStats;
}

export interface PaginatedProjectLabIdeas {
  data: ProjectLabIdea[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface DismissProjectLabIdeaInput {
  feedbackText?: string;
}

export interface ConvertProjectLabIdeaInput {
  area: Area;
  priority?: 'P1' | 'P2' | 'P3' | 'P4';
  goalIds?: string[];
}

export interface ConvertProjectLabIdeaResult {
  idea: ProjectLabIdea;
  project: Project;
}
