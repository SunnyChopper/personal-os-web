/** Display helpers for In-Person Events discovery cadence (Events tab status line). */

import { formatRelativeChatTimestamp } from '@/lib/chat/format-relative-time';
import type { SyncCadence } from '@/types/api/personal-branding.dto';
import { formatDateTimeInTimeZone } from '@/utils/date-formatters';

export type EventDiscoveryCadenceInput = {
  lastRunAt?: string | null;
  lastSuccessfulRunAt?: string | null;
  lastRunStatus?: string | null;
  lastErrorSummary?: string | null;
  nextDueAt?: string | null;
  syncCadence?: SyncCadence | string | null;
  syncTimezone?: string | null;
};

export type EventDiscoveryCadenceLine = {
  text: string;
  title: string;
};

function formatCalendarDateInTimeZone(iso: string, timeZone: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeZone,
    }).format(parsed);
  } catch {
    return parsed.toLocaleDateString();
  }
}

function resolveTimeZone(syncTimezone?: string | null): string {
  return syncTimezone?.trim() || Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function showNextDue(
  syncCadence: SyncCadence | string | null | undefined,
  nextDueAt: string | null | undefined
): nextDueAt is string {
  return syncCadence !== 'MANUAL_ONLY' && Boolean(nextDueAt);
}

/**
 * Quiet last-successful-run label for the Run discovery button cluster.
 * Uses lastSuccessfulRunAt (not lastRunAt) so failed/cancelled runs do not look successful.
 */
export function formatLastSuccessfulRunLine(
  input:
    | Pick<
        EventDiscoveryCadenceInput,
        'lastSuccessfulRunAt' | 'lastRunStatus' | 'lastErrorSummary' | 'syncTimezone'
      >
    | null
    | undefined,
  now: Date = new Date()
): EventDiscoveryCadenceLine {
  const timeZone = resolveTimeZone(input?.syncTimezone);

  if (input?.lastSuccessfulRunAt) {
    const relativeLast = formatRelativeChatTimestamp(input.lastSuccessfulRunAt, now);
    const absoluteLast = formatDateTimeInTimeZone(input.lastSuccessfulRunAt, timeZone);
    return {
      text: `Last run ${relativeLast}`,
      title: `Last run ${absoluteLast}`,
    };
  }

  if (input?.lastRunStatus === 'failed') {
    const detail = input.lastErrorSummary?.trim();
    return {
      text: 'Last run failed',
      title: detail || 'The most recent discovery run failed',
    };
  }

  return {
    text: 'Never run',
    title: '',
  };
}

/**
 * Format the Events tab next-due subtitle from discovery settings.
 * Returns null when there is no scheduled next due (MANUAL_ONLY or missing nextDueAt).
 */
export function formatEventDiscoveryCadenceLine(
  input: EventDiscoveryCadenceInput | null | undefined,
  _now: Date = new Date()
): EventDiscoveryCadenceLine | null {
  if (!input) return null;
  if (!showNextDue(input.syncCadence, input.nextDueAt)) return null;

  const timeZone = resolveTimeZone(input.syncTimezone);
  const nextDate = formatCalendarDateInTimeZone(input.nextDueAt, timeZone);
  const absoluteNext = formatDateTimeInTimeZone(input.nextDueAt, timeZone);

  return {
    text: `Next: ${nextDate}`,
    title: `Next ${absoluteNext}`,
  };
}
