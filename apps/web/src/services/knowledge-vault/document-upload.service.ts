import { apiClient } from '@/lib/api-client';
import type { Document } from '@/types/knowledge-vault';

export interface PresignedDocumentUploadPayload {
  uploadUrl: string;
  s3Key: string;
  fileId: string;
}

export interface CreateDocumentFromFileBody {
  fileId: string;
  title: string;
  area: string;
  tags?: string[];
  content?: string;
  fileType?: string;
}

export const documentUploadService = {
  async getPresignedUrl(file: File): Promise<PresignedDocumentUploadPayload> {
    const res = await apiClient.post<PresignedDocumentUploadPayload>(
      '/knowledge/documents/upload-url',
      {
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSizeBytes: file.size,
      }
    );
    if (!res.success || !res.data) {
      throw new Error(
        typeof res.error === 'object' && res.error && 'message' in res.error
          ? String((res.error as { message?: string }).message)
          : 'Failed to get upload URL'
      );
    }
    return res.data;
  },

  /**
   * PUT file to S3 with upload progress (0–100).
   */
  uploadToS3WithProgress(
    presignedUrl: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', presignedUrl);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable && onProgress) {
          const pct = Math.round((evt.loaded / evt.total) * 100);
          onProgress(pct);
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`S3 upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      };
      xhr.onerror = () => reject(new Error('S3 upload network error'));
      xhr.send(file);
    });
  },

  async createDocumentFromFile(body: CreateDocumentFromFileBody): Promise<Document> {
    const res = await apiClient.post<Document>('/knowledge/documents/from-file', body);
    if (!res.success || !res.data) {
      throw new Error(
        typeof res.error === 'object' && res.error && 'message' in res.error
          ? String((res.error as { message?: string }).message)
          : 'Failed to create document from file'
      );
    }
    return res.data;
  },
};
