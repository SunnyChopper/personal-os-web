/**
 * Hook for managing local markdown files in localStorage.
 * Implementation lives in @/lib/markdown/local-files-store (pure, no React).
 */

export type { LocalFile } from '@/lib/markdown/local-files-store';
export {
  createLocalFile,
  deleteLocalFile,
  getAllLocalFiles,
  getLocalFile,
  isLocalOnlyFile,
  markAsSynced,
  purgeLocalFile,
  updateLocalFile,
  updateLocalFileMetadata,
} from '@/lib/markdown/local-files-store';

import {
  createLocalFile,
  deleteLocalFile,
  getAllLocalFiles,
  getLocalFile,
  isLocalOnlyFile,
  markAsSynced,
  purgeLocalFile,
  updateLocalFile,
  updateLocalFileMetadata,
} from '@/lib/markdown/local-files-store';

export function useLocalFiles() {
  return {
    createLocalFile,
    getLocalFile,
    updateLocalFile,
    deleteLocalFile,
    purgeLocalFile,
    getAllLocalFiles,
    isLocalOnlyFile,
    markAsSynced,
    updateLocalFileMetadata,
  };
}
