import { useQuery } from '@tanstack/react-query';
import { chatbotService } from '@/services/chatbot.service';
import { useBackendStatus } from '@/contexts/BackendStatusContext';
import { queryKeys } from '@/lib/react-query/query-keys';
import { extractApiError, isNetworkError } from '@/lib/react-query/error-utils';
import { isLocalAssistantThreadId } from '@/lib/chat/local-thread-id';
import {
  assistantChatQueryDefaults,
  normalizeChatThreadsQueryData,
} from '@/hooks/chatbot/chatbot-query-shared';

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
