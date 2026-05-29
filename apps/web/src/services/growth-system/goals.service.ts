import { apiClient } from '@/lib/api-client';
import type { ApiResponse, ApiListResponse } from '@/types/api-contracts';
import type {
  Goal,
  GoalDependency,
  CreateGoalInput,
  UpdateGoalInput,
  GoalUpdateWithCascade,
  CascadedGoalUpdate,
  Metric,
  Task,
  Habit,
  GoalProgressBreakdown,
  GoalActivity,
  SuccessCriterion,
  GoalLinkSuggestions,
} from '@/types/growth-system';

interface BackendPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

interface BackendSuccessCriterion {
  id: string;
  description: string;
  targetValue?: number | null;
  unit?: string | null;
  isCompleted: boolean;
  completedAt: string | null;
}

// Normalize backend goal to frontend Goal type
function normalizeGoal(backendGoal: any): Goal {
  return {
    ...backendGoal,
    startDate: backendGoal.startDate ?? null,
    successCriteria: Array.isArray(backendGoal.successCriteria)
      ? backendGoal.successCriteria.map(
          (criterion: BackendSuccessCriterion): SuccessCriterion => ({
            id: criterion.id,
            description: criterion.description,
            isCompleted: criterion.isCompleted,
            completedAt: criterion.completedAt,
            linkedMetricId: null,
            linkedTaskId: null,
            targetDate: null,
            order: 0,
          })
        )
      : [],
  };
}

export const goalsService = {
  async getAll(filters?: {
    area?: string;
    status?: string;
    health?: string;
    priority?: string;
  }): Promise<ApiListResponse<Goal>> {
    const queryParams = new URLSearchParams();
    if (filters?.area) queryParams.append('area', filters.area);
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.health) queryParams.append('health', filters.health);
    if (filters?.priority) queryParams.append('priority', filters.priority);

    const endpoint = `/goals${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<BackendPaginatedResponse<any>>(endpoint);

    if (response.success && response.data) {
      return {
        data: response.data.data.map(normalizeGoal),
        total: response.data.total,
        success: true,
      };
    }

    throw new Error(response.error?.message || 'Failed to fetch goals');
  },

  async getById(id: string): Promise<ApiResponse<Goal>> {
    const response = await apiClient.get<any>(`/goals/${id}`);
    if (response.success && response.data) {
      return {
        ...response,
        data: normalizeGoal(response.data),
      };
    }
    return response;
  },

  async create(input: CreateGoalInput): Promise<ApiResponse<Goal>> {
    // Prepare request body matching backend schema
    const requestBody = {
      ...input,
    };

    const response = await apiClient.post<Goal>('/goals', requestBody);
    return response;
  },

  async update(
    id: string,
    input: UpdateGoalInput,
    options?: { cascade?: boolean }
  ): Promise<ApiResponse<Goal> | ApiResponse<GoalUpdateWithCascade>> {
    // Transform success criteria from frontend format to backend format
    const requestBody: any = {
      ...input,
    };

    // Transform success criteria if present
    if (
      input.successCriteria &&
      Array.isArray(input.successCriteria) &&
      input.successCriteria.length > 0
    ) {
      // Check if it's a string array or SuccessCriterion array
      const firstCriterion = input.successCriteria[0];
      if (typeof firstCriterion === 'string') {
        // Convert string[] to BackendSuccessCriterion[]
        requestBody.successCriteria = (input.successCriteria as string[]).map((text: string) => ({
          description: text,
          isCompleted: false,
          completedAt: null,
        }));
      } else {
        // SuccessCriterion[] already uses 'description' field, so it matches backend format
        requestBody.successCriteria = (input.successCriteria as SuccessCriterion[]).map(
          (criterion) => {
            const backendCriterion: any = {
              description: criterion.description,
              isCompleted: criterion.isCompleted,
              completedAt: criterion.completedAt,
            };
            // Only include ID if it exists and is not empty (preserve existing criteria)
            if (criterion.id && criterion.id.trim() !== '') {
              backendCriterion.id = criterion.id;
            }
            return backendCriterion;
          }
        );
      }
    }

    const cascadeQuery = options?.cascade ? '?cascade=true' : '';
    const response = await apiClient.patch<any>(`/goals/${id}${cascadeQuery}`, requestBody);

    if (response.success && response.data) {
      if (response.data.goal) {
        return {
          ...response,
          data: {
            goal: normalizeGoal(response.data.goal),
            cascaded: (response.data.cascaded ?? []) as CascadedGoalUpdate[],
          },
        };
      }
      return {
        ...response,
        data: normalizeGoal(response.data),
      };
    }

    return response;
  },

  async listAllDependencies(goalIds?: string[]): Promise<ApiResponse<GoalDependency[]>> {
    const query = goalIds?.length ? `?goalIds=${goalIds.join(',')}` : '';
    const response = await apiClient.get<{ dependencies: GoalDependency[] }>(
      `/goals/dependencies${query}`
    );
    if (response.success && response.data) {
      return { ...response, data: response.data.dependencies };
    }
    throw new Error(response.error?.message || 'Failed to fetch goal dependencies');
  },

  async listDependenciesForGoal(
    goalId: string
  ): Promise<ApiResponse<{ predecessors: GoalDependency[]; successors: GoalDependency[] }>> {
    const response = await apiClient.get<{
      predecessors: GoalDependency[];
      successors: GoalDependency[];
    }>(`/goals/${goalId}/dependencies`);
    return response;
  },

  async addDependency(
    successorGoalId: string,
    predecessorGoalId: string,
    lagDays?: number
  ): Promise<ApiResponse<{ dependency: GoalDependency; cascaded: CascadedGoalUpdate[] }>> {
    const body: { predecessorGoalId: string; lagDays?: number } = { predecessorGoalId };
    if (lagDays !== undefined) body.lagDays = lagDays;
    const response = await apiClient.post<{
      dependency: GoalDependency;
      cascaded: CascadedGoalUpdate[];
    }>(`/goals/${successorGoalId}/dependencies`, body);
    return response;
  },

  async updateDependencyLag(
    successorGoalId: string,
    predecessorGoalId: string,
    lagDays: number
  ): Promise<ApiResponse<{ dependency: GoalDependency; cascaded: CascadedGoalUpdate[] }>> {
    const response = await apiClient.patch<{
      dependency: GoalDependency;
      cascaded: CascadedGoalUpdate[];
    }>(`/goals/${successorGoalId}/dependencies/${predecessorGoalId}`, { lagDays });
    return response;
  },

  async removeDependency(
    successorGoalId: string,
    predecessorGoalId: string
  ): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/goals/${successorGoalId}/dependencies/${predecessorGoalId}`);
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(`/goals/${id}`);
    return response;
  },

  async linkMetric(goalId: string, metricId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<void>(`/goals/${goalId}/link`, {
      entityId: metricId,
      entityType: 'metric',
    });
    return response;
  },

  async unlinkMetric(goalId: string, metricId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(`/goals/${goalId}/link/metric/${metricId}`);
    return response;
  },

  async linkProject(goalId: string, projectId: string): Promise<ApiResponse<void>> {
    // Note: Backend may not have this endpoint, using tasks endpoint pattern
    const response = await apiClient.post<void>(`/goals/${goalId}/projects`, { projectId });
    return response;
  },

  async unlinkProject(goalId: string, projectId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(`/goals/${goalId}/projects/${projectId}`);
    return response;
  },

  async getLinkedMetrics(goalId: string): Promise<ApiListResponse<Metric>> {
    const response = await apiClient.get<BackendPaginatedResponse<Metric>>(
      `/goals/${goalId}/metrics`
    );
    if (response.success && response.data) {
      return {
        data: response.data.data,
        total: response.data.total,
        success: true,
      };
    }
    throw new Error(response.error?.message || 'Failed to fetch linked metrics');
  },

  async getLinkedProjects(
    goalId: string
  ): Promise<ApiListResponse<import('../../types/growth-system').Project>> {
    // Note: Backend may not have this endpoint
    const response = await apiClient.get<
      BackendPaginatedResponse<import('../../types/growth-system').Project>
    >(`/goals/${goalId}/projects`);
    if (response.success && response.data) {
      return {
        data: response.data.data,
        total: response.data.total,
        success: true,
      };
    }
    throw new Error(response.error?.message || 'Failed to fetch linked projects');
  },

  async getByProject(
    projectId: string
  ): Promise<ApiListResponse<import('../../types/growth-system').Goal>> {
    const response = await apiClient.get<
      BackendPaginatedResponse<import('../../types/growth-system').Goal>
    >(`/projects/${projectId}/goals`);
    if (response.success && response.data) {
      return {
        data: response.data.data,
        total: response.data.total,
        success: true,
      };
    }
    throw new Error(response.error?.message || 'Failed to fetch goals for project');
  },

  async getLinkedTasks(goalId: string): Promise<ApiListResponse<Task>> {
    const response = await apiClient.get<BackendPaginatedResponse<Task>>(`/goals/${goalId}/tasks`);
    if (response.success && response.data) {
      return {
        data: response.data.data,
        total: response.data.total,
        success: true,
      };
    }
    throw new Error(response.error?.message || 'Failed to fetch linked tasks');
  },

  async getLinkedHabits(goalId: string): Promise<ApiListResponse<Habit>> {
    const response = await apiClient.get<BackendPaginatedResponse<Habit>>(
      `/goals/${goalId}/habits`
    );
    if (response.success && response.data) {
      return {
        data: response.data.data,
        total: response.data.total,
        success: true,
      };
    }
    throw new Error(response.error?.message || 'Failed to fetch linked habits');
  },

  async linkHabit(goalId: string, habitId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.post<void>(`/goals/${goalId}/link`, {
      entityId: habitId,
      entityType: 'habit',
    });
    return response;
  },

  async unlinkHabit(goalId: string, habitId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(`/goals/${goalId}/link/habit/${habitId}`);
    return response;
  },

  async getProgress(goalId: string): Promise<ApiResponse<GoalProgressBreakdown>> {
    const response = await apiClient.get<{ goalId: string; progress: GoalProgressBreakdown }>(
      `/goals/${goalId}/progress`
    );
    if (response.success && response.data?.progress) {
      return { success: true, data: response.data.progress };
    }
    return {
      success: false,
      error: response.error ?? { message: 'Failed to fetch goal progress', code: 'UNKNOWN' },
    };
  },

  async completeCriterion(goalId: string, criterionId: string): Promise<ApiResponse<Goal>> {
    const response = await apiClient.post<Goal>(
      `/goals/${goalId}/criteria/${criterionId}/complete`
    );
    return response;
  },

  async getActivities(goalId: string, limit?: number): Promise<ApiListResponse<GoalActivity>> {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', String(limit));

    const endpoint = `/goals/${goalId}/activity${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<BackendPaginatedResponse<GoalActivity>>(endpoint);

    if (response.success && response.data) {
      return {
        data: response.data.data,
        total: response.data.total,
        success: true,
      };
    }

    throw new Error(response.error?.message || 'Failed to fetch goal activities');
  },

  async updateCriterion(
    goalId: string,
    criterionId: string,
    updates: { isCompleted: boolean; completedAt: string | null }
  ): Promise<ApiResponse<Goal>> {
    const response = await apiClient.patch<Goal>(
      `/goals/${goalId}/criteria/${criterionId}`,
      updates
    );
    return response;
  },

  async logActivity(
    goalId: string,
    activity: Omit<GoalActivity, 'id' | 'goalId' | 'createdAt'>
  ): Promise<ApiResponse<GoalActivity>> {
    const response = await apiClient.post<GoalActivity>(`/goals/${goalId}/activity`, activity);
    return response;
  },

  async fetchLinkSuggestions(
    goalId: string,
    opts?: {
      entityTypes?: Array<'task' | 'habit' | 'metric' | 'project'>;
      limitPerType?: number;
      useCache?: boolean;
    }
  ): Promise<ApiResponse<GoalLinkSuggestions>> {
    const response = await apiClient.post<GoalLinkSuggestions>(
      `/ai/goals/${goalId}/suggest-links`,
      opts ?? {}
    );
    return response;
  },
};
