import type { IStorageAdapter } from './storage-interface';
import { apiClient } from '@/lib/api-client';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export class APIStorageAdapter implements IStorageAdapter {
  async getAll<T>(collection: string): Promise<T[]> {
    const response = await apiClient.get<PaginatedResponse<T>>(`/${collection}`);
    if (response.success && response.data) {
      // Backend returns paginated response with data array
      return response.data.data;
    }
    throw new Error(response.error?.message || 'Failed to fetch items');
  }

  async getById<T>(collection: string, id: string): Promise<T | null> {
    const response = await apiClient.get<T>(`/${collection}/${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    if (response.error?.code === 'NOT_FOUND' || response.error?.code === 'HTTP_404') {
      return null;
    }
    throw new Error(response.error?.message || 'Failed to fetch item');
  }

  async create<T>(collection: string, _id: string, entity: T): Promise<T> {
    const response = await apiClient.post<T>(`/${collection}`, entity);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to create item');
  }

  async update<T>(collection: string, id: string, updates: Partial<T>): Promise<T | null> {
    const response = await apiClient.patch<T>(`/${collection}/${id}`, updates);
    if (response.success && response.data) {
      return response.data;
    }
    if (response.error?.code === 'NOT_FOUND' || response.error?.code === 'HTTP_404') {
      return null;
    }
    throw new Error(response.error?.message || 'Failed to update item');
  }

  async delete(collection: string, id: string): Promise<boolean> {
    const response = await apiClient.delete(`/${collection}/${id}`);
    if (response.success) {
      return true;
    }
    if (response.error?.code === 'NOT_FOUND' || response.error?.code === 'HTTP_404') {
      return false;
    }
    throw new Error(response.error?.message || 'Failed to delete item');
  }

  clear(_collection: string): void {
    console.warn('Clear operation is not supported on API storage adapter');
  }

  seed<T>(_collection: string, _entities: T[]): void {
    console.warn('Seed operation is not supported on API storage adapter');
  }

  async createRelation(
    collection: string,
    _id: string,
    relation: Record<string, unknown>
  ): Promise<void> {
    const response = await apiClient.post(`/${collection}`, relation);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to create relation');
    }
  }

  async deleteRelation(collection: string, id: string): Promise<boolean> {
    return this.delete(collection, id);
  }

  async getRelations<T>(collection: string, filters: Record<string, unknown>): Promise<T[]> {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      queryParams.append(key, String(value));
    });

    const response = await apiClient.get<PaginatedResponse<T>>(
      `/${collection}?${queryParams.toString()}`
    );
    if (response.success && response.data) {
      // Backend returns paginated response with data array
      return response.data.data;
    }
    throw new Error(response.error?.message || 'Failed to fetch relations');
  }
}
