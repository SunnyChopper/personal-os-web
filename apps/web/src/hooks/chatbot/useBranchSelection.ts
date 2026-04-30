import { useCallback, useMemo, useState } from 'react';
import type { ChatMessage, ChatThread, MessageTreeResponse } from '@/types/chatbot';

type BranchSelectionState = {
  selectedLeafId: string | null;
  transcript: ChatMessage[];
  setSelectedLeafId: (leafId: string | null) => void;
  getSiblings: (messageId: string) => string[];
  selectSibling: (messageId: string, direction: 'prev' | 'next') => void;
  findLeafForNode: (messageId: string) => string | null;
};

export function useBranchSelection({
  threadId,
  tree,
  nodeById,
  activeLeafMessageId,
}: {
  threadId: string | undefined;
  tree: MessageTreeResponse | null;
  nodeById: Map<string, ChatMessage>;
  activeLeafMessageId?: ChatThread['activeLeafMessageId'] | null;
}): BranchSelectionState {
  const [selectedLeafByThreadId, setSelectedLeafByThreadId] = useState<Record<string, string>>({});
  const leafIds = useMemo(() => tree?.leafIds ?? [], [tree]);

  const findLatestLeaf = useCallback((): string | null => {
    if (!tree || tree.leafIds.length === 0) {
      return null;
    }
    let latestId = tree.leafIds[0];
    let latestTime = new Date(nodeById.get(latestId)?.createdAt ?? 0).getTime();
    tree.leafIds.forEach((leafId) => {
      const time = new Date(nodeById.get(leafId)?.createdAt ?? 0).getTime();
      if (time >= latestTime) {
        latestTime = time;
        latestId = leafId;
      }
    });
    return latestId;
  }, [nodeById, tree]);

  const rawSelectedLeafId = threadId ? (selectedLeafByThreadId[threadId] ?? null) : null;
  const selectedLeafId = useMemo(() => {
    if (!tree) {
      return null;
    }
    if (rawSelectedLeafId && leafIds.includes(rawSelectedLeafId)) {
      return rawSelectedLeafId;
    }
    if (activeLeafMessageId && leafIds.includes(activeLeafMessageId)) {
      return activeLeafMessageId;
    }
    return findLatestLeaf();
  }, [activeLeafMessageId, findLatestLeaf, leafIds, rawSelectedLeafId, tree]);

  const buildTranscript = useCallback(
    (leafId: string | null): ChatMessage[] => {
      if (!leafId || !tree) {
        return [];
      }
      const path: ChatMessage[] = [];
      let currentId: string | null = leafId;
      while (currentId) {
        const node = nodeById.get(currentId);
        if (!node) {
          break;
        }
        path.push(node);
        currentId = node.parentId ?? null;
      }
      return path.reverse();
    },
    [nodeById, tree]
  );

  const transcript = useMemo(
    () => buildTranscript(selectedLeafId),
    [buildTranscript, selectedLeafId]
  );

  const getSiblings = useCallback(
    (messageId: string): string[] => {
      if (!tree) {
        return [];
      }
      const message = nodeById.get(messageId);
      if (!message) {
        return [];
      }
      const parentKey = message.parentId ?? tree.rootKey;
      return tree.childrenByParentId[parentKey] ?? [];
    },
    [nodeById, tree]
  );

  const findLeafForNode = useCallback(
    (messageId: string): string | null => {
      if (!tree) {
        return null;
      }
      let bestLeafId: string | null = null;
      let bestTimestamp = 0;
      for (const leafId of tree.leafIds) {
        let currentId: string | null = leafId;
        while (currentId) {
          if (currentId === messageId) {
            const leafTime = new Date(nodeById.get(leafId)?.createdAt ?? 0).getTime();
            if (leafTime >= bestTimestamp) {
              bestTimestamp = leafTime;
              bestLeafId = leafId;
            }
            break;
          }
          currentId = nodeById.get(currentId)?.parentId ?? null;
        }
      }
      return bestLeafId;
    },
    [nodeById, tree]
  );

  const setSelectedLeafId = useCallback(
    (leafId: string | null) => {
      if (!threadId) {
        return;
      }
      setSelectedLeafByThreadId((current) => {
        const next = { ...current };
        if (leafId) {
          next[threadId] = leafId;
        } else {
          delete next[threadId];
        }
        return next;
      });
    },
    [threadId]
  );

  const selectSibling = useCallback(
    (messageId: string, direction: 'prev' | 'next') => {
      const siblings = getSiblings(messageId);
      const index = siblings.indexOf(messageId);
      if (index === -1) {
        return;
      }
      const nextIndex = direction === 'prev' ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= siblings.length) {
        return;
      }
      const siblingId = siblings[nextIndex];
      const nextLeafId = findLeafForNode(siblingId) ?? siblingId;
      setSelectedLeafId(nextLeafId);
    },
    [findLeafForNode, getSiblings, setSelectedLeafId]
  );

  return {
    selectedLeafId,
    transcript,
    setSelectedLeafId,
    getSiblings,
    selectSibling,
    findLeafForNode,
  };
}
