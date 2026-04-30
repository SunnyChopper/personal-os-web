import { generatePath } from 'react-router-dom';
import { ROUTES } from '@/routes';

export interface NavigateToMarkdownFileOptions {
  reader?: boolean;
}

/**
 * Navigate to a markdown file
 */
export function navigateToMarkdownFile(
  navigate: (path: string) => void,
  filePath: string,
  options?: NavigateToMarkdownFileOptions
): void {
  const encodedPath = encodeURIComponent(filePath);
  const path = generatePath(ROUTES.admin.markdownViewerFile, {
    filePath: encodedPath,
  });
  const url = options?.reader ? `${path}?reader=true` : path;
  navigate(url);
}

/**
 * Get encoded file path for navigation
 */
export function getEncodedFilePath(filePath: string): string {
  return encodeURIComponent(filePath);
}
