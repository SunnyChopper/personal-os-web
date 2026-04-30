import type { WsStatusUpdatePayload } from '@/types/chatbot';

/** WS statusUpdate stages plus client-only HITL stage (not sent as statusUpdate). */
export type StreamingStatusStage = NonNullable<WsStatusUpdatePayload['stage']> | 'awaitingApproval';

export function getRunProgressLabel(
  run?: Pick<
    { statusStage?: StreamingStatusStage; statusMessage?: string },
    'statusStage' | 'statusMessage'
  >
): string | null {
  if (!run) {
    return null;
  }
  if (run.statusMessage) {
    return run.statusMessage;
  }
  if (run.statusStage === 'runningTools') {
    return 'Running tools...';
  }
  if (run.statusStage === 'responding') {
    return 'Generating response...';
  }
  if (run.statusStage === 'persisting') {
    return 'Persisting response...';
  }
  if (run.statusStage === 'planning') {
    return 'Planning response...';
  }
  if (run.statusStage === 'awaitingApproval') {
    return 'Awaiting tool approval...';
  }
  return null;
}

export const scheduleDeltaFlush = (callback: FrameRequestCallback): number => {
  if (typeof window !== 'undefined') {
    if (typeof window.requestAnimationFrame === 'function') {
      return window.requestAnimationFrame(callback);
    }
    return window.setTimeout(() => callback(Date.now()), 16);
  }
  return 0;
};
