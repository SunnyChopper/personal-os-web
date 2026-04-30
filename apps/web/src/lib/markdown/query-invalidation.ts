import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';

export interface InvalidateMarkdownQueriesOptions {
  filePath?: string;
  includeTags?: boolean;
  includeCategories?: boolean;
}

/**
 * Invalidate all markdown-related queries
 */
export function invalidateMarkdownQueries(
  queryClient: QueryClient,
  options?: InvalidateMarkdownQueriesOptions
): void {
  const { filePath, includeTags = false, includeCategories = false } = options || {};

  if (filePath) {
    queryClient.invalidateQueries({ queryKey: ['markdown-file', filePath] });
  }
  queryClient.invalidateQueries({ queryKey: ['markdown-files'] });
  queryClient.invalidateQueries({ queryKey: queryKeys.markdownFiles.tree() });

  if (includeTags) {
    queryClient.invalidateQueries({ queryKey: ['markdown-tags'] });
  }
  if (includeCategories) {
    queryClient.invalidateQueries({ queryKey: ['markdown-categories'] });
  }
}

/**
 * Invalidate queries after file operations
 */
export function invalidateAfterFileOperation(
  queryClient: QueryClient,
  filePath?: string,
  includeMetadata = false
): void {
  invalidateMarkdownQueries(queryClient, {
    filePath,
    includeTags: includeMetadata,
    includeCategories: includeMetadata,
  });
}
