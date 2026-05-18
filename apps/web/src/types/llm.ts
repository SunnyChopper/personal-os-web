import type { Task, CreateTaskInput, Project, Area, SubCategory, Priority } from './growth-system';

/** Prefer Zod schemas under `@/lib/llm/schemas` with `z.infer<>` for new LLM I/O to avoid duplicating shapes here. */

export type LLMAdapterType = 'direct' | 'api';

export interface LLMConfig {
  adapterType: LLMAdapterType;
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ParseTaskInput {
  text: string;
}

export interface ParseTaskOutput {
  task: Partial<CreateTaskInput>;
  confidence: number;
  extractedEntities: string[];
}

export interface TaskBreakdownInput {
  task: Task;
}

export interface TaskBreakdownOutput {
  subtasks: CreateTaskInput[];
  reasoning: string;
}

export interface BlockerResolutionInput {
  task: Task;
  blockers: Task[];
}

export interface BlockerResolutionOutput {
  suggestions: string[];
  recommendedActions: Array<{ action: string; targetTaskId: string; reason: string }>;
}

export interface PriorityAdvisorInput {
  task: Task;
  allTasks: Task[];
}

export interface PriorityAdvisorOutput {
  recommendedPriority: Priority;
  reasoning: string;
  factors: string[];
}

export interface EffortEstimationInput {
  task: Partial<Task>;
  similarTasks?: Task[];
}

/** Matches backend TaskEffortEstimate (camelCase). */
export interface EffortEstimationOutput {
  storyPoints: number;
  confidence: 'low' | 'medium' | 'high';
  complexityFactors: string[];
  assumptions: string[];
}

export interface TaskCategorizationInput {
  title: string;
  description?: string;
}

export interface TaskCategorizationOutput {
  area: Area;
  subCategory?: SubCategory;
  confidence: number;
  reasoning: string;
}

export interface DependencyDetectionInput {
  task: Partial<Task>;
  existingTasks: Task[];
}

export interface DependencyDetectionOutput {
  suggestedDependencies: Array<{
    taskId: string;
    taskTitle: string;
    reason: string;
    confidence: number;
  }>;
}

export interface ProjectHealthInput {
  project: Project;
  tasks: Task[];
}

/** Matches backend ProjectHealthAnalysis (camelCase wire). */
export type ProjectOverallHealth = 'excellent' | 'good' | 'atRisk' | 'critical';

export interface ProjectHealthFactor {
  factorName: string;
  status: 'good' | 'warning' | 'critical';
  description: string;
  impact: 'high' | 'medium' | 'low';
}

export interface ProjectHealthOutput {
  overallHealth: ProjectOverallHealth;
  healthScore: number;
  healthFactors: ProjectHealthFactor[];
  positiveIndicators: string[];
  concerns: string[];
  priorityActions: string[];
  trajectory: 'improving' | 'stable' | 'declining';
}

export interface ProjectTaskGenInput {
  project: Project;
  existingTasks: Task[];
}

/** Matches backend GeneratedTask (camelCase wire). */
export interface GeneratedProjectTask {
  title: string;
  description: string;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  estimatedHours: number;
  dependencies: number[];
  category: string;
}

/** Matches backend ProjectTaskGeneration (camelCase wire). */
export interface ProjectTaskGenOutput {
  tasks: GeneratedProjectTask[];
  executionPhases: string[];
  criticalPath: number[];
  estimatedTotalHours: number;
  recommendedStart: string;
}

export interface ProjectRiskInput {
  project: Project;
  tasks: Task[];
}

/** Matches backend ProjectRisk (camelCase wire). */
export interface ProjectRiskItem {
  riskTitle: string;
  description: string;
  category: 'timeline' | 'resources' | 'technical' | 'scope' | 'dependencies' | 'external';
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  riskScore: number;
  mitigationStrategies: string[];
  contingencyPlan: string;
}

/** Matches backend ProjectRiskAssessment (camelCase wire). */
export interface ProjectRiskOutput {
  overallRiskLevel: 'low' | 'moderate' | 'high' | 'critical';
  risks: ProjectRiskItem[];
  topPriorityRisk: string;
  riskMitigationRoadmap: string[];
}

export interface StoredSuggestion {
  id: string;
  type:
    | 'task_breakdown'
    | 'dependency_detection'
    | 'priority_adjustment'
    | 'effort_estimation'
    | 'project_health'
    | 'project_risk'
    | 'task_suggestion';
  title: string;
  description: string;
  data: Record<string, unknown>;
  entityType: 'task' | 'project' | null;
  entityId: string | null;
  createdAt: string;
  dismissedAt: string | null;
  expiresAt: string | null;
}

export interface LLMResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface StreamingLLMResponse<T> {
  onChunk: (chunk: string) => void;
  onComplete: (result: LLMResponse<T>) => void;
  onError: (error: string) => void;
  abort: () => void;
}

export interface ILLMAdapter {
  parseNaturalLanguageTask(input: ParseTaskInput): Promise<LLMResponse<ParseTaskOutput>>;
  breakdownTask(input: TaskBreakdownInput): Promise<LLMResponse<TaskBreakdownOutput>>;
  resolveBlockers(input: BlockerResolutionInput): Promise<LLMResponse<BlockerResolutionOutput>>;
  advisePriority(input: PriorityAdvisorInput): Promise<LLMResponse<PriorityAdvisorOutput>>;
  estimateEffort(input: EffortEstimationInput): Promise<LLMResponse<EffortEstimationOutput>>;
  categorizeTask(input: TaskCategorizationInput): Promise<LLMResponse<TaskCategorizationOutput>>;
  detectDependencies(
    input: DependencyDetectionInput
  ): Promise<LLMResponse<DependencyDetectionOutput>>;
  analyzeProjectHealth(input: ProjectHealthInput): Promise<LLMResponse<ProjectHealthOutput>>;
  generateProjectTasks(input: ProjectTaskGenInput): Promise<LLMResponse<ProjectTaskGenOutput>>;
  identifyProjectRisks(input: ProjectRiskInput): Promise<LLMResponse<ProjectRiskOutput>>;
  isConfigured(): boolean;
}
