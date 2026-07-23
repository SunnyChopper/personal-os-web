import { toLocalDateTimeString } from '@/utils/date-formatters';
import { formatPersonalBrandingDateTime } from '../personal-branding-ui';

export type PublishSchedulePresetId =
  | 'in_1_hour'
  | 'later_today'
  | 'tomorrow_9am'
  | 'in_3_days'
  | 'next_monday';

export type PublishSchedulePreset = {
  id: PublishSchedulePresetId;
  label: string;
};

export const PUBLISH_SCHEDULE_PRESETS: PublishSchedulePreset[] = [
  { id: 'in_1_hour', label: 'In 1 hour' },
  { id: 'later_today', label: 'Later today 5:00 PM' },
  { id: 'tomorrow_9am', label: 'Tomorrow 9:00 AM' },
  { id: 'in_3_days', label: 'In 3 days 9:00 AM' },
  { id: 'next_monday', label: 'Next Monday 9:00 AM' },
];

function setLocalTime(d: Date, hours: number, minutes: number): Date {
  const copy = new Date(d);
  copy.setHours(hours, minutes, 0, 0);
  return copy;
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function nextMondayAt(d: Date, hours: number, minutes: number): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  let daysToAdd: number;
  if (day === 0) {
    daysToAdd = 1;
  } else if (day === 1) {
    daysToAdd = 7;
  } else {
    daysToAdd = 8 - day;
  }
  copy.setDate(copy.getDate() + daysToAdd);
  copy.setHours(hours, minutes, 0, 0);
  return copy;
}

export function resolvePublishSchedulePreset(
  presetId: PublishSchedulePresetId,
  now: Date = new Date()
): Date {
  switch (presetId) {
    case 'in_1_hour': {
      const next = new Date(now);
      next.setHours(next.getHours() + 1);
      return next;
    }
    case 'later_today': {
      const fivePm = setLocalTime(now, 17, 0);
      if (now.getTime() >= fivePm.getTime()) {
        const fallback = new Date(now);
        fallback.setHours(fallback.getHours() + 2);
        return fallback;
      }
      return fivePm;
    }
    case 'tomorrow_9am':
      return setLocalTime(addDays(now, 1), 9, 0);
    case 'in_3_days':
      return setLocalTime(addDays(now, 3), 9, 0);
    case 'next_monday':
      return nextMondayAt(now, 9, 0);
    default:
      return new Date(now);
  }
}

export function presetToLocalDateTimeString(
  presetId: PublishSchedulePresetId,
  now: Date = new Date()
): string {
  return toLocalDateTimeString(resolvePublishSchedulePreset(presetId, now));
}

function formatTimeShort(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatPublishScheduleDisplay(
  value?: string | null,
  now: Date = new Date()
): string {
  if (!value) return 'Unscheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const diffMs = date.getTime() - now.getTime();
  if (diffMs < 0) {
    return `Past due · ${formatPersonalBrandingDateTime(value)}`;
  }

  const diffMinutes = Math.round(diffMs / (60 * 1000));
  if (diffMinutes <= 90) {
    if (diffMinutes <= 1) return 'In 1 minute';
    if (diffMinutes < 60) return `In ${diffMinutes} minutes`;
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    if (mins === 0) return hours === 1 ? 'In 1 hour' : `In ${hours} hours`;
    return `In ${diffMinutes} minutes`;
  }

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (targetStart.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000)
  );
  const timeStr = formatTimeShort(date);

  if (diffDays === 0) return `Today · ${timeStr}`;
  if (diffDays === 1) return `Tomorrow · ${timeStr}`;
  if (diffDays > 1 && diffDays < 7) return `In ${diffDays} days · ${timeStr}`;

  return formatPersonalBrandingDateTime(value);
}

export function isPublishScheduleOverdue(value?: string | null, now: Date = new Date()): boolean {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < now.getTime();
}
