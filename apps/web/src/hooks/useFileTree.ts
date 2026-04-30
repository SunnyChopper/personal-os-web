import { useQuery, useQueryClient } from '@tanstack/react-query';
import { markdownFilesService } from '@/services/markdown-files.service';
import type { FileTreeNode } from '@/types/markdown-files';
import { useBackendStatus } from '@/contexts/BackendStatusContext';
import { queryKeys } from '@/lib/react-query/query-keys';
import { extractApiError } from '@/lib/react-query/error-utils';
import { logger } from '@/lib/logger';
import { useMemo } from 'react';

// Helper to find a node by path
const findNodeByPath = (path: string, nodes?: FileTreeNode[]): FileTreeNode | null => {
  if (!nodes) return null;
  for (const node of nodes) {
    if (node.path === path) return node;
    if (node.children) {
      const found = findNodeByPath(path, node.children);
      if (found) return found;
    }
  }
  return null;
};

// Helper to get all files from tree
const getAllFiles = (nodes?: FileTreeNode[]): FileTreeNode[] => {
  if (!nodes) return [];
  const files: FileTreeNode[] = [];
  for (const node of nodes) {
    if (node.type === 'file') {
      files.push(node);
    }
    if (node.children) {
      files.push(...getAllFiles(node.children));
    }
  }
  return files;
};

// Helper to get folder structure
const getFolders = (nodes?: FileTreeNode[]): FileTreeNode[] => {
  if (!nodes) return [];
  const folders: FileTreeNode[] = [];
  for (const node of nodes) {
    if (node.type === 'folder') {
      folders.push(node);
      if (node.children) {
        folders.push(...getFolders(node.children));
      }
    }
  }
  return folders;
};

/**
 * Hook to fetch and manipulate file tree structure
 */
export function useFileTree() {
  const queryClient = useQueryClient();
  const { recordError, recordSuccess } = useBackendStatus();

  const { data, isLoading, error, isError } = useQuery({
    queryKey: queryKeys.markdownFiles.tree(),
    queryFn: async () => {
      try {
        const result = await markdownFilesService.getFileTree();
        if (result.success && result.data) {
          recordSuccess();

          // DEBUG: Check for invalid file IDs in tree (paths instead of UUIDs)
          const checkForInvalidIds = (nodes: FileTreeNode[]): void => {
            for (const node of nodes) {
              if (node.type === 'file' && node.metadata?.id) {
                const id = node.metadata.id;
                const looksLikePath = id.endsWith('.md') || id.includes('/');
                if (looksLikePath) {
                  logger.warn('Backend returned file with path-like ID', {
                    path: node.path,
                    id,
                    expectedFormat: 'UUID',
                  });
                }
              }
              if (node.children) {
                checkForInvalidIds(node.children);
              }
            }
          };

          checkForInvalidIds(result.data);
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

  const apiError = error ? extractApiError(error) : null;

  const tree = useMemo(() => data?.data || [], [data?.data]);
  const allFiles = useMemo(() => getAllFiles(tree), [tree]);
  const folders = useMemo(() => getFolders(tree), [tree]);

  return {
    tree,
    allFiles,
    folders,
    isLoading,
    isError,
    error: apiError || error,
    findNodeByPath: (path: string) => findNodeByPath(path, tree),
    refresh: () => queryClient.invalidateQueries({ queryKey: queryKeys.markdownFiles.tree() }),
  };
}
