import { apiClient } from '@/lib/api-client';
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

  async parseNaturalLanguageTask(input: ParseTaskInput): Promise<LLMResponse<ParseTaskOutput>> {
    return this.callAIEndpoint<{ input: string }, ParseTaskOutput>('/ai/tasks/parse', {
      input: input.text,
    });
  }

  async breakdownTask(input: TaskBreakdownInput): Promise<LLMResponse<TaskBreakdownOutput>> {
    return this.callAIEndpoint<{ taskId: string }, TaskBreakdownOutput>('/ai/tasks/breakdown', {
      taskId: input.task.id,
    });
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
    // Backend may not have this exact endpoint - may need to use a different approach
    return this.callAIEndpoint<{ projectId: string }, ProjectHealthOutput>('/ai/tasks/breakdown', {
      projectId: input.project.id,
    });
  }

  async generateProjectTasks(
    input: ProjectTaskGenInput
  ): Promise<LLMResponse<ProjectTaskGenOutput>> {
    // Backend may not have this exact endpoint
    return this.callAIEndpoint<{ projectId: string }, ProjectTaskGenOutput>('/ai/tasks/breakdown', {
      projectId: input.project.id,
    });
  }

  async identifyProjectRisks(input: ProjectRiskInput): Promise<LLMResponse<ProjectRiskOutput>> {
    // Backend may not have this exact endpoint
    return this.callAIEndpoint<{ projectId: string }, ProjectRiskOutput>('/ai/tasks/breakdown', {
      projectId: input.project.id,
    });
  }
}
