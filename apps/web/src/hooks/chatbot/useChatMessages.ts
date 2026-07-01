import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLayoutEffect, useMemo } from 'react';
import { chatbotService } from '@/services/chatbot.service';
import { useBackendStatus } from '@/contexts/BackendStatusContext';
import { queryKeys } from '@/lib/react-query/query-keys';
import { extractApiError, isNetworkError } from '@/lib/react-query/error-utils';
import { isLocalAssistantThreadId } from '@/lib/chat/local-thread-id';
import type { ChatMessage, MessageTreeResponse } from '@/types/chatbot';
import { assistantChatQueryDefaults } from '@/hooks/chatbot/chatbot-query-shared';
import {
  ensureMessageTreeInfiniteCache,
  mergeFetchedMessageTreeWithCache,
  mergeMessageTreePages,
  readMergedMessageTreeFromCache,
} from '@/lib/react-query/chatbot-cache';

/** Recent-first page size for assistant message tree pagination. */
export const ASSISTANT_MESSAGE_TREE_PAGE_SIZE = 40;

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

  useLayoutEffect(() => {
    if (!threadId || isLocalAssistantThreadId(threadId)) {
      return;
    }
    ensureMessageTreeInfiniteCache(queryClient, threadId);
  }, [queryClient, threadId]);

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    error,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.chatbot.messages.tree(threadId || ''),
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      if (!threadId) {
        return null;
      }
      try {
        const tree = await chatbotService.getMessageTree(threadId, {
          limit: ASSISTANT_MESSAGE_TREE_PAGE_SIZE,
          before: pageParam,
        });
        const prevTree = readMergedMessageTreeFromCache(queryClient, threadId);
        recordSuccess();
        return mergeFetchedMessageTreeWithCache(tree, prevTree);
      } catch (err: unknown) {
        const apiError = extractApiError(err);
        if (apiError && isNetworkError(apiError)) {
          recordError(apiError);
        }
        throw err;
      }
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage?.hasMore || !lastPage.nextCursor) {
        return undefined;
      }
      return lastPage.nextCursor;
    },
    enabled: !!threadId && !isLocalAssistantThreadId(threadId),
    ...assistantChatQueryDefaults,
  });

  const tree = useMemo(() => {
    if (!data?.pages?.length) {
      return null;
    }
    const pages = data.pages.filter((page): page is MessageTreeResponse => page != null);
    if (pages.length === 0) {
      return null;
    }
    return mergeMessageTreePages(pages);
  }, [data]);

  const apiError = error ? extractApiError(error) : null;
  const nodeById = useMemo(() => {
    if (!tree?.nodes) {
      return new Map<string, ChatMessage>();
    }
    return new Map(tree.nodes.map((node) => [node.id, node]));
  }, [tree]);

  return {
    tree,
    nodeById,
    isLoading: isLoading && !isError,
    isFetching: isFetching && !isError,
    isError,
    error: apiError || error,
    refetch,
    fetchEarlier: fetchNextPage,
    hasEarlier: Boolean(hasNextPage),
    isFetchingEarlier: isFetchingNextPage,
  };
}
