import { apiClient } from '@/lib/api-client';

export const postmanService = {
  async saveToVault(payload: {
    title: string;
    request: Record<string, unknown>;
    response?: Record<string, unknown> | null;
  }): Promise<{ vaultItemId: string }> {
    const response = await apiClient.post<{ vaultItemId: string }>('/tools/postman/save', payload);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to save');
  },
};
