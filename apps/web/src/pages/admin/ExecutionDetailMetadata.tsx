import type { ReactNode } from 'react';
import type { ObservabilityExecutionDetail } from '@/types/observability';
import CopyIconButton from '@/components/atoms/CopyIconButton';
import CollapsibleSection from '@/components/molecules/CollapsibleSection';
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
  copyValue?: string | null;
};

function DetailFieldRow({ label, value, mono = true, copyValue }: DetailField) {
  const canCopy = copyValue != null && copyValue !== '' && copyValue !== '—';

  return (
    <div className={cn(canCopy && 'group')}>
      <dt className="text-gray-500">{label}</dt>
      <dd
        className={cn(
          'flex items-start gap-1 text-gray-900 dark:text-gray-100 break-all',
          mono && 'font-mono tabular-nums'
        )}
      >
        <span className="min-w-0 flex-1">{value}</span>
        {canCopy && <CopyIconButton value={copyValue} ariaLabel={`Copy ${label}`} alwaysVisible />}
      </dd>
    </div>
  );
}

function DetailGrid({ fields }: { fields: DetailField[] }) {
  return (
    <dl className={DETAIL_GRID_CLASS}>
      {fields.map((field) => (
        <DetailFieldRow key={field.label} {...field} />
      ))}
    </dl>
  );
}

function StatTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 px-3 py-2">
      <div className="text-[10px] font-medium uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100 tabular-nums">
        {value}
      </div>
    </div>
  );
}

export default function ExecutionDetailMetadata({
  detail,
}: {
  detail: ObservabilityExecutionDetail;
}) {
  const traceSummary = detail.threadId ?? detail.runId ?? detail.requestId ?? 'IDs';

  return (
    <div className="space-y-3">
      <CollapsibleSection title="Overview" defaultOpen>
        <div className="space-y-4">
          <DetailGrid
            fields={[
              { label: 'module', value: detail.module, mono: false },
              { label: 'feature', value: detail.feature ?? '—', mono: false },
            ]}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <StatTile
              label="Tokens"
              value={
                <span className="block text-xs font-normal">
                  <span className="block">
                    In: {formatPromptTokenValue(detail.inputTokens, detail.outputTokens)}
                  </span>
                  <span className="block text-gray-500">
                    Out: {formatObservabilityTokenCount(detail.outputTokens)}
                  </span>
                  <span className="block text-gray-500">
                    Total: {formatObservabilityTokenCount(detail.totalTokens)}
                  </span>
                  {detail.cachedTokens != null && (
                    <span className="block text-gray-500">
                      Cached: {formatObservabilityTokenCount(detail.cachedTokens)}
                    </span>
                  )}
                  {detail.cacheCreationTokens != null && (
                    <span className="block text-gray-500">
                      Cache write: {formatObservabilityTokenCount(detail.cacheCreationTokens)}
                    </span>
                  )}
                </span>
              }
            />
            <StatTile
              label="Cost"
              value={
                <span className="block text-xs font-normal">
                  <span className="block">In: {formatObservabilityUsd(detail.inputCostUsd)}</span>
                  <span className="block text-gray-500">
                    Out: {formatObservabilityUsd(detail.outputCostUsd)}
                  </span>
                  <span className="block text-gray-500">
                    Total: {formatObservabilityUsd(detail.totalCostUsd)}
                  </span>
                </span>
              }
            />
            <StatTile
              label="Timing"
              value={
                <span className="block text-xs font-normal">
                  <span className="block">Latency: {formatLatencyMs(detail.latencyMs)}</span>
                  <span className="block text-gray-500">
                    TTFT: {formatLatencyMs(detail.ttftMs)}
                  </span>
                </span>
              }
            />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Trace & correlation" defaultOpen={false} summary={traceSummary}>
        <DetailGrid
          fields={[
            { label: 'id', value: detail.id, copyValue: detail.id },
            { label: 'requestId', value: detail.requestId ?? '—', copyValue: detail.requestId },
            {
              label: 'providerRequestId',
              value: detail.providerRequestId ?? '—',
              copyValue: detail.providerRequestId,
            },
            { label: 'threadId', value: detail.threadId ?? '—', copyValue: detail.threadId },
            { label: 'runId', value: detail.runId ?? '—', copyValue: detail.runId },
          ]}
        />
      </CollapsibleSection>
    </div>
  );
}
