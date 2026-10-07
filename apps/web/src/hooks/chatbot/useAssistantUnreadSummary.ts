import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryLogger } from '@/lib/logger';
import { extractErrorMessage } from '@/lib/react-query/error-utils';
import { queryKeys } from '@/lib/react-query/query-keys';
import { assistantUnreadService } from '@/services/assistant-unread.service';
import type { MarkThreadReadResult } from '@/types/api-contracts';

export function useAssistantUnreadSummary() {
  return useQuery({
    queryKey: queryKeys.chatbot.unreadSummary(),
    queryFn: () => assistantUnreadService.getUnreadSummary(),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });
}

export async function markAssistantThreadReadBestEffort(
  threadId: string
): Promise<MarkThreadReadResult | null> {
  try {
    return await assistantUnreadService.markThreadRead(threadId);
  } catch (error) {
    queryLogger.warn('markThreadRead failed (best-effort)', {
      threadId,
      error: extractErrorMessage(error),
    });
    return null;
  }
}

export function useMarkAssistantThreadRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ['assistant', 'thread', 'markRead'],
    mutationFn: markAssistantThreadReadBestEffort,
    onSuccess: (result) => {
      if (!result) {
        return;
      }
      void qc.invalidateQueries({ queryKey: queryKeys.chatbot.unreadSummary() });
    },
  });
}
