import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { isLocalAssistantThreadId } from '@/lib/chat/local-thread-id';
import { queryKeys } from '@/lib/react-query/query-keys';
import { chatbotService } from '@/services/chatbot.service';
import type { AssistantRunConfig } from '@/types/chatbot';

function stableRunConfigKey(runConfig: AssistantRunConfig | undefined): string {
  if (!runConfig) return 'null';
  try {
    return JSON.stringify(runConfig);
  } catch {
    return 'invalid';
  }
}

/**
 * Preflight estimate for the active branch + next-send run config (read-only on the server).
 */
export function useThreadContextUsage({
  threadId,
  leafMessageId,
  runConfig,
  enabled,
}: {
  threadId: string | undefined;
  leafMessageId: string | null | undefined;
  runConfig: AssistantRunConfig | undefined;
  enabled: boolean;
}) {
  const runKey = useMemo(() => stableRunConfigKey(runConfig), [runConfig]);
  const leaf = leafMessageId ?? '';
  const serverThread = Boolean(threadId && !isLocalAssistantThreadId(threadId));

  return useQuery({
    queryKey: queryKeys.chatbot.contextUsage.detail(threadId ?? '', leaf, runKey),
    queryFn: () =>
      chatbotService.getThreadContextUsage(threadId!, {
        leafMessageId: leaf || undefined,
        runConfig,
      }),
    enabled: Boolean(enabled && serverThread && threadId && leaf),
    staleTime: 10_000,
  });
}
