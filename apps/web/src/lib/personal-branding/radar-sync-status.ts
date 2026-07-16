/** Backward-compatible alias for Signal Radar sync schedule display. */

import {
  describeSyncSchedule,
  type SyncScheduleInput,
  type SyncScheduleStatus,
} from './sync-schedule-status';

export type RadarSyncScheduleInput = SyncScheduleInput;
export type RadarSyncScheduleStatus = SyncScheduleStatus;

export function describeRadarSyncSchedule(
  settings: RadarSyncScheduleInput | null | undefined,
  nowMs: number = Date.now(),
  timeZone?: string
): RadarSyncScheduleStatus {
  return describeSyncSchedule(settings, nowMs, 'radar', timeZone);
}
