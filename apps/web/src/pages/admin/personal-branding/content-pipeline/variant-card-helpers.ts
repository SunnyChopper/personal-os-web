import {
  DEFAULT_PREVIEW_MAX_CHARS,
  smartTruncatePreview,
} from '@/lib/personal-branding/smart-text-preview';
import type { ContentVariantEngagement } from '@/types/api/personal-branding.dto';

export { DEFAULT_PREVIEW_MAX_CHARS };

export type EngagementMetricKey = 'views' | 'likes' | 'comments' | 'shares';

export type EngagementStripMetric = {
  key: EngagementMetricKey;
  label: string;
  value: number;
};

const STRIP_METRIC_DEFS: Array<{ key: EngagementMetricKey; label: string }> = [
  { key: 'views', label: 'views' },
  { key: 'likes', label: 'likes' },
  { key: 'comments', label: 'comments' },
  { key: 'shares', label: 'shares' },
];

export function variantBodyPreview(body: string, maxChars = DEFAULT_PREVIEW_MAX_CHARS): string {
  return smartTruncatePreview(body, maxChars);
}

export function formatToneMatchPercent(confidence: number | null | undefined): string {
  if (confidence == null || Number.isNaN(confidence)) return '—';
  return `${Math.round(confidence * 100)}%`;
}

export function variantCopyText(title: string, body: string): string {
  const trimmedTitle = title.trim();
  const trimmedBody = body.trim();
  if (trimmedTitle && trimmedBody) return `${trimmedTitle}\n\n${trimmedBody}`;
  return trimmedTitle || trimmedBody;
}

/** True when views, likes, or comments has a numeric value (gate for collapsed strip). */
export function hasPerformanceSnapshot(
  engagement: ContentVariantEngagement | null | undefined
): boolean {
  if (!engagement) return false;
  return engagement.views != null || engagement.likes != null || engagement.comments != null;
}

/** Populated engagement metrics in display order (includes shares when present). */
export function engagementMetricsForStrip(
  engagement: ContentVariantEngagement | null | undefined
): EngagementStripMetric[] {
  if (!engagement) return [];
  const metrics: EngagementStripMetric[] = [];
  for (const def of STRIP_METRIC_DEFS) {
    const value = engagement[def.key];
    if (value != null) {
      metrics.push({ key: def.key, label: def.label, value });
    }
  }
  return metrics;
}

/**
 * Normalize values to bar heights in [0, 1] relative to the max.
 * Zero values get height 0; empty input returns [].
 */
export function relativeBarHeights(values: number[]): number[] {
  if (values.length === 0) return [];
  const max = Math.max(...values);
  if (max <= 0) return values.map(() => 0);
  return values.map((value) => value / max);
}

/** Compact display for strip chips (e.g. 1200 → 1.2k). */
export function formatCompactMetric(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '0';
  if (value < 1000) return String(Math.floor(value));
  if (value < 1_000_000) {
    const thousands = value / 1000;
    const rounded = thousands >= 10 ? Math.round(thousands) : Math.round(thousands * 10) / 10;
    return `${rounded}k`.replace(/\.0k$/, 'k');
  }
  const millions = value / 1_000_000;
  const rounded = millions >= 10 ? Math.round(millions) : Math.round(millions * 10) / 10;
  return `${rounded}M`.replace(/\.0M$/, 'M');
}

/** Plain-text engagement summary for form footer and strip aria-label. */
export function formatEngagementSummary(
  engagement: ContentVariantEngagement | null | undefined
): string | null {
  const metrics = engagementMetricsForStrip(engagement);
  if (metrics.length === 0) return null;
  return metrics.map((m) => `${m.value} ${m.label}`).join(' · ');
}
