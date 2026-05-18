import { describe, expect, it } from 'vitest';
import {
  fileUpdatedSortMs,
  parseMarkdownFileTreeSortFromStorage,
  sortFileTreeNodes,
} from '@/lib/markdown/file-tree-sort';
import type { FileTreeNode } from '@/types/markdown-files';

const isoOld = '2024-01-01T00:00:00.000Z';
const isoNew = '2026-01-01T00:00:00.000Z';

function fileNode(
  path: string,
  overrides: { updatedAt?: string; createdAt?: string; size?: number } = {}
): FileTreeNode {
  const name = path.split('/').pop() || path;
  const updatedAt = overrides.updatedAt ?? isoOld;
  const createdAt = overrides.createdAt ?? isoOld;
  return {
    type: 'file',
    name,
    path,
    metadata: {
      id: `id-${path}`,
      path,
      name,
      size: overrides.size ?? 10,
      createdAt,
      updatedAt,
    },
  };
}

describe('fileUpdatedSortMs', () => {
  it('falls back from updatedAt to createdAt', () => {
    expect(
      fileUpdatedSortMs({
        id: '1',
        path: 'a.md',
        name: 'a.md',
        size: 1,
        createdAt: isoNew,
        updatedAt: '',
      })
    ).toBe(Date.parse(isoNew));
  });
});

describe('sortFileTreeNodes', () => {
  it('sorts files by updatedAt descending by default expectation (newest first)', () => {
    const tree: FileTreeNode[] = [
      fileNode('z-old.md', { updatedAt: isoOld }),
      fileNode('y-new.md', { updatedAt: isoNew }),
    ];
    const sorted = sortFileTreeNodes(tree, { field: 'updatedAt', dir: 'desc' });
    expect(sorted.map((n) => n.path)).toEqual(['y-new.md', 'z-old.md']);
  });

  it('orders folders by max descendant updatedAt when field is updatedAt', () => {
    const tree: FileTreeNode[] = [
      {
        type: 'folder',
        name: 'folderA',
        path: 'folderA',
        children: [fileNode('folderA/x.md', { updatedAt: isoOld })],
      },
      {
        type: 'folder',
        name: 'folderB',
        path: 'folderB',
        children: [fileNode('folderB/y.md', { updatedAt: isoNew })],
      },
    ];
    const sorted = sortFileTreeNodes(tree, { field: 'updatedAt', dir: 'desc' });
    expect(sorted.map((n) => n.path)).toEqual(['folderB', 'folderA']);
  });

  it('sorts siblings by name ascending case-insensitively', () => {
    const tree: FileTreeNode[] = [fileNode('Zebra.md'), fileNode('alpha.md')];
    const sorted = sortFileTreeNodes(tree, { field: 'name', dir: 'asc' });
    expect(sorted.map((n) => n.path)).toEqual(['alpha.md', 'Zebra.md']);
  });

  it('uses path as tie-breaker for identical timestamps', () => {
    const tree: FileTreeNode[] = [
      fileNode('b.md', { updatedAt: isoOld }),
      fileNode('a.md', { updatedAt: isoOld }),
    ];
    const sorted = sortFileTreeNodes(tree, { field: 'updatedAt', dir: 'desc' });
    expect(sorted.map((n) => n.path)).toEqual(['a.md', 'b.md']);
  });

  it('lists all folders before files at the same level (Explorer-style grouping)', () => {
    const tree: FileTreeNode[] = [
      fileNode('newest.md', { updatedAt: isoNew }),
      {
        type: 'folder',
        name: 'old-folder',
        path: 'old-folder',
        children: [fileNode('old-folder/x.md', { updatedAt: isoOld })],
      },
    ];
    const sorted = sortFileTreeNodes(tree, { field: 'updatedAt', dir: 'desc' });
    expect(sorted.map((n) => n.path)).toEqual(['old-folder', 'newest.md']);
  });
});

describe('parseMarkdownFileTreeSortFromStorage', () => {
  it('returns default when null or invalid', () => {
    expect(parseMarkdownFileTreeSortFromStorage(null)).toEqual({
      field: 'updatedAt',
      dir: 'desc',
    });
    expect(parseMarkdownFileTreeSortFromStorage('')).toEqual({
      field: 'updatedAt',
      dir: 'desc',
    });
    expect(parseMarkdownFileTreeSortFromStorage('not-json')).toEqual({
      field: 'updatedAt',
      dir: 'desc',
    });
  });

  it('parses valid payloads', () => {
    expect(
      parseMarkdownFileTreeSortFromStorage(JSON.stringify({ field: 'name', dir: 'asc' }))
    ).toEqual({ field: 'name', dir: 'asc' });
  });
});
