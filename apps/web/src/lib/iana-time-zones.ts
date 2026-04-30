/** Sorted IANA time zone names for `<select>` (falls back if `Intl.supportedValuesOf` is unavailable). */

const FALLBACK_ZONES = [
  'UTC',
  'Africa/Johannesburg',
  'America/Anchorage',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/New_York',
  'America/Sao_Paulo',
  'America/Toronto',
  'Asia/Dubai',
  'Asia/Hong_Kong',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Melbourne',
  'Australia/Sydney',
  'Europe/Amsterdam',
  'Europe/Berlin',
  'Europe/London',
  'Europe/Paris',
  'Pacific/Auckland',
];

let _cached: string[] | null = null;

export function getIanaTimeZoneOptions(): string[] {
  if (_cached) return _cached;
  try {
    const supportedValuesOf = (
      Intl as unknown as { supportedValuesOf?: (type: string) => string[] }
    ).supportedValuesOf;
    if (typeof supportedValuesOf === 'function') {
      _cached = supportedValuesOf.call(Intl, 'timeZone').slice().sort();
      return _cached;
    }
  } catch {
    /* ignore */
  }
  _cached = FALLBACK_ZONES.slice().sort();
  return _cached;
}

export function detectBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}
