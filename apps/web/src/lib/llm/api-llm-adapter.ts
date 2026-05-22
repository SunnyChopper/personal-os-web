import { apiClient } from '@/lib/api-client';
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

export class APILLMAdapter implements ILLMAdapter {
  isConfigured(): boolean {
    // Backend handles API key configuration
    return true;
  }

  private async callAIEndpoint<TInput, TOutput>(
    endpoint: string,
    input: TInput
  ): Promise<LLMResponse<TOutput>> {
    try {
      const response = await apiClient.post<{ data: AIResponse<TOutput> }>(endpoint, input);

      if (response.success && response.data) {
        // Backend wraps response in { success, data: { result, confidence, ... } }
        const aiResponse = response.data.data;
        return {
          data: aiResponse.result,
          error: null,
          success: true,
          usage: undefined,
        };
      }

      return {
        data: null,
        error: response.error?.message || 'AI request failed',
        success: false,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { data: null, error: message, success: false };
    }
  }

  private async postStandardEnvelope<T>(endpoint: string, body: unknown): Promise<LLMResponse<T>> {
    try {
      const response = await apiClient.post<T>(endpoint, body);
      if (response.success && response.data !== undefined && response.data !== null) {
        return { success: true, data: response.data, error: null };
      }
      return {
        success: false,
        data: null,
        error: response.error?.message ?? 'AI request failed',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { data: null, error: message, success: false };
    }
  }

  async parseNaturalLanguageTask(input: ParseTaskInput): Promise<LLMResponse<ParseTaskOutput>> {
    return this.callAIEndpoint<{ input: string }, ParseTaskOutput>('/ai/tasks/parse', {
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

    const res = await this.postStandardEnvelope<ApiBreakdown>('/ai/tasks/breakdown', {
      taskId: task.id,
      title: task.title,
      description: task.description ?? undefined,
      area: task.area,
    });

    if (!res.success || !res.data) {
      return {
        success: false,
        data: null,
        error: res.error ?? 'AI breakdown failed',
      };
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
    // Backend may not have this exact endpoint - using breakdown as fallback
    return this.callAIEndpoint<{ taskId: string }, BlockerResolutionOutput>('/ai/tasks/breakdown', {
      taskId: input.task.id,
    });
  }

  async advisePriority(input: PriorityAdvisorInput): Promise<LLMResponse<PriorityAdvisorOutput>> {
    return this.callAIEndpoint<{ taskId: string }, PriorityAdvisorOutput>('/ai/tasks/prioritize', {
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
      const response = await apiClient.post<EffortPayload>('/ai/tasks/estimate-effort', {
        taskId: input.task.id ?? 'new',
        title: input.task.title ?? '',
        description: input.task.description ?? undefined,
        similarTasks: similarTasks.length ? similarTasks : undefined,
      });
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
      return {
        success: false,
        data: null,
        error: response.error?.message ?? 'Failed to estimate story points',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { data: null, error: message, success: false };
    }
  }

  async categorizeTask(
    input: TaskCategorizationInput
  ): Promise<LLMResponse<TaskCategorizationOutput>> {
    return this.callAIEndpoint<{ input: string }, TaskCategorizationOutput>(
      '/ai/tasks/categorize',
      {
        input: `${input.title} ${input.description || ''}`.trim(),
      }
    );
  }

  async detectDependencies(
    input: DependencyDetectionInput
  ): Promise<LLMResponse<DependencyDetectionOutput>> {
    return this.callAIEndpoint<
      { taskId?: string; title: string; description?: string },
      DependencyDetectionOutput
    >('/ai/tasks/dependencies', {
      taskId: input.task.id,
      title: input.task.title || '',
      description: input.task.description || undefined,
    });
  }

  async analyzeProjectHealth(input: ProjectHealthInput): Promise<LLMResponse<ProjectHealthOutput>> {
    const { project, tasks } = input;
    return this.postStandardEnvelope<ProjectHealthOutput>('/ai/projects/health', {
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
    return this.postStandardEnvelope<ProjectTaskGenOutput>('/ai/projects/generate-tasks', {
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
    return this.postStandardEnvelope<ProjectRiskOutput>('/ai/projects/risks', {
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
