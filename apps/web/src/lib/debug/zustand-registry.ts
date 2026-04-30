import type { StoreApi } from 'zustand/vanilla';
import { createStore } from 'zustand/vanilla';

export type ZustandStoreEntry = {
  name: string;
  store: StoreApi<unknown>;
};

const zustandRegistry = new Map<string, StoreApi<unknown>>();

export function registerZustandStore(name: string, store: StoreApi<unknown>): () => void {
  zustandRegistry.set(name, store);
  return () => {
    zustandRegistry.delete(name);
  };
}

export function getZustandStores(): ZustandStoreEntry[] {
  return Array.from(zustandRegistry.entries()).map(([name, store]) => ({ name, store }));
}

export function getZustandStoreStates(): Array<{ name: string; state: unknown }> {
  return getZustandStores().map(({ name, store }) => {
    let state: unknown;
    try {
      state = store.getState();
    } catch (error) {
      state = { error: error instanceof Error ? error.message : 'Unknown error' };
    }
    return { name, state };
  });
}

export function createDebuggableStore<T>(
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createState: any
): StoreApi<T> {
  const store = createStore<T>(createState);
  registerZustandStore(name, store as StoreApi<unknown>);
  return store;
}
