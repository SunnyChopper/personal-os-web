import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api-contracts';
import type { DashboardInsightsResponse } from '@/types/growth-system';

export const dashboardInsightsService = {
  async getLatest(): Promise<ApiResponse<DashboardInsightsResponse>> {
    const response = await apiClient.get<DashboardInsightsResponse>('/ai/dashboard/insights');
    if (response.success && response.data) {
      return { success: true, data: response.data };
    }
    throw new Error(response.error?.message || 'Failed to fetch dashboard insights');
  },

  async regenerate(options?: {
    force?: boolean;
    useCache?: boolean;
  }): Promise<ApiResponse<DashboardInsightsResponse>> {
    const response = await apiClient.post<DashboardInsightsResponse>(
      '/ai/dashboard/insights/regenerate',
      {
        force: options?.force ?? false,
        useCache: options?.useCache ?? true,
      }
    );
    if (response.success && response.data) {
      return { success: true, data: response.data };
    }
    throw new Error(response.error?.message || 'Failed to refresh dashboard insights');
  },
};
