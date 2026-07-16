import { describe, expect, it } from 'vitest';
import { describeRadarSyncSchedule } from './radar-sync-status';

describe('describeRadarSyncSchedule', () => {
  const now = Date.parse('2026-07-14T20:00:00.000Z');

  it('marks past nextDueAt as overdue', () => {
    const status = describeRadarSyncSchedule(
      {
        syncCadence: 'DAILY',
        nextDueAt: '2026-07-07T17:22:01.000Z',
        lastRunAt: '2026-07-06T17:22:01.000Z',
      },
      now
    );
    expect(status.isOverdue).toBe(true);
    expect(status.overdueDurationLabel).toMatch(/day/);
  });

  it('treats future nextDueAt as not overdue', () => {
    const status = describeRadarSyncSchedule(
      {
        syncCadence: 'DAILY',
        nextDueAt: '2026-07-15T08:00:00.000Z',
      },
      now
    );
    expect(status.isOverdue).toBe(false);
  });

  it('manual-only cadence is never overdue', () => {
    const status = describeRadarSyncSchedule(
      {
        syncCadence: 'MANUAL_ONLY',
        nextDueAt: '2026-07-01T08:00:00.000Z',
      },
      now
    );
    expect(status.isManualOnly).toBe(true);
    expect(status.isOverdue).toBe(false);
  });

  it('formats labels in the requested IANA timezone', () => {
    const status = describeRadarSyncSchedule(
      {
        syncCadence: 'DAILY',
        nextDueAt: '2026-07-16T08:00:00.000Z',
        lastRunAt: '2026-07-15T08:00:00.000Z',
      },
      now,
      'America/Chicago'
    );
    expect(status.nextDueLabel).toMatch(/3:00:00 AM/);
    expect(status.lastRunLabel).toMatch(/3:00:00 AM/);
  });
});
