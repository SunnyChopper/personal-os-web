import type { IStorageAdapter } from './storage-interface';

const STORAGE_PREFIX = 'gs_';

interface StorageData<T> {
  [key: string]: T;
}

class LocalStorageCollection<T> {
  private storageKey: string;

  constructor(entityName: string) {
    this.storageKey = `${STORAGE_PREFIX}${entityName}`;
  }

  private getData(): StorageData<T> {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : {};
  }

  private setData(data: StorageData<T>): void {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  getAll(): T[] {
    const data = this.getData();
    return Object.values(data);
  }

  getById(id: string): T | null {
    const data = this.getData();
    return data[id] || null;
  }

  create(id: string, entity: T): T {
    const data = this.getData();
    data[id] = entity;
    this.setData(data);
    return entity;
  }

  update(id: string, updates: Partial<T>): T | null {
    const data = this.getData();
    const existing = data[id];
    if (!existing) return null;

    const updated = { ...existing, ...updates };
    data[id] = updated;
    this.setData(data);
    return updated;
  }

  delete(id: string): boolean {
    const data = this.getData();
    if (!data[id]) return false;

    delete data[id];
    this.setData(data);
    return true;
  }

  clear(): void {
    localStorage.removeItem(this.storageKey);
  }

  seed(entities: T[]): void {
    const data: StorageData<T> = {};
    entities.forEach((entity) => {
      const id = (entity as Record<string, unknown>).id as string;
      data[id] = entity;
    });
    this.setData(data);
  }
}

export class LocalStorageAdapter implements IStorageAdapter {
  private collections: Map<string, LocalStorageCollection<unknown>> = new Map();

  private getCollection<T>(name: string): LocalStorageCollection<T> {
    if (!this.collections.has(name)) {
      this.collections.set(name, new LocalStorageCollection<T>(name));
    }
    return this.collections.get(name) as LocalStorageCollection<T>;
  }

  async getAll<T>(collection: string): Promise<T[]> {
    return Promise.resolve(this.getCollection<T>(collection).getAll());
  }

  async getById<T>(collection: string, id: string): Promise<T | null> {
    return Promise.resolve(this.getCollection<T>(collection).getById(id));
  }

  async create<T>(collection: string, id: string, entity: T): Promise<T> {
    return Promise.resolve(this.getCollection<T>(collection).create(id, entity));
  }

  async update<T>(collection: string, id: string, updates: Partial<T>): Promise<T | null> {
    return Promise.resolve(this.getCollection<T>(collection).update(id, updates));
  }

  async delete(collection: string, id: string): Promise<boolean> {
    return Promise.resolve(this.getCollection(collection).delete(id));
  }

  clear(collection: string): void {
    this.getCollection(collection).clear();
  }

  seed<T>(collection: string, entities: T[]): void {
    this.getCollection<T>(collection).seed(entities);
  }

  async createRelation(
    collection: string,
    id: string,
    relation: Record<string, unknown>
  ): Promise<void> {
    const coll = this.getCollection<Record<string, unknown>>(collection);
    await coll.create(id, relation);
  }

  async deleteRelation(collection: string, id: string): Promise<boolean> {
    return this.delete(collection, id);
  }

  async getRelations<T>(collection: string, filters: Record<string, unknown>): Promise<T[]> {
    const allItems = await this.getAll<T>(collection);
    return allItems.filter((item: T) => {
      return Object.entries(filters).every(([key, value]) => {
        return (item as Record<string, unknown>)[key] === value;
      });
    });
  }
}
