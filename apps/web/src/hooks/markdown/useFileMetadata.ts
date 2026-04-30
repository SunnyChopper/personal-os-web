import { useQueryClient } from '@tanstack/react-query';
import { updateLocalFileMetadata, isLocalOnlyFile } from '@/hooks/useLocalFiles';
import { markdownFilesService } from '@/services/markdown-files.service';
import { invalidateAfterFileOperation } from '@/lib/markdown/query-invalidation';

/**
 * Hook for updating file metadata (tags and category)
 */
export function useFileMetadata() {
  const queryClient = useQueryClient();

  const updateMetadata = async (
    filePath: string,
    tags: string[],
    category: string
  ): Promise<void> => {
    if (isLocalOnlyFile(filePath)) {
      updateLocalFileMetadata(filePath, tags, category);
      invalidateAfterFileOperation(queryClient, filePath);
    } else {
      const result = await markdownFilesService.updateFileMetadata(filePath, tags, category);
      if (result.success) {
        invalidateAfterFileOperation(queryClient, filePath, true);
      } else {
        throw new Error(result.error?.message || 'Failed to update metadata');
      }
    }
  };

  return { updateMetadata };
}
