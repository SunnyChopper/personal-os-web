import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api-contracts';
import type { WeeklyDashboardConfig } from '@/types/weekly-dashboard';

export const weeklyDashboardService = {
  get: async (): Promise<ApiResponse<WeeklyDashboardConfig>> => {
    return apiClient.get<WeeklyDashboardConfig>('/preferences/weekly-dashboard');
  },

  put: async (config: WeeklyDashboardConfig): Promise<ApiResponse<WeeklyDashboardConfig>> => {
    return apiClient.put<WeeklyDashboardConfig>('/preferences/weekly-dashboard', config);
  },
};
