/** Display helpers for shared sync schedule (Signal Radar, Recon Feed). */

import { formatDateTimeInTimeZone } from '@/utils/date-formatters';

export type SyncScheduleInput = {
  syncCadence?: string | null;
  syncStartTime?: string | null;
  syncEndTime?: string | null;
  syncIntervalHours?: number | null;
  nextDueAt?: string | null;
  lastRunAt?: string | null;
};

export type SyncScheduleStatus = {
  isManualOnly: boolean;
  isOverdue: boolean;
  overdueDurationLabel: string | null;
  nextDueLabel: string;
  lastRunLabel: string;
  scheduleHint: string;
};

export type SyncScheduleHintContext = 'radar' | 'recon';

function formatDate(value?: string | null, timeZone?: string): string {
  if (!value) return '—';
  if (timeZone) {
    return formatDateTimeInTimeZone(value, timeZone);
  }
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatOverdueDuration(nextDueAt: string, nowMs: number): string | null {
  const dueMs = Date.parse(nextDueAt);
  if (Number.isNaN(dueMs) || dueMs >= nowMs) {
    return null;
  }
  const diffMs = nowMs - dueMs;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) {
    return `${Math.max(1, minutes)} minute${minutes === 1 ? '' : 's'}`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 48) {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'}`;
}

function manualActionLabel(context: SyncScheduleHintContext): string {
  return context === 'recon' ? 'Run now' : 'Sync now';
}

function featureLabel(context: SyncScheduleHintContext): string {
  return context === 'recon' ? 'Recon Feed' : 'Trend Stream';
}

export function describeSyncSchedule(
  settings: SyncScheduleInput | null | undefined,
  nowMs: number = Date.now(),
  context: SyncScheduleHintContext = 'radar',
  timeZone?: string
): SyncScheduleStatus {
  const isManualOnly = settings?.syncCadence === 'MANUAL_ONLY';
  const nextDueAt = settings?.nextDueAt ?? null;
  const isOverdue = Boolean(!isManualOnly && nextDueAt && Date.parse(nextDueAt) < nowMs);
  const overdueDurationLabel =
    isOverdue && nextDueAt ? formatOverdueDuration(nextDueAt, nowMs) : null;
  const manualAction = manualActionLabel(context);
  const feature = featureLabel(context);

  let scheduleHint = `Sync cadence drives scheduled ingestion. Manual runs update last run only and do not move the next due time.`;
  if (settings?.syncCadence === 'EVERY_N_HOURS' && settings.syncEndTime && settings.syncStartTime) {
    const interval = settings.syncIntervalHours ?? 6;
    scheduleHint = `Runs every ${interval} hour${interval === 1 ? '' : 's'} between ${settings.syncStartTime} and ${settings.syncEndTime} local time, then resumes at start time the next day. Manual runs update last run only.`;
  } else if (isOverdue) {
    scheduleHint = `Scheduled sync is overdue. The next cron tick will catch up automatically, or use ${manualAction} on ${feature}.`;
  } else if (isManualOnly) {
    scheduleHint = `Manual-only cadence — use ${manualAction} on ${feature} to ingest.`;
  }

  return {
    isManualOnly,
    isOverdue,
    overdueDurationLabel,
    nextDueLabel: formatDate(nextDueAt, timeZone),
    lastRunLabel: formatDate(settings?.lastRunAt, timeZone),
    scheduleHint,
  };
}
