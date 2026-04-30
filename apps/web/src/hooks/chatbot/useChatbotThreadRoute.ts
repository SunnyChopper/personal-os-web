import { useEffect, useMemo, useRef } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { isLocalAssistantThreadId } from '@/lib/chat/local-thread-id';
import type { ChatThread } from '@/types/chatbot';

type ShowToast = (options: { type: 'error'; title: string; message: string }) => void;

export function useChatbotThreadRoute({
  routeThreadId,
  threads,
  navigate,
  showToast,
  userId,
}: {
  routeThreadId: string | undefined;
  threads: ChatThread[];
  navigate: NavigateFunction;
  showToast: ShowToast;
  userId: string | undefined;
}) {
  const resolvedThreadId = useMemo(
    () => routeThreadId ?? threads[0]?.id ?? null,
    [routeThreadId, threads]
  );

  const syntheticDraftThread = useMemo((): ChatThread | null => {
    if (!routeThreadId || !isLocalAssistantThreadId(routeThreadId)) {
      return null;
    }
    const now = new Date().toISOString();
    return {
      id: routeThreadId,
      userId: userId ?? '',
      title: 'New Chat',
      createdAt: now,
      updatedAt: now,
    };
  }, [routeThreadId, userId]);

  const displayThreads = useMemo(() => {
    if (syntheticDraftThread && !threads.some((t) => t.id === syntheticDraftThread.id)) {
      return [syntheticDraftThread, ...threads];
    }
    return threads;
  }, [syntheticDraftThread, threads]);

  const invalidThreadToastRef = useRef<string | null>(null);

  useEffect(() => {
    if (routeThreadId && isLocalAssistantThreadId(routeThreadId)) {
      invalidThreadToastRef.current = null;
      return;
    }

    if (!threads.length) {
      invalidThreadToastRef.current = null;
      return;
    }

    if (!routeThreadId) {
      navigate(`/admin/assistant/${threads[0].id}`, { replace: true });
      return;
    }

    const threadExists = threads.some((thread) => thread.id === routeThreadId);
    if (!threadExists) {
      const fallbackThreadId = threads[0].id;
      navigate(`/admin/assistant/${fallbackThreadId}`, { replace: true });
      if (invalidThreadToastRef.current !== routeThreadId) {
        invalidThreadToastRef.current = routeThreadId;
        showToast({
          type: 'error',
          title: 'Chat not found',
          message: 'That chat link is no longer available. Opening your latest chat instead.',
        });
      }
      return;
    }

    invalidThreadToastRef.current = null;
  }, [navigate, routeThreadId, showToast, threads]);

  return {
    resolvedThreadId,
    syntheticDraftThread,
    displayThreads,
  };
}
