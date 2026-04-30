import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useMarkdownFiles } from '@/hooks/useMarkdownFiles';
import { getLocalFile, deleteLocalFile, isLocalOnlyFile } from '@/hooks/useLocalFiles';
import { navigateToMarkdownFile } from '@/lib/markdown/navigation-utils';
import { invalidateAfterFileOperation } from '@/lib/markdown/query-invalidation';

/**
 * Hook for renaming files
 */
export function useFileRename() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { createFile, deleteFile } = useMarkdownFiles();

  const renameFile = async (
    filePath: string,
    newPath: string,
    currentContent?: string
  ): Promise<void> => {
    // Get content from parameter or local file
    let content = currentContent;
    if (!content) {
      if (isLocalOnlyFile(filePath)) {
        content = getLocalFile(filePath)?.content || '';
      } else {
        // For regular files, content should be passed in
        throw new Error('Content is required for renaming regular files');
      }
    }

    if (isLocalOnlyFile(filePath)) {
      await createFile({ path: newPath, content });
      deleteLocalFile(filePath);
    } else {
      await createFile({ path: newPath, content });
      await deleteFile(filePath);
    }

    // Invalidate queries for both old and new paths
    invalidateAfterFileOperation(queryClient, filePath);
    invalidateAfterFileOperation(queryClient, newPath);

    // Navigate to new file
    navigateToMarkdownFile(navigate, newPath);
  };

  return { renameFile };
}
