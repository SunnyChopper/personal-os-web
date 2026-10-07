import { describe, expect, it } from 'vitest';
import {
  clearContentWorkbenchIdempotencyKey,
  ensureContentWorkbenchIdempotencyKey,
  mintContentWorkbenchIdempotencyKey,
} from './content-workbench-idempotency';

describe('content-workbench-idempotency', () => {
  it('mintContentWorkbenchIdempotencyKey returns a uuid', () => {
    const key = mintContentWorkbenchIdempotencyKey();
    expect(key).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('ensureContentWorkbenchIdempotencyKey reuses the same key until cleared', () => {
    const ref = { current: null as string | null };
    const first = ensureContentWorkbenchIdempotencyKey(ref);
    const second = ensureContentWorkbenchIdempotencyKey(ref);
    expect(second).toBe(first);
    clearContentWorkbenchIdempotencyKey(ref);
    const third = ensureContentWorkbenchIdempotencyKey(ref);
    expect(third).not.toBe(first);
  });
});
