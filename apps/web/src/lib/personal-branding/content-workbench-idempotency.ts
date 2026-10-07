/** Client idempotency keys for Content Workbench async job starts. */

export function mintContentWorkbenchIdempotencyKey(): string {
  return crypto.randomUUID();
}

export function ensureContentWorkbenchIdempotencyKey(ref: { current: string | null }): string {
  if (!ref.current) {
    ref.current = mintContentWorkbenchIdempotencyKey();
  }
  return ref.current;
}

export function clearContentWorkbenchIdempotencyKey(ref: { current: string | null }): void {
  ref.current = null;
}
