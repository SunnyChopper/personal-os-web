/** Format a latency value in milliseconds for display (integer or one decimal). */
export function formatLatencyMs(ms: number | null | undefined): string {
  if (ms == null || Number.isNaN(ms)) return '—';
  const rounded = Math.round(ms * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
