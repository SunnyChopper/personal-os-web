import { describe, expect, it } from 'vitest';
import { calendarDateInTimeZone } from './local-calendar';

describe('calendarDateInTimeZone', () => {
  it('returns YYYY-MM-DD in the requested IANA zone', () => {
    const instant = new Date('2026-08-14T02:00:00.000Z');
    expect(calendarDateInTimeZone('America/Chicago', instant)).toBe('2026-08-13');
    expect(calendarDateInTimeZone('UTC', instant)).toBe('2026-08-14');
  });

  it('falls back to UTC for invalid zone names', () => {
    const instant = new Date('2026-08-14T02:00:00.000Z');
    expect(calendarDateInTimeZone('Not/A_Real_Zone', instant)).toBe('2026-08-14');
  });
});
