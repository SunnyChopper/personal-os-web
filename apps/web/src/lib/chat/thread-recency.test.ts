import { describe, expect, it } from 'vitest';
import type { ChatThread } from '@/types/chatbot';
import { threadRecencyMs, threadRecencyTimestamp } from '@/lib/chat/thread-recency';

describe('threadRecencyTimestamp', () => {
  const base: ChatThread = {
    id: 't1',
    userId: 'u1',
    title: 'Chat',
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-05-30T20:00:00Z',
  };

  it('prefers lastMessageAt over updatedAt', () => {
    expect(
      threadRecencyTimestamp({
        ...base,
        lastMessageAt: '2026-05-30T16:02:00Z',
      })
    ).toBe('2026-05-30T16:02:00Z');
  });

  it('falls back to createdAt when lastMessageAt is missing (not updatedAt)', () => {
    expect(threadRecencyTimestamp(base)).toBe('2026-05-01T00:00:00Z');
    expect(
      threadRecencyTimestamp({
        ...base,
        lastMessageAt: '2026-05-30T16:00:00Z',
      })
    ).toBe('2026-05-30T16:00:00Z');
  });

  it('sorts threads by recency ms', () => {
    const recent: ChatThread = {
      ...base,
      id: 'recent',
      lastMessageAt: '2026-05-30T16:00:00Z',
      updatedAt: '2026-05-10T00:00:00Z',
    };
    const stale: ChatThread = {
      ...base,
      id: 'stale',
      lastMessageAt: '2026-05-20T00:00:00Z',
      updatedAt: '2026-05-30T20:00:00Z',
    };
    expect(threadRecencyMs(recent)).toBeGreaterThan(threadRecencyMs(stale));
  });
});
