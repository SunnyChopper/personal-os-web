import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { markdownFilesService, isBackendUnavailable } from '@/services/markdown-files.service';
import { useBackendStatus } from '@/contexts/BackendStatusContext';
import { queryKeys } from '@/lib/react-query/query-keys';
import { extractApiError } from '@/lib/react-query/error-utils';
import { updateLocalFile, purgeLocalFile } from '@/hooks/useLocalFiles';
import { useMarkdownBackendStatus } from '@/hooks/useMarkdownBackendStatus';
import { buildUpdateFile } from '@/lib/markdown/file-utils';
import { logger } from '@/lib/logger';
import { removeMarkdownFileCache, upsertMarkdownFileCache } from '@/lib/react-query/markdown-cache';
import type { FileTreeNode } from '@/types/markdown-files';

/**
 * Hook to fetch list of markdown files
 * @param folder - Optional folder path to filter files
 */
export function useMarkdownFiles(folder?: string) {
  const queryClient = useQueryClient();
  const { recordError, recordSuccess } = useBackendStatus();
  const { isOnline: isBackendOnline } = useMarkdownBackendStatus();

  const { data, isLoading, error, isError } = useQuery({
    queryKey: queryKeys.markdownFiles.list(folder),
    queryFn: async () => {
      try {
        const result = await markdownFilesService.getFiles(folder);
        if (result.success && result.data) {
          recordSuccess();
        }
        return result;
      } catch (err: unknown) {
        const apiError = extractApiError(err);
        if (apiError) {
          recordError(apiError);
        }
        throw err;
      }
    },
    enabled: true,
  });

  const createMutation = useMutation({
    mutationFn: async ({ path, content }: { path: string; content?: string }) => {
      // Check if backend is offline before attempting creation
      if (!isBackendOnline) {
        // Backend is offline - save to local storage
        updateLocalFile(path, content || '');
        return {
          success: true as const,
          data: buildUpdateFile(path, content || ''),
        };
      }

      // Backend is online - attempt to create file
      const result = await markdownFilesService.createFile(path, content);

      if (!result.success) {
        // Check if backend is unavailable (not just a regular error)
        if (isBackendUnavailable(result.error)) {
          // Backend unavailable - fallback to local storage
          updateLocalFile(path, content || '');
          return {
            success: true as const,
            data: buildUpdateFile(path, content || ''),
          };
        }

        // Backend is connected but creation failed - throw the error
        throw new Error(result.error?.message || 'Failed to create file');
      }

      // Backend save succeeded - don't save to localStorage
      return result;
    },
    onSuccess: (result) => {
      if (result.success && result.data) {
        upsertMarkdownFileCache(queryClient, result.data);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ filePath, content }: { filePath: string; content: string }) => {
      // Check if backend is offline before attempting update
      if (!isBackendOnline) {
        // Backend is offline - save to local storage
        updateLocalFile(filePath, content);
        return {
          success: true as const,
          data: buildUpdateFile(filePath, content),
        };
      }

      // Backend is online - attempt to update file
      // Note: This uses the deprecated path-based method as this hook doesn't have file tree context
      // For proper ID-based updates, use useMarkdownFile hook instead
      const result = await markdownFilesService.updateFile(filePath, content);

      if (!result.success) {
        // Check if backend is unavailable (not just a regular error)
        if (isBackendUnavailable(result.error)) {
          // Backend unavailable - fallback to local storage
          updateLocalFile(filePath, content);
          return {
            success: true as const,
            data: buildUpdateFile(filePath, content),
          };
        }

        // Backend is connected but update failed - throw the error
        throw new Error(result.error?.message || 'Failed to update file');
      }

      // Backend save succeeded - don't save to localStorage
      return result;
    },
    onSuccess: (result) => {
      if (result.success && result.data) {
        upsertMarkdownFileCache(queryClient, result.data);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ filePath, fileId }: { filePath: string; fileId?: string }) => {
      if (import.meta.env.DEV) {
        logger.debug('deleteMutation started', { filePath, fileId });
      }

      // Always purge from localStorage first - this is aggressive and will remove the file
      // regardless of exact path matching. This ensures complete local deletion.
      logger.debug('Purging markdown file from local storage', { filePath });
      purgeLocalFile(filePath);

      // Try to delete from backend (service also purges localStorage, but we do it here too for safety)
      // Pass fileId if available so backend can use it instead of path
      logger.debug('Calling markdownFilesService.deleteFile', { filePath, fileId });
      const result = await markdownFilesService.deleteFile(filePath, fileId);

      logger.debug('markdownFilesService.deleteFile returned', result);

      // Even if backend deletion failed, localStorage has been purged
      // Return success for local files since local deletion is what matters
      return result;
    },
    onSuccess: (_result, variables) => {
      logger.debug('deleteMutation succeeded, updating caches', variables);
      removeMarkdownFileCache(queryClient, variables.filePath);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => markdownFilesService.uploadFiles(files),
    onSuccess: (result) => {
      // Optimistically update the file tree cache with uploaded files
      // This ensures the correct file sizes are shown immediately, even if backend
      // hasn't fully processed the files yet
      if (result.success && result.data && result.data.length > 0) {
        // Store the correct file sizes from uploaded files in sessionStorage
        // This persists across query invalidations and refetches
        const uploadedFileSizes: Record<string, number> = {};
        result.data.forEach((file) => {
          if (file.size && file.size > 0) {
            uploadedFileSizes[file.path] = file.size;
          }
        });

        // Store in sessionStorage so it persists across refetches
        const existingSizes = JSON.parse(sessionStorage.getItem('uploadedFileSizes') || '{}');
        const mergedSizes = { ...existingSizes, ...uploadedFileSizes };
        sessionStorage.setItem('uploadedFileSizes', JSON.stringify(mergedSizes));

        const treeQueryData = queryClient.getQueryData<{
          success: boolean;
          data?: FileTreeNode[];
        }>(queryKeys.markdownFiles.tree());

        if (treeQueryData?.data) {
          // Helper to recursively find and update files in nested tree structure
          const updateFileInTree = (nodes: FileTreeNode[]): FileTreeNode[] => {
            return nodes.map((node) => {
              if (node.type === 'file') {
                const uploadedFile = result.data?.find((f) => f.path === node.path);
                if (uploadedFile) {
                  // Update existing file with new metadata (including correct size)
                  return {
                    ...node,
                    metadata: uploadedFile,
                  };
                }
              } else if (node.type === 'folder' && node.children) {
                // Recursively update children
                return {
                  ...node,
                  children: updateFileInTree(node.children),
                };
              }
              return node;
            });
          };

          // Get all existing file paths (including nested) to avoid duplicates
          const collectPaths = (nodes: FileTreeNode[]): Set<string> => {
            const paths = new Set<string>();
            for (const node of nodes) {
              if (node.type === 'file') {
                paths.add(node.path);
              }
              if (node.children) {
                collectPaths(node.children).forEach((path) => paths.add(path));
              }
            }
            return paths;
          };

          const existingPaths = collectPaths(treeQueryData.data);

          // Convert uploaded files to FileTreeNode format
          const newNodes: FileTreeNode[] = result.data
            .filter((file) => !existingPaths.has(file.path))
            .map((file) => ({
              type: 'file' as const,
              name: file.name,
              path: file.path,
              metadata: file,
            }));

          // Update existing tree (including nested files)
          const updatedTree = updateFileInTree(treeQueryData.data);

          // Add new files to the root level
          // Note: In a real implementation, you might want to place files in their
          // correct folder based on file.path, but for simplicity we add to root
          const finalTree = [...updatedTree, ...newNodes];

          // Update cache optimistically
          queryClient.setQueryData(queryKeys.markdownFiles.tree(), {
            success: true,
            data: finalTree,
          });
        }

        result.data.forEach((file) => {
          upsertMarkdownFileCache(queryClient, file);
        });
      }
    },
  });

  const apiError = error ? extractApiError(error) : null;

  return {
    files: data?.data || [],
    isLoading,
    isError,
    error: apiError || error,
    createFile: createMutation.mutateAsync,
    updateFile: updateMutation.mutateAsync,
    deleteFile: (filePath: string, fileId?: string) =>
      deleteMutation.mutateAsync({ filePath, fileId }),
    uploadFiles: uploadMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUploading: uploadMutation.isPending,
  };
}
