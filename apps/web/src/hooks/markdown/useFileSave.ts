import { useQueryClient } from '@tanstack/react-query';
import { useMarkdownFiles } from '@/hooks/useMarkdownFiles';
import { useFileTree } from '@/hooks/useFileTree';
import {
  getLocalFile,
  updateLocalFile,
  deleteLocalFile,
  isLocalOnlyFile,
} from '@/hooks/useLocalFiles';
import { isBackendUnavailable, markdownFilesService } from '@/services/markdown-files.service';
import { isLocalFileResult } from '@/lib/markdown/file-utils';
import { invalidateAfterFileOperation } from '@/lib/markdown/query-invalidation';
import { logger } from '@/lib/logger';

export interface SaveFileResult {
  success: boolean;
  local: boolean;
}

/**
 * Hook for saving files with local fallback
 */
export function useFileSave() {
  const queryClient = useQueryClient();
  const { createFile } = useMarkdownFiles();
  const { findNodeByPath } = useFileTree();

  const saveFile = async (
    filePath: string,
    content: string,
    isLocalOnly: boolean
  ): Promise<SaveFileResult> => {
    if (isLocalOnlyFile(filePath) || isLocalOnly) {
      return await saveLocalOnlyFile(filePath, content);
    } else {
      return await saveRegularFile(filePath, content);
    }
  };

  const saveLocalOnlyFile = async (filePath: string, content: string): Promise<SaveFileResult> => {
    // Update localStorage first
    updateLocalFile(filePath, content);
    const localFile = getLocalFile(filePath);

    try {
      const result = await createFile({ path: filePath, content });

      if (!result.success && isBackendUnavailable(result.error)) {
        return { success: true, local: true };
      }

      if (isLocalFileResult(result.data)) {
        return { success: true, local: true };
      }

      // Backend save succeeded
      deleteLocalFile(filePath);

      // Save metadata if present
      if (localFile?.tags || localFile?.category) {
        try {
          // Get the file ID from the result
          const fileId = result.data?.id;
          if (fileId && !fileId.startsWith('local-')) {
            await markdownFilesService.updateFileMetadataById(
              fileId,
              localFile.tags || [],
              localFile.category || ''
            );
          } else {
            logger.warn('Failed to save metadata: invalid file ID after creation');
          }
        } catch (error) {
          logger.warn('Failed to save metadata', error);
        }
      }

      invalidateAfterFileOperation(queryClient, filePath, true);
      return { success: true, local: false };
    } catch (error) {
      if (isBackendUnavailable(error)) {
        return { success: true, local: true };
      }
      throw error;
    }
  };

  const saveRegularFile = async (filePath: string, content: string): Promise<SaveFileResult> => {
    // Get the file ID from the tree
    const fileNode = findNodeByPath(filePath);
    const fileId = fileNode?.metadata?.id;

    logger.debug('saveRegularFile called', {
      filePath,
      fileId,
      hasFileNode: !!fileNode,
    });

    // Validate file ID
    if (!fileId) {
      throw new Error(
        'Cannot save file: File ID not found. The file may not exist on the backend.'
      );
    }

    if (fileId.startsWith('local-')) {
      throw new Error('Cannot save file: File is local-only. Please sync to backend first.');
    }

    // Check if fileId looks like a path (shouldn't happen after our fixes, but be safe)
    if (fileId.endsWith('.md') || fileId.includes('/')) {
      throw new Error(
        `Cannot save file: File ID appears to be a path (${fileId}), not a UUID. Please refresh and try again.`
      );
    }

    // Use the ID-based update method
    const result = await markdownFilesService.updateFileById(fileId, content);

    if (result && result.success) {
      if (isLocalFileResult(result.data)) {
        return { success: true, local: true };
      }

      // Backend save succeeded - clean up local file if exists
      const localFile = getLocalFile(filePath);
      if (localFile && !localFile.syncedToBackend) {
        deleteLocalFile(filePath);
      }

      invalidateAfterFileOperation(queryClient, filePath);
      return { success: true, local: false };
    }

    // Handle error case
    const error = result && 'error' in result ? result.error : null;
    if (isBackendUnavailable(error)) {
      return { success: true, local: true };
    }

    throw new Error(
      error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : 'Failed to save file'
    );
  };

  return { saveFile };
}
