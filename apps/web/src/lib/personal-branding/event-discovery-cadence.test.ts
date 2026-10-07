import { describe, expect, it } from 'vitest';
import {
  formatEventDiscoveryCadenceLine,
  formatLastSuccessfulRunLine,
} from './event-discovery-cadence';

const fixedNow = new Date('2026-03-30T12:00:00.000Z');

describe('formatLastSuccessfulRunLine', () => {
  it('shows Never run when lastSuccessfulRunAt is absent', () => {
    const line = formatLastSuccessfulRunLine(
      { syncTimezone: 'UTC', lastSuccessfulRunAt: null },
      fixedNow
    );
    expect(line.text).toBe('Never run');
    expect(line.title).toBe('');
  });

  it('shows Last run failed when lastRunStatus is failed', () => {
    const line = formatLastSuccessfulRunLine(
      {
        syncTimezone: 'UTC',
        lastSuccessfulRunAt: null,
        lastRunStatus: 'failed',
        lastErrorSummary: 'Tavily is not configured',
      },
      fixedNow
    );
    expect(line.text).toBe('Last run failed');
    expect(line.title).toBe('Tavily is not configured');
  });

  it('shows Never run when lastRunAt exists but lastSuccessfulRunAt is null without failed status', () => {
    const line = formatLastSuccessfulRunLine(
      { syncTimezone: 'UTC', lastSuccessfulRunAt: null },
      fixedNow
    );
    expect(line.text).toBe('Never run');
  });

  it('shows relative last successful run without colon', () => {
    const line = formatLastSuccessfulRunLine(
      {
        lastSuccessfulRunAt: '2026-03-30T11:30:00.000Z',
        syncTimezone: 'UTC',
      },
      fixedNow
    );
    expect(line.text).toBe('Last run 30m ago');
    expect(line.title).toMatch(/^Last run /);
  });
});

describe('formatEventDiscoveryCadenceLine', () => {
  it('returns null when settings are missing', () => {
    expect(formatEventDiscoveryCadenceLine(null, fixedNow)).toBeNull();
    expect(formatEventDiscoveryCadenceLine(undefined, fixedNow)).toBeNull();
  });

  it('returns null for MANUAL_ONLY even when nextDueAt is set', () => {
    const line = formatEventDiscoveryCadenceLine(
      {
        syncCadence: 'MANUAL_ONLY',
        syncTimezone: 'UTC',
        nextDueAt: '2026-04-06T08:00:00.000Z',
      },
      fixedNow
    );
    expect(line).toBeNull();
  });

  it('returns null when nextDueAt is missing for scheduled cadence', () => {
    const line = formatEventDiscoveryCadenceLine(
      {
        syncCadence: 'WEEKLY',
        syncTimezone: 'UTC',
      },
      fixedNow
    );
    expect(line).toBeNull();
  });

  it('shows Next date for scheduled cadence with nextDueAt', () => {
    const line = formatEventDiscoveryCadenceLine(
      {
        syncCadence: 'WEEKLY',
        syncTimezone: 'UTC',
        nextDueAt: '2026-04-06T08:00:00.000Z',
      },
      fixedNow
    );
    expect(line?.text).toMatch(/^Next: /);
    expect(line?.text).toContain('Apr');
    expect(line?.title).toMatch(/^Next /);
  });
});
