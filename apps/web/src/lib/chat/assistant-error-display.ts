import type { WsRunErrorPayload } from '@/types/chatbot';

function stringifyAssistantErrorDetails(
  details: Record<string, unknown> | undefined
): string | null {
  if (!details || Object.keys(details).length === 0) {
    return null;
  }
  const err = details.error;
  if (typeof err === 'string' && err.trim()) {
    return err.trim();
  }
  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return String(details);
  }
}

/**
 * Multi-line debug-oriented summary for WebSocket runError payloads.
 * Surfaces `details.error` (e.g. wrapped engine exceptions) instead of only the generic message.
 */
export function formatAssistantRunErrorForDisplay(payload: WsRunErrorPayload): string {
  const code = payload.code?.trim() || 'UNKNOWN';
  const msg = payload.message?.trim() || 'No message';
  const lines: string[] = [`[${code}] ${msg}`];

  const detailStr = stringifyAssistantErrorDetails(
    payload.details as Record<string, unknown> | undefined
  );
  if (detailStr) {
    lines.push('', 'Cause:', detailStr);
  }

  if (payload.runId?.trim() && payload.runId !== 'connection') {
    lines.push('', `runId: ${payload.runId}`);
  }
  if (payload.threadId?.trim()) {
    lines.push(`threadId: ${payload.threadId}`);
  }

  return lines.join('\n');
}

/**
 * Whether to show raw assistant error text under the failure heading (chat bubble).
 * Legacy placeholders used only the generic backend message; rich formatted errors always show.
 */
export function shouldShowAssistantErrorDetails(messageText?: string): boolean {
  if (!messageText) {
    return false;
  }
  const t = messageText.trim();
  if (t.length === 0) {
    return false;
  }
  if (t.includes('\n')) {
    return true;
  }
  return t.toLowerCase() !== 'failed to generate response';
}
