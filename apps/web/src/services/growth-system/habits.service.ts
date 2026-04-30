import { apiClient } from '@/lib/api-client';
import type {
  Habit,
  HabitLog,
  CreateHabitInput,
  UpdateHabitInput,
  CreateHabitLogInput,
} from '@/types/growth-system';
import type { ApiResponse, ApiListResponse } from '@/types/api-contracts';

interface BackendPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

interface HabitStats {
  total: number;
  last7Days: number;
  last30Days: number;
  currentStreak: number;
  longestStreak: number;
}

interface HabitHeatmap {
  [date: string]: number; // date -> completion count
}

interface HabitToday {
  habitId: string;
  name: string;
  completed: boolean;
  date: string;
}

export const habitsService = {
  async getAll(filters?: { area?: string; status?: string }): Promise<ApiListResponse<Habit>> {
    const queryParams = new URLSearchParams();
    if (filters?.area) queryParams.append('area', filters.area);
    if (filters?.status) queryParams.append('status', filters.status);

    const endpoint = `/habits${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<BackendPaginatedResponse<Habit>>(endpoint);

    if (response.success && response.data) {
      return {
        data: response.data.data,
        total: response.data.total,
        success: true,
      };
    }

    throw new Error(response.error?.message || 'Failed to fetch habits');
  },

  async getById(id: string): Promise<ApiResponse<Habit>> {
    const response = await apiClient.get<Habit>(`/habits/${id}`);
    return response;
  },

  async create(input: CreateHabitInput): Promise<ApiResponse<Habit>> {
    const response = await apiClient.post<Habit>('/habits', input);
    return response;
  },

  async update(id: string, input: UpdateHabitInput): Promise<ApiResponse<Habit>> {
    const response = await apiClient.patch<Habit>(`/habits/${id}`, input);
    return response;
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(`/habits/${id}`);
    return response;
  },

  async logCompletion(input: CreateHabitLogInput): Promise<ApiResponse<HabitLog>> {
    const response = await apiClient.post<HabitLog>(`/habits/${input.habitId}/logs`, {
      completed: true,
      date: input.completedAt
        ? new Date(input.completedAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      notes: input.notes,
    });
    return response;
  },

  async getLogsByHabit(
    habitId: string,
    filters?: { startDate?: string; endDate?: string }
  ): Promise<ApiListResponse<HabitLog>> {
    const queryParams = new URLSearchParams();
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);

    const endpoint = `/habits/${habitId}/logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<BackendPaginatedResponse<HabitLog>>(endpoint);

    if (response.success && response.data) {
      return {
        data: response.data.data,
        total: response.data.total,
        success: true,
      };
    }

    throw new Error(response.error?.message || 'Failed to fetch habit logs');
  },

  async deleteLog(habitId: string, date: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(`/habits/${habitId}/logs/${date}`);
    return response;
  },

  async getStats(habitId: string): Promise<ApiResponse<HabitStats>> {
    const response = await apiClient.get<HabitStats>(`/habits/${habitId}/stats`);
    return response;
  },

  async getHeatmap(habitId: string): Promise<ApiResponse<HabitHeatmap>> {
    const response = await apiClient.get<HabitHeatmap>(`/habits/${habitId}/heatmap`);
    return response;
  },

  async getToday(): Promise<ApiListResponse<HabitToday>> {
    const response = await apiClient.get<BackendPaginatedResponse<HabitToday>>('/habits/today');
    if (response.success && response.data) {
      return {
        data: response.data.data,
        total: response.data.total,
        success: true,
      };
    }
    throw new Error(response.error?.message || 'Failed to fetch habits for today');
  },
};
