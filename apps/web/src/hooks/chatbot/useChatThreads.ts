import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatbotService } from '@/services/chatbot.service';
import { useBackendStatus } from '@/contexts/BackendStatusContext';
import { queryKeys } from '@/lib/react-query/query-keys';
import { extractApiError, isNetworkError } from '@/lib/react-query/error-utils';
import { isLocalAssistantThreadId } from '@/lib/chat/local-thread-id';
import type { ChatThread } from '@/types/chatbot';
import {
  assistantChatQueryDefaults,
  normalizeChatThreadsQueryData,
} from '@/hooks/chatbot/chatbot-query-shared';

function findThreadInListCache(
  queryClient: ReturnType<typeof useQueryClient>,
  threadId: string
): ChatThread | undefined {
  const listData = queryClient.getQueryData(queryKeys.chatbot.threads.lists());
  return normalizeChatThreadsQueryData(listData).find((thread) => thread.id === threadId);
}

export function useChatThreads() {
  const { recordError, recordSuccess } = useBackendStatus();

  const { data, isLoading, error, isError, refetch } = useQuery({
    queryKey: queryKeys.chatbot.threads.lists(),
    queryFn: async () => {
      try {
        const threads = await chatbotService.getThreads();
        recordSuccess();
        return threads;
      } catch (err: unknown) {
        const apiError = extractApiError(err);
        if (apiError && isNetworkError(apiError)) {
          recordError(apiError);
        }
        throw err;
      }
    },
    enabled: true,
    ...assistantChatQueryDefaults,
  });

  const apiError = error ? extractApiError(error) : null;

  return {
    threads: normalizeChatThreadsQueryData(data),
    isLoading: isLoading && !isError,
    isError,
    error: apiError || error,
    refetch,
  };
}

export function useChatThread(id: string | undefined) {
  const queryClient = useQueryClient();
  const { recordError, recordSuccess } = useBackendStatus();

  const { data, isLoading, error, isError } = useQuery({
    queryKey: queryKeys.chatbot.threads.detail(id || ''),
    queryFn: async () => {
      if (!id) {
        return null;
      }
      try {
        const thread = await chatbotService.getThread(id);
        if (thread) {
          recordSuccess();
        }
        return thread;
      } catch (err: unknown) {
        const apiError = extractApiError(err);
        if (apiError && isNetworkError(apiError)) {
          recordError(apiError);
        }
        throw err;
      }
    },
    enabled: !!id && !isLocalAssistantThreadId(id),
    placeholderData: () => {
      if (!id) {
        return undefined;
      }
      return findThreadInListCache(queryClient, id);
    },
    ...assistantChatQueryDefaults,
  });

  const apiError = error ? extractApiError(error) : null;

  return {
    thread: data || null,
    isLoading: isLoading && !isError,
    isError,
    error: apiError || error,
  };
}
