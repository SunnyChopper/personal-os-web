import { describe, expect, it } from 'vitest';
import { formatDateTimeInTimeZone } from './date-formatters';

describe('formatDateTimeInTimeZone', () => {
  it('returns em dash for empty values', () => {
    expect(formatDateTimeInTimeZone(null, 'UTC')).toBe('—');
    expect(formatDateTimeInTimeZone(undefined, 'UTC')).toBe('—');
    expect(formatDateTimeInTimeZone('', 'UTC')).toBe('—');
  });

  it('formats UTC instant in America/Chicago', () => {
    const label = formatDateTimeInTimeZone('2026-07-16T08:00:00.000Z', 'America/Chicago');
    expect(label).toMatch(/7\/16\/26/);
    expect(label).toMatch(/3:00:00 AM/);
  });

  it('formats UTC instant in UTC zone', () => {
    const label = formatDateTimeInTimeZone('2026-07-16T08:00:00.000Z', 'UTC');
    expect(label).toMatch(/7\/16\/26/);
    expect(label).toMatch(/8:00:00 AM/);
  });

  it('returns raw string for unparseable input', () => {
    expect(formatDateTimeInTimeZone('not-a-date', 'UTC')).toBe('not-a-date');
  });
});
