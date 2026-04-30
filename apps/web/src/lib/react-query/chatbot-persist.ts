import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { defaultShouldDehydrateQuery } from '@tanstack/react-query';
import { del, get, set } from 'idb-keyval';
import type { Query } from '@tanstack/react-query';

/** Bump when persisted chatbot payload shape is incompatible with prior builds. */
export const CHATBOT_CACHE_BUSTER = 'chatbot-persist-v1';

const PERSIST_KEY = 'personal-os-tanstack-query-chatbot';

const idbStringStorage = {
  getItem: async (key: string) => (await get<string>(key)) ?? null,
  setItem: async (key: string, value: string) => {
    await set(key, value);
  },
  removeItem: async (key: string) => {
    await del(key);
  },
};

export const chatbotAsyncPersister = createAsyncStoragePersister({
  storage: idbStringStorage,
  key: PERSIST_KEY,
  throttleTime: 1000,
});

/** Query keys are the logical index; no separate IndexedDB indexes. */
export function shouldPersistChatbotQuery(query: Query): boolean {
  if (!defaultShouldDehydrateQuery(query)) {
    return false;
  }
  const key = query.queryKey;
  if (!Array.isArray(key) || key[0] !== 'chatbot') {
    return false;
  }
  return !JSON.stringify(key).includes('"local-');
}
