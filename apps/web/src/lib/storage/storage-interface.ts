export interface IStorageAdapter {
  getAll<T>(collection: string): Promise<T[]>;
  getById<T>(collection: string, id: string): Promise<T | null>;
  create<T>(collection: string, id: string, entity: T): Promise<T>;
  update<T>(collection: string, id: string, updates: Partial<T>): Promise<T | null>;
  delete(collection: string, id: string): Promise<boolean>;
  clear(collection: string): void;
  seed<T>(collection: string, entities: T[]): void;

  createRelation(collection: string, id: string, relation: Record<string, unknown>): Promise<void>;
  deleteRelation(collection: string, id: string): Promise<boolean>;
  getRelations<T>(collection: string, filters: Record<string, unknown>): Promise<T[]>;
}
