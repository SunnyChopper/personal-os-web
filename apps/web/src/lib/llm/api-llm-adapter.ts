import { apiClient } from '@/lib/api-client';
import { getFeatureConfig } from '@/lib/llm/config/feature-config-store';
import type { AIFeature } from '@/lib/llm/config/feature-types';
import { parseModelNotFoundError } from '@/lib/llm/model-not-found';
import type { Task } from '@/types/growth-system';
import type {
  ILLMAdapter,
  LLMResponse,
  ParseTaskInput,
  ParseTaskOutput,
  TaskBreakdownInput,
  TaskBreakdownOutput,
  BlockerResolutionInput,
  BlockerResolutionOutput,
  PriorityAdvisorInput,
  PriorityAdvisorOutput,
  EffortEstimationInput,
  EffortEstimationOutput,
  TaskCategorizationInput,
  TaskCategorizationOutput,
  DependencyDetectionInput,
  DependencyDetectionOutput,
  ProjectHealthInput,
  ProjectHealthOutput,
  ProjectTaskGenInput,
  ProjectTaskGenOutput,
  ProjectRiskInput,
  ProjectRiskOutput,
} from '@/types/llm';

function buildTaskStats(tasks: Task[]): {
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  notStarted: number;
} {
  const stats = {
    total: tasks.length,
    completed: 0,
    inProgress: 0,
    blocked: 0,
    notStarted: 0,
  };
  for (const t of tasks) {
    switch (t.status) {
      case 'Done':
        stats.completed += 1;
        break;
      case 'In Progress':
        stats.inProgress += 1;
        break;
      case 'Blocked':
        stats.blocked += 1;
        break;
      case 'Not Started':
        stats.notStarted += 1;
        break;
      case 'Backlog':
        break;
      default:
        stats.notStarted += 1;
        break;
    }
  }
  return stats;
}

function buildTaskDetails(tasks: Task[]) {
  return tasks.slice(0, 20).map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    ...(t.priority !== undefined && { priority: t.priority }),
    ...(t.size !== undefined && { size: t.size }),
    ...(t.dueDate != null && t.dueDate !== '' && { dueDate: t.dueDate }),
  }));
}

interface AIResponse<T> {
  result: T;
  confidence: number;
  reasoning?: string;
  provider?: string;
  model?: string;
  cached?: boolean;
}

async function withFeatureAi<T extends Record<string, unknown>>(
  feature: AIFeature,
  body: T
): Promise<T & { provider: string; model: string }> {
  const cfg = await getFeatureConfig(feature);
  return { ...body, provider: cfg.provider, model: cfg.model };
}

function enrichFailure<T>(
  feature: AIFeature,
  message: string | null,
  base: LLMResponse<T | null>
): LLMResponse<T | null> {
  const parsed = parseModelNotFoundError(message, feature);
  if (!parsed) {
    return base;
  }
  return {
    ...base,
    errorCode: 'MODEL_NOT_FOUND',
    errorFeature: parsed.feature,
    errorModel: parsed.model,
  };
}

export class APILLMAdapter implements ILLMAdapter {
  isConfigured(): boolean {
    return true;
  }

  private async callAIEndpoint<TInput, TOutput>(
    feature: AIFeature,
    endpoint: string,
    input: TInput
  ): Promise<LLMResponse<TOutput>> {
    try {
      const body = await withFeatureAi(feature, input as Record<string, unknown>);
      const response = await apiClient.post<{ data: AIResponse<TOutput> }>(endpoint, body);

      if (response.success && response.data) {
        const aiResponse = response.data.data;
        return {
          data: aiResponse.result,
          error: null,
          success: true,
          usage: undefined,
        };
      }

      const errMsg = response.error?.message || 'AI request failed';
      return enrichFailure(feature, errMsg, {
        data: null,
        error: errMsg,
        success: false,
      }) as LLMResponse<TOutput>;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return enrichFailure(feature, message, {
        data: null,
        error: message,
        success: false,
      }) as LLMResponse<TOutput>;
    }
  }

  private async postStandardEnvelope<T>(
    feature: AIFeature,
    endpoint: string,
    body: Record<string, unknown>
  ): Promise<LLMResponse<T>> {
    try {
      const payload = await withFeatureAi(feature, body);
      const response = await apiClient.post<T>(endpoint, payload);
      if (response.success && response.data !== undefined && response.data !== null) {
        return { success: true, data: response.data, error: null };
      }
      const errMsg = response.error?.message ?? 'AI request failed';
      return enrichFailure(feature, errMsg, {
        success: false,
        data: null,
        error: errMsg,
      }) as LLMResponse<T>;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return enrichFailure(feature, message, {
        data: null,
        error: message,
        success: false,
      }) as LLMResponse<T>;
    }
  }

  async parseNaturalLanguageTask(input: ParseTaskInput): Promise<LLMResponse<ParseTaskOutput>> {
    return this.callAIEndpoint('parseTask', '/ai/tasks/parse', {
      input: input.text,
    });
  }

  async breakdownTask(input: TaskBreakdownInput): Promise<LLMResponse<TaskBreakdownOutput>> {
    const task = input.task;
    type ApiSubtask = {
      title: string;
      description?: string | null;
      storyPoints: number;
      order: number;
    };
    type ApiBreakdown = {
      subtasks: ApiSubtask[];
      totalStoryPoints?: number;
      criticalPath?: number[];
      parallelPossible?: boolean;
    };

    const res = await this.postStandardEnvelope<ApiBreakdown>(
      'breakdownTask',
      '/ai/tasks/breakdown',
      {
        taskId: task.id,
        title: task.title,
        description: task.description ?? undefined,
        area: task.area,
      }
    );

    if (!res.success || !res.data) {
      return res as unknown as LLMResponse<TaskBreakdownOutput>;
    }

    const subtasks = res.data.subtasks.map((st) => ({
      title: st.title,
      description: st.description ?? undefined,
      area: task.area,
      priority: task.priority,
      size: 1,
      projectIds: task.projectIds?.length ? [...task.projectIds] : undefined,
      goalIds: task.goalIds?.length ? [...task.goalIds] : undefined,
      status: 'Not Started' as const,
    }));

    return {
      success: true,
      data: {
        subtasks,
        reasoning: `Split into ${subtasks.length} one-point subtasks from AI breakdown.`,
      },
      error: null,
    };
  }

  async resolveBlockers(
    input: BlockerResolutionInput
  ): Promise<LLMResponse<BlockerResolutionOutput>> {
    return this.callAIEndpoint('breakdownTask', '/ai/tasks/breakdown', {
      taskId: input.task.id,
    });
  }

  async advisePriority(input: PriorityAdvisorInput): Promise<LLMResponse<PriorityAdvisorOutput>> {
    return this.callAIEndpoint('priorityAdvisor', '/ai/tasks/prioritize', {
      taskId: input.task.id,
    });
  }

  async estimateEffort(input: EffortEstimationInput): Promise<LLMResponse<EffortEstimationOutput>> {
    try {
      const similarTasks = (input.similarTasks ?? []).slice(0, 5).map((t) => ({
        title: t.title,
        size: t.size,
      }));
      type EffortPayload = {
        storyPoints: number;
        confidence: 'low' | 'medium' | 'high';
        complexityFactors: string[];
        assumptions: string[];
      };
      const payload = await withFeatureAi('effortEstimation', {
        taskId: input.task.id ?? 'new',
        title: input.task.title ?? '',
        description: input.task.description ?? undefined,
        similarTasks: similarTasks.length ? similarTasks : undefined,
      });
      const response = await apiClient.post<EffortPayload>('/ai/tasks/estimate-effort', payload);
      if (response.success && response.data) {
        const d = response.data;
        return {
          success: true,
          error: null,
          data: {
            storyPoints: d.storyPoints,
            confidence: d.confidence,
            complexityFactors: d.complexityFactors ?? [],
            assumptions: d.assumptions ?? [],
          },
        };
      }
      const errMsg = response.error?.message ?? 'Failed to estimate story points';
      return enrichFailure('effortEstimation', errMsg, {
        success: false,
        data: null,
        error: errMsg,
      }) as unknown as LLMResponse<EffortEstimationOutput>;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return enrichFailure('effortEstimation', message, {
        data: null,
        error: message,
        success: false,
      }) as unknown as LLMResponse<EffortEstimationOutput>;
    }
  }

  async categorizeTask(
    input: TaskCategorizationInput
  ): Promise<LLMResponse<TaskCategorizationOutput>> {
    return this.callAIEndpoint('taskCategorization', '/ai/tasks/categorize', {
      input: `${input.title} ${input.description || ''}`.trim(),
    });
  }

  async detectDependencies(
    input: DependencyDetectionInput
  ): Promise<LLMResponse<DependencyDetectionOutput>> {
    return this.callAIEndpoint('dependencyDetection', '/ai/tasks/dependencies', {
      taskId: input.task.id,
      title: input.task.title || '',
      description: input.task.description || undefined,
    });
  }

  async analyzeProjectHealth(input: ProjectHealthInput): Promise<LLMResponse<ProjectHealthOutput>> {
    const { project, tasks } = input;
    return this.postStandardEnvelope('projectHealth', '/ai/projects/health', {
      projectId: project.id,
      name: project.name,
      description: project.description ?? undefined,
      status: project.status,
      startDate: project.startDate ?? undefined,
      targetDate: project.targetEndDate ?? undefined,
      taskStats: buildTaskStats(tasks),
      taskDetails: buildTaskDetails(tasks),
      recentActivity: [],
    });
  }

  async generateProjectTasks(
    input: ProjectTaskGenInput
  ): Promise<LLMResponse<ProjectTaskGenOutput>> {
    const { project, existingTasks } = input;
    return this.postStandardEnvelope('projectTaskGen', '/ai/projects/generate-tasks', {
      projectId: project.id,
      name: project.name,
      description: project.description ?? undefined,
      goals: [],
      targetDate: project.targetEndDate ?? undefined,
      existingTasks: buildTaskDetails(existingTasks),
    });
  }

  async identifyProjectRisks(input: ProjectRiskInput): Promise<LLMResponse<ProjectRiskOutput>> {
    const { project, tasks } = input;
    return this.postStandardEnvelope('projectRisk', '/ai/projects/risks', {
      projectId: project.id,
      name: project.name,
      description: project.description ?? undefined,
      status: project.status,
      startDate: project.startDate ?? undefined,
      targetDate: project.targetEndDate ?? undefined,
      taskDetails: buildTaskDetails(tasks),
      dependencies: [],
      resources: {
        teamSize: null,
        budget: null,
        timeline: project.targetEndDate ?? null,
      },
    });
  }
}
