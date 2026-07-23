import { cn } from '@/lib/utils';
import {
  engagementMetricsForStrip,
  formatCompactMetric,
  formatEngagementSummary,
  relativeBarHeights,
} from '@/pages/admin/personal-branding/content-pipeline/variant-card-helpers';
import { pbMetaClassName } from '@/pages/admin/personal-branding/personal-branding-ui';
import type { ContentVariantEngagement } from '@/types/api/personal-branding.dto';

export type VariantPerformanceStripProps = {
  engagement: ContentVariantEngagement;
  className?: string;
};

const BAR_WIDTH = 56;
const BAR_HEIGHT = 28;
const BAR_GAP = 3;
const BAR_PAD_Y = 2;

/**
 * Compact engagement snapshot for collapsed variant cards:
 * tabular metric chips + tiny relative-bar chart (point-in-time, not a time series).
 */
export function VariantPerformanceStrip({ engagement, className }: VariantPerformanceStripProps) {
  const metrics = engagementMetricsForStrip(engagement);
  const heights = relativeBarHeights(metrics.map((m) => m.value));
  const summary = formatEngagementSummary(engagement);

  if (metrics.length === 0) return null;

  const barCount = metrics.length;
  const slotWidth = (BAR_WIDTH - BAR_GAP * (barCount - 1)) / barCount;
  const usableHeight = BAR_HEIGHT - BAR_PAD_Y * 2;

  return (
    <div
      className={cn('mt-2 flex flex-wrap items-center gap-3', className)}
      data-testid="variant-performance-strip"
    >
      <p className={cn('min-w-0 flex-1 tabular-nums', pbMetaClassName)} aria-hidden="true">
        {metrics.map((metric, index) => (
          <span key={metric.key}>
            {index > 0 ? ' · ' : null}
            <span className="font-medium text-gray-700 dark:text-gray-200">
              {formatCompactMetric(metric.value)}
            </span>{' '}
            {metric.label}
          </span>
        ))}
      </p>
      <svg
        width={BAR_WIDTH}
        height={BAR_HEIGHT}
        className="shrink-0 text-sky-600 dark:text-sky-400"
        role="img"
        aria-label={summary ? `Engagement: ${summary}` : 'Engagement metrics'}
      >
        {metrics.map((metric, index) => {
          const ratio = heights[index] ?? 0;
          const barH = Math.max(ratio > 0 ? 2 : 0, ratio * usableHeight);
          const x = index * (slotWidth + BAR_GAP);
          const y = BAR_PAD_Y + (usableHeight - barH);
          return (
            <rect
              key={metric.key}
              x={x}
              y={y}
              width={Math.max(slotWidth, 1)}
              height={barH}
              rx={1}
              className="fill-current opacity-80"
            />
          );
        })}
      </svg>
    </div>
  );
}
