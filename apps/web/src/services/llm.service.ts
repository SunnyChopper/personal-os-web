import { getLLMAdapter } from '@/lib/llm';
import type {
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
import type { Task, Project } from '@/types/growth-system';

class LLMService {
  isConfigured(): boolean {
    return getLLMAdapter().isConfigured();
  }

  async parseNaturalLanguageTask(text: string): Promise<LLMResponse<ParseTaskOutput>> {
    const input: ParseTaskInput = { text };
    return getLLMAdapter().parseNaturalLanguageTask(input);
  }

  async breakdownTask(task: Task): Promise<LLMResponse<TaskBreakdownOutput>> {
    const input: TaskBreakdownInput = { task };
    return getLLMAdapter().breakdownTask(input);
  }

  async resolveBlockers(
    task: Task,
    blockers: Task[]
  ): Promise<LLMResponse<BlockerResolutionOutput>> {
    const input: BlockerResolutionInput = { task, blockers };
    return getLLMAdapter().resolveBlockers(input);
  }

  async advisePriority(task: Task, allTasks: Task[]): Promise<LLMResponse<PriorityAdvisorOutput>> {
    const input: PriorityAdvisorInput = { task, allTasks };
    return getLLMAdapter().advisePriority(input);
  }

  async estimateEffort(
    task: Partial<Task>,
    similarTasks?: Task[]
  ): Promise<LLMResponse<EffortEstimationOutput>> {
    const input: EffortEstimationInput = { task, similarTasks };
    return getLLMAdapter().estimateEffort(input);
  }

  async categorizeTask(
    title: string,
    description?: string
  ): Promise<LLMResponse<TaskCategorizationOutput>> {
    const input: TaskCategorizationInput = { title, description };
    return getLLMAdapter().categorizeTask(input);
  }

  async detectDependencies(
    task: Partial<Task>,
    existingTasks: Task[]
  ): Promise<LLMResponse<DependencyDetectionOutput>> {
    const input: DependencyDetectionInput = { task, existingTasks };
    return getLLMAdapter().detectDependencies(input);
  }

  async analyzeProjectHealth(
    project: Project,
    tasks: Task[]
  ): Promise<LLMResponse<ProjectHealthOutput>> {
    const input: ProjectHealthInput = { project, tasks };
    return getLLMAdapter().analyzeProjectHealth(input);
  }

  async generateProjectTasks(
    project: Project,
    existingTasks: Task[]
  ): Promise<LLMResponse<ProjectTaskGenOutput>> {
    const input: ProjectTaskGenInput = { project, existingTasks };
    return getLLMAdapter().generateProjectTasks(input);
  }

  async identifyProjectRisks(
    project: Project,
    tasks: Task[]
  ): Promise<LLMResponse<ProjectRiskOutput>> {
    const input: ProjectRiskInput = { project, tasks };
    return getLLMAdapter().identifyProjectRisks(input);
  }
}

export const llmService = new LLMService();
