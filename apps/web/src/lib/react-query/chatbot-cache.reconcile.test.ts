import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { reconcileOptimisticUserMessageId } from '@/lib/react-query/chatbot-cache';
import { queryKeys } from '@/lib/react-query/query-keys';
import type { MessageTreeResponse } from '@/types/chatbot';

describe('reconcileOptimisticUserMessageId', () => {
  it('replaces client user id with server id in the message tree', () => {
    const queryClient = new QueryClient();
    const threadId = 'thread-1';
    const tree: MessageTreeResponse = {
      rootKey: 'ROOT',
      nodes: [
        {
          id: 'client-user-1',
          threadId,
          role: 'user',
          content: 'Hello',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ],
      childrenByParentId: { ROOT: ['client-user-1'] },
      leafIds: ['client-user-1'],
    };
    queryClient.setQueryData(queryKeys.chatbot.messages.tree(threadId), tree);

    reconcileOptimisticUserMessageId(queryClient, threadId, 'client-user-1', 'msg-server-1');

    const next = queryClient.getQueryData<MessageTreeResponse>(
      queryKeys.chatbot.messages.tree(threadId)
    );
    expect(next?.nodes[0]?.id).toBe('msg-server-1');
    expect(next?.leafIds).toEqual(['msg-server-1']);
  });
});
