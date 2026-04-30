/**
 * Hook to manage recently viewed markdown files in localStorage
 */

import { logger } from '@/lib/logger';

const RECENT_FILES_KEY = 'markdown-viewer-recent-files';
const MAX_RECENT_FILES = 20;

export interface RecentFile {
  path: string;
  name: string;
  viewedAt: string; // ISO timestamp
}

/**
 * Get all recent files, sorted by most recently viewed
 */
export function getRecentFiles(): RecentFile[] {
  try {
    const stored = localStorage.getItem(RECENT_FILES_KEY);
    if (!stored) return [];
    const files: RecentFile[] = JSON.parse(stored);
    // Sort by viewedAt descending (most recent first)
    return files.sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime());
  } catch {
    return [];
  }
}

/**
 * Add a file to recent files list
 */
export function addRecentFile(filePath: string, fileName: string): void {
  try {
    const files = getRecentFiles();
    // Remove if already exists
    const filtered = files.filter((f) => f.path !== filePath);
    // Add to beginning
    const updated: RecentFile[] = [
      {
        path: filePath,
        name: fileName,
        viewedAt: new Date().toISOString(),
      },
      ...filtered,
    ].slice(0, MAX_RECENT_FILES); // Limit to MAX_RECENT_FILES

    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(updated));
  } catch (error) {
    logger.error('Failed to save recent file', error);
  }
}

/**
 * Clear all recent files
 */
export function clearRecentFiles(): void {
  try {
    localStorage.removeItem(RECENT_FILES_KEY);
  } catch (error) {
    logger.error('Failed to clear recent files', error);
  }
}

/**
 * Remove a specific file from recent files
 */
export function removeRecentFile(filePath: string): void {
  try {
    const files = getRecentFiles();
    const filtered = files.filter((f) => f.path !== filePath);
    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(filtered));
  } catch (error) {
    logger.error('Failed to remove recent file', error);
  }
}
