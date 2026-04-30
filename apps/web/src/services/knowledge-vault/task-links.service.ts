import { apiClient } from '@/lib/api-client';

export interface VaultTaskLink {
  id: string;
  vaultItemId: string;
  taskId: string;
  linkType: string;
  similarityScore: number | null;
  acknowledged: boolean;
  createdAt: string;
}

export const taskLinksService = {
  async listUnacknowledged(): Promise<{ items: VaultTaskLink[] } | null> {
    const res = await apiClient.get<{ items: VaultTaskLink[] }>(
      '/knowledge/task-links?acknowledged=false'
    );
    if (res.success && res.data) return res.data;
    return null;
  },

  async acknowledge(linkId: string): Promise<boolean> {
    const res = await apiClient.post<{ acknowledged: boolean }>(
      `/knowledge/task-links/${linkId}/acknowledge`,
      {}
    );
    return Boolean(res.success);
  },

  async analyze(): Promise<{ newLinksCount: number } | null> {
    const res = await apiClient.post<{ newLinksCount: number }>(
      '/knowledge/task-links/analyze',
      {}
    );
    if (res.success && res.data != null) return res.data;
    return null;
  },

  async approve(linkId: string): Promise<boolean> {
    const res = await apiClient.post<{ approved: boolean }>(
      `/knowledge/task-links/${linkId}/approve`,
      {}
    );
    return Boolean(res.success);
  },
};
