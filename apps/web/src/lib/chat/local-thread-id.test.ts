import { describe, expect, it } from 'vitest';
import {
  createLocalAssistantThreadId,
  isLocalAssistantThreadId,
  LOCAL_ASSISTANT_THREAD_PREFIX,
} from './local-thread-id';

describe('local-thread-id', () => {
  it('createLocalAssistantThreadId uses prefix and UUID shape', () => {
    const id = createLocalAssistantThreadId();
    expect(id.startsWith(LOCAL_ASSISTANT_THREAD_PREFIX)).toBe(true);
    expect(id.length).toBeGreaterThan(LOCAL_ASSISTANT_THREAD_PREFIX.length + 10);
  });

  it('isLocalAssistantThreadId detects prefixed ids', () => {
    expect(isLocalAssistantThreadId('local-550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isLocalAssistantThreadId('thread_abc123')).toBe(false);
    expect(isLocalAssistantThreadId('')).toBe(false);
    expect(isLocalAssistantThreadId(undefined)).toBe(false);
    expect(isLocalAssistantThreadId(null)).toBe(false);
  });
});
