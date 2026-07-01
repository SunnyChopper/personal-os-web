/** Unwrap `{ success, data, error }` API envelopes for React Query hooks. */

export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: { message?: string; code?: string };
};

export function unwrapApiData<T>(res: ApiEnvelope<T>): T {
  if (res.success && res.data !== undefined) {
    return res.data;
  }
  throw new Error(res.error?.message || 'Request failed');
}

export function unwrapApiList<T>(res: ApiEnvelope<{ items?: T[] } & Record<string, unknown>>): T[] {
  const data = unwrapApiData(res);
  if (Array.isArray(data.items)) {
    return data.items;
  }
  if (Array.isArray(data as unknown as T[])) {
    return data as unknown as T[];
  }
  return [];
}
