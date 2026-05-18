import { apiClient } from '@/lib/api-client';
import type {
  Project,
  CreateProjectInput,
  Task,
  UpdateProjectInput,
  Goal,
} from '@/types/growth-system';
import type { ApiResponse, ApiListResponse, ApiError } from '@/types/api-contracts';
import { goalsService } from '@/services/growth-system/goals.service';

interface BackendPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

interface ProjectHealth {
  status: 'green' | 'yellow' | 'red';
  tasksCompleted: number;
  tasksTotal: number;
  percentComplete: number;
}

const isMissingEndpointError = (error?: ApiError | null) =>
  error?.code === 'HTTP_404' || error?.code === 'HTTP_405' || error?.code === 'HTTP_501';

export const projectsService = {
  async getAll(filters?: {
    area?: string;
    status?: string;
    priority?: string;
  }): Promise<ApiListResponse<Project>> {
    const queryParams = new URLSearchParams();
    if (filters?.area) queryParams.append('area', filters.area);
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.priority) queryParams.append('priority', filters.priority);

    const endpoint = `/projects${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<BackendPaginatedResponse<Project>>(endpoint);

    if (response.success && response.data) {
      return {
        data: response.data.data,
        total: response.data.total,
        success: true,
      };
    }

    throw new Error(response.error?.message || 'Failed to fetch projects');
  },

  async getById(id: string): Promise<ApiResponse<Project>> {
    const response = await apiClient.get<Project>(`/projects/${id}`);
    return response;
  },

  async create(input: CreateProjectInput): Promise<ApiResponse<Project>> {
    // Prepare request body matching backend schema (camelCase)
    const requestBody = {
      name: input.name,
      description: input.description || undefined,
      area: input.area,
      subCategory: input.subCategory || undefined,
      priority: input.priority ?? undefined,
      status: input.status,
      impact: input.impact,
      startDate: input.startDate || undefined,
      targetEndDate: input.targetEndDate || undefined,
      notes: input.notes || undefined,
    };

    const response = await apiClient.post<Project>('/projects', requestBody);
    return response;
  },

  async update(id: string, input: UpdateProjectInput): Promise<ApiResponse<Project>> {
    const requestBody = {
      name: input.name,
      description: input.description || undefined,
      area: input.area,
      subCategory: input.subCategory || undefined,
      priority: input.priority ?? undefined,
      status: input.status,
      impact: input.impact,
      startDate: input.startDate || undefined,
      targetEndDate: input.targetEndDate || undefined,
      actualEndDate: input.actualEndDate || undefined,
      notes: input.notes || undefined,
    };

    const response = await apiClient.patch<Project>(`/projects/${id}`, requestBody);
    return response;
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(`/projects/${id}`);
    return response;
  },

  async getLinkedTasks(projectId: string): Promise<ApiListResponse<Task>> {
    const response = await apiClient.get<BackendPaginatedResponse<Task>>(
      `/projects/${projectId}/tasks`
    );
    if (response.success && response.data) {
      return {
        data: response.data.data,
        total: response.data.total,
        success: true,
      };
    }
    throw new Error(response.error?.message || 'Failed to fetch linked tasks');
  },

  async linkTask(projectId: string, taskId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<void>(`/projects/${projectId}/tasks`, { taskId });
    return response;
  },

  async unlinkTask(projectId: string, taskId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(`/projects/${projectId}/tasks/${taskId}`);
    return response;
  },

  async getLinkedGoals(projectId: string): Promise<ApiListResponse<Goal>> {
    const response = await apiClient.get<BackendPaginatedResponse<Goal>>(
      `/projects/${projectId}/goals`
    );
    if (response.success && response.data) {
      return {
        data: response.data.data,
        total: response.data.total,
        success: true,
      };
    }
    if (isMissingEndpointError(response.error)) {
      return {
        success: false,
        error: response.error,
      };
    }
    throw new Error(response.error?.message || 'Failed to fetch linked goals');
  },

  async linkToGoal(projectId: string, goalId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<void>(`/projects/${projectId}/goals`, { goalId });
    if (!response.success && isMissingEndpointError(response.error)) {
      return goalsService.linkProject(goalId, projectId);
    }
    return response;
  },

  async unlinkFromGoal(projectId: string, goalId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(`/projects/${projectId}/goals/${goalId}`);
    if (!response.success && isMissingEndpointError(response.error)) {
      return goalsService.unlinkProject(goalId, projectId);
    }
    return response;
  },

  async getHealth(projectId: string): Promise<ApiResponse<ProjectHealth>> {
    const response = await apiClient.get<ProjectHealth>(`/projects/${projectId}/health`);
    return response;
  },

  async calculateProgress(projectId: string): Promise<ApiResponse<number>> {
    const healthResponse = await this.getHealth(projectId);
    if (healthResponse.success && healthResponse.data) {
      return {
        success: true,
        data: healthResponse.data.percentComplete,
      };
    }
    return {
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to calculate progress' },
    };
  },
};
