import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/knowledge-vault';

export type InboxTriageStatus = 'pending' | 'triaged' | 'filed' | 'dismissed';

export type InboxIngestionStatus =
  | 'queued'
  | 'running'
  | 'complete'
  | 'failed'
  | 'needsManualUpload';

export interface InboxManualUploadHint {
  uploadUrlPath: string;
  uploadCompletePath: string;
  fileIdField: string;
  hint: string;
}

export interface InboxIngestionJob {
  jobId: string;
  inboxItemId: string;
  status: InboxIngestionStatus;
  stage?: string | null;
  message?: string | null;
  noteId?: string | null;
  sourceDocumentId?: string | null;
  graphEdgesCreated?: number;
  manualUpload?: InboxManualUploadHint | null;
  errorCode?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InboxItem {
  id: string;
  rawContent: string;
  sourceType: string;
  sourceUrl?: string | null;
  aiSuggestedTitle?: string | null;
  aiSuggestedType?: string | null;
  aiSuggestedTags: string[];
  aiSuggestedArea?: string | null;
  aiTriageStatus: string;
  ingestionJobId?: string | null;
  ingestionStatus?: InboxIngestionStatus | null;
  ingestionError?: string | null;
  extractedPreview?: string | null;
  contentType?: string | null;
  sourceDocumentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InboxListPayload {
  items: InboxItem[];
}

export interface FileInboxInput {
  targetType: 'note' | 'flashcard' | 'course' | 'document';
  title?: string;
  tags?: string[];
  area?: string;
  fallbackFileId?: string;
  createGraphEdges?: boolean;
  ingest?: boolean;
}

export interface FileInboxResult {
  filedAs?: string;
  entity?: Record<string, unknown>;
  ingestionJob?: InboxIngestionJob;
}

export const inboxService = {
  async list(status?: InboxTriageStatus): Promise<ApiResponse<InboxListPayload>> {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await apiClient.get<InboxListPayload>(`/knowledge/inbox${q}`);
    if (res.success && res.data) {
      return { success: true, data: res.data, error: null };
    }
    return {
      success: false,
      data: null,
      error: res.error?.message || 'Failed to load inbox',
    };
  },

  async create(rawContent: string, sourceType: 'text' | 'url' | 'dictation', sourceUrl?: string) {
    const res = await apiClient.post<InboxItem>('/knowledge/inbox', {
      rawContent,
      sourceType,
      sourceUrl,
    });
    if (res.success && res.data) {
      return { success: true as const, data: res.data };
    }
    return {
      success: false as const,
      error: res.error?.message || 'Failed to capture',
    };
  },

  async triageAll() {
    const res = await apiClient.post<{ triagedCount: number }>('/knowledge/inbox/triage', {});
    if (res.success && res.data) {
      return { success: true as const, data: res.data };
    }
    return { success: false as const, error: res.error?.message || 'Triage failed' };
  },

  async file(itemId: string, body: FileInboxInput) {
    const res = await apiClient.post<FileInboxResult>(`/knowledge/inbox/${itemId}/file`, {
      targetType: body.targetType,
      title: body.title,
      tags: body.tags,
      area: body.area,
      fallbackFileId: body.fallbackFileId,
      createGraphEdges: body.createGraphEdges ?? true,
      ingest: body.ingest ?? true,
    });
    if (res.success && res.data) {
      return { success: true as const, data: res.data };
    }
    return { success: false as const, error: res.error?.message || 'File failed' };
  },

  async getIngestionJob(jobId: string) {
    const res = await apiClient.get<InboxIngestionJob>(`/knowledge/inbox/ingestions/${jobId}`);
    if (res.success && res.data) {
      return { success: true as const, data: res.data };
    }
    return {
      success: false as const,
      error: res.error?.message || 'Failed to load ingestion job',
    };
  },

  async remove(itemId: string) {
    const res = await apiClient.delete(`/knowledge/inbox/${itemId}`);
    if (res.success) {
      return { success: true as const };
    }
    return { success: false as const, error: res.error?.message || 'Delete failed' };
  },
};
