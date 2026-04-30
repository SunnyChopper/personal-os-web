import { apiClient } from '@/lib/api-client';
import type { LongTermMemoryEntry } from '@/types/assistant-memory';
import type { Area } from '@/types/growth-system';

export interface LtmListResponse {
  items: LongTermMemoryEntry[];
  nextPageToken?: string | null;
}

export const ltmService = {
  async list(params: {
    pageSize?: number;
    pageToken?: string | null;
    includeArchived?: boolean;
    archivedOnly?: boolean;
  }): Promise<LtmListResponse> {
    const sp = new URLSearchParams();
    if (params.pageSize != null) sp.set('pageSize', String(params.pageSize));
    if (params.pageToken) sp.set('pageToken', params.pageToken);
    if (params.includeArchived) sp.set('includeArchived', 'true');
    if (params.archivedOnly) sp.set('archivedOnly', 'true');
    const q = sp.toString();
    const response = await apiClient.get<LtmListResponse>(`/ltm${q ? `?${q}` : ''}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to load LTM list');
  },

  async search(body: {
    query: string;
    limit?: number;
    minScore?: number;
    includeArchived?: boolean;
  }): Promise<LongTermMemoryEntry[]> {
    const response = await apiClient.post<{ hits: LongTermMemoryEntry[] }>('/ltm/search', {
      query: body.query,
      limit: body.limit,
      minScore: body.minScore,
      includeArchived: body.includeArchived ?? false,
    });
    if (response.success && response.data) {
      return response.data.hits;
    }
    throw new Error(response.error?.message || 'Failed to search LTM');
  },

  async update(
    memoryId: string,
    patch: {
      title?: string;
      summary?: string;
      area?: Area;
      tags?: string[];
      archived?: boolean;
    }
  ): Promise<LongTermMemoryEntry> {
    const response = await apiClient.put<LongTermMemoryEntry>(`/ltm/${memoryId}`, patch);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to update LTM');
  },

  async remove(memoryId: string): Promise<void> {
    const response = await apiClient.delete<{ deleted: boolean }>(`/ltm/${memoryId}`);
    if (response.success && response.data?.deleted) {
      return;
    }
    throw new Error(response.error?.message || 'Failed to delete LTM');
  },
};
