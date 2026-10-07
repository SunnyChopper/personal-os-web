import { describe, expect, it } from 'vitest';
import { consumeIgnoredTerminalJob, markJobCancelled } from './client-job-cancel';

describe('client-job-cancel', () => {
  it('marks and consumes ignored terminal job ids once', () => {
    const ignored = new Set<string>();
    markJobCancelled(ignored, 'job-1');
    expect(ignored.has('job-1')).toBe(true);
    expect(consumeIgnoredTerminalJob(ignored, 'job-1')).toBe(true);
    expect(consumeIgnoredTerminalJob(ignored, 'job-1')).toBe(false);
    expect(ignored.has('job-1')).toBe(false);
  });
});
