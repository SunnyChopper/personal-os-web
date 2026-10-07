export type ClientJobCancelState = 'idle' | 'cancelled';

export const CLIENT_JOB_CANCELLED_LABEL =
  'Cancelled — stopped watching this job. It may still finish in the background.';

/** Shown after server-side cancel for ideation / approve jobs. */
export const SERVER_JOB_CANCELLED_LABEL = 'Generation was cancelled.';

/** Session-local ids whose terminal poll results must not apply UI side effects. */
export function markJobCancelled(ignored: Set<string>, jobId: string): void {
  ignored.add(jobId);
}

export function consumeIgnoredTerminalJob(
  ignored: Set<string>,
  jobId: string | null | undefined
): boolean {
  if (!jobId || !ignored.has(jobId)) return false;
  ignored.delete(jobId);
  return true;
}
