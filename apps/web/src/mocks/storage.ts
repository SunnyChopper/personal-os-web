const STORAGE_PREFIX = 'gs_';

interface StorageData<T> {
  [key: string]: T;
}

export class MockStorage<T> {
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

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randomDelay(min = 100, max = 500): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return delay(ms);
}
