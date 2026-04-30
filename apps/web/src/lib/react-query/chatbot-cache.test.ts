import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import type { MessageTreeResponse, StatusEntry } from '@/types/chatbot';
import {
  mergeFetchedMessageTreeWithCache,
  upsertMessageTreeNodeCache,
} from '@/lib/react-query/chatbot-cache';
import { queryKeys } from '@/lib/react-query/query-keys';

describe('mergeFetchedMessageTreeWithCache', () => {
  const rootKey = 'ROOT';
  const steps: StatusEntry[] = [
    { stage: 'planning', message: 'Planning', startedAt: 1 },
    { stage: 'runningTools', message: 'Tool', startedAt: 2 },
  ];

  it('returns incoming when there is no prior cache', () => {
    const incoming: MessageTreeResponse = {
      rootKey,
      nodes: [{ id: 'u1', threadId: 't', role: 'user', content: 'Hi', createdAt: 'a' }],
      childrenByParentId: { [rootKey]: ['u1'] },
      leafIds: ['u1'],
    };
    expect(mergeFetchedMessageTreeWithCache(incoming, undefined)).toBe(incoming);
    expect(mergeFetchedMessageTreeWithCache(incoming, null)).toBe(incoming);
    expect(mergeFetchedMessageTreeWithCache(incoming, { ...incoming, nodes: [] })).toBe(incoming);
  });

  it('preserves executionSteps from cache when server payload omits them', () => {
    const prev: MessageTreeResponse = {
      rootKey,
      nodes: [
        { id: 'u1', threadId: 't', role: 'user', content: 'Hi', createdAt: 'a' },
        {
          id: 'a1',
          threadId: 't',
          role: 'assistant',
          content: 'Done',
          createdAt: 'b',
          parentId: 'u1',
          executionSteps: steps,
        },
      ],
      childrenByParentId: { [rootKey]: ['u1'], u1: ['a1'] },
      leafIds: ['a1'],
    };
    const incoming: MessageTreeResponse = {
      ...prev,
      nodes: [
        prev.nodes[0],
        {
          id: 'a1',
          threadId: 't',
          role: 'assistant',
          content: 'Done',
          createdAt: 'b',
          parentId: 'u1',
        },
      ],
    };
    const merged = mergeFetchedMessageTreeWithCache(incoming, prev);
    expect(merged.nodes.find((n) => n.id === 'a1')?.executionSteps).toEqual(steps);
  });

  it('preserves cache executionSteps when server sends an empty array', () => {
    const prev: MessageTreeResponse = {
      rootKey,
      nodes: [
        {
          id: 'a1',
          threadId: 't',
          role: 'assistant',
          content: 'x',
          createdAt: 'b',
          executionSteps: steps,
        },
      ],
      childrenByParentId: {},
      leafIds: ['a1'],
    };
    const incoming: MessageTreeResponse = {
      ...prev,
      nodes: [{ ...prev.nodes[0], executionSteps: [] }],
    };
    const merged = mergeFetchedMessageTreeWithCache(incoming, prev);
    expect(merged.nodes[0].executionSteps).toEqual(steps);
  });

  it('uses server executionSteps when the server sends a longer trace', () => {
    const serverSteps: StatusEntry[] = [
      { stage: 'planning', startedAt: 1 },
      { stage: 'runningTools', message: 'Tool: x', startedAt: 2 },
      { stage: 'responding', startedAt: 9 },
    ];
    const prev: MessageTreeResponse = {
      rootKey,
      nodes: [
        {
          id: 'a1',
          threadId: 't',
          role: 'assistant',
          content: 'x',
          createdAt: 'b',
          executionSteps: steps,
        },
      ],
      childrenByParentId: {},
      leafIds: ['a1'],
    };
    const incoming: MessageTreeResponse = {
      ...prev,
      nodes: [{ ...prev.nodes[0], executionSteps: serverSteps }],
    };
    const merged = mergeFetchedMessageTreeWithCache(incoming, prev);
    expect(merged.nodes[0].executionSteps).toEqual(serverSteps);
  });

  it('preserves non-empty assistant content when refetch returns empty body', () => {
    const prev: MessageTreeResponse = {
      rootKey,
      nodes: [
        {
          id: 'a1',
          threadId: 't',
          role: 'assistant',
          content: 'Streamed reply',
          createdAt: 'b',
        },
      ],
      childrenByParentId: {},
      leafIds: ['a1'],
    };
    const incoming: MessageTreeResponse = {
      ...prev,
      nodes: [{ ...prev.nodes[0], content: '' }],
    };
    const merged = mergeFetchedMessageTreeWithCache(incoming, prev);
    expect(merged.nodes[0].content).toBe('Streamed reply');
  });

  it('keeps longer cache executionSteps when server returns a shorter snapshot', () => {
    const shortServer: StatusEntry[] = [{ stage: 'planning', startedAt: 1 }];
    const prev: MessageTreeResponse = {
      rootKey,
      nodes: [
        {
          id: 'a1',
          threadId: 't',
          role: 'assistant',
          content: 'x',
          createdAt: 'b',
          executionSteps: steps,
        },
      ],
      childrenByParentId: {},
      leafIds: ['a1'],
    };
    const incoming: MessageTreeResponse = {
      ...prev,
      nodes: [{ ...prev.nodes[0], executionSteps: shortServer }],
    };
    const merged = mergeFetchedMessageTreeWithCache(incoming, prev);
    expect(merged.nodes[0].executionSteps).toEqual(steps);
  });

  it('tree upsert merge keeps assistant body when messageComplete sends empty content', () => {
    const qc = new QueryClient();
    const threadId = 'thread-y';
    const base = {
      id: 'a1',
      threadId,
      role: 'assistant' as const,
      content: 'Hello from stream',
      createdAt: '2026-01-01',
    };
    upsertMessageTreeNodeCache(qc, threadId, base);
    upsertMessageTreeNodeCache(qc, threadId, {
      ...base,
      content: '',
      executionSteps: steps,
    });
    const tree = qc.getQueryData<MessageTreeResponse>(queryKeys.chatbot.messages.tree(threadId));
    expect(tree?.nodes.find((n) => n.id === 'a1')?.content).toBe('Hello from stream');
    expect(tree?.nodes.find((n) => n.id === 'a1')?.executionSteps).toEqual(steps);
  });

  it('tree upsert merge keeps executionSteps when follow-up patch sends empty array', () => {
    const qc = new QueryClient();
    const threadId = 'thread-x';
    const base = {
      id: 'a1',
      threadId,
      role: 'assistant' as const,
      content: 'a',
      createdAt: '2026-01-01',
      executionSteps: steps,
    };
    upsertMessageTreeNodeCache(qc, threadId, base);
    upsertMessageTreeNodeCache(qc, threadId, {
      ...base,
      content: 'ab',
      executionSteps: [],
    });
    const tree = qc.getQueryData<MessageTreeResponse>(queryKeys.chatbot.messages.tree(threadId));
    expect(tree?.nodes.find((n) => n.id === 'a1')?.executionSteps).toEqual(steps);
    expect(tree?.nodes.find((n) => n.id === 'a1')?.content).toBe('ab');
  });
});
