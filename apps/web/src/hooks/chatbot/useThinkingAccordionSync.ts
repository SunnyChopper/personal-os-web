import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type { AssistantStreamingRunState } from '@/lib/websocket/thinking-delta-cache';
import type { StatusEntry, WsToolCallCompletePayload } from '@/types/chatbot';

type RunWithExtras = AssistantStreamingRunState & {
  statusHistory?: StatusEntry[];
  toolCallDetails?: WsToolCallCompletePayload[];
};

export function useThinkingAccordionSync(
  runs: Record<string, RunWithExtras>,
  setThinkingExpanded: Dispatch<SetStateAction<Record<string, boolean>>>
) {
  useEffect(() => {
    setThinkingExpanded((prev) => {
      let next: typeof prev | null = null;
      for (const run of Object.values(runs)) {
        const desired =
          run.buffer?.length > 0 ? false : run.thinkingBuffer?.length > 0 ? true : undefined;
        if (desired !== undefined && prev[run.assistantMessageId] !== desired) {
          if (!next) next = { ...prev };
          next[run.assistantMessageId] = desired;
        }
      }
      return next ?? prev;
    });
  }, [runs]);
}
