import type { FileTreeNode, MarkdownFile } from '@/types/markdown-files';

export type MarkdownFileTreeSortField = 'updatedAt' | 'createdAt' | 'name' | 'size';
export type MarkdownFileTreeSortDir = 'asc' | 'desc';

export interface MarkdownFileTreeSortOptions {
  field: MarkdownFileTreeSortField;
  dir: MarkdownFileTreeSortDir;
}

export const MARKDOWN_FILE_TREE_SORT_STORAGE_KEY = 'markdown-file-tree-sort';

const DEFAULT_SORT: MarkdownFileTreeSortOptions = {
  field: 'updatedAt',
  dir: 'desc',
};

function parseTimestamp(iso?: string): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

/** Per contract: updated uses updatedAt, then createdAt */
export function fileUpdatedSortMs(metadata?: MarkdownFile): number | null {
  if (!metadata) return null;
  const fromUpdated = parseTimestamp(metadata.updatedAt);
  if (fromUpdated !== null) return fromUpdated;
  return parseTimestamp(metadata.createdAt);
}

function fileCreatedSortMs(metadata?: MarkdownFile): number | null {
  if (!metadata) return null;
  return parseTimestamp(metadata.createdAt);
}

function maxDescendantTimestamp(
  node: FileTreeNode,
  mode: 'updatedAt' | 'createdAt'
): number | null {
  if (node.type === 'file') {
    return mode === 'updatedAt'
      ? fileUpdatedSortMs(node.metadata)
      : fileCreatedSortMs(node.metadata);
  }
  if (!node.children?.length) return null;
  let max: number | null = null;
  for (const child of node.children) {
    const v = maxDescendantTimestamp(child, mode);
    if (v == null) continue;
    if (max == null || v > max) max = v;
  }
  return max;
}

function maxDescendantSize(node: FileTreeNode): number | null {
  if (node.type === 'file') {
    const s = node.metadata?.size;
    return s == null ? null : s;
  }
  if (!node.children?.length) return null;
  let max: number | null = null;
  for (const child of node.children) {
    const v = maxDescendantSize(child);
    if (v == null) continue;
    if (max == null || v > max) max = v;
  }
  return max;
}

function getNumericSortValue(node: FileTreeNode, field: MarkdownFileTreeSortField): number | null {
  switch (field) {
    case 'updatedAt':
      return node.type === 'file'
        ? fileUpdatedSortMs(node.metadata)
        : maxDescendantTimestamp(node, 'updatedAt');
    case 'createdAt':
      return node.type === 'file'
        ? fileCreatedSortMs(node.metadata)
        : maxDescendantTimestamp(node, 'createdAt');
    case 'size':
      return node.type === 'file'
        ? node.metadata?.size != null
          ? node.metadata.size
          : null
        : maxDescendantSize(node);
    default:
      return null;
  }
}

function compareSiblings(
  a: FileTreeNode,
  b: FileTreeNode,
  options: MarkdownFileTreeSortOptions
): number {
  const { field, dir } = options;

  // Explorer-style grouping: folders before files at the same level, then sort within each group.
  if (a.type === 'folder' && b.type === 'file') return -1;
  if (a.type === 'file' && b.type === 'folder') return 1;

  if (field === 'name') {
    const sa = a.name.toLowerCase();
    const sb = b.name.toLowerCase();
    const cmp = sa.localeCompare(sb);
    if (cmp !== 0) return dir === 'asc' ? cmp : -cmp;
    return a.path.localeCompare(b.path);
  }

  const va = getNumericSortValue(a, field);
  const vb = getNumericSortValue(b, field);

  if (va === null && vb === null) {
    return a.path.localeCompare(b.path);
  }
  if (va === null) return 1;
  if (vb === null) return -1;

  const diff = va - vb;
  if (diff !== 0) return dir === 'asc' ? diff : -diff;
  return a.path.localeCompare(b.path);
}

function sortNodeDeep(node: FileTreeNode, options: MarkdownFileTreeSortOptions): FileTreeNode {
  if (node.type !== 'folder' || !node.children?.length) {
    return { ...node };
  }

  const sortedChildren = [...node.children]
    .map((child) => sortNodeDeep(child, options))
    .sort((a, b) => compareSiblings(a, b, options));

  return { ...node, children: sortedChildren };
}

/**
 * Returns a new tree with siblings sorted at every level (immutable).
 * Folders precede files at each level; within each group, ordering follows the sort options.
 * Default ordering contract: see `docs/contracts/markdown-viewer-sidebar-sort-contract-spec.md`.
 */
export function sortFileTreeNodes(
  nodes: FileTreeNode[],
  options: MarkdownFileTreeSortOptions
): FileTreeNode[] {
  if (!nodes.length) return [];
  return [...nodes]
    .map((n) => sortNodeDeep(n, options))
    .sort((a, b) => compareSiblings(a, b, options));
}

export function parseMarkdownFileTreeSortFromStorage(
  raw: string | null
): MarkdownFileTreeSortOptions {
  if (!raw) return { ...DEFAULT_SORT };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_SORT };
    const rec = parsed as Record<string, unknown>;
    const field = rec.field;
    const dir = rec.dir;
    const validFields: MarkdownFileTreeSortField[] = ['updatedAt', 'createdAt', 'name', 'size'];
    const validDirs: MarkdownFileTreeSortDir[] = ['asc', 'desc'];
    if (
      typeof field === 'string' &&
      validFields.includes(field as MarkdownFileTreeSortField) &&
      typeof dir === 'string' &&
      validDirs.includes(dir as MarkdownFileTreeSortDir)
    ) {
      return { field: field as MarkdownFileTreeSortField, dir: dir as MarkdownFileTreeSortDir };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_SORT };
}

export function getDefaultMarkdownFileTreeSort(): MarkdownFileTreeSortOptions {
  return { ...DEFAULT_SORT };
}
