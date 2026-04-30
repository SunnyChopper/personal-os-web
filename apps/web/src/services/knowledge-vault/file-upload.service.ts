import { apiClient } from '@/lib/api-client';

export interface PresignedUploadPayload {
  uploadUrl: string;
  s3Key: string;
  fileId: string;
}

export interface UploadCompletePayload {
  inboxItemId: string;
  fileId: string;
}

export const vaultFileUploadService = {
  async getPresignedUrl(file: File): Promise<PresignedUploadPayload> {
    const res = await apiClient.post<PresignedUploadPayload>('/knowledge/inbox/upload-url', {
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      fileSizeBytes: file.size,
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to get upload URL');
    }
    return res.data;
  },

  async uploadToS3(presignedUrl: string, file: File): Promise<void> {
    try {
      const put = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
      });
      if (!put.ok) {
        throw new Error(`S3 upload failed: ${put.status} ${put.statusText}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === 'Failed to fetch' || (e instanceof TypeError && msg.includes('fetch'))) {
        throw new Error(
          'Could not upload file to storage (network or S3 CORS). If this is production, ensure the files bucket allows PUT from your site origin (see serverless FilesBucket CorsConfiguration).'
        );
      }
      throw e;
    }
  },

  async completeUpload(fileId: string): Promise<UploadCompletePayload> {
    const res = await apiClient.post<UploadCompletePayload>('/knowledge/inbox/upload-complete', {
      fileId,
    });
    if (!res.success || !res.data) {
      throw new Error(res.error?.message || 'Failed to finalize upload');
    }
    return res.data;
  },

  async uploadFile(file: File): Promise<UploadCompletePayload> {
    const { uploadUrl, fileId } = await this.getPresignedUrl(file);
    await this.uploadToS3(uploadUrl, file);
    return this.completeUpload(fileId);
  },
};
