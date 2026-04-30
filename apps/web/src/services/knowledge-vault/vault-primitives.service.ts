import { apiClient } from '@/lib/api-client';

export const vaultPrimitivesService = {
  async rewrite(vaultItemId: string, mode: 'expert' | 'beginner' | 'analogy', section?: string) {
    return apiClient.post<{ text: string }>('/knowledge/ai/rewrite', {
      vaultItemId,
      mode,
      section,
    });
  },

  async feynmanRespond(
    vaultItemId: string,
    conversation: Array<{ role: string; content: string }>
  ) {
    return apiClient.post<Record<string, unknown>>('/knowledge/ai/feynman/respond', {
      vaultItemId,
      conversation,
    });
  },

  async devilsAdvocate(vaultItemId: string) {
    return apiClient.post<Record<string, unknown>>('/knowledge/ai/devils-advocate', {
      vaultItemId,
    });
  },

  async syntopic(documentIds: string[]) {
    return apiClient.post<Record<string, unknown>>('/knowledge/ai/syntopic', {
      documentIds,
    });
  },

  async darkMatter() {
    return apiClient.post<Record<string, unknown>>('/knowledge/ai/dark-matter', {});
  },

  async getCheatSheet() {
    return apiClient.get<{ markdownContent: string; weekDate: string | null }>(
      '/knowledge/cheat-sheet'
    );
  },

  async generateCheatSheet() {
    return apiClient.post<{ success: boolean; weekDate: string }>(
      '/knowledge/cheat-sheet/generate',
      {}
    );
  },

  async jitSearch(query: string, context?: string) {
    const params = new URLSearchParams({ query });
    if (context) params.set('context', context);
    return apiClient.get<{ hits: Array<Record<string, unknown>> }>(`/knowledge/jit?${params}`);
  },

  async getGraphClusters() {
    return apiClient.get<{ clusters: Array<Record<string, unknown>> }>('/knowledge/graph/clusters');
  },
};
