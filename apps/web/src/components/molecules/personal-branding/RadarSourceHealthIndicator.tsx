import { cn } from '@/lib/utils';
import type { RadarSourceHealth } from '@/types/api/personal-branding.dto';

const HEALTH_LABELS: Record<RadarSourceHealth, string> = {
  healthy: 'Healthy',
  degraded: 'Needs attention',
  unhealthy: 'Unhealthy',
  paused: 'Paused',
};

const HEALTH_DOT_CLASS: Record<RadarSourceHealth, string> = {
  healthy: 'bg-emerald-500',
  degraded: 'bg-amber-500',
  unhealthy: 'bg-red-500',
  paused: 'bg-gray-400 dark:bg-gray-500',
};

export interface RadarSourceHealthIndicatorProps {
  health?: RadarSourceHealth | null;
  healthReason?: string | null;
  className?: string;
  onClick?: () => void;
}

export default function RadarSourceHealthIndicator({
  health = 'degraded',
  healthReason,
  className,
  onClick,
}: RadarSourceHealthIndicatorProps) {
  const resolvedHealth = health ?? 'degraded';
  const label = HEALTH_LABELS[resolvedHealth];
  const title = healthReason?.trim() ? `${label}: ${healthReason}` : label;
  const interactive = Boolean(onClick);

  const content = (
    <>
      <span
        className={cn('size-2.5 shrink-0 rounded-full', HEALTH_DOT_CLASS[resolvedHealth])}
        aria-hidden
      />
      <span className="sr-only">{title}</span>
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-2 rounded-md p-1 -m-1 transition-colors',
          'hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-gray-800',
          className
        )}
        title={`${title} — View health details`}
        aria-label={`${title}. View health details`}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      className={cn('inline-flex items-center gap-2', className)}
      title={title}
      aria-label={title}
    >
      {content}
    </span>
  );
}
