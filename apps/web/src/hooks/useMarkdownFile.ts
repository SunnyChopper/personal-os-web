import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { markdownFilesService, isBackendUnavailable } from '@/services/markdown-files.service';
import { useBackendStatus } from '@/contexts/BackendStatusContext';
import { queryKeys } from '@/lib/react-query/query-keys';
import { extractApiError } from '@/lib/react-query/error-utils';
import { getLocalFile, isLocalOnlyFile, updateLocalFile } from '@/hooks/useLocalFiles';
import { useFileTree } from '@/hooks/useFileTree';
import { useMarkdownBackendStatus } from '@/hooks/useMarkdownBackendStatus';
import { buildLocalMarkdownFile, buildUpdateFile } from '@/lib/markdown/file-utils';
import { logger } from '@/lib/logger';
import type { FileTreeNode } from '@/types/markdown-files';

/**
 * [Purpose] Fetch and update a single markdown file by path.
 * @param filePath File path (URL-encoded)
 */
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

export function useMarkdownFile(filePath: string | undefined) {
  const queryClient = useQueryClient();
  const { recordError, recordSuccess } = useBackendStatus();
  const { tree, isLoading: isTreeLoading } = useFileTree();
  const { isOnline: isBackendOnline } = useMarkdownBackendStatus();

  const isLocalOnly = filePath ? isLocalOnlyFile(filePath) : false;

  const treeData = queryClient.getQueryData<{ success: boolean; data?: FileTreeNode[] }>(
    queryKeys.markdownFiles.tree()
  );
  const treeIsReady =
    !isTreeLoading &&
    (treeData?.success === true || (treeData?.data && treeData.data.length > 0) || tree.length > 0);

  const { data, isLoading, error, isError } = useQuery({
    queryKey: queryKeys.markdownFiles.detail(filePath || ''),
    queryFn: async () => {
      if (!filePath) {
        return {
          success: false as const,
          error: { message: 'No file path provided', code: 'INVALID_INPUT' },
        };
      }
      try {
        const treeQuery = queryClient.getQueryData<{ success: boolean; data?: FileTreeNode[] }>(
          queryKeys.markdownFiles.tree()
        );
        const nodes = treeQuery?.data || tree;
        const fileNode = findNodeByPath(filePath, nodes);
        const fileId = fileNode?.metadata?.id;

        // DEBUG: Log file metadata from tree
        if (import.meta.env.DEV) {
          logger.debug('Loading markdown file', {
            filePath,
            fileId,
            hasFileNode: !!fileNode,
            fileNodeMetadata: fileNode?.metadata,
          });
        }

        // Check if fileId looks valid (not a path)
        const fileIdLooksValid =
          fileId &&
          !fileId.startsWith('local-') &&
          !fileId.endsWith('.md') &&
          !fileId.includes('/');

        if (fileIdLooksValid) {
          try {
            const res = await markdownFilesService.getFileContent(fileId);
            if (res.success && res.data && fileNode.metadata) {
              recordSuccess();
              if (import.meta.env.DEV) {
                logger.debug('Loaded markdown file via getFileContent', fileNode.metadata);
              }
              return {
                success: true as const,
                data: { ...fileNode.metadata, content: res.data.content || '' },
              };
            }
          } catch (err) {
            // If getFileContent fails (likely because fileId is actually a path),
            // fall through to getFile below
            logger.warn('getFileContent failed, falling back to getFile', err);
          }
        } else if (fileId) {
          logger.warn('File ID looks like a path, skipping getFileContent', { fileId });
        }

        const result = await markdownFilesService.getFile(filePath);
        if (result.success && result.data) {
          recordSuccess();
          if (result.data.content === undefined) result.data.content = '';
          if (import.meta.env.DEV) {
            logger.debug('Loaded markdown file via getFile', {
              id: result.data.id,
              path: result.data.path,
              name: result.data.name,
            });
          }

          // CRITICAL FIX: Update the tree cache with the correct file metadata
          // This ensures the file ID is correct for subsequent update operations
          if (treeQuery?.data && result.data.id) {
            const updateTreeWithCorrectId = (nodes: FileTreeNode[]): FileTreeNode[] => {
              return nodes.map((node) => {
                if (node.type === 'file' && node.path === filePath) {
                  // Update this node with correct metadata from backend
                  return {
                    ...node,
                    metadata: result.data,
                  };
                } else if (node.type === 'folder' && node.children) {
                  // Recursively update children
                  return {
                    ...node,
                    children: updateTreeWithCorrectId(node.children),
                  };
                }
                return node;
              });
            };

            const updatedTree = updateTreeWithCorrectId(treeQuery.data);
            queryClient.setQueryData(queryKeys.markdownFiles.tree(), {
              success: true,
              data: updatedTree,
            });
            if (import.meta.env.DEV) {
              logger.debug('Updated tree cache with correct file ID', { fileId: result.data.id });
            }
          }
        } else if (result.error && isBackendUnavailable(result.error)) {
          const localFile = getLocalFile(filePath);
          if (localFile && !localFile.syncedToBackend) {
            return { success: true as const, data: buildLocalMarkdownFile(localFile, filePath) };
          }
        }
        return result;
      } catch (err: unknown) {
        const apiError = extractApiError(err);
        if (isBackendUnavailable(apiError)) {
          const localFile = getLocalFile(filePath!);
          if (localFile && !localFile.syncedToBackend) {
            return { success: true as const, data: buildLocalMarkdownFile(localFile, filePath!) };
          }
        }
        if (apiError && !isBackendUnavailable(apiError)) recordError(apiError);
        throw err;
      }
    },
    enabled: !!filePath && (!isLocalOnly ? treeIsReady : true),
  });

  useEffect(() => {
    if (filePath && !isLocalOnly && treeIsReady && !isLoading) {
      const backendId = data?.data?.id && !data.data.id.startsWith('local-');
      if (!backendId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.markdownFiles.detail(filePath) });
      }
    }
  }, [filePath, isLocalOnly, treeIsReady, isLoading, data, queryClient]);

  const updateMutation = useMutation({
    mutationFn: async ({ filePath, content }: { filePath: string; content: string }) => {
      if (isLocalOnlyFile(filePath)) {
        updateLocalFile(filePath, content);
        return { success: true as const, data: buildUpdateFile(filePath, content) };
      }
      if (!isBackendOnline) {
        updateLocalFile(filePath, content);
        return { success: true as const, data: buildUpdateFile(filePath, content) };
      }
      const treeQuery = queryClient.getQueryData<{ success: boolean; data?: FileTreeNode[] }>(
        queryKeys.markdownFiles.tree()
      );
      const nodes = treeQuery?.data || tree;
      const fileNode = findNodeByPath(filePath, nodes);
      const fileId = fileNode?.metadata?.id;

      // DEBUG: Log the file ID being used
      if (import.meta.env.DEV) {
        logger.debug('Markdown file update attempt', {
          filePath,
          fileId,
          fileNode: fileNode?.metadata,
          hasMetadata: !!fileNode?.metadata,
        });
      }

      if (!fileId || fileId.startsWith('local-'))
        throw new Error(
          'Cannot save file: File ID not found. The file may not exist on the backend.'
        );
      if (fileId.startsWith('http://') || fileId.startsWith('https://'))
        throw new Error('Invalid file ID: File ID cannot be a URL. This is likely a bug.');

      // Check if fileId looks like a path (contains .md extension without a proper UUID)
      if (fileId.endsWith('.md') || fileId.includes('/')) {
        logger.error('File ID appears to be a path, not an ID', { fileId });
        throw new Error(
          'Invalid file ID: File ID appears to be a file path. Cannot update file. Please check backend file metadata.'
        );
      }

      const result = await markdownFilesService.updateFileById(fileId, content);
      if (!result.success) throw new Error(result.error?.message || 'Failed to update file');
      return result;
    },
    onSuccess: (result, variables) => {
      if (result.success && result.data) {
        const treeQuery = queryClient.getQueryData<{ success: boolean; data?: FileTreeNode[] }>(
          queryKeys.markdownFiles.tree()
        );
        if (treeQuery?.data) {
          const updateTree = (nodes: FileTreeNode[]): FileTreeNode[] =>
            nodes.map((node) =>
              node.type === 'file' && node.path === variables.filePath
                ? { ...node, metadata: result.data }
                : node.type === 'folder' && node.children
                  ? { ...node, children: updateTree(node.children) }
                  : node
            );
          queryClient.setQueryData(queryKeys.markdownFiles.tree(), {
            success: true,
            data: updateTree(treeQuery.data),
          });
        }
        queryClient.setQueryData(queryKeys.markdownFiles.detail(variables.filePath), {
          success: true,
          data: result.data,
        });
      }
    },
  });

  const apiError = error ? extractApiError(error) : null;
  const isActuallyLocalOnly = (() => {
    if (!data?.data) return isLocalOnly;
    return !(data.data.id && !data.data.id.startsWith('local-')) && isLocalOnly;
  })();

  return {
    file: data?.data,
    isLoading,
    isError,
    error: apiError || error,
    updateFile: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    isLocalOnly: isActuallyLocalOnly,
  };
}
