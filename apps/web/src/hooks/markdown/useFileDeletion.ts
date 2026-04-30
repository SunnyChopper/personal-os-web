import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { purgeLocalFile } from '@/hooks/useLocalFiles';
import { useMarkdownFiles } from '@/hooks/useMarkdownFiles';
import { useFileTree } from '@/hooks/useFileTree';
import { invalidateAfterFileOperation } from '@/lib/markdown/query-invalidation';
import { logger } from '@/lib/logger';
import { ROUTES } from '@/routes';

export interface DeleteFileOptions {
  navigateAfter?: boolean;
  navigateTo?: string;
}

/**
 * Hook for file deletion with cleanup
 */
export function useFileDeletion() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { deleteFile } = useMarkdownFiles();
  const { findNodeByPath } = useFileTree();

  const deleteFileWithCleanup = async (
    filePath: string,
    options?: DeleteFileOptions
  ): Promise<void> => {
    // Get file ID from tree
    const fileNode = findNodeByPath(filePath);
    const fileId = fileNode?.metadata?.id;

    // Step 1: Purge from localStorage
    purgeLocalFile(filePath);

    // Step 2: Delete from backend if ID exists
    if (fileId) {
      try {
        await deleteFile(filePath, fileId);
      } catch (error) {
        logger.warn('Backend deletion failed', error);
        // Continue even if backend deletion fails
      }
    }

    // Step 3: Invalidate queries
    invalidateAfterFileOperation(queryClient, filePath);

    // Step 4: Navigate if requested
    if (options?.navigateAfter) {
      navigate(options.navigateTo || ROUTES.admin.markdownViewer);
    }
  };

  return { deleteFileWithCleanup };
}
