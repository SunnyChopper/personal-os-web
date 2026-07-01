import { apiClient } from '@/lib/api-client';
import type {
  VaultDocumentChunksList,
  VaultDocumentDetail,
  VaultDocumentReingestInput,
  VaultDocumentReingestResult,
} from '@/types/knowledge-vault';

export const documentService = {
  async getDetail(documentId: string): Promise<VaultDocumentDetail> {
    const res = await apiClient.get<VaultDocumentDetail>(
      `/knowledge/documents/${encodeURIComponent(documentId)}`
    );
    if (!res.success || !res.data) {
      throw new Error(
        typeof res.error === 'object' && res.error && 'message' in res.error
          ? String((res.error as { message?: string }).message)
          : 'Failed to load document'
      );
    }
    return res.data;
  },

  async getChunks(documentId: string): Promise<VaultDocumentChunksList> {
    const res = await apiClient.get<VaultDocumentChunksList>(
      `/knowledge/documents/${encodeURIComponent(documentId)}/chunks`
    );
    if (!res.success || !res.data) {
      throw new Error(
        typeof res.error === 'object' && res.error && 'message' in res.error
          ? String((res.error as { message?: string }).message)
          : 'Failed to load document chunks'
      );
    }
    return res.data;
  },

  async reingest(
    documentId: string,
    body: VaultDocumentReingestInput
  ): Promise<VaultDocumentReingestResult> {
    const res = await apiClient.post<VaultDocumentReingestResult>(
      `/knowledge/documents/${encodeURIComponent(documentId)}/reingest`,
      body
    );
    if (!res.success || !res.data) {
      throw new Error(
        typeof res.error === 'object' && res.error && 'message' in res.error
          ? String((res.error as { message?: string }).message)
          : 'Failed to re-ingest document'
      );
    }
    return res.data;
  },
};
