import { useQueryClient } from '@tanstack/react-query';
import { updateLocalFileMetadata, isLocalOnlyFile } from '@/hooks/useLocalFiles';
import { markdownFilesService } from '@/services/markdown-files.service';
import { invalidateAfterFileOperation } from '@/lib/markdown/query-invalidation';
import { queryKeys } from '@/lib/react-query/query-keys';
import type { FileTreeNode, MarkdownFile } from '@/types/markdown-files';

function findNodeByPath(path: string, nodes?: FileTreeNode[]): FileTreeNode | null {
  if (!nodes) return null;
  for (const n of nodes) {
    if (n.path === path) return n;
    if (n.children) {
      const found = findNodeByPath(path, n.children);
      if (found) return found;
    }
  }
  return null;
}

function isUsableBackendFileId(id: string | undefined): boolean {
  if (!id) return false;
  if (id.startsWith('local-')) return false;
  if (id.includes('/') || id.endsWith('.md')) return false;
  if (id.startsWith('http://') || id.startsWith('https://')) return false;
  return true;
}

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
      return;
    }

    const readTree = () =>
      queryClient.getQueryData<{ success: boolean; data?: FileTreeNode[] }>(
        queryKeys.markdownFiles.tree()
      );

    let treeData = readTree();
    let node = findNodeByPath(filePath, treeData?.data);
    let fileId = node?.metadata?.id;

    if (!isUsableBackendFileId(fileId)) {
      await queryClient.refetchQueries({ queryKey: queryKeys.markdownFiles.tree() });
      treeData = readTree();
      node = findNodeByPath(filePath, treeData?.data);
      fileId = node?.metadata?.id;
    }

    if (!isUsableBackendFileId(fileId)) {
      throw new Error(
        'Could not resolve file ID for metadata update. Refresh the file list or re-open the file, then try again.'
      );
    }

    const resolvedId = fileId as string;

    const result = await markdownFilesService.updateFileMetadataById(resolvedId, tags, category);
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to update metadata');
    }

    const detailKey = queryKeys.markdownFiles.detail(filePath);
    const prev = queryClient.getQueryData<{ success: boolean; data?: MarkdownFile }>(detailKey);
    if (prev?.success && prev.data) {
      queryClient.setQueryData(detailKey, {
        success: true,
        data: {
          ...prev.data,
          tags,
          category: category.trim() || undefined,
        },
      });
    }

    invalidateAfterFileOperation(queryClient, filePath, true);
  };

  return { updateMetadata };
}
