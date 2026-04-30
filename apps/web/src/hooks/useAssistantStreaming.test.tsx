import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import type { ChatMessage, MessageTreeResponse } from '@/types/chatbot';
import { queryKeys } from '@/lib/react-query/query-keys';
import { applyThinkingDeltaToRunsAndCache } from '@/lib/websocket/thinking-delta-cache';
import {
  getRunProgressLabel,
  removeNodeFromTree,
  shouldPreserveFailedPlaceholderOnMessageComplete,
} from '@/hooks/useAssistantStreaming';

describe('useAssistantStreaming', () => {
  const threadId = 'thread-123';
  const rootKey = 'ROOT';
  const userMessageId = 'msg-user-1';
  const assistantMessageId = 'msg-assistant-1';
  const failedAssistantMessageId = 'msg-assistant-failed';

  it('writes thinking deltas into assistant placeholder message cache', () => {
    const queryClient = new QueryClient();

    const initialTree: MessageTreeResponse = {
      rootKey,
      nodes: [
        {
          id: userMessageId,
          threadId,
          role: 'user',
          content: 'Hello',
          createdAt: '2026-02-09T00:00:00Z',
        },
      ],
      childrenByParentId: { [rootKey]: [userMessageId] },
      leafIds: [userMessageId],
    };

    queryClient.setQueryData(queryKeys.chatbot.messages.tree(threadId), initialTree);

    const withPlaceholder: MessageTreeResponse = {
      ...initialTree,
      nodes: [
        ...initialTree.nodes,
        {
          id: assistantMessageId,
          threadId,
          role: 'assistant',
          content: '',
          createdAt: '2026-02-09T00:00:01Z',
          parentId: userMessageId,
        },
      ],
      childrenByParentId: {
        ...initialTree.childrenByParentId,
        [userMessageId]: [assistantMessageId],
      },
      leafIds: [assistantMessageId],
    };
    queryClient.setQueryData(queryKeys.chatbot.messages.tree(threadId), withPlaceholder);

    const nextRuns = applyThinkingDeltaToRunsAndCache(
      {
        'run-1': {
          threadId,
          assistantMessageId,
          userMessageId,
          buffer: '',
          thinkingBuffer: '',
        },
      },
      {
        runId: 'run-1',
        threadId,
        delta: 'Let me reason through this.',
      },
      queryClient
    );

    const tree = queryClient.getQueryData<MessageTreeResponse>(
      queryKeys.chatbot.messages.tree(threadId)
    );
    const assistant = tree?.nodes.find((node) => node.id === assistantMessageId);
    expect(nextRuns['run-1']?.thinkingBuffer).toBe('Let me reason through this.');
    expect(assistant?.thinking).toBe('Let me reason through this.');
  });

  it('preserves executionSteps on assistant when applying thinking deltas', () => {
    const queryClient = new QueryClient();
    const executionSteps = [
      { stage: 'planning' as const, message: 'Planning', startedAt: 1 },
      { stage: 'runningTools' as const, message: 'Tools', startedAt: 2 },
    ];

    const tree: MessageTreeResponse = {
      rootKey,
      nodes: [
        {
          id: userMessageId,
          threadId,
          role: 'user',
          content: 'Hello',
          createdAt: '2026-02-09T00:00:00Z',
        },
        {
          id: assistantMessageId,
          threadId,
          role: 'assistant',
          content: 'Partial',
          createdAt: '2026-02-09T00:00:01Z',
          parentId: userMessageId,
          executionSteps,
        },
      ],
      childrenByParentId: { [rootKey]: [userMessageId], [userMessageId]: [assistantMessageId] },
      leafIds: [assistantMessageId],
    };
    queryClient.setQueryData(queryKeys.chatbot.messages.tree(threadId), tree);

    applyThinkingDeltaToRunsAndCache(
      {
        'run-1': {
          threadId,
          assistantMessageId,
          userMessageId,
          buffer: 'Partial',
          thinkingBuffer: '',
        },
      },
      { runId: 'run-1', threadId, delta: 'more thinking' },
      queryClient
    );

    const next = queryClient.getQueryData<MessageTreeResponse>(
      queryKeys.chatbot.messages.tree(threadId)
    );
    const assistant = next?.nodes.find((node) => node.id === assistantMessageId);
    expect(assistant?.executionSteps).toEqual(executionSteps);
    expect(assistant?.thinking).toBe('more thinking');
  });

  it('removes failed assistant placeholder from message tree', () => {
    const tree: MessageTreeResponse = {
      rootKey,
      nodes: [
        {
          id: userMessageId,
          threadId,
          role: 'user',
          content: 'Hello',
          createdAt: '2026-02-09T00:00:00Z',
        },
        {
          id: failedAssistantMessageId,
          threadId,
          role: 'assistant',
          content: '',
          createdAt: '2026-02-09T00:00:01Z',
          parentId: userMessageId,
          clientStatus: 'failed',
          clientError: 'Failed to generate response',
        },
      ],
      childrenByParentId: {
        [rootKey]: [userMessageId],
        [userMessageId]: [failedAssistantMessageId],
      },
      leafIds: [failedAssistantMessageId],
    };

    const nextTree = removeNodeFromTree(tree, failedAssistantMessageId);

    expect(nextTree.nodes.some((node) => node.id === failedAssistantMessageId)).toBe(false);
    expect(nextTree.childrenByParentId[userMessageId]).toEqual([]);
    expect(nextTree.leafIds).toEqual([userMessageId]);
  });

  it('keeps failed placeholder when messageComplete payload is empty', () => {
    const existingMessage: ChatMessage = {
      id: failedAssistantMessageId,
      threadId,
      role: 'assistant',
      content: '',
      createdAt: '2026-02-09T00:00:01Z',
      parentId: userMessageId,
      clientStatus: 'failed',
      clientError: 'Failed to generate response',
    };
    const incomingMessage: ChatMessage = {
      id: failedAssistantMessageId,
      threadId,
      role: 'assistant',
      content: '',
      createdAt: '2026-02-09T00:00:02Z',
      parentId: userMessageId,
    };

    expect(shouldPreserveFailedPlaceholderOnMessageComplete(existingMessage, incomingMessage)).toBe(
      true
    );
  });

  it('maps run progress stage to readable labels', () => {
    expect(getRunProgressLabel()).toBeNull();
    expect(getRunProgressLabel({ statusStage: 'planning' })).toBe('Planning response...');
    expect(getRunProgressLabel({ statusStage: 'runningTools' })).toBe('Running tools...');
    expect(getRunProgressLabel({ statusStage: 'responding' })).toBe('Generating response...');
    expect(getRunProgressLabel({ statusStage: 'persisting' })).toBe('Persisting response...');
    expect(getRunProgressLabel({ statusStage: 'awaitingApproval' })).toBe(
      'Awaiting tool approval...'
    );
    expect(getRunProgressLabel({ statusStage: 'planning', statusMessage: 'Custom status' })).toBe(
      'Custom status'
    );
  });
});
