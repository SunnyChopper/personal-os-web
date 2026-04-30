import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { chatbotService } from '@/services/chatbot.service';
import { useBackendStatus } from '@/contexts/BackendStatusContext';
import { queryKeys } from '@/lib/react-query/query-keys';
import { extractApiError, isNetworkError } from '@/lib/react-query/error-utils';
import { isLocalAssistantThreadId } from '@/lib/chat/local-thread-id';
import type { ChatMessage, MessageTreeResponse } from '@/types/chatbot';
import { assistantChatQueryDefaults } from '@/hooks/chatbot/chatbot-query-shared';
import { mergeFetchedMessageTreeWithCache } from '@/lib/react-query/chatbot-cache';

export function useChatMessages(threadId: string | undefined) {
  const { recordError, recordSuccess } = useBackendStatus();

  const { data, isLoading, error, isError } = useQuery({
    queryKey: queryKeys.chatbot.messages.list(threadId || ''),
    queryFn: async () => {
      if (!threadId) {
        return [];
      }
      try {
        const messages = await chatbotService.getMessages(threadId);
        recordSuccess();
        return messages;
      } catch (err: unknown) {
        const apiError = extractApiError(err);
        if (apiError && isNetworkError(apiError)) {
          recordError(apiError);
        }
        throw err;
      }
    },
    enabled: !!threadId && !isLocalAssistantThreadId(threadId),
    ...assistantChatQueryDefaults,
  });

  const apiError = error ? extractApiError(error) : null;

  return {
    messages: data || [],
    isLoading: isLoading && !isError,
    isError,
    error: apiError || error,
  };
}

export function useMessageTree(threadId: string | undefined) {
  const queryClient = useQueryClient();
  const { recordError, recordSuccess } = useBackendStatus();

  const { data, isLoading, error, isError, refetch } = useQuery({
    queryKey: queryKeys.chatbot.messages.tree(threadId || ''),
    queryFn: async () => {
      if (!threadId) {
        return null;
      }
      try {
        const tree = await chatbotService.getMessageTree(threadId);
        const prev = queryClient.getQueryData<MessageTreeResponse>(
          queryKeys.chatbot.messages.tree(threadId)
        );
        recordSuccess();
        return mergeFetchedMessageTreeWithCache(tree, prev);
      } catch (err: unknown) {
        const apiError = extractApiError(err);
        if (apiError && isNetworkError(apiError)) {
          recordError(apiError);
        }
        throw err;
      }
    },
    enabled: !!threadId && !isLocalAssistantThreadId(threadId),
    ...assistantChatQueryDefaults,
  });

  const apiError = error ? extractApiError(error) : null;
  const nodeById = useMemo(() => {
    if (!data?.nodes) {
      return new Map<string, ChatMessage>();
    }
    return new Map(data.nodes.map((node) => [node.id, node]));
  }, [data]);

  return {
    tree: data || null,
    nodeById,
    isLoading: isLoading && !isError,
    isError,
    error: apiError || error,
    refetch,
  };
}
