import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import type { ChatThread } from '@/types/chatbot';
import { upsertChatThreadCache, upsertThreadMetadataFromWs } from '@/lib/react-query/chatbot-cache';
import { queryKeys } from '@/lib/react-query/query-keys';

describe('chatbot thread recency cache', () => {
  it('sorts thread list by lastMessageAt after WS metadata patch', () => {
    const qc = new QueryClient();
    const stale: ChatThread = {
      id: 'stale',
      userId: 'u1',
      title: 'Stale',
      createdAt: '2026-05-01T00:00:00Z',
      updatedAt: '2026-05-30T20:00:00Z',
      lastMessageAt: '2026-05-20T00:00:00Z',
    };
    const active: ChatThread = {
      id: 'active',
      userId: 'u1',
      title: 'Active',
      createdAt: '2026-05-01T00:00:00Z',
      updatedAt: '2026-05-10T00:00:00Z',
      lastMessageAt: '2026-05-20T00:00:00Z',
    };
    qc.setQueryData(queryKeys.chatbot.threads.lists(), { data: [stale, active] });

    upsertThreadMetadataFromWs(qc, 'active', {
      title: 'Active',
      updatedAt: '2026-05-10T00:00:00Z',
      lastMessageAt: '2026-05-30T16:02:00Z',
    });

    const list = qc.getQueryData<{ data: ChatThread[] }>(queryKeys.chatbot.threads.lists());
    expect(list?.data?.map((t) => t.id)).toEqual(['active', 'stale']);
  });

  it('upsertChatThreadCache orders by lastMessageAt', () => {
    const qc = new QueryClient();
    upsertChatThreadCache(qc, {
      id: 'a',
      userId: 'u1',
      title: 'A',
      createdAt: '2026-05-01T00:00:00Z',
      updatedAt: '2026-05-30T20:00:00Z',
      lastMessageAt: '2026-05-20T00:00:00Z',
    });
    upsertChatThreadCache(qc, {
      id: 'b',
      userId: 'u1',
      title: 'B',
      createdAt: '2026-05-01T00:00:00Z',
      updatedAt: '2026-05-10T00:00:00Z',
      lastMessageAt: '2026-05-30T16:00:00Z',
    });

    const list = qc.getQueryData<{ data: ChatThread[] }>(queryKeys.chatbot.threads.lists());
    expect(list?.data?.map((t) => t.id)).toEqual(['b', 'a']);
  });

  it('merges activeLeafMessageId from WS metadata patch', () => {
    const qc = new QueryClient();
    const thread: ChatThread = {
      id: 't1',
      userId: 'u1',
      title: 'Chat',
      createdAt: '2026-05-01T00:00:00Z',
      updatedAt: '2026-05-10T00:00:00Z',
      activeLeafMessageId: 'leaf-old',
    };
    qc.setQueryData(queryKeys.chatbot.threads.detail('t1'), thread);
    qc.setQueryData(queryKeys.chatbot.threads.lists(), { data: [thread] });

    upsertThreadMetadataFromWs(qc, 't1', {
      title: 'Chat',
      updatedAt: '2026-05-10T00:00:00Z',
      activeLeafMessageId: 'leaf-new',
    });

    const detail = qc.getQueryData<ChatThread>(queryKeys.chatbot.threads.detail('t1'));
    expect(detail?.activeLeafMessageId).toBe('leaf-new');
    const list = qc.getQueryData<{ data: ChatThread[] }>(queryKeys.chatbot.threads.lists());
    expect(list?.data?.[0]?.activeLeafMessageId).toBe('leaf-new');
  });
});
