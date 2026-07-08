import type { ObservabilityExecutionDetail } from '@/types/observability';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { ProviderBrandBadge } from '@/components/atoms/ProviderBrandBadge';
import {
  formatObservabilityTokenCount,
  formatObservabilityUsd,
} from '@/lib/observability-formatters';
import { formatLatencyMs } from '@/utils/latency-formatters';
import { cn } from '@/lib/utils';

export type ExecutionSummaryHeaderProps = {
  detail: ObservabilityExecutionDetail;
  className?: string;
};

function formatOccurredAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function ExecutionSummaryHeader({ detail, className }: ExecutionSummaryHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-gray-200 dark:border-gray-700',
        'bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-sm',
        className
      )}
    >
      <StatusBadge status={detail.status} size="sm" />
      <ProviderBrandBadge providerId={detail.provider} size="sm" />
      <span className="font-mono text-xs text-gray-700 dark:text-gray-300 truncate max-w-[240px]">
        {detail.model}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
        {formatObservabilityUsd(detail.totalCostUsd)}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
        {formatLatencyMs(detail.latencyMs)}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
        {formatObservabilityTokenCount(detail.totalTokens)} tokens
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
        {formatOccurredAt(detail.occurredAt)}
      </span>
    </div>
  );
}
