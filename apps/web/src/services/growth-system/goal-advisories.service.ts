import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api-contracts';
import type { GoalAdvisory } from '@/types/growth-system';

interface GoalAdvisoryListPayload {
  advisories: GoalAdvisory[];
  total: number;
}

export const goalAdvisoriesService = {
  async listActive(): Promise<ApiResponse<GoalAdvisory[]>> {
    const response = await apiClient.get<GoalAdvisoryListPayload>('/goals/advisories');
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.advisories,
      };
    }
    throw new Error(response.error?.message || 'Failed to fetch goal advisories');
  },

  async dismiss(advisoryId: string): Promise<ApiResponse<GoalAdvisory>> {
    const response = await apiClient.post<GoalAdvisory>(
      `/goals/advisories/${advisoryId}/dismiss`,
      {}
    );
    if (response.success && response.data) {
      return { success: true, data: response.data };
    }
    throw new Error(response.error?.message || 'Failed to dismiss advisory');
  },
};
