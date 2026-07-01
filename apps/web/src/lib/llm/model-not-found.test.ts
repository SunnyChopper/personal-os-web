import { describe, expect, it } from 'vitest';
import { parseModelNotFoundError } from '@/lib/llm/model-not-found';

describe('parseModelNotFoundError', () => {
  it('detects Anthropic not_found_error with model id', () => {
    const msg =
      'Claude API error: Error code: 404 - {"type": "error", "error": {"type": "not_found_error", "message": "model: claude-3-5-sonnet-20241022"}}';
    const parsed = parseModelNotFoundError(msg, 'projectHealth');
    expect(parsed?.code).toBe('MODEL_NOT_FOUND');
    expect(parsed?.feature).toBe('projectHealth');
    expect(parsed?.model).toBe('claude-3-5-sonnet-20241022');
  });

  it('returns null for unrelated errors', () => {
    expect(parseModelNotFoundError('Network timeout', 'projectHealth')).toBeNull();
  });
});
