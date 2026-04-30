import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import type { AssistantStreamingRunState } from '@/lib/websocket/thinking-delta-cache';
import type { StatusEntry, WsToolCallCompletePayload } from '@/types/chatbot';

type RunWithExtras = AssistantStreamingRunState & {
  statusHistory?: StatusEntry[];
  toolCallDetails?: WsToolCallCompletePayload[];
};

/**
 * While a run is active, keep the execution trace expanded so users see live progress.
 * When the run completes, collapse for a cleaner transcript (user can re-expand).
 */
export function useExecutionTraceAccordionSync(
  runs: Record<string, RunWithExtras>,
  setExecutionTraceExpanded: Dispatch<SetStateAction<Record<string, boolean>>>
) {
  const prevActiveAssistantIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const active = new Set(Object.values(runs).map((r) => r.assistantMessageId));
    const prevActive = prevActiveAssistantIdsRef.current;
    setExecutionTraceExpanded((prev) => {
      const next = { ...prev };
      for (const id of active) {
        next[id] = true;
      }
      for (const id of prevActive) {
        if (!active.has(id)) {
          next[id] = false;
        }
      }
      return next;
    });
    prevActiveAssistantIdsRef.current = active;
  }, [runs]);
}
