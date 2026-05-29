import { describe, expect, it } from 'vitest';
import { formatListToolCountBadge } from '@/lib/chat/assistant-list-tool-count-badge';
import type { WsToolCallCompletePayload } from '@/types/chatbot';

function listToolPayload(
  overrides: Partial<WsToolCallCompletePayload> = {}
): WsToolCallCompletePayload {
  return {
    runId: 'run-1',
    threadId: 'thread-1',
    toolName: 'list_tasks',
    arguments: {},
    status: 'success',
    durationMs: 120,
    ...overrides,
  };
}

describe('formatListToolCountBadge', () => {
  it('returns null when counts are missing', () => {
    expect(formatListToolCountBadge(null)).toBeNull();
    expect(formatListToolCountBadge(listToolPayload())).toBeNull();
  });

  it('shows full set when returned matches denominator', () => {
    expect(
      formatListToolCountBadge(
        listToolPayload({ returnedItemCount: 7, total: 7, truncatedForWs: false })
      )
    ).toBe('7 of 7');
  });

  it('prefers originalItemCount over total for denominator', () => {
    expect(
      formatListToolCountBadge(
        listToolPayload({
          returnedItemCount: 2,
          originalItemCount: 7,
          total: 60,
        })
      )
    ).toBe('Showing 2 of 7');
  });

  it('shows partial wording when WS truncated even if counts match', () => {
    expect(
      formatListToolCountBadge(
        listToolPayload({
          returnedItemCount: 7,
          total: 7,
          truncatedForWs: true,
        })
      )
    ).toBe('Showing 7 of 7');
  });
});
