import { useCallback, useState } from 'react';
import {
  getDefaultMarkdownFileTreeSort,
  MARKDOWN_FILE_TREE_SORT_STORAGE_KEY,
  parseMarkdownFileTreeSortFromStorage,
  type MarkdownFileTreeSortDir,
  type MarkdownFileTreeSortField,
  type MarkdownFileTreeSortOptions,
} from '@/lib/markdown/file-tree-sort';
import { logger } from '@/lib/logger';

function readSortFromStorage(): MarkdownFileTreeSortOptions {
  if (typeof window === 'undefined') return getDefaultMarkdownFileTreeSort();
  try {
    return parseMarkdownFileTreeSortFromStorage(
      localStorage.getItem(MARKDOWN_FILE_TREE_SORT_STORAGE_KEY)
    );
  } catch {
    return getDefaultMarkdownFileTreeSort();
  }
}

function writeSortToStorage(options: MarkdownFileTreeSortOptions): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MARKDOWN_FILE_TREE_SORT_STORAGE_KEY, JSON.stringify(options));
  } catch (error) {
    logger.warn('Failed to persist markdown file tree sort', error);
  }
}

export function useMarkdownFileTreeSort() {
  const [sort, setSortState] = useState<MarkdownFileTreeSortOptions>(() => readSortFromStorage());

  const setSort = useCallback(
    (
      next:
        | MarkdownFileTreeSortOptions
        | ((prev: MarkdownFileTreeSortOptions) => MarkdownFileTreeSortOptions)
    ) => {
      if (typeof next === 'function') {
        setSortState((prev) => {
          const resolved = next(prev);
          writeSortToStorage(resolved);
          return resolved;
        });
      } else {
        setSortState(next);
        writeSortToStorage(next);
      }
    },
    []
  );

  const setField = useCallback(
    (field: MarkdownFileTreeSortField) => {
      setSort((prev) => ({ ...prev, field }));
    },
    [setSort]
  );

  const setDir = useCallback(
    (dir: MarkdownFileTreeSortDir) => {
      setSort((prev) => ({ ...prev, dir }));
    },
    [setSort]
  );

  const toggleDir = useCallback(() => {
    setSort((prev) => ({ ...prev, dir: prev.dir === 'asc' ? 'desc' : 'asc' }));
  }, [setSort]);

  return {
    sortField: sort.field,
    sortDir: sort.dir,
    sortOptions: sort,
    setSort,
    setField,
    setDir,
    toggleDir,
  };
}
