import { apiClient } from '@/lib/api-client';
import { fetchPlainHealthMarkdown } from '@/lib/public-health-fetch';
import type {
  MarkdownFile,
  FileTreeNode,
  GetFilesResponse,
  GetFileTreeResponse,
  GetFileResponse,
  CreateFileRequest,
  CreateFileResponse,
  UpdateFileRequest,
  UpdateFileResponse,
  DeleteFileResponse,
  SearchFilesResponse,
  GetTagsResponse,
  GetCategoriesResponse,
  PresignedUrlRequest,
  PresignedUrlResponse,
} from '@/types/markdown-files';
import type { ApiResponse, ApiError } from '@/types/api-contracts';
import {
  getLocalFile,
  purgeLocalFile,
  updateLocalFile,
  updateLocalFileMetadata,
} from '@/lib/markdown/local-files-store';
import { logger } from '@/lib/logger';

/**
 * Check if an error indicates backend unavailability
 * Returns true for 404, network errors, connection refused, etc.
 */
export function isBackendUnavailable(error: ApiError | unknown): boolean {
  if (!error) return false;

  // Check if it's an ApiError
  if (typeof error === 'object' && 'code' in error && 'message' in error) {
    const apiError = error as ApiError;
    const code = apiError.code || '';
    const message = apiError.message || '';

    // Check for 404 errors
    if (code === 'HTTP_404' || code === 'NOT_FOUND' || code.includes('404')) {
      return true;
    }

    // Check for network errors
    if (
      code === 'NETWORK_ERROR' ||
      code === 'ERR_NETWORK' ||
      code === 'ERR_CONNECTION_REFUSED' ||
      code === 'ECONNREFUSED' ||
      code === 'ETIMEDOUT' ||
      message.includes('Network Error') ||
      message.includes('Connection refused') ||
      message.includes('timeout') ||
      message.includes('Failed to fetch')
    ) {
      return true;
    }
  }

  // Check error message for common backend unavailability patterns
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('404') ||
      message.includes('not found') ||
      message.includes('network error') ||
      message.includes('connection refused') ||
      message.includes('timeout') ||
      message.includes('failed to fetch')
    );
  }

  return false;
}

/**
 * Service for markdown file operations
 */
export const markdownFilesService = {
  /**
   * Get all files, optionally filtered by folder
   */
  async getFiles(folder?: string): Promise<ApiResponse<MarkdownFile[]>> {
    const queryParams = folder ? `?folder=${encodeURIComponent(folder)}` : '';
    const response = await apiClient.get<GetFilesResponse>(`/markdown-files${queryParams}`);

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.files,
      };
    }

    return {
      success: false,
      error: response.error || {
        message: 'Failed to fetch files',
        code: 'FETCH_ERROR',
      },
    };
  },

  /**
   * Get hierarchical file tree structure
   */
  async getFileTree(): Promise<ApiResponse<FileTreeNode[]>> {
    const response = await apiClient.get<GetFileTreeResponse>('/markdown-files/tree');

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.tree,
      };
    }

    return {
      success: false,
      error: response.error || {
        message: 'Failed to fetch file tree',
        code: 'FETCH_ERROR',
      },
    };
  },

  /**
   * Get single file by path
   * @param filePath - URL-encoded file path (e.g., "docs%2Fguides%2Fgetting-started.md")
   * @deprecated Use getFileContent with fileId instead
   */
  async getFile(filePath: string): Promise<ApiResponse<MarkdownFile>> {
    // Ensure filePath is URL-encoded
    const encodedPath = encodeURIComponent(filePath);
    const response = await apiClient.get<GetFileResponse>(`/markdown-files/${encodedPath}`);

    if (response.success && response.data) {
      const file = response.data.file;

      // If file has downloadUrl but no content, fetch content from S3
      if (file.downloadUrl && !file.content) {
        try {
          // Fetch content from S3 presigned URL
          const contentResponse = await fetch(file.downloadUrl);
          if (!contentResponse.ok) {
            throw new Error(`Failed to fetch content from S3: ${contentResponse.statusText}`);
          }
          const content = await contentResponse.text();

          // Return file with content populated
          return {
            success: true,
            data: {
              ...file,
              content,
            },
          };
        } catch (fetchError) {
          // If fetching from S3 fails, return the file without content but log the error
          logger.error('Failed to fetch file content from downloadUrl', fetchError);
          return {
            success: false,
            error: {
              message: `Failed to fetch file content: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
              code: 'CONTENT_FETCH_ERROR',
            },
          };
        }
      }

      return {
        success: true,
        data: file,
      };
    }

    return {
      success: false,
      error: response.error || {
        message: 'Failed to fetch file',
        code: 'FETCH_ERROR',
      },
    };
  },

  /**
   * Get file by file ID
   * @param fileId - File ID (not path)
   * @returns Response with file metadata
   */
  async getFileById(fileId: string): Promise<ApiResponse<MarkdownFile>> {
    const response = await apiClient.get<GetFileResponse>(`/markdown-files/${fileId}`);

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.file,
      };
    }

    return {
      success: false,
      error: response.error || {
        message: 'Failed to fetch file',
        code: 'FETCH_ERROR',
      },
    };
  },

  /**
   * Get file content by file ID
   * @param fileId - File ID (not path)
   * @returns Response with content: { success: true, data: { content: "..." } }
   */
  async getFileContent(fileId: string): Promise<ApiResponse<{ content: string }>> {
    const response = await apiClient.get<{ content: string }>(`/markdown-files/${fileId}/content`);

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data,
      };
    }

    return {
      success: false,
      error: response.error || {
        message: 'Failed to fetch file content',
        code: 'FETCH_ERROR',
      },
    };
  },

  /**
   * Create a new file
   * Falls back to local storage if backend is unavailable
   */
  async createFile(path: string, content?: string): Promise<ApiResponse<MarkdownFile>> {
    const request: CreateFileRequest = { path, content };
    const response = await apiClient.post<CreateFileResponse>('/markdown-files', request);

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.file,
      };
    }

    // If backend is unavailable, fall back to local storage
    if (response.error && isBackendUnavailable(response.error)) {
      // Save to local storage
      updateLocalFile(path, content || '');

      // Return success with a local file representation
      const localFile: MarkdownFile = {
        id: `local-${path}`,
        path,
        name: path.split('/').pop() || path,
        content: content || '',
        size: new Blob([content || '']).size,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        success: true,
        data: localFile,
      };
    }

    return {
      success: false,
      error: response.error || {
        message: 'Failed to create file',
        code: 'CREATE_ERROR',
      },
    };
  },

  /**
   * Update file content
   * @param filePath - File path (will be URL-encoded)
   * @deprecated Use updateFileById instead
   * Falls back to local storage if backend is unavailable
   */
  async updateFile(filePath: string, content: string): Promise<ApiResponse<MarkdownFile>> {
    const encodedPath = encodeURIComponent(filePath);
    const request: UpdateFileRequest = { content };
    const response = await apiClient.put<UpdateFileResponse>(
      `/markdown-files/${encodedPath}`,
      request
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.file,
      };
    }

    // If backend is unavailable, fall back to local storage
    if (response.error && isBackendUnavailable(response.error)) {
      // Save to local storage
      updateLocalFile(filePath, content);

      // Return success with a local file representation
      const localFile: MarkdownFile = {
        id: `local-${filePath}`,
        path: filePath,
        name: filePath.split('/').pop() || filePath,
        content,
        size: new Blob([content]).size,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        success: true,
        data: localFile,
      };
    }

    return {
      success: false,
      error: response.error || {
        message: 'Failed to update file',
        code: 'UPDATE_ERROR',
      },
    };
  },

  /**
   * Update file content by file ID
   * @param fileId - File ID (not path, to avoid issues with special characters like emojis)
   * @param content - New content for the file
   * @returns Updated file metadata
   *
   * Note: This method does NOT fall back to local storage.
   * It will throw an error if the backend is unavailable.
   */
  async updateFileById(fileId: string, content: string): Promise<ApiResponse<MarkdownFile>> {
    // Validate that fileId is not a URL (common mistake: using downloadUrl instead of id)
    if (fileId.startsWith('http://') || fileId.startsWith('https://')) {
      logger.error('Attempted to update file using a URL instead of a file ID', { fileId });
      return {
        success: false,
        error: {
          message:
            'Invalid file ID: cannot use URL as file identifier. Please use the file ID from metadata.',
          code: 'INVALID_FILE_ID',
        },
      };
    }

    if (import.meta.env.DEV) {
      logger.debug('Updating file by ID', { fileId });
    }
    const request: UpdateFileRequest = { content };
    const response = await apiClient.put<UpdateFileResponse>(`/markdown-files/${fileId}`, request);

    if (response.success && response.data) {
      if (import.meta.env.DEV) {
        logger.debug('File updated successfully', { fileId });
      }
      return {
        success: true,
        data: response.data.file,
      };
    }

    logger.error('Failed to update file', { fileId, error: response.error });
    return {
      success: false,
      error: response.error || {
        message: 'Failed to update file',
        code: 'UPDATE_ERROR',
      },
    };
  },

  /**
   * Update file metadata (tags and category)
   * @param filePath - File path (will be URL-encoded)
   * @param tags - Array of tags
   * @param category - Category string
   * @deprecated Use updateFileMetadataById instead
   * Falls back to local storage if backend is unavailable
   */
  async updateFileMetadata(
    filePath: string,
    tags: string[],
    category: string
  ): Promise<ApiResponse<MarkdownFile>> {
    const encodedPath = encodeURIComponent(filePath);
    const request: UpdateFileRequest = { tags, category };
    const response = await apiClient.put<UpdateFileResponse>(
      `/markdown-files/${encodedPath}`,
      request
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.file,
      };
    }

    // If backend is unavailable, fall back to local storage
    if (response.error && isBackendUnavailable(response.error)) {
      // Get existing file content from local storage or use empty string
      const existingFile = getLocalFile(filePath);
      const content = existingFile?.content || '';

      // Update metadata in local storage
      updateLocalFileMetadata(filePath, tags, category);

      // If content wasn't in local storage, save it now
      if (!existingFile) {
        updateLocalFile(filePath, content);
      }

      // Return success with a local file representation
      const localFile: MarkdownFile = {
        id: `local-${filePath}`,
        path: filePath,
        name: filePath.split('/').pop() || filePath,
        content,
        size: new Blob([content]).size,
        tags,
        category: category.trim() || undefined,
        createdAt: existingFile?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        success: true,
        data: localFile,
      };
    }

    return {
      success: false,
      error: response.error || {
        message: 'Failed to update file metadata',
        code: 'UPDATE_ERROR',
      },
    };
  },

  /**
   * Update file metadata by file ID
   * @param fileId - File ID (not path, to avoid issues with special characters like emojis)
   * @param tags - Array of tags
   * @param category - Category string
   * @returns Updated file metadata
   *
   * Note: This method does NOT fall back to local storage.
   * It will throw an error if the backend is unavailable.
   */
  async updateFileMetadataById(
    fileId: string,
    tags: string[],
    category: string
  ): Promise<ApiResponse<MarkdownFile>> {
    const request: UpdateFileRequest = { tags, category };
    const response = await apiClient.put<UpdateFileResponse>(`/markdown-files/${fileId}`, request);

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.file,
      };
    }

    return {
      success: false,
      error: response.error || {
        message: 'Failed to update file metadata',
        code: 'UPDATE_ERROR',
      },
    };
  },

  /**
   * Delete a file
   * @param filePath - File path (for localStorage purging)
   * @param fileId - File ID (for backend deletion - preferred over path)
   * Always attempts to delete from backend, and also purges from localStorage aggressively
   */
  async deleteFile(filePath: string, fileId?: string): Promise<ApiResponse<void>> {
    logger.debug('deleteFile called', { filePath, fileId });

    // Always purge from localStorage first - this is aggressive and will remove the file
    // regardless of exact path matching. This ensures complete local deletion.
    logger.debug('Purging markdown file from local storage', { filePath });
    purgeLocalFile(filePath);

    // Try to delete from backend using file ID if available, otherwise fall back to path
    // Backend expects file ID, not path
    const deleteIdentifier = fileId || filePath;
    logger.debug('Making delete request for markdown file', {
      filePath,
      deleteIdentifier,
      usedFileId: Boolean(fileId),
    });
    const response = await apiClient.delete<DeleteFileResponse>(
      `/markdown-files/${deleteIdentifier}`
    );

    if (response.success) {
      logger.debug('Delete request successful for markdown file', { filePath });
      return {
        success: true,
      };
    }

    // If backend deletion failed, we've still purged from localStorage
    // Return success since local deletion is the critical part for local files
    // For regular files, the backend error is more important
    if (isBackendUnavailable(response.error)) {
      if (import.meta.env.DEV) {
        logger.debug('Backend unavailable, but local markdown file was purged', { filePath });
      }
      return {
        success: true,
      };
    }

    logger.error('Delete request failed for markdown file', { filePath, error: response.error });
    return {
      success: false,
      error: response.error || {
        message: 'Failed to delete file',
        code: 'DELETE_ERROR',
      },
    };
  },

  /**
   * Upload files using pre-signed URLs
   * Flow: 1) Get pre-signed URL for each file, 2) Upload to S3 using POST with FormData, 3) Fetch file metadata
   *
   * @param files - Array of File objects to upload
   * @param options - Optional upload options (folderPath, tags, category)
   */
  async uploadFiles(
    files: File[],
    options?: {
      folderPath?: string;
      tags?: string[];
      category?: string;
    }
  ): Promise<ApiResponse<MarkdownFile[]>> {
    try {
      // Validate files before upload
      for (const file of files) {
        if (!file.name.endsWith('.md')) {
          return {
            success: false,
            error: {
              message: `File "${file.name}" must have .md extension`,
              code: 'VALIDATION_ERROR',
            },
          };
        }

        // Check file size (10 MB limit)
        const maxSize = 10 * 1024 * 1024; // 10 MB
        if (file.size > maxSize) {
          return {
            success: false,
            error: {
              message: `File "${file.name}" size (${(file.size / 1024 / 1024).toFixed(2)} MB) exceeds maximum allowed size (10 MB)`,
              code: 'VALIDATION_ERROR',
            },
          };
        }
      }

      // Step 1: Request pre-signed URL for each file and upload to S3
      const uploadPromises = files.map(async (file): Promise<MarkdownFile> => {
        // Request pre-signed URL for this file
        const presignedRequest: PresignedUrlRequest = {
          fileName: file.name,
          folderPath: options?.folderPath,
          tags: options?.tags,
          category: options?.category,
        };

        const presignedResponse = await apiClient.post<PresignedUrlResponse>(
          '/markdown-files/upload-url',
          presignedRequest
        );

        if (!presignedResponse.success || !presignedResponse.data) {
          throw new Error(presignedResponse.error?.message || 'Failed to get pre-signed URL');
        }

        const { uploadUrl, fields, fileId } = presignedResponse.data;

        // Step 2: Upload file to S3 using presigned POST with FormData
        const formData = new FormData();

        // Add all fields from the presigned URL response (must be in order)
        Object.entries(fields).forEach(([key, value]) => {
          formData.append(key, value);
        });

        // Add the file last (must be the last field)
        formData.append('file', file);

        let uploadSucceeded = false;
        let uploadError: Error | null = null;

        try {
          const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
          });

          // S3 returns 204 (No Content) for successful POST uploads, which is a valid success status
          // Check for both ok status (200-299) and specifically 204
          if (uploadResponse.ok || uploadResponse.status === 204) {
            uploadSucceeded = true;
          } else {
            uploadError = new Error(
              `Failed to upload ${file.name} to S3: ${uploadResponse.status} ${uploadResponse.statusText}`
            );
          }
        } catch (fetchError) {
          // Handle CORS errors and network errors
          // For S3 presigned POST uploads, CORS errors on the response are common
          // but the upload itself may have succeeded. We'll proceed with metadata fetch
          // and if that succeeds, we know the upload worked.
          const errorMessage =
            fetchError instanceof Error ? fetchError.message : String(fetchError);
          const isCorsError =
            errorMessage.includes('Failed to fetch') ||
            errorMessage.includes('NetworkError') ||
            errorMessage.includes('CORS') ||
            (fetchError instanceof TypeError && errorMessage.includes('fetch'));

          if (isCorsError) {
            // CORS error on response - upload may have succeeded, proceed with metadata fetch
            logger.warn('CORS error on S3 upload response; proceeding with metadata fetch', {
              fileName: file.name,
            });
            uploadSucceeded = true; // Assume success, will verify via metadata fetch
          } else {
            // Actual network/upload error
            uploadError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
          }
        }

        // If upload clearly failed (not a CORS issue), throw error
        if (!uploadSucceeded && uploadError) {
          throw uploadError;
        }

        // Step 3: Fetch file metadata to verify upload and return file object
        // Use getFileById to ensure we're using the file ID, not the file path
        // Add retry logic since backend may need a moment to process the upload
        let fileResponse = await this.getFileById(fileId);
        let retries = 3;
        let retryDelay = 500; // Start with 500ms delay

        while (!fileResponse.success && retries > 0) {
          if (import.meta.env.DEV) {
            logger.debug('Metadata fetch failed after upload, retrying', {
              fileName: file.name,
              retriesRemaining: retries,
            });
          }
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          fileResponse = await this.getFileById(fileId);
          retries--;
          retryDelay *= 2; // Exponential backoff
        }

        if (!fileResponse.success || !fileResponse.data) {
          // If metadata fetch fails but S3 upload succeeded (or we assumed it did due to CORS),
          // create a partial file object. This ensures the upload is considered successful
          // even if metadata isn't immediately available or if we couldn't verify the upload
          // due to CORS issues.
          logger.warn(
            'S3 upload completed, but metadata fetch failed after retries; creating partial file object',
            { fileName: file.name }
          );

          // Return a partial file object with the information we have
          // The file list will refresh and get the full metadata later
          return {
            id: fileId,
            path: options?.folderPath ? `${options.folderPath}/${file.name}` : file.name,
            name: file.name,
            content: '', // Content will be fetched when file is opened
            size: file.size, // Use the actual file size from the File object
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tags: options?.tags,
            category: options?.category,
          };
        }

        // Ensure we use the actual file size if backend returns 0 or incorrect size
        // This fixes the issue where uploaded files show "0 B" in the tree view
        const fileData = fileResponse.data;
        if (!fileData.size || fileData.size === 0) {
          fileData.size = file.size;
        }

        return fileData;
      });

      // Wait for all uploads to complete
      const uploadedFiles = await Promise.all(uploadPromises);

      return {
        success: true,
        data: uploadedFiles,
      };
    } catch (error) {
      // This catch block handles actual upload failures (network errors, S3 errors, etc.)
      // Metadata fetch failures are handled within the individual upload promise
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload files';

      logger.error('Upload failed', { errorMessage });

      return {
        success: false,
        error: {
          message: errorMessage,
          code: 'UPLOAD_ERROR',
        },
      };
    }
  },

  /**
   * Search files
   * @param query - Search query
   * @param type - Search type: 'text' or 'embedding'
   */
  async searchFiles(
    query: string,
    type: 'text' | 'embedding' = 'text'
  ): Promise<ApiResponse<SearchFilesResponse['results']>> {
    const queryParams = new URLSearchParams({
      q: query,
      type,
    });
    const response = await apiClient.get<SearchFilesResponse>(
      `/markdown-files/search?${queryParams.toString()}`
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.results,
      };
    }

    return {
      success: false,
      error: response.error || {
        message: 'Failed to search files',
        code: 'SEARCH_ERROR',
      },
    };
  },

  /**
   * Get all tags
   */
  async getTags(): Promise<ApiResponse<string[]>> {
    const response = await apiClient.get<GetTagsResponse>('/markdown-files/tags');

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.tags,
      };
    }

    return {
      success: false,
      error: response.error || {
        message: 'Failed to fetch tags',
        code: 'FETCH_ERROR',
      },
    };
  },

  /**
   * Get all categories
   */
  async getCategories(): Promise<ApiResponse<string[]>> {
    const response = await apiClient.get<GetCategoriesResponse>('/markdown-files/categories');

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.categories,
      };
    }

    return {
      success: false,
      error: response.error || {
        message: 'Failed to fetch categories',
        code: 'FETCH_ERROR',
      },
    };
  },

  /**
   * Check markdown backend health
   */
  async checkHealth(): Promise<ApiResponse<{ status: string }>> {
    return fetchPlainHealthMarkdown() as Promise<ApiResponse<{ status: string }>>;
  },
};
