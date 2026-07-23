import { describe, expect, it } from 'vitest';
import { describeSyncSchedule } from './sync-schedule-status';

describe('describeSyncSchedule (recon)', () => {
  it('exposes separate successful and attempted labels', () => {
    const status = describeSyncSchedule(
      {
        syncCadence: 'DAILY',
        lastRunAt: '2026-07-15T19:41:48.000Z',
        lastSuccessfulRunAt: '2026-07-14T08:00:00.000Z',
        nextDueAt: '2026-07-17T08:00:00.000Z',
      },
      Date.parse('2026-07-16T12:00:00.000Z'),
      'recon'
    );

    expect(status.lastSuccessfulRunLabel).not.toBe('—');
    expect(status.lastAttemptedRunLabel).not.toBe('—');
    expect(status.lastSuccessfulRunLabel).not.toBe(status.lastAttemptedRunLabel);
    expect(status.scheduleHint).toMatch(/Scheduled runs advance the next due time/);
  });
});
