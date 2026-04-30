import type { QueryClient, QueryKey } from '@tanstack/react-query';
import type { ChatMessage, ChatThread, MessageTreeResponse } from '@/types/chatbot';
import { queryKeys } from '@/lib/react-query/query-keys';

type ListCache<T> = { data?: T[] } | T[];

const extractListData = <T>(value: ListCache<T> | undefined): T[] => {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.data)) return value.data;
  return [];
};

const mergeListData = <T>(value: ListCache<T> | undefined, data: T[]): ListCache<T> => {
  if (Array.isArray(value)) return data;
  if (value && typeof value === 'object') {
    return { ...value, data };
  }
  return { data };
};

const updateListQueries = <T>(
  queryClient: QueryClient,
  queryKeyBase: QueryKey,
  updater: (items: T[]) => T[]
): void => {
  const queries = queryClient.getQueriesData<ListCache<T>>({ queryKey: queryKeyBase });
  queries.forEach(([key, data]) => {
    const next = updater(extractListData<T>(data));
    queryClient.setQueryData(key, mergeListData<T>(data, next));
  });
};

const upsertById = <T extends { id: string }>(items: T[], item: T): T[] => {
  const index = items.findIndex((existing) => existing.id === item.id);
  if (index === -1) {
    return [...items, item];
  }
  const next = [...items];
  next[index] = item;
  return next;
};

const removeById = <T extends { id: string }>(items: T[], id: string): T[] =>
  items.filter((item) => item.id !== id);

const sortThreads = (threads: ChatThread[]): ChatThread[] =>
  [...threads].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

const sortMessages = (messages: ChatMessage[]): ChatMessage[] =>
  [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

/**
 * Merge assistant trace arrays from HTTP/refetch vs React Query cache (or WS buffer vs payload).
 * - Empty `incoming` never wipes a non-empty cache.
 * - When both non-empty, keep the **longer** list (WS/cache often has more steps than a
 *   partially-persisted or lagging API snapshot — this was losing the accordion in production).
 * - Same length: prefer `incoming` (server payload slightly fresher).
 */
export function preferRicherTraceArray<T extends readonly unknown[] | undefined | null>(
  incoming: T,
  cached: T
): T | undefined {
  const inLen = incoming?.length ?? 0;
  const cacheLen = cached?.length ?? 0;
  if (inLen === 0 && cacheLen === 0) {
    return (incoming ?? cached) as T;
  }
  if (inLen === 0) {
    return cached as T;
  }
  if (cacheLen === 0) {
    return incoming as T;
  }
  if (inLen > cacheLen) {
    return incoming as T;
  }
  if (cacheLen > inLen) {
    return cached as T;
  }
  return incoming as T;
}

export const upsertChatThreadCache = (queryClient: QueryClient, thread: ChatThread): void => {
  const merge = (items: ChatThread[]) => sortThreads(upsertById(items, thread));
  updateListQueries<ChatThread>(queryClient, queryKeys.chatbot.threads.lists(), merge);
  // Always patch the canonical list key used by useChatThreads so updates apply even if
  // findAll(filters) misses (e.g. timing with persistence / strict mode).
  const listKey = queryKeys.chatbot.threads.lists();
  queryClient.setQueryData(listKey, (old: ListCache<ChatThread> | undefined) =>
    mergeListData(old, merge(extractListData(old)))
  );
  queryClient.setQueryData(queryKeys.chatbot.threads.detail(thread.id), thread);
};

/**
 * Apply a thread title update from assistant WebSocket `threadUpdated`.
 * Detail cache may be empty while `useChatThread` is still loading (race after first send);
 * fall back to the threads list entry or a minimal thread so the sidebar updates.
 */
export const upsertThreadTitleFromWs = (
  queryClient: QueryClient,
  threadId: string,
  title: string,
  updatedAt: string
): void => {
  const detail = queryClient.getQueryData<ChatThread>(queryKeys.chatbot.threads.detail(threadId));
  if (detail) {
    upsertChatThreadCache(queryClient, { ...detail, title, updatedAt });
    return;
  }

  const listQueries = queryClient.getQueriesData<ListCache<ChatThread>>({
    queryKey: queryKeys.chatbot.threads.lists(),
  });
  for (const [, data] of listQueries) {
    const items = extractListData<ChatThread>(data);
    const fromList = items.find((t) => t.id === threadId);
    if (fromList) {
      upsertChatThreadCache(queryClient, { ...fromList, title, updatedAt });
      return;
    }
  }

  upsertChatThreadCache(queryClient, {
    id: threadId,
    userId: '',
    title,
    createdAt: updatedAt,
    updatedAt,
  });
};

export const removeChatThreadCache = (queryClient: QueryClient, threadId: string): void => {
  updateListQueries<ChatThread>(queryClient, queryKeys.chatbot.threads.lists(), (items) =>
    removeById(items, threadId)
  );
  queryClient.removeQueries({ queryKey: queryKeys.chatbot.threads.detail(threadId) });
  queryClient.removeQueries({ queryKey: queryKeys.chatbot.messages.list(threadId) });
  queryClient.removeQueries({ queryKey: queryKeys.chatbot.messages.tree(threadId) });
};

export const upsertChatMessageCache = (queryClient: QueryClient, message: ChatMessage): void => {
  updateListQueries<ChatMessage>(
    queryClient,
    queryKeys.chatbot.messages.list(message.threadId),
    (items) => sortMessages(upsertById(items, message))
  );
};

export const patchChatMessageCache = (
  queryClient: QueryClient,
  threadId: string,
  messageId: string,
  updater: (message: ChatMessage) => ChatMessage
): void => {
  updateListQueries<ChatMessage>(queryClient, queryKeys.chatbot.messages.list(threadId), (items) =>
    sortMessages(items.map((message) => (message.id === messageId ? updater(message) : message)))
  );
};

export const removeChatMessageCache = (
  queryClient: QueryClient,
  threadId: string,
  messageId: string
): void => {
  updateListQueries<ChatMessage>(queryClient, queryKeys.chatbot.messages.list(threadId), (items) =>
    sortMessages(removeById(items, messageId))
  );
};

export const replaceChatThreadMessages = (
  queryClient: QueryClient,
  threadId: string,
  messages: ChatMessage[]
): void => {
  queryClient.setQueryData(queryKeys.chatbot.messages.list(threadId), sortMessages(messages));
};

export const replaceMessageTreeCache = (
  queryClient: QueryClient,
  threadId: string,
  tree: MessageTreeResponse
): void => {
  queryClient.setQueryData(queryKeys.chatbot.messages.tree(threadId), tree);
};

/**
 * When React Query refetches `/messages/tree`, the HTTP snapshot can race behind WebSocket
 * persistence. Merge preserves assistant `executionSteps` / `toolCallDetails` from cache when
 * the server omits them, sends empty arrays, or returns a shorter trace than the live cache.
 */
export function mergeFetchedMessageTreeWithCache(
  incoming: MessageTreeResponse,
  prev: MessageTreeResponse | null | undefined
): MessageTreeResponse {
  if (!prev?.nodes.length) {
    return incoming;
  }
  const prevById = new Map(prev.nodes.map((n) => [n.id, n]));
  return {
    ...incoming,
    nodes: incoming.nodes.map((node) => {
      if (node.role !== 'assistant') {
        return node;
      }
      const old = prevById.get(node.id);
      if (!old || old.role !== 'assistant') {
        return node;
      }
      const incomingBodyEmpty = !(node.content && node.content.trim());
      const preserveBody = incomingBodyEmpty && Boolean(old.content && old.content.trim());
      return {
        ...old,
        ...node,
        ...(preserveBody ? { content: old.content } : {}),
        executionSteps: preferRicherTraceArray(node.executionSteps, old.executionSteps),
        toolCallDetails: preferRicherTraceArray(node.toolCallDetails, old.toolCallDetails),
      };
    }),
  };
}

const upsertOrMergeMessageNode = (items: ChatMessage[], item: ChatMessage): ChatMessage[] => {
  const index = items.findIndex((n) => n.id === item.id);
  if (index === -1) {
    return [...items, item];
  }
  const next = [...items];
  const existing = next[index];
  if (existing.role === 'assistant' && item.role === 'assistant') {
    const incomingEmpty = !(item.content && item.content.trim());
    const preserveStreamedBody =
      incomingEmpty && Boolean(existing.content && existing.content.trim());
    next[index] = {
      ...existing,
      ...item,
      ...(preserveStreamedBody ? { content: existing.content } : {}),
      executionSteps: preferRicherTraceArray(item.executionSteps, existing.executionSteps),
      toolCallDetails: preferRicherTraceArray(item.toolCallDetails, existing.toolCallDetails),
    };
  } else {
    next[index] = { ...existing, ...item };
  }
  return next;
};

export const removeNodeFromTree = (
  tree: MessageTreeResponse,
  nodeId: string
): MessageTreeResponse => {
  const removedNode = tree.nodes.find((node) => node.id === nodeId);
  if (!removedNode) {
    return tree;
  }

  const nodes = tree.nodes.filter((node) => node.id !== nodeId);
  const childrenByParentId: Record<string, string[]> = {};
  Object.entries(tree.childrenByParentId).forEach(([key, children]) => {
    childrenByParentId[key] = children.filter((childId) => childId !== nodeId);
  });
  let leafIds = tree.leafIds.filter((id) => id !== nodeId);
  const removedParentId = removedNode.parentId;
  if (removedParentId) {
    const parentChildren = childrenByParentId[removedParentId] ?? [];
    const parentStillExists = nodes.some((node) => node.id === removedParentId);
    if (parentStillExists && parentChildren.length === 0 && !leafIds.includes(removedParentId)) {
      leafIds = [...leafIds, removedParentId];
    }
  }

  return {
    ...tree,
    nodes,
    childrenByParentId,
    leafIds,
  };
};

export const upsertMessageTreeNodeCache = (
  queryClient: QueryClient,
  threadId: string,
  message: ChatMessage
): void => {
  const ROOT_KEY = 'ROOT';
  const existing = queryClient.getQueryData<MessageTreeResponse>(
    queryKeys.chatbot.messages.tree(threadId)
  );

  // Bootstrap a minimal empty tree if none exists yet (e.g. first message in a new thread).
  const tree: MessageTreeResponse = existing ?? {
    rootKey: ROOT_KEY,
    nodes: [],
    childrenByParentId: {},
    leafIds: [],
  };

  const existed = tree.nodes.some((node) => node.id === message.id);
  const nodes = upsertOrMergeMessageNode(tree.nodes, message);
  if (existed) {
    queryClient.setQueryData(queryKeys.chatbot.messages.tree(threadId), {
      ...tree,
      nodes,
    });
    return;
  }

  const parentKey = message.parentId ?? tree.rootKey;
  const currentChildren = tree.childrenByParentId[parentKey] ?? [];
  const childrenByParentId = {
    ...tree.childrenByParentId,
    [parentKey]: [...currentChildren, message.id],
  };

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  childrenByParentId[parentKey] = [...new Set(childrenByParentId[parentKey])].sort((a, b) => {
    const aDate = nodeById.get(a)?.createdAt ?? '';
    const bDate = nodeById.get(b)?.createdAt ?? '';
    return new Date(aDate).getTime() - new Date(bDate).getTime();
  });

  let leafIds = tree.leafIds;
  if (message.parentId) {
    leafIds = leafIds.filter((id) => id !== message.parentId);
  }
  if (!childrenByParentId[message.id] || childrenByParentId[message.id].length === 0) {
    if (!leafIds.includes(message.id)) {
      leafIds = [...leafIds, message.id];
    }
  }

  queryClient.setQueryData(queryKeys.chatbot.messages.tree(threadId), {
    ...tree,
    nodes,
    childrenByParentId,
    leafIds,
  });
};
