import { apiClient } from '@/lib/api-client';
import { markdownFilesService } from '@/services/markdown-files.service';
import type {
  ConsolidateMemoryResponse,
  LongTermMemoryEntry,
  ShortTermMemoryHistoryResponse,
  ShortTermMemoryResponse,
} from '@/types/assistant-memory';
import type { Area } from '@/types/growth-system';

interface LongTermMemoryListResponse {
  items: LongTermMemoryEntry[];
  nextPageToken?: string | null;
}

interface SearchLongTermMemoryResponse {
  hits: LongTermMemoryEntry[];
}

export const assistantMemoryService = {
  async getShortTerm(date?: string): Promise<ShortTermMemoryResponse> {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    const response = await apiClient.get<ShortTermMemoryResponse>(
      `/assistant/memory/short-term${query}`
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to load short-term memory');
  },

  async getShortTermHistory(includeArchived = true): Promise<ShortTermMemoryHistoryResponse> {
    const query = `?includeArchived=${includeArchived ? 'true' : 'false'}`;
    const response = await apiClient.get<ShortTermMemoryHistoryResponse>(
      `/assistant/memory/short-term/history${query}`
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to load memory history');
  },

  async getShortTermContent(fileId: string): Promise<string> {
    const response = await markdownFilesService.getFileContent(fileId);
    if (response.success && response.data) {
      return response.data.content;
    }
    throw new Error(response.error?.message || 'Failed to load memory content');
  },

  async updateShortTerm(fileId: string, content: string): Promise<ShortTermMemoryResponse> {
    const response = await apiClient.put<ShortTermMemoryResponse>(
      `/assistant/memory/short-term/${fileId}`,
      { content }
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to update short-term memory');
  },

  async consolidate(date?: string): Promise<ConsolidateMemoryResponse> {
    const response = await apiClient.post<ConsolidateMemoryResponse>(
      '/assistant/memory/consolidate',
      {
        date,
      }
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to consolidate memory');
  },

  async getLongTermNotes(search?: string): Promise<LongTermMemoryEntry[]> {
    if (search?.trim()) {
      const response = await apiClient.post<SearchLongTermMemoryResponse>(
        '/assistant/memory/long-term/search',
        { query: search.trim(), limit: 50 }
      );
      if (response.success && response.data) {
        return response.data.hits;
      }
      throw new Error(response.error?.message || 'Failed to search long-term memory');
    }
    const response = await apiClient.get<LongTermMemoryListResponse>(
      '/assistant/memory/long-term?pageSize=100'
    );
    if (response.success && response.data) {
      return response.data.items;
    }
    throw new Error(response.error?.message || 'Failed to load long-term memory');
  },

  async updateLongTermMemory(
    memoryId: string,
    body: {
      title?: string;
      summary?: string;
      area?: Area;
      tags?: string[];
    }
  ): Promise<LongTermMemoryEntry> {
    const response = await apiClient.put<LongTermMemoryEntry>(
      `/assistant/memory/long-term/${memoryId}`,
      body
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to update long-term memory');
  },
};
