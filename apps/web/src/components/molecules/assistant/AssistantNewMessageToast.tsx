import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAssistantUnreadSummary } from '@/hooks/chatbot/useAssistantUnreadSummary';
import type { AssistantThreadUnreadItem } from '@/types/api-contracts';

function newestUnreadThread(
  threads: AssistantThreadUnreadItem[] | undefined
): AssistantThreadUnreadItem | undefined {
  if (!threads?.length) {
    return undefined;
  }
  return [...threads]
    .filter((row) => row.unreadCount > 0)
    .sort((a, b) => (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? ''))[0];
}

type AssistantNewMessageToastProps = {
  isAssistantRoute: boolean;
};

export function AssistantNewMessageToast({ isAssistantRoute }: AssistantNewMessageToastProps) {
  const { showToast } = useToast();
  const unreadQ = useAssistantUnreadSummary();
  const prevTotalRef = useRef<number | undefined>(undefined);
  const initializedRef = useRef(false);

  useEffect(() => {
    const total = unreadQ.data?.totalUnread ?? 0;

    if (!initializedRef.current) {
      initializedRef.current = true;
      prevTotalRef.current = total;
      return;
    }

    const prev = prevTotalRef.current ?? 0;
    if (!isAssistantRoute && total > prev) {
      const thread = newestUnreadThread(unreadQ.data?.threads);
      showToast({
        type: 'info',
        title: 'New assistant message',
        message: thread?.lastMessagePreview?.trim() || 'Open Assistant to read your messages.',
        duration: 6_000,
      });
    }

    prevTotalRef.current = total;
  }, [isAssistantRoute, showToast, unreadQ.data]);

  return null;
}
