import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ChatMessage, MessageTreeResponse } from '@/types/chatbot';
import { useBranchSelection } from '@/hooks/chatbot/useBranchSelection';

function buildTree(nodes: ChatMessage[]): {
  tree: MessageTreeResponse;
  nodeById: Map<string, ChatMessage>;
} {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const childrenByParentId: Record<string, string[]> = {};
  for (const node of nodes) {
    const parentKey = node.parentId ?? 'root';
    childrenByParentId[parentKey] = [...(childrenByParentId[parentKey] ?? []), node.id];
  }
  const leafIds = nodes.filter((n) => !childrenByParentId[n.id]?.length).map((n) => n.id);
  return {
    nodeById,
    tree: {
      rootKey: 'root',
      leafIds,
      childrenByParentId,
      nodes,
    },
  };
}

describe('useBranchSelection', () => {
  it('prefers latest leaf when server activeLeafMessageId is older than thread lastMessageAt', () => {
    const { tree, nodeById } = buildTree([
      {
        id: 'u1',
        threadId: 't1',
        role: 'user',
        content: 'old branch',
        parentId: undefined,
        createdAt: '2026-05-30T08:00:00Z',
      },
      {
        id: 'a1',
        threadId: 't1',
        role: 'assistant',
        content: 'old reply',
        parentId: 'u1',
        createdAt: '2026-05-30T08:01:00Z',
      },
      {
        id: 'u2',
        threadId: 't1',
        role: 'user',
        content: 'new branch',
        parentId: undefined,
        createdAt: '2026-05-30T16:00:00Z',
      },
      {
        id: 'a2',
        threadId: 't1',
        role: 'assistant',
        content: 'new reply',
        parentId: 'u2',
        createdAt: '2026-05-30T16:01:00Z',
      },
    ]);

    const { result } = renderHook(() =>
      useBranchSelection({
        threadId: 't1',
        tree,
        nodeById,
        activeLeafMessageId: 'a1',
        threadLastMessageAt: '2026-05-30T16:01:00Z',
      })
    );

    expect(result.current.selectedLeafId).toBe('a2');
  });

  it('keeps explicit user-selected leaf during the session', () => {
    const { tree, nodeById } = buildTree([
      {
        id: 'u1',
        threadId: 't1',
        role: 'user',
        content: 'a',
        parentId: undefined,
        createdAt: '2026-05-30T08:00:00Z',
      },
      {
        id: 'a1',
        threadId: 't1',
        role: 'assistant',
        content: 'a reply',
        parentId: 'u1',
        createdAt: '2026-05-30T08:01:00Z',
      },
      {
        id: 'u2',
        threadId: 't1',
        role: 'user',
        content: 'b',
        parentId: undefined,
        createdAt: '2026-05-30T16:00:00Z',
      },
      {
        id: 'a2',
        threadId: 't1',
        role: 'assistant',
        content: 'b reply',
        parentId: 'u2',
        createdAt: '2026-05-30T16:01:00Z',
      },
    ]);

    const { result } = renderHook(() =>
      useBranchSelection({
        threadId: 't1',
        tree,
        nodeById,
        activeLeafMessageId: 'a2',
        threadLastMessageAt: '2026-05-30T16:01:00Z',
      })
    );

    expect(result.current.selectedLeafId).toBe('a2');
    act(() => {
      result.current.setSelectedLeafId('a1');
    });
    expect(result.current.selectedLeafId).toBe('a1');
  });
});
