import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api-contracts';
import type { HealthActionResponse } from '@/types/fitness';

export const healthActionService = {
  async getLatest(): Promise<ApiResponse<HealthActionResponse>> {
    const response = await apiClient.get<HealthActionResponse>('/ai/health/action');
    if (response.success && response.data) {
      return { success: true, data: response.data };
    }
    throw new Error(response.error?.message || 'Failed to fetch health action');
  },

  async regenerate(options?: {
    force?: boolean;
    useCache?: boolean;
  }): Promise<ApiResponse<HealthActionResponse>> {
    const response = await apiClient.post<HealthActionResponse>('/ai/health/action/regenerate', {
      force: options?.force ?? false,
      useCache: options?.useCache ?? true,
    });
    if (response.success && response.data) {
      return { success: true, data: response.data };
    }
    throw new Error(response.error?.message || 'Failed to refresh health action');
  },
};
