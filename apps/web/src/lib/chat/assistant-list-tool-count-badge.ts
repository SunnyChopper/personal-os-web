import type { WsToolCallCompletePayload } from '@/types/chatbot';

/** R11 — list-tool count badge from WS envelope (not re-parsing truncated JSON). */
export function formatListToolCountBadge(
  toolDetails: WsToolCallCompletePayload | null | undefined
): string | null {
  if (!toolDetails) return null;
  const returned = toolDetails.returnedItemCount;
  const original = toolDetails.originalItemCount;
  const total = toolDetails.total;
  if (returned == null) return null;
  const denominator = original ?? total;
  if (denominator == null) return null;
  if (returned === denominator && !toolDetails.truncatedForWs) {
    return `${returned} of ${denominator}`;
  }
  return `Showing ${returned} of ${denominator}`;
}
