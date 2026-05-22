import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api-contracts';
import type {
  WeeklyReview,
  WeeklyReviewCurrentDashboard,
  WeeklyReviewGeneratePayload,
  WeeklyReviewLeverageRoiResponse,
  WeeklyReviewListResult,
  WeeklyReviewPlanActions,
  WeeklyReviewSendEmailResult,
  WeeklyReviewSuggestedTask,
} from '@/types/growth-system';

export const weeklyReviewService = {
  list: async (page = 1, pageSize = 20): Promise<ApiResponse<WeeklyReviewListResult>> => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return apiClient.get<WeeklyReviewListResult>(`/growth-system/weekly-reviews?${q}`);
  },

  getCurrent: async (
    weeks = 5,
    rollingWindow = 4
  ): Promise<ApiResponse<WeeklyReviewCurrentDashboard>> => {
    const q = new URLSearchParams({
      weeks: String(weeks),
      rollingWindow: String(rollingWindow),
    });
    return apiClient.get<WeeklyReviewCurrentDashboard>(
      `/growth-system/weekly-reviews/current?${q}`
    );
  },

  get: async (weekStart: string): Promise<ApiResponse<WeeklyReview>> => {
    return apiClient.get<WeeklyReview>(
      `/growth-system/weekly-reviews/${encodeURIComponent(weekStart)}`
    );
  },

  generate: async (payload?: WeeklyReviewGeneratePayload): Promise<ApiResponse<WeeklyReview>> => {
    const body = payload ?? {};
    return apiClient.post<WeeklyReview>('/growth-system/weekly-reviews/generate', {
      ...(body.weekStart ? { weekStart: body.weekStart } : {}),
      ...(body.closeoutDate ? { closeoutDate: body.closeoutDate } : {}),
      ...(body.activateOooStandby ? { activateOooStandby: true } : {}),
      ...(body.oooStandbyLabel ? { oooStandbyLabel: body.oooStandbyLabel } : {}),
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

  sendEmail: async (weekStart: string): Promise<ApiResponse<WeeklyReviewSendEmailResult>> => {
    return apiClient.post<WeeklyReviewSendEmailResult>(
      `/growth-system/weekly-reviews/${encodeURIComponent(weekStart)}/send-email`,
      {}
    );
  },

  getLeverageRoi: async (options?: {
    days?: number;
    anchorDate?: string;
  }): Promise<ApiResponse<WeeklyReviewLeverageRoiResponse>> => {
    const q = new URLSearchParams();
    if (options?.days != null) q.append('days', String(options.days));
    if (options?.anchorDate) q.append('anchorDate', options.anchorDate);
    const suffix = q.toString() ? `?${q}` : '';
    return apiClient.get<WeeklyReviewLeverageRoiResponse>(
      `/growth-system/weekly-reviews/leverage-roi${suffix}`
    );
  },
};
