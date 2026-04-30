import type { MarkdownFile } from '@/types/markdown-files';
import type { LocalFile } from '@/hooks/useLocalFiles';

/**
 * Build a MarkdownFile from a LocalFile
 */
export function buildLocalMarkdownFile(localFile: LocalFile, filePath: string): MarkdownFile {
  return {
    id: `local-${filePath}`,
    path: localFile.path,
    name: localFile.path,
    content: localFile.content,
    size: new Blob([localFile.content]).size,
    tags: localFile.tags,
    category: localFile.category,
    createdAt: localFile.createdAt,
    updatedAt: localFile.updatedAt,
  };
}

/**
 * Build a MarkdownFile for a new/updated file
 */
export function buildUpdateFile(filePath: string, content: string): MarkdownFile {
  return {
    id: `local-${filePath}`,
    path: filePath,
    name: filePath.split('/').pop() || filePath,
    content,
    size: new Blob([content]).size,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Check if a file result is a local-only file
 */
export function isLocalFileResult(file: MarkdownFile | undefined): boolean {
  return file?.id?.startsWith('local-') ?? false;
}
