import { extractApiError, isNetworkError } from '@/lib/react-query/error-utils';
import type { ApiError } from '@/types/api-contracts';
import type { ChatThread } from '@/types/chatbot';

export const assistantChatQueryDefaults = {
  refetchOnWindowFocus: true as const,
  staleTime: 5 * 60 * 1000,
};

/** Thread list cache uses plain arrays or `{ data: T[] }` (see chatbot-cache mergeListData). */
export function normalizeChatThreadsQueryData(data: unknown): ChatThread[] {
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'object' && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: ChatThread[] }).data;
  }
  return [];
}

export const reportMutationError = (error: unknown, recordError: (error: ApiError) => void) => {
  const apiError = extractApiError(error);
  if (apiError && isNetworkError(apiError)) {
    recordError(apiError);
  }
};
