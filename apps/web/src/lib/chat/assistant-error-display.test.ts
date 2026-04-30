import { describe, expect, it } from 'vitest';
import {
  formatAssistantRunErrorForDisplay,
  shouldShowAssistantErrorDetails,
} from './assistant-error-display';
import type { WsRunErrorPayload } from '@/types/chatbot';

describe('formatAssistantRunErrorForDisplay', () => {
  it('includes code, message, cause from details.error, and ids', () => {
    const payload: WsRunErrorPayload = {
      runId: 'run-1',
      threadId: 'thread-1',
      message: 'Failed to generate response',
      code: 'LANGGRAPH_ERROR',
      details: { error: '1 validation error for Foo\n  bar [type=x]' },
    };
    const out = formatAssistantRunErrorForDisplay(payload);
    expect(out).toContain('[LANGGRAPH_ERROR] Failed to generate response');
    expect(out).toContain('Cause:');
    expect(out).toContain('1 validation error for Foo');
    expect(out).toContain('runId: run-1');
    expect(out).toContain('threadId: thread-1');
  });

  it('JSON-stringifies details when error is not a string', () => {
    const payload: WsRunErrorPayload = {
      runId: 'r',
      threadId: 't',
      message: 'x',
      code: 'C',
      details: { foo: 1 },
    };
    expect(formatAssistantRunErrorForDisplay(payload)).toContain('"foo": 1');
  });
});

describe('shouldShowAssistantErrorDetails', () => {
  it('returns false for empty/undefined', () => {
    expect(shouldShowAssistantErrorDetails(undefined)).toBe(false);
    expect(shouldShowAssistantErrorDetails('')).toBe(false);
  });

  it('returns false for generic backend message', () => {
    expect(shouldShowAssistantErrorDetails('Failed to generate response')).toBe(false);
    expect(shouldShowAssistantErrorDetails('  failed to generate response  ')).toBe(false);
  });

  it('returns true for other messages', () => {
    expect(shouldShowAssistantErrorDetails('Rate limit exceeded')).toBe(true);
  });

  it('returns true for multi-line formatted errors', () => {
    expect(shouldShowAssistantErrorDetails('[X] y\n\nCause:\nz')).toBe(true);
  });
});
