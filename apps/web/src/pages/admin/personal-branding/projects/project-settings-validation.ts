export const DAILY_COUNT_RANGE_ERROR = 'Enter a whole number from 3 to 10.';
export const START_TIME_RANGE_ERROR = 'Enter a time from 00:00 to 23:59.';
export const DIRECTION_MAX_LENGTH = 2000;

const START_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidDailyCount(value: number): boolean {
  return Number.isInteger(value) && value >= 3 && value <= 10;
}

export function parseDailyCountDraft(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function isValidStartTime(value: string): boolean {
  return START_TIME_PATTERN.test(value.trim());
}

export function directionLengthError(value: string): string | null {
  if (value.length > DIRECTION_MAX_LENGTH) {
    return `Direction must be at most ${DIRECTION_MAX_LENGTH} characters.`;
  }
  return null;
}
