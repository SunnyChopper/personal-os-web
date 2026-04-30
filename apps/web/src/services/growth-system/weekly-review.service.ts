import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api-contracts';
import type {
  WeeklyReview,
  WeeklyReviewCurrentDashboard,
  WeeklyReviewListResult,
  WeeklyReviewPlanActions,
  WeeklyReviewSuggestedTask,
} from '@/types/growth-system';

export const weeklyReviewService = {
  list: async (page = 1, pageSize = 20): Promise<ApiResponse<WeeklyReviewListResult>> => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return apiClient.get<WeeklyReviewListResult>(`/growth-system/weekly-reviews?${q}`);
  },

  getCurrent: async (): Promise<ApiResponse<WeeklyReviewCurrentDashboard>> => {
    return apiClient.get<WeeklyReviewCurrentDashboard>('/growth-system/weekly-reviews/current');
  },

  get: async (weekStart: string): Promise<ApiResponse<WeeklyReview>> => {
    return apiClient.get<WeeklyReview>(
      `/growth-system/weekly-reviews/${encodeURIComponent(weekStart)}`
    );
  },

  generate: async (weekStart?: string): Promise<ApiResponse<WeeklyReview>> => {
    return apiClient.post<WeeklyReview>('/growth-system/weekly-reviews/generate', {
      ...(weekStart ? { weekStart } : {}),
    });
  },

  savePlan: async (
    weekStart: string,
    planActions: WeeklyReviewPlanActions
  ): Promise<ApiResponse<WeeklyReview>> => {
    return apiClient.put<WeeklyReview>(
      `/growth-system/weekly-reviews/${encodeURIComponent(weekStart)}/plan`,
      { planActions }
    );
  },

  complete: async (weekStart: string): Promise<ApiResponse<WeeklyReview>> => {
    return apiClient.put<WeeklyReview>(
      `/growth-system/weekly-reviews/${encodeURIComponent(weekStart)}/complete`,
      {}
    );
  },

  discard: async (weekStart: string): Promise<ApiResponse<null>> => {
    return apiClient.delete<null>(`/growth-system/weekly-reviews/${encodeURIComponent(weekStart)}`);
  },

  suggestTasks: async (
    weekStart?: string
  ): Promise<ApiResponse<{ suggestedTasks: WeeklyReviewSuggestedTask[] }>> => {
    return apiClient.post<{ suggestedTasks: WeeklyReviewSuggestedTask[] }>(
      '/growth-system/weekly-reviews/suggest-tasks',
      { ...(weekStart ? { weekStart } : {}) }
    );
  },
};
