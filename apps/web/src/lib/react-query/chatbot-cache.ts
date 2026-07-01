import type { QueryClient, QueryKey } from '@tanstack/react-query';
import type { ChatMessage, ChatThread, MessageTreeResponse } from '@/types/chatbot';
import { threadRecencyMs } from '@/lib/chat/thread-recency';
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
  [...threads].sort((a, b) => threadRecencyMs(b) - threadRecencyMs(a));

const sortMessages = (messages: ChatMessage[]): ChatMessage[] =>
  [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

const ROOT_KEY = 'ROOT';

/** Build branch adjacency metadata from a chronological node list. */
export function buildMessageTreeFromNodes(nodes: ChatMessage[]): MessageTreeResponse {
  const uniqueById = new Map<string, ChatMessage>();
  sortMessages(nodes).forEach((node) => uniqueById.set(node.id, node));
  const messages = [...uniqueById.values()];

  const idToCreatedAt: Record<string, string> = {};
  for (const msg of messages) {
    idToCreatedAt[msg.id] = msg.createdAt;
  }

  const childrenByParentId: Record<string, string[]> = {};
  const parentIdsWithChildren = new Set<string>();

  for (const msg of messages) {
    const parentId = msg.parentId ?? ROOT_KEY;
    childrenByParentId[parentId] = childrenByParentId[parentId] ?? [];
    childrenByParentId[parentId].push(msg.id);
    if (parentId !== ROOT_KEY) {
      parentIdsWithChildren.add(parentId);
    }
  }

  for (const parentId of Object.keys(childrenByParentId)) {
    childrenByParentId[parentId].sort(
      (a, b) =>
        new Date(idToCreatedAt[a] ?? 0).getTime() - new Date(idToCreatedAt[b] ?? 0).getTime()
    );
  }

  const leafIds = messages
    .map((msg) => msg.id)
    .filter((id) => !parentIdsWithChildren.has(id))
    .sort(
      (a, b) =>
        new Date(idToCreatedAt[a] ?? 0).getTime() - new Date(idToCreatedAt[b] ?? 0).getTime()
    );

  return {
    rootKey: ROOT_KEY,
    nodes: messages,
    childrenByParentId,
    leafIds,
  };
}

/** Merge infinite-query pages (page 0 = newest) into one tree for branch selection. */
export function mergeMessageTreePages(pages: MessageTreeResponse[]): MessageTreeResponse {
  if (pages.length === 0) {
    return {
      rootKey: ROOT_KEY,
      nodes: [],
      childrenByParentId: {},
      leafIds: [],
      hasMore: false,
      nextCursor: null,
    };
  }
  const byId = new Map<string, ChatMessage>();
  for (let pageIndex = pages.length - 1; pageIndex >= 0; pageIndex -= 1) {
    for (const node of pages[pageIndex].nodes) {
      byId.set(node.id, node);
    }
  }
  const oldestPage = pages[pages.length - 1];
  const merged = buildMessageTreeFromNodes([...byId.values()]);
  return {
    ...merged,
    nextCursor: oldestPage.nextCursor ?? null,
    hasMore: oldestPage.hasMore ?? false,
  };
}

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

export type ThreadMetadataWsPatch = {
  title: string;
  updatedAt: string;
  lastMessageAt?: string;
  activeLeafMessageId?: string;
};

const mergeThreadMetadataPatch = (
  thread: ChatThread,
  patch: ThreadMetadataWsPatch
): ChatThread => ({
  ...thread,
  title: patch.title,
  updatedAt: patch.updatedAt,
  ...(patch.lastMessageAt ? { lastMessageAt: patch.lastMessageAt } : {}),
  ...(patch.activeLeafMessageId ? { activeLeafMessageId: patch.activeLeafMessageId } : {}),
});

/**
 * Apply thread metadata from assistant WebSocket `threadUpdated`.
 * Detail cache may be empty while `useChatThread` is still loading (race after first send);
 * fall back to the threads list entry or a minimal thread so the sidebar updates.
 */
export const upsertThreadMetadataFromWs = (
  queryClient: QueryClient,
  threadId: string,
  patch: ThreadMetadataWsPatch
): void => {
  const detail = queryClient.getQueryData<ChatThread>(queryKeys.chatbot.threads.detail(threadId));
  if (detail) {
    upsertChatThreadCache(queryClient, mergeThreadMetadataPatch(detail, patch));
    return;
  }

  const listQueries = queryClient.getQueriesData<ListCache<ChatThread>>({
    queryKey: queryKeys.chatbot.threads.lists(),
  });
  for (const [, data] of listQueries) {
    const items = extractListData<ChatThread>(data);
    const fromList = items.find((t) => t.id === threadId);
    if (fromList) {
      upsertChatThreadCache(queryClient, mergeThreadMetadataPatch(fromList, patch));
      return;
    }
  }

  upsertChatThreadCache(queryClient, {
    id: threadId,
    userId: '',
    title: patch.title,
    createdAt: patch.updatedAt,
    updatedAt: patch.updatedAt,
    ...(patch.lastMessageAt ? { lastMessageAt: patch.lastMessageAt } : {}),
    ...(patch.activeLeafMessageId ? { activeLeafMessageId: patch.activeLeafMessageId } : {}),
  });
};

/** @deprecated Use upsertThreadMetadataFromWs */
export const upsertThreadTitleFromWs = (
  queryClient: QueryClient,
  threadId: string,
  title: string,
  updatedAt: string
): void => {
  upsertThreadMetadataFromWs(queryClient, threadId, { title, updatedAt });
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

/** Shape required by `useInfiniteQuery` on `queryKeys.chatbot.messages.tree`. */
export type MessageTreeInfiniteData = {
  pages: MessageTreeResponse[];
  pageParams: (string | undefined)[];
};

export const isMessageTreeInfiniteCache = (value: unknown): value is MessageTreeInfiniteData =>
  Boolean(
    value &&
    typeof value === 'object' &&
    'pages' in value &&
    Array.isArray((value as MessageTreeInfiniteData).pages)
  );

const isLegacyFlatMessageTreeCache = (value: unknown): value is MessageTreeResponse =>
  Boolean(
    value &&
    typeof value === 'object' &&
    'nodes' in value &&
    Array.isArray((value as MessageTreeResponse).nodes) &&
    !isMessageTreeInfiniteCache(value)
  );

export const wrapMessageTreeAsInfiniteData = (
  tree: MessageTreeResponse
): MessageTreeInfiniteData => ({
  pages: [tree],
  pageParams: [undefined],
});

/**
 * Migrate legacy flat `MessageTreeResponse` cache entries before `useInfiniteQuery` subscribes.
 * TanStack Query reads `data.pages.length`; flat cache causes `Cannot read properties of undefined (reading 'length')`.
 */
export const ensureMessageTreeInfiniteCache = (
  queryClient: QueryClient,
  threadId: string
): void => {
  const key = queryKeys.chatbot.messages.tree(threadId);
  const cached = queryClient.getQueryData(key);
  if (!cached || isMessageTreeInfiniteCache(cached)) {
    return;
  }
  if (isLegacyFlatMessageTreeCache(cached)) {
    queryClient.setQueryData(key, wrapMessageTreeAsInfiniteData(cached));
  }
};

/** Merged tree across infinite pages (or legacy flat cache). */
export const readMergedMessageTreeFromCache = (
  queryClient: QueryClient,
  threadId: string
): MessageTreeResponse | undefined => {
  const cached = queryClient.getQueryData<MessageTreeResponse | MessageTreeInfiniteData>(
    queryKeys.chatbot.messages.tree(threadId)
  );
  if (!cached) {
    return undefined;
  }
  if (isMessageTreeInfiniteCache(cached)) {
    const pages = cached.pages.filter((page): page is MessageTreeResponse => page != null);
    if (pages.length === 0) {
      return undefined;
    }
    if (pages.length === 1) {
      return pages[0];
    }
    return mergeMessageTreePages(pages);
  }
  return cached as MessageTreeResponse;
};

export const replaceMessageTreeCache = (
  queryClient: QueryClient,
  threadId: string,
  tree: MessageTreeResponse
): void => {
  queryClient.setQueryData(
    queryKeys.chatbot.messages.tree(threadId),
    wrapMessageTreeAsInfiniteData(tree)
  );
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

export type UpsertMessageTreeOptions = {
  /** When true, incoming `content` wins even if empty (e.g. after `assistantContentReplace`). */
  authoritativeContent?: boolean;
};

const upsertOrMergeMessageNode = (
  items: ChatMessage[],
  item: ChatMessage,
  options?: UpsertMessageTreeOptions
): ChatMessage[] => {
  const index = items.findIndex((n) => n.id === item.id);
  if (index === -1) {
    return [...items, item];
  }
  const next = [...items];
  const existing = next[index];
  if (existing.role === 'assistant' && item.role === 'assistant') {
    const incomingEmpty = !(item.content && item.content.trim());
    const preserveStreamedBody =
      !options?.authoritativeContent &&
      incomingEmpty &&
      Boolean(existing.content && existing.content.trim());
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

const readMessageTreePageZero = (
  queryClient: QueryClient,
  threadId: string
): MessageTreeResponse | undefined => {
  const cached = queryClient.getQueryData<MessageTreeResponse | MessageTreeInfiniteData>(
    queryKeys.chatbot.messages.tree(threadId)
  );
  if (!cached) {
    return undefined;
  }
  if (isMessageTreeInfiniteCache(cached)) {
    return cached.pages[0];
  }
  if (isLegacyFlatMessageTreeCache(cached)) {
    return cached;
  }
  return undefined;
};

const writeMessageTreePageZero = (
  queryClient: QueryClient,
  threadId: string,
  pageZero: MessageTreeResponse
): void => {
  const key = queryKeys.chatbot.messages.tree(threadId);
  const cached = queryClient.getQueryData<MessageTreeResponse | MessageTreeInfiniteData>(key);
  if (isMessageTreeInfiniteCache(cached)) {
    queryClient.setQueryData<MessageTreeInfiniteData>(key, {
      ...cached,
      pages: [pageZero, ...cached.pages.slice(1)],
      pageParams:
        cached.pageParams.length > 0
          ? [cached.pageParams[0], ...cached.pageParams.slice(1)]
          : [undefined],
    });
    return;
  }
  if (isLegacyFlatMessageTreeCache(cached)) {
    queryClient.setQueryData(key, wrapMessageTreeAsInfiniteData(pageZero));
    return;
  }
  queryClient.setQueryData(key, wrapMessageTreeAsInfiniteData(pageZero));
};

export const upsertMessageTreeNodeCache = (
  queryClient: QueryClient,
  threadId: string,
  message: ChatMessage,
  options?: UpsertMessageTreeOptions
): void => {
  const existing = readMessageTreePageZero(queryClient, threadId);

  // Bootstrap a minimal empty tree if none exists yet (e.g. first message in a new thread).
  const tree: MessageTreeResponse = existing ?? {
    rootKey: ROOT_KEY,
    nodes: [],
    childrenByParentId: {},
    leafIds: [],
  };

  const existed = tree.nodes.some((node) => node.id === message.id);
  const nodes = upsertOrMergeMessageNode(tree.nodes, message, options);
  if (existed) {
    writeMessageTreePageZero(queryClient, threadId, {
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

  writeMessageTreePageZero(queryClient, threadId, {
    ...tree,
    nodes,
    childrenByParentId,
    leafIds,
  });
};

/** Swap a client-optimistic user message id for the server id from ``runStarted``. */
export const reconcileOptimisticUserMessageId = (
  queryClient: QueryClient,
  threadId: string,
  clientMessageId: string,
  serverMessageId: string
): void => {
  if (!clientMessageId || clientMessageId === serverMessageId) {
    return;
  }
  const tree = readMessageTreePageZero(queryClient, threadId);
  if (!tree) {
    return;
  }
  const node = tree.nodes.find((n) => n.id === clientMessageId);
  if (!node) {
    return;
  }
  const nextNode: ChatMessage = {
    ...node,
    id: serverMessageId,
    clientStatus: undefined,
    clientMessageId: serverMessageId,
  };
  const nodes = tree.nodes.map((n) => (n.id === clientMessageId ? nextNode : n));
  const childrenByParentId: Record<string, string[]> = {};
  for (const [key, children] of Object.entries(tree.childrenByParentId)) {
    childrenByParentId[key] = children.map((id) => (id === clientMessageId ? serverMessageId : id));
  }
  const leafIds = tree.leafIds.map((id) => (id === clientMessageId ? serverMessageId : id));
  writeMessageTreePageZero(queryClient, threadId, {
    ...tree,
    nodes,
    childrenByParentId,
    leafIds,
  });
  updateListQueries<ChatMessage>(queryClient, queryKeys.chatbot.messages.list(threadId), (items) =>
    sortMessages(items.map((m) => (m.id === clientMessageId ? { ...m, id: serverMessageId } : m)))
  );
};
