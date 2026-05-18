import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';

export interface InvalidateMarkdownQueriesOptions {
  filePath?: string;
  includeTags?: boolean;
  includeCategories?: boolean;
}

/**
 * Invalidate all markdown-related queries. Resolves when refetches triggered by
 * invalidation have settled (TanStack Query v5 invalidateQueries promise).
 */
export async function invalidateMarkdownQueries(
  queryClient: QueryClient,
  options?: InvalidateMarkdownQueriesOptions
): Promise<void> {
  const { filePath, includeTags = false, includeCategories = false } = options || {};

  const tasks: Promise<unknown>[] = [];

  if (filePath) {
    tasks.push(
      queryClient.invalidateQueries({ queryKey: queryKeys.markdownFiles.detail(filePath) })
    );
  }
  tasks.push(queryClient.invalidateQueries({ queryKey: ['markdown-files'] }));
  tasks.push(queryClient.invalidateQueries({ queryKey: queryKeys.markdownFiles.tree() }));

  if (includeTags) {
    tasks.push(queryClient.invalidateQueries({ queryKey: ['markdown-tags'] }));
  }
  if (includeCategories) {
    tasks.push(queryClient.invalidateQueries({ queryKey: ['markdown-categories'] }));
  }

  await Promise.all(tasks);
}

/**
 * Invalidate queries after file operations
 */
export async function invalidateAfterFileOperation(
  queryClient: QueryClient,
  filePath?: string,
  includeMetadata = false
): Promise<void> {
  await invalidateMarkdownQueries(queryClient, {
    filePath,
    includeTags: includeMetadata,
    includeCategories: includeMetadata,
  });
}
