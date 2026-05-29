import type { ReactNode } from 'react';
import type { ObservabilityExecutionDetail } from '@/types/observability';
import { formatLatencyMs } from '@/utils/latency-formatters';
import { cn } from '@/lib/utils';
import {
  formatObservabilityTokenCount,
  formatObservabilityUsd,
  formatPromptTokenValue,
} from '@/lib/observability-formatters';

const DETAIL_GRID_CLASS = 'grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs';

type DetailField = {
  label: string;
  value: ReactNode;
  mono?: boolean;
};

function DetailSection({ title, fields }: { title: string; fields: DetailField[] }) {
  const headingId = `execution-detail-${title.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <section aria-labelledby={headingId}>
      <h3
        id={headingId}
        className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2"
      >
        {title}
      </h3>
      <dl className={DETAIL_GRID_CLASS}>
        {fields.map(({ label, value, mono = true }) => (
          <div key={label}>
            <dt className="text-gray-500">{label}</dt>
            <dd
              className={cn(
                'text-gray-900 dark:text-gray-100 break-all',
                mono && 'font-mono tabular-nums'
              )}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function ExecutionDetailMetadata({
  detail,
}: {
  detail: ObservabilityExecutionDetail;
}) {
  return (
    <div className="space-y-4">
      <DetailSection
        title="Identity"
        fields={[
          { label: 'id', value: detail.id },
          { label: 'module', value: detail.module },
          { label: 'feature', value: detail.feature ?? '—' },
          { label: 'provider', value: detail.provider },
          { label: 'model', value: detail.model },
          { label: 'status', value: detail.status },
          { label: 'requestId', value: detail.requestId ?? '—' },
          { label: 'providerRequestId', value: detail.providerRequestId ?? '—' },
          { label: 'threadId', value: detail.threadId ?? '—' },
          { label: 'runId', value: detail.runId ?? '—' },
        ]}
      />
      <DetailSection
        title="Token usage"
        fields={[
          {
            label: 'Prompt (input)',
            value: formatPromptTokenValue(detail.inputTokens, detail.outputTokens),
          },
          {
            label: 'Completion (output)',
            value: formatObservabilityTokenCount(detail.outputTokens),
          },
          {
            label: 'Total',
            value: formatObservabilityTokenCount(detail.totalTokens),
          },
        ]}
      />
      <DetailSection
        title="Cost"
        fields={[
          { label: 'Input cost (USD)', value: formatObservabilityUsd(detail.inputCostUsd) },
          { label: 'Output cost (USD)', value: formatObservabilityUsd(detail.outputCostUsd) },
          { label: 'Total cost (USD)', value: formatObservabilityUsd(detail.totalCostUsd) },
        ]}
      />
      <DetailSection
        title="Timing"
        fields={[
          {
            label: 'latencyMs',
            value: formatLatencyMs(detail.latencyMs),
          },
          {
            label: 'ttftMs',
            value: formatLatencyMs(detail.ttftMs),
          },
        ]}
      />
    </div>
  );
}
