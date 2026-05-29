import { describe, expect, it } from 'vitest';
import {
  expandRecurringOffDates,
  habitConfiguredOffDates,
  streakProtectedDatesForHabit,
} from '@/utils/habit-off-days';
import type { Habit } from '@/types/growth-system';

const baseHabit: Pick<Habit, 'offDaysOfWeek' | 'offDates'> = {
  offDaysOfWeek: ['sat', 'sun'],
  offDates: ['2026-06-01'],
};

describe('habit-off-days', () => {
  it('expands recurring weekdays', () => {
    const start = new Date(2026, 4, 18);
    const end = new Date(2026, 4, 24);
    const off = expandRecurringOffDates(start, end, ['sat', 'sun']);
    expect(off.has('2026-05-23')).toBe(true);
    expect(off.has('2026-05-24')).toBe(true);
    expect(off.has('2026-05-22')).toBe(false);
  });

  it('includes explicit off dates in range', () => {
    const start = new Date(2026, 5, 1);
    const end = new Date(2026, 5, 10);
    const off = habitConfiguredOffDates(baseHabit, start, end);
    expect(off.has('2026-06-01')).toBe(true);
  });

  it('builds streak protected set for habit', () => {
    const ref = new Date(2026, 4, 25);
    const protectedSet = streakProtectedDatesForHabit(baseHabit, ref);
    expect(protectedSet.has('2026-05-24')).toBe(true);
  });
});
