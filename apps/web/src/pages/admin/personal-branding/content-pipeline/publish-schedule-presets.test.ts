import { describe, expect, it } from 'vitest';
import {
  formatPublishScheduleDisplay,
  isPublishScheduleOverdue,
  presetToLocalDateTimeString,
  resolvePublishSchedulePreset,
} from './publish-schedule-presets';

describe('publish-schedule-presets', () => {
  const now = new Date(2026, 6, 21, 14, 30, 0);

  it('resolves in 1 hour preset', () => {
    const resolved = resolvePublishSchedulePreset('in_1_hour', now);
    expect(resolved.getHours()).toBe(15);
    expect(resolved.getMinutes()).toBe(30);
  });

  it('resolves later today to 5pm when before 5pm', () => {
    const resolved = resolvePublishSchedulePreset('later_today', now);
    expect(resolved.getHours()).toBe(17);
    expect(resolved.getMinutes()).toBe(0);
    expect(resolved.getDate()).toBe(now.getDate());
  });

  it('resolves later today to +2h when after 5pm', () => {
    const evening = new Date(2026, 6, 21, 18, 0, 0);
    const resolved = resolvePublishSchedulePreset('later_today', evening);
    expect(resolved.getHours()).toBe(20);
    expect(resolved.getMinutes()).toBe(0);
  });

  it('resolves tomorrow 9am', () => {
    const resolved = resolvePublishSchedulePreset('tomorrow_9am', now);
    expect(resolved.getDate()).toBe(22);
    expect(resolved.getHours()).toBe(9);
    expect(resolved.getMinutes()).toBe(0);
  });

  it('resolves in 3 days at 9am', () => {
    const resolved = resolvePublishSchedulePreset('in_3_days', now);
    expect(resolved.getDate()).toBe(24);
    expect(resolved.getHours()).toBe(9);
  });

  it('resolves next monday from wednesday', () => {
    const resolved = resolvePublishSchedulePreset('next_monday', now);
    expect(resolved.getDay()).toBe(1);
    expect(resolved.getDate()).toBe(27);
    expect(resolved.getHours()).toBe(9);
  });

  it('resolves next monday from monday as following week', () => {
    const monday = new Date(2026, 6, 20, 10, 0, 0);
    const resolved = resolvePublishSchedulePreset('next_monday', monday);
    expect(resolved.getDate()).toBe(27);
  });

  it('converts preset to datetime-local string', () => {
    expect(presetToLocalDateTimeString('in_1_hour', now)).toBe('2026-07-21T15:30');
  });

  it('formats relative schedule display', () => {
    const in45Min = new Date(now.getTime() + 45 * 60 * 1000).toISOString();
    expect(formatPublishScheduleDisplay(in45Min, now)).toBe('In 45 minutes');

    const tomorrowMorning = new Date(2026, 6, 22, 9, 0, 0).toISOString();
    expect(formatPublishScheduleDisplay(tomorrowMorning, now)).toMatch(/^Tomorrow · /);
  });

  it('formats past due display', () => {
    const past = new Date(2026, 6, 20, 9, 0, 0).toISOString();
    expect(formatPublishScheduleDisplay(past, now)).toMatch(/^Past due · /);
    expect(isPublishScheduleOverdue(past, now)).toBe(true);
  });

  it('returns Unscheduled for empty value', () => {
    expect(formatPublishScheduleDisplay(null, now)).toBe('Unscheduled');
    expect(isPublishScheduleOverdue(null, now)).toBe(false);
  });
});
