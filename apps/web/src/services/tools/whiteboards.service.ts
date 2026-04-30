import { apiClient } from '@/lib/api-client';
import type {
  SaveWhiteboardPayload,
  WhiteboardDetailResponse,
  WhiteboardListResponse,
  WhiteboardSummary,
} from '@/types/api/tools';

export const whiteboardsService = {
  async list(): Promise<WhiteboardListResponse> {
    const response = await apiClient.get<WhiteboardListResponse>('/tools/whiteboards');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to list whiteboards');
  },

  async get(boardId: string): Promise<WhiteboardDetailResponse> {
    const response = await apiClient.get<WhiteboardDetailResponse>(`/tools/whiteboards/${boardId}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to load whiteboard');
  },

  async save(payload: SaveWhiteboardPayload): Promise<WhiteboardSummary> {
    const response = await apiClient.post<WhiteboardSummary>('/tools/whiteboards', payload);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to save whiteboard');
  },

  async delete(boardId: string): Promise<void> {
    const response = await apiClient.delete(`/tools/whiteboards/${boardId}`);
    if (response.success) {
      return;
    }
    throw new Error(response.error?.message || 'Failed to delete whiteboard');
  },
};
