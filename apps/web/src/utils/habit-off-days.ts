import type { Habit } from '@/types/growth-system';
import { toLocalDateKey } from '@/utils/date-formatters';

export const HABIT_WEEKDAY_CODES = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type HabitWeekdayCode = (typeof HABIT_WEEKDAY_CODES)[number];

/** JS Date.getDay(): 0 = Sunday … 6 = Saturday */
const JS_DAY_TO_CODE: Record<number, HabitWeekdayCode> = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
};

export function expandRecurringOffDates(
  start: Date,
  end: Date,
  offDaysOfWeek?: string[] | null
): Set<string> {
  const codes = new Set(
    (offDaysOfWeek ?? [])
      .map((c) => c.trim().toLowerCase())
      .filter((c): c is HabitWeekdayCode => HABIT_WEEKDAY_CODES.includes(c as HabitWeekdayCode))
  );
  if (codes.size === 0) return new Set();

  const result = new Set<string>();
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const endTime = new Date(end);
  endTime.setHours(0, 0, 0, 0);

  while (cur <= endTime) {
    const code = JS_DAY_TO_CODE[cur.getDay()];
    if (codes.has(code)) {
      result.add(toLocalDateKey(cur));
    }
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

export function explicitOffDatesInRange(
  offDates: string[] | null | undefined,
  start: Date,
  end: Date
): Set<string> {
  const startKey = toLocalDateKey(start);
  const endKey = toLocalDateKey(end);
  return new Set((offDates ?? []).filter((d) => d >= startKey && d <= endKey));
}

export function habitConfiguredOffDates(
  habit: Pick<Habit, 'offDaysOfWeek' | 'offDates'>,
  start: Date,
  end: Date
): Set<string> {
  const recurring = expandRecurringOffDates(start, end, habit.offDaysOfWeek);
  const explicit = explicitOffDatesInRange(habit.offDates, start, end);
  return new Set([...recurring, ...explicit]);
}

/** Union habit off days with optional extra protected dates (e.g. OOO standby). */
export function buildHabitProtectedDatesSet(
  habit: Pick<Habit, 'offDaysOfWeek' | 'offDates'>,
  start: Date,
  end: Date,
  extraProtected?: Iterable<string>
): Set<string> {
  const protectedSet = habitConfiguredOffDates(habit, start, end);
  if (extraProtected) {
    for (const d of extraProtected) {
      protectedSet.add(d);
    }
  }
  return protectedSet;
}

/** Protected date range for streak display (~400 days, matching backend). */
export function streakProtectedDatesForHabit(
  habit: Pick<Habit, 'offDaysOfWeek' | 'offDates'>,
  referenceDate: Date = new Date()
): Set<string> {
  const end = new Date(referenceDate);
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - 400);
  return buildHabitProtectedDatesSet(habit, start, end);
}
