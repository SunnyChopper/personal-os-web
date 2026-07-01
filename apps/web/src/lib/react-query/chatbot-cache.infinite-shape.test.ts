import { InfiniteQueryObserver, QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import type { MessageTreeResponse } from '@/types/chatbot';
import {
  ensureMessageTreeInfiniteCache,
  isMessageTreeInfiniteCache,
  readMergedMessageTreeFromCache,
  replaceMessageTreeCache,
  upsertMessageTreeNodeCache,
  wrapMessageTreeAsInfiniteData,
} from '@/lib/react-query/chatbot-cache';
import { queryKeys } from '@/lib/react-query/query-keys';

const emptyTree = (): MessageTreeResponse => ({
  rootKey: 'ROOT',
  nodes: [],
  childrenByParentId: {},
  leafIds: [],
});

describe('message tree infinite query cache shape', () => {
  const threadId = 'thread-infinite-shape';

  it('wrapMessageTreeAsInfiniteData matches useInfiniteQuery expectations', () => {
    const wrapped = wrapMessageTreeAsInfiniteData(emptyTree());
    expect(wrapped.pages).toHaveLength(1);
    expect(wrapped.pageParams).toEqual([undefined]);
    expect(isMessageTreeInfiniteCache(wrapped)).toBe(true);
  });

  it('migrates legacy flat cache before InfiniteQueryObserver subscribes', () => {
    const queryClient = new QueryClient();
    const flat = emptyTree();
    queryClient.setQueryData(queryKeys.chatbot.messages.tree(threadId), flat);

    ensureMessageTreeInfiniteCache(queryClient, threadId);

    const cached = queryClient.getQueryData(queryKeys.chatbot.messages.tree(threadId));
    expect(isMessageTreeInfiniteCache(cached)).toBe(true);
    expect(readMergedMessageTreeFromCache(queryClient, threadId)).toEqual(flat);
  });

  it('does not throw when InfiniteQueryObserver reads migrated cache', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.chatbot.messages.tree(threadId), emptyTree());
    ensureMessageTreeInfiniteCache(queryClient, threadId);

    const observer = new InfiniteQueryObserver(queryClient, {
      queryKey: queryKeys.chatbot.messages.tree(threadId),
      queryFn: async () => emptyTree(),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: () => undefined,
    });

    expect(() => observer.getCurrentResult()).not.toThrow();
    expect(observer.getCurrentResult().data?.pages).toHaveLength(1);
  });

  it('upsertMessageTreeNodeCache writes infinite shape', () => {
    const queryClient = new QueryClient();
    upsertMessageTreeNodeCache(queryClient, threadId, {
      id: 'u1',
      threadId,
      role: 'user',
      content: 'Hi',
      createdAt: '2026-01-01',
    });
    const cached = queryClient.getQueryData(queryKeys.chatbot.messages.tree(threadId));
    expect(isMessageTreeInfiniteCache(cached)).toBe(true);
  });

  it('replaceMessageTreeCache writes infinite shape', () => {
    const queryClient = new QueryClient();
    replaceMessageTreeCache(queryClient, threadId, emptyTree());
    const cached = queryClient.getQueryData(queryKeys.chatbot.messages.tree(threadId));
    expect(isMessageTreeInfiniteCache(cached)).toBe(true);
  });
});
