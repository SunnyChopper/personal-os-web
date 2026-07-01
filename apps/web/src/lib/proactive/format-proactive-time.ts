/**
 * Format proactive automation `localTime` (API: HH:MM24h) for display in 12-hour clock.
 */
export function formatProactiveLocalTime12h(localTime: string): string {
  const t = (localTime || '').trim();
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return t || '—';
  const h = Number.parseInt(m[1], 10);
  const minutes = m[2];
  if (!Number.isFinite(h) || h < 0 || h > 23) return t;
  const ap = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${minutes} ${ap}`;
}
