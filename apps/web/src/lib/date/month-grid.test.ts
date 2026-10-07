import { describe, expect, it } from 'vitest';
import {
  buildMonthGrid,
  eventDayDensityDotCount,
  firstIsoOfMonth,
  formatEventDayAriaLabel,
  isoBelongsToMonth,
  resolveSelectedDayForMonth,
} from './month-grid';

describe('isoBelongsToMonth', () => {
  it('returns true when iso is in the given month', () => {
    expect(isoBelongsToMonth('2026-08-13', 2026, 7)).toBe(true);
    expect(isoBelongsToMonth('2026-08-01', 2026, 7)).toBe(true);
  });

  it('returns false for other months or years', () => {
    expect(isoBelongsToMonth('2026-07-31', 2026, 7)).toBe(false);
    expect(isoBelongsToMonth('2026-09-01', 2026, 7)).toBe(false);
    expect(isoBelongsToMonth('2025-08-13', 2026, 7)).toBe(false);
  });
});

describe('firstIsoOfMonth', () => {
  it('returns YYYY-MM-01 for the given month', () => {
    expect(firstIsoOfMonth(2026, 7)).toBe('2026-08-01');
    expect(firstIsoOfMonth(2026, 1)).toBe('2026-02-01');
    expect(firstIsoOfMonth(2026, 0)).toBe('2026-01-01');
  });
});

describe('resolveSelectedDayForMonth', () => {
  const today = '2026-08-13';

  it('keeps preferred iso when it belongs to the month', () => {
    expect(
      resolveSelectedDayForMonth({
        year: 2026,
        month: 7,
        todayIso: today,
        preferredIso: '2026-08-20',
      })
    ).toBe('2026-08-20');
  });

  it('defaults to today when viewing the current month and no valid preferred', () => {
    expect(resolveSelectedDayForMonth({ year: 2026, month: 7, todayIso: today })).toBe(
      '2026-08-13'
    );
    expect(
      resolveSelectedDayForMonth({
        year: 2026,
        month: 7,
        todayIso: today,
        preferredIso: '2026-07-15',
      })
    ).toBe('2026-08-13');
  });

  it('defaults to the 1st when today is outside the month', () => {
    expect(resolveSelectedDayForMonth({ year: 2026, month: 8, todayIso: today })).toBe(
      '2026-09-01'
    );
    expect(resolveSelectedDayForMonth({ year: 2026, month: 6, todayIso: today })).toBe(
      '2026-07-01'
    );
  });

  it('handles February and year boundaries', () => {
    expect(
      resolveSelectedDayForMonth({
        year: 2026,
        month: 1,
        todayIso: '2026-02-28',
        preferredIso: '2026-02-15',
      })
    ).toBe('2026-02-15');
    expect(resolveSelectedDayForMonth({ year: 2025, month: 11, todayIso: today })).toBe(
      '2025-12-01'
    );
  });
});

describe('eventDayDensityDotCount', () => {
  it('returns 0 for empty days and caps at 3', () => {
    expect(eventDayDensityDotCount(0)).toBe(0);
    expect(eventDayDensityDotCount(1)).toBe(1);
    expect(eventDayDensityDotCount(2)).toBe(2);
    expect(eventDayDensityDotCount(3)).toBe(3);
    expect(eventDayDensityDotCount(4)).toBe(3);
  });
});

describe('formatEventDayAriaLabel', () => {
  it('includes count only when events exist', () => {
    expect(formatEventDayAriaLabel('2026-08-13', 0)).toBe('2026-08-13');
    expect(formatEventDayAriaLabel('2026-08-13', 1)).toBe('2026-08-13, 1 event');
    expect(formatEventDayAriaLabel('2026-08-13', 2)).toBe('2026-08-13, 2 events');
  });
});

describe('buildMonthGrid', () => {
  it('returns six weeks with correct inMonth flags for August 2026', () => {
    const weeks = buildMonthGrid(2026, 7);
    expect(weeks).toHaveLength(6);
    expect(weeks.every((week) => week.length === 7)).toBe(true);

    const inMonthDays = weeks.flat().filter((day) => day.inMonth);
    expect(inMonthDays).toHaveLength(31);
    expect(inMonthDays[0].iso).toBe('2026-08-01');
    expect(inMonthDays.at(-1)?.iso).toBe('2026-08-31');
  });

  it('pads leading days from the previous month', () => {
    const weeks = buildMonthGrid(2026, 7);
    const firstDay = weeks[0][0];
    expect(firstDay.inMonth).toBe(false);
    expect(firstDay.iso).toBe('2026-07-26');
  });
});
