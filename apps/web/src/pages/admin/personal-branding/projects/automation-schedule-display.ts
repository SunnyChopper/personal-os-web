import { calendarDateInTimeZone } from '@/lib/date/local-calendar';
import { formatDateTimeInTimeZone, formatLocalTime } from '@/utils/date-formatters';

export const AUTOMATIC_GENERATION_OFF = 'Automatic generation is off';
export const NOT_SCHEDULED_YET = 'Not scheduled yet';
export const NO_AUTOMATIC_RUNS_YET = 'No automatic runs yet';
export const START_TIME_DISABLED_HINT = 'Turn on automatic generation to change the start time.';

export function formatUtcScheduleLabel(iso: string | null | undefined): string {
  if (!iso) return '';
  const formatted = formatDateTimeInTimeZone(iso, 'UTC');
  return formatted === '—' ? '' : `${formatted} UTC`;
}

export function resolveNextRunStatusLabel(
  autoEnabled: boolean,
  nextDueAt: string | null | undefined
): string {
  if (!autoEnabled) return AUTOMATIC_GENERATION_OFF;
  if (!nextDueAt) return NOT_SCHEDULED_YET;
  return formatUtcScheduleLabel(nextDueAt);
}

export function resolveLastRunStatusLabel(lastRunAt: string | null | undefined): string {
  if (!lastRunAt) return NO_AUTOMATIC_RUNS_YET;
  return formatUtcScheduleLabel(lastRunAt);
}

const LOCAL_CLOCK_ONLY: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: '2-digit',
};

function formatClockInTimeZone(iso: string, timeZone: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      ...LOCAL_CLOCK_ONLY,
      timeZone,
    }).format(parsed);
  } catch {
    return formatLocalTime(iso) ?? '—';
  }
}

/**
 * ponytail: uses today's UTC calendar date + stored HH:MM as a UTC instant; DST can shift the local clock by an hour vs other dates.
 */
export function buildStartTimeClockHint(
  startTimeHhMm: string,
  operatorTimeZone: string | undefined,
  timeZoneLoaded: boolean
): string {
  const trimmed = startTimeHhMm.trim();
  const utcClock = `${trimmed} UTC`;
  if (!timeZoneLoaded || !operatorTimeZone?.trim()) {
    return utcClock;
  }
  const zone = operatorTimeZone.trim();
  if (zone === 'UTC') {
    return utcClock;
  }
  const utcDate = calendarDateInTimeZone('UTC');
  const iso = `${utcDate}T${trimmed}:00.000Z`;
  const localClock = formatClockInTimeZone(iso, zone);
  return `${utcClock} · ${localClock} ${zone}`;
}
