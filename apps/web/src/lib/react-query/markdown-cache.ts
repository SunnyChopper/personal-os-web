import type { QueryClient, QueryKey } from '@tanstack/react-query';
import type { FileTreeNode, MarkdownFile } from '@/types/markdown-files';
import { queryKeys } from '@/lib/react-query/query-keys';

type ListCache<T> = { data?: T[] } | T[];

const extractListData = <T>(value: ListCache<T> | undefined): T[] => {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.data)) return value.data;
  return [];
};

const mergeListData = <T>(value: ListCache<T> | undefined, data: T[]): ListCache<T> => {
  if (Array.isArray(value)) return data;
  if (value && typeof value === 'object') {
    return { ...value, data };
  }
  return { data };
};

const updateListQueries = <T>(
  queryClient: QueryClient,
  queryKeyBase: QueryKey,
  updater: (items: T[], queryKey: QueryKey) => T[]
): void => {
  const queries = queryClient.getQueriesData<ListCache<T>>({ queryKey: queryKeyBase });
  queries.forEach(([key, data]) => {
    const next = updater(extractListData<T>(data), key);
    queryClient.setQueryData(key, mergeListData<T>(data, next));
  });
};

const upsertById = <T extends { id: string }>(items: T[], item: T): T[] => {
  const index = items.findIndex((existing) => existing.id === item.id);
  if (index === -1) {
    return [...items, item];
  }
  const next = [...items];
  next[index] = item;
  return next;
};

const removeByPath = (items: MarkdownFile[], filePath: string): MarkdownFile[] =>
  items.filter((item) => item.path !== filePath);

const getFolderFilter = (queryKey: QueryKey): string | undefined => {
  if (Array.isArray(queryKey) && queryKey.length >= 3) {
    const folder = queryKey[2];
    return typeof folder === 'string' ? folder : undefined;
  }
  return undefined;
};

const matchesFolder = (filePath: string, folder?: string): boolean => {
  if (!folder) return true;
  if (filePath === folder) return true;
  return filePath.startsWith(`${folder}/`);
};

const updateTreeNode = (
  nodes: FileTreeNode[],
  file: MarkdownFile,
  updater: (node: FileTreeNode, file: MarkdownFile) => FileTreeNode
): FileTreeNode[] =>
  nodes.map((node) => {
    if (node.type === 'file' && node.path === file.path) {
      return updater(node, file);
    }
    if (node.type === 'folder' && node.children) {
      return { ...node, children: updateTreeNode(node.children, file, updater) };
    }
    return node;
  });

const addToRoot = (nodes: FileTreeNode[], file: MarkdownFile): FileTreeNode[] => [
  ...nodes,
  {
    type: 'file',
    name: file.name,
    path: file.path,
    metadata: file,
  },
];

const removeFromTree = (nodes: FileTreeNode[], filePath: string): FileTreeNode[] =>
  nodes
    .filter((node) => !(node.type === 'file' && node.path === filePath))
    .map((node) =>
      node.type === 'folder' && node.children
        ? { ...node, children: removeFromTree(node.children, filePath) }
        : node
    );

export const upsertMarkdownFileCache = (queryClient: QueryClient, file: MarkdownFile): void => {
  updateListQueries<MarkdownFile>(queryClient, queryKeys.markdownFiles.lists(), (items, key) => {
    const folder = getFolderFilter(key);
    if (!matchesFolder(file.path, folder)) return items;
    return upsertById(items, file);
  });

  const treeQuery = queryClient.getQueryData<{ success: boolean; data?: FileTreeNode[] }>(
    queryKeys.markdownFiles.tree()
  );
  if (treeQuery?.data) {
    const updatedTree = updateTreeNode(treeQuery.data, file, (node, nextFile) => ({
      ...node,
      name: nextFile.name,
      path: nextFile.path,
      metadata: nextFile,
    }));
    const exists = updatedTree.some((node) => node.type === 'file' && node.path === file.path);
    queryClient.setQueryData(queryKeys.markdownFiles.tree(), {
      success: true,
      data: exists ? updatedTree : addToRoot(updatedTree, file),
    });
  }

  queryClient.setQueryData(queryKeys.markdownFiles.detail(file.path), {
    success: true,
    data: file,
  });
};

export const removeMarkdownFileCache = (queryClient: QueryClient, filePath: string): void => {
  updateListQueries<MarkdownFile>(queryClient, queryKeys.markdownFiles.lists(), (items, key) => {
    const folder = getFolderFilter(key);
    if (!matchesFolder(filePath, folder)) return items;
    return removeByPath(items, filePath);
  });

  const treeQuery = queryClient.getQueryData<{ success: boolean; data?: FileTreeNode[] }>(
    queryKeys.markdownFiles.tree()
  );
  if (treeQuery?.data) {
    queryClient.setQueryData(queryKeys.markdownFiles.tree(), {
      success: true,
      data: removeFromTree(treeQuery.data, filePath),
    });
  }

  queryClient.removeQueries({ queryKey: queryKeys.markdownFiles.detail(filePath) });
};
