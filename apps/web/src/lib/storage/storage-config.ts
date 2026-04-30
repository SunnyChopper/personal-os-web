import type { IStorageAdapter } from './storage-interface';
import { APIStorageAdapter } from './api-storage-adapter';

export class StorageConfig {
  private static instance: StorageConfig;
  private currentAdapter: IStorageAdapter;

  private constructor() {
    // Always use API adapter for backend storage
    this.currentAdapter = new APIStorageAdapter();
  }

  static getInstance(): StorageConfig {
    if (!StorageConfig.instance) {
      StorageConfig.instance = new StorageConfig();
    }
    return StorageConfig.instance;
  }

  getAdapter(): IStorageAdapter {
    return this.currentAdapter;
  }
}

export const storageConfig = StorageConfig.getInstance();
export const getStorageAdapter = (): IStorageAdapter => storageConfig.getAdapter();
