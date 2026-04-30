import { llmConfig } from '@/lib/llm';
import { llmLogger } from '@/lib/logger';
import { taskPointsAIService } from '@/services/ai/task-points.service';
import { apiClient } from '@/lib/api-client';
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskDependency,
  FilterOptions,
  PaginatedResponse,
  DependencyGraph,
} from '@/types/growth-system';
import type { ApiResponse, ApiListResponse } from '@/types/api-contracts';

interface BackendPaginatedResponse<T> {
  tasks: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export const tasksService = {
  async getAll(filters?: FilterOptions): Promise<PaginatedResponse<Task>> {
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.priority) queryParams.append('priority', filters.priority);
    if (filters?.area) queryParams.append('area', filters.area);
    if (filters?.subCategory) queryParams.append('subCategory', filters.subCategory);
    if (filters?.projectId) queryParams.append('projectId', filters.projectId);
    if (filters?.goalId) queryParams.append('goalId', filters.goalId);
    if (filters?.dueDate) queryParams.append('dueDate', filters.dueDate);
    if (filters?.page) queryParams.append('page', String(filters.page));
    if (filters?.pageSize) queryParams.append('pageSize', String(filters.pageSize));
    if (filters?.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

    const endpoint = `/tasks${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<BackendPaginatedResponse<Task>>(endpoint);

    if (response.success && response.data) {
      const tasks = response.data.tasks || [];
      return {
        data: tasks,
        total: response.data.total,
        page: response.data.page,
        pageSize: response.data.pageSize,
        totalPages: Math.ceil(response.data.total / response.data.pageSize),
      };
    }

    throw new Error(response.error?.message || 'Failed to fetch tasks');
  },

  async getById(id: string): Promise<ApiResponse<Task>> {
    const response = await apiClient.get<Task>(`/tasks/${id}`);
    return response;
  },

  async create(input: CreateTaskInput): Promise<ApiResponse<Task>> {
    // Calculate point value if not provided and LLM is configured
    let pointValue = input.pointValue || null;

    if (pointValue === null && llmConfig.isConfigured()) {
      try {
        const calculation = await taskPointsAIService.calculateTaskPoints({
          title: input.title,
          description: input.description,
          area: input.area,
          priority: input.priority || 'P3',
          size: input.size,
        });
        pointValue = calculation.pointValue;
      } catch (error) {
        llmLogger.warn('Failed to calculate task points with AI', error);
      }
    }

    // Prepare request body matching backend schema
    const requestBody = {
      ...input,
      pointValue: pointValue ?? undefined,
    };

    const response = await apiClient.post<Task>('/tasks', requestBody);
    return response;
  },

  async update(id: string, input: UpdateTaskInput): Promise<ApiResponse<Task>> {
    const requestBody = {
      ...input,
    };

    const response = await apiClient.patch<Task>(`/tasks/${id}`, requestBody);
    return response;
  },

  /** Mark task complete with wallet award (idempotent). Prefer over PATCH for explicit completion UX. */
  async complete(id: string): Promise<ApiResponse<Task>> {
    const response = await apiClient.post<Task>(`/tasks/${id}/complete`, {});
    return response;
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(`/tasks/${id}`);
    return response;
  },

  async addDependency(
    taskId: string,
    dependsOnTaskId: string
  ): Promise<ApiResponse<TaskDependency>> {
    const response = await apiClient.post<TaskDependency>(`/tasks/${taskId}/dependencies`, {
      dependsOnTaskId,
    });
    return response;
  },

  async removeDependency(taskId: string, dependsOnTaskId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(
      `/tasks/${taskId}/dependencies/${dependsOnTaskId}`
    );
    return response;
  },

  async getDependencies(taskId: string): Promise<ApiResponse<TaskDependency[]>> {
    const response = await apiClient.get<TaskDependency[]>(`/tasks/${taskId}/dependencies`);
    return response;
  },

  async linkToProject(taskId: string, projectId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<void>(`/projects/${projectId}/tasks`, { taskId });
    return response;
  },

  async unlinkFromProject(taskId: string, projectId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(`/projects/${projectId}/tasks/${taskId}`);
    return response;
  },

  async getByProject(projectId: string): Promise<ApiListResponse<Task>> {
    const response = await apiClient.get<BackendPaginatedResponse<Task>>(
      `/projects/${projectId}/tasks`
    );
    if (response.success && response.data) {
      const tasks = response.data.tasks || [];
      return {
        data: tasks,
        total: response.data.total,
        success: true,
      };
    }
    throw new Error(response.error?.message || 'Failed to fetch tasks');
  },

  async linkToGoal(taskId: string, goalId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<void>(`/goals/${goalId}/tasks`, { taskId });
    return response;
  },

  async unlinkFromGoal(taskId: string, goalId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(`/goals/${goalId}/tasks/${taskId}`);
    return response;
  },

  async getByGoal(goalId: string): Promise<ApiListResponse<Task>> {
    const response = await apiClient.get<BackendPaginatedResponse<Task>>(`/goals/${goalId}/tasks`);
    if (response.success && response.data) {
      const tasks = response.data.tasks || [];
      return {
        data: tasks,
        total: response.data.total,
        success: true,
      };
    }
    throw new Error(response.error?.message || 'Failed to fetch tasks');
  },

  async getDependencyGraph(filters?: FilterOptions): Promise<ApiResponse<DependencyGraph>> {
    // Get filtered tasks
    const tasksResponse = await this.getAll(filters);
    if (!tasksResponse.data) {
      return {
        success: false,
        error: { code: 'FETCH_ERROR', message: 'Failed to fetch tasks' },
      };
    }

    const tasks = tasksResponse.data;
    const taskIds = new Set(tasks.map((t) => t.id));

    // Get dependencies for all tasks
    const allDeps: TaskDependency[] = [];
    for (const task of tasks) {
      const depsResponse = await this.getDependencies(task.id);
      if (depsResponse.success && depsResponse.data) {
        allDeps.push(...depsResponse.data);
      }
    }

    // Filter dependencies to only include those between filtered tasks
    const relevantDeps = allDeps.filter(
      (d) => taskIds.has(d.taskId) && taskIds.has(d.dependsOnTaskId)
    );

    const graph: DependencyGraph = {
      nodes: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        area: t.area,
        size: t.size,
      })),
      edges: relevantDeps.map((d) => ({
        source: d.dependsOnTaskId,
        target: d.taskId,
      })),
    };

    return { data: graph, success: true };
  },
};
