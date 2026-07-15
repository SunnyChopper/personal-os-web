/** Display helpers for Signal Radar global sync schedule (server timestamps are canonical). */

export type RadarSyncScheduleInput = {
  syncCadence?: string | null;
  nextDueAt?: string | null;
  lastRunAt?: string | null;
};

export type RadarSyncScheduleStatus = {
  isManualOnly: boolean;
  isOverdue: boolean;
  overdueDurationLabel: string | null;
  nextDueLabel: string;
  lastRunLabel: string;
  scheduleHint: string;
};

function formatDate(value?: string | null): string {
  if (!value) return '—';
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

export function describeRadarSyncSchedule(
  settings: RadarSyncScheduleInput | null | undefined,
  nowMs: number = Date.now()
): RadarSyncScheduleStatus {
  const isManualOnly = settings?.syncCadence === 'MANUAL_ONLY';
  const nextDueAt = settings?.nextDueAt ?? null;
  const isOverdue = Boolean(!isManualOnly && nextDueAt && Date.parse(nextDueAt) < nowMs);
  const overdueDurationLabel =
    isOverdue && nextDueAt ? formatOverdueDuration(nextDueAt, nowMs) : null;

  let scheduleHint =
    'Sync cadence drives scheduled ingestion. Manual runs update last run only and do not move the next due time.';
  if (isOverdue) {
    scheduleHint =
      'Scheduled sync is overdue. The next cron tick will catch up automatically, or use Sync now on Trend Stream.';
  } else if (isManualOnly) {
    scheduleHint = 'Manual-only cadence — use Sync now on Trend Stream to ingest.';
  }

  return {
    isManualOnly,
    isOverdue,
    overdueDurationLabel,
    nextDueLabel: formatDate(nextDueAt),
    lastRunLabel: formatDate(settings?.lastRunAt),
    scheduleHint,
  };
}
