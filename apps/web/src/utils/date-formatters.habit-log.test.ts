import { describe, expect, it } from 'vitest';
import { getHabitLogCalendarDay } from './date-formatters';

describe('getHabitLogCalendarDay', () => {
  it('returns date-only values unchanged', () => {
    expect(getHabitLogCalendarDay('2026-02-01')).toBe('2026-02-01');
  });

  it('uses the ISO date prefix for API log timestamps (not local TZ shift)', () => {
    // Backend emits noon UTC for date-only completions; local parsing must not roll to adjacent days.
    expect(getHabitLogCalendarDay('2026-02-01T12:00:00.000Z')).toBe('2026-02-01');
    expect(getHabitLogCalendarDay('2026-02-01T00:00:00.000Z')).toBe('2026-02-01');
  });
});
