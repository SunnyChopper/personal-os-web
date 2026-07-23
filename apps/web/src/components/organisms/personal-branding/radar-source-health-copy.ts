import type { RadarSourceYield } from '@/types/api/personal-branding.dto';

const LAST_SCRAPE_VOLUME_REASONS = new Set([
  'Last scrape created no Trend Stream cards',
  'No items in last scrape',
]);

const SUSTAINED_LOW_YIELD_REASONS = new Set([
  'Low yield over recent window',
  'No Trend Stream cards in last 7 days',
]);

/** Clarifying subtitle for health modal when reason alone is ambiguous. */
export function getHealthReasonClarification(
  healthReason: string | null | undefined,
  yieldBand: RadarSourceYield
): string | null {
  const reason = healthReason?.trim();
  if (!reason) return null;

  if (LAST_SCRAPE_VOLUME_REASONS.has(reason)) {
    return `One scrape only — rolling yield is still ${yieldBand}.`;
  }

  if (SUSTAINED_LOW_YIELD_REASONS.has(reason)) {
    return 'Based on rolling windows (7d/30d), not only the last scrape.';
  }

  return null;
}
