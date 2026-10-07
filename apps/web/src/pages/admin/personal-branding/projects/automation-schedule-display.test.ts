import { describe, expect, it, vi } from 'vitest';
import * as localCalendar from '@/lib/date/local-calendar';
import {
  AUTOMATIC_GENERATION_OFF,
  buildStartTimeClockHint,
  NO_AUTOMATIC_RUNS_YET,
  NOT_SCHEDULED_YET,
  resolveLastRunStatusLabel,
  resolveNextRunStatusLabel,
} from './automation-schedule-display';

describe('automation-schedule-display', () => {
  it('resolveNextRunStatusLabel when automation is off', () => {
    expect(resolveNextRunStatusLabel(false, '2026-10-04T09:00:00.000Z')).toBe(
      AUTOMATIC_GENERATION_OFF
    );
  });

  it('resolveNextRunStatusLabel when on with nextDueAt', () => {
    const label = resolveNextRunStatusLabel(true, '2026-10-04T09:00:00.000Z');
    expect(label).toContain('UTC');
    expect(label).not.toBe(AUTOMATIC_GENERATION_OFF);
  });

  it('resolveNextRunStatusLabel when on without nextDueAt', () => {
    expect(resolveNextRunStatusLabel(true, null)).toBe(NOT_SCHEDULED_YET);
  });

  it('resolveLastRunStatusLabel when missing last run', () => {
    expect(resolveLastRunStatusLabel(null)).toBe(NO_AUTOMATIC_RUNS_YET);
  });

  it('buildStartTimeClockHint shows UTC only when preference zone is UTC', () => {
    expect(buildStartTimeClockHint('09:00', 'UTC', true)).toBe('09:00 UTC');
  });

  it('buildStartTimeClockHint includes operator zone when loaded', () => {
    vi.spyOn(localCalendar, 'calendarDateInTimeZone').mockReturnValue('2026-10-04');
    const hint = buildStartTimeClockHint('09:00', 'America/Chicago', true);
    expect(hint).toMatch(/^09:00 UTC · .+ America\/Chicago$/);
    vi.restoreAllMocks();
  });

  it('buildStartTimeClockHint omits local part while timezone query is pending', () => {
    expect(buildStartTimeClockHint('09:00', 'America/Chicago', false)).toBe('09:00 UTC');
  });
});
