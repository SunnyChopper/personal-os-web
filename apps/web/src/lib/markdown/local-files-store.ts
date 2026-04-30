/**
 * Pure localStorage persistence for unsynced markdown files (no React).
 * Used by hooks and services; keeps dependency direction services → lib.
 */

import { logger } from '@/lib/logger';

export interface LocalFile {
  path: string;
  content: string;
  tags?: string[];
  category?: string;
  syncedToBackend: boolean;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'md_local_files';

export function getAllLocalFiles(): LocalFile[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as LocalFile[];
  } catch {
    return [];
  }
}

function saveAllLocalFiles(files: LocalFile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  } catch (error) {
    logger.error('Failed to save local files to localStorage', error);
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw new Error('Local storage quota exceeded. Please save or delete some local files.');
    }
    throw error;
  }
}

function getNextFileNumber(): number {
  const files = getAllLocalFiles();
  if (files.length === 0) return 1;
  return files.length + 1;
}

export function createLocalFile(): string {
  const number = getNextFileNumber();
  const path = `Untitled-${number}.md`;
  const now = new Date().toISOString();

  const newFile: LocalFile = {
    path,
    content: '',
    syncedToBackend: false,
    createdAt: now,
    updatedAt: now,
  };

  const files = getAllLocalFiles();
  files.push(newFile);
  saveAllLocalFiles(files);

  return path;
}

export function getLocalFile(path: string): LocalFile | null {
  const files = getAllLocalFiles();
  return files.find((file) => file.path === path) || null;
}

export function isLocalOnlyFile(path: string | undefined): boolean {
  if (!path) return false;
  const file = getLocalFile(path);
  return file !== null && !file.syncedToBackend;
}

export function markAsSynced(path: string): void {
  const files = getAllLocalFiles();
  const fileIndex = files.findIndex((file) => file.path === path);

  if (fileIndex !== -1) {
    files[fileIndex] = {
      ...files[fileIndex],
      syncedToBackend: true,
      updatedAt: new Date().toISOString(),
    };
    saveAllLocalFiles(files);

    window.dispatchEvent(new CustomEvent('localStorageFilesChanged'));
  }
}

export function updateLocalFile(path: string, content: string): void {
  const files = getAllLocalFiles();
  const fileIndex = files.findIndex((file) => file.path === path);

  if (fileIndex === -1) {
    const now = new Date().toISOString();
    files.push({
      path,
      content,
      syncedToBackend: false,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    files[fileIndex] = {
      ...files[fileIndex],
      content,
      syncedToBackend: false,
      updatedAt: new Date().toISOString(),
    };
  }

  saveAllLocalFiles(files);

  window.dispatchEvent(new CustomEvent('localStorageFilesChanged'));
}

export function updateLocalFileMetadata(path: string, tags: string[], category: string): void {
  const files = getAllLocalFiles();
  const fileIndex = files.findIndex((file) => file.path === path);

  if (fileIndex === -1) {
    const now = new Date().toISOString();
    files.push({
      path,
      content: '',
      syncedToBackend: false,
      tags,
      category: category.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    files[fileIndex] = {
      ...files[fileIndex],
      tags,
      category: category.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };
  }

  saveAllLocalFiles(files);

  window.dispatchEvent(new CustomEvent('localStorageFilesChanged'));
}

export function deleteLocalFile(path: string): void {
  const files = getAllLocalFiles();

  const filtered = files.filter((file) => {
    if (file.path === path) return false;
    if (file.path.endsWith(`/${path}`)) return false;
    if (path.endsWith(`/${file.path}`)) return false;
    return true;
  });

  saveAllLocalFiles(filtered);

  window.dispatchEvent(new CustomEvent('localStorageFilesChanged'));
}

export function purgeLocalFile(path: string): void {
  const files = getAllLocalFiles();
  const normalizedPath = path.replace(/^\/+|\/+$/g, '');

  const filtered = files.filter((file) => {
    const normalizedFilePath = file.path.replace(/^\/+|\/+$/g, '');
    if (normalizedFilePath === normalizedPath) return false;
    if (normalizedFilePath.split('/').pop() === normalizedPath.split('/').pop()) return false;
    return true;
  });

  saveAllLocalFiles(filtered);

  window.dispatchEvent(new CustomEvent('localStorageFilesChanged'));
}
