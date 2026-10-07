import type { ReactNode } from 'react';
import Button from '@/components/atoms/Button';
import type { ObservabilityExecutionDetail } from '@/types/observability';
import CopyIconButton from '@/components/atoms/CopyIconButton';
import CollapsibleSection from '@/components/molecules/CollapsibleSection';
import ExecutionDetailOverview from '@/components/molecules/observability/ExecutionDetailOverview';
import { getTraceSummary } from '@/lib/observability/execution-detail-helpers';
import { executionDetailSectionStackClassName } from '@/lib/observability/execution-detail-surfaces';
import { cn } from '@/lib/utils';

const DETAIL_GRID_CLASS = 'grid grid-cols-1 gap-x-4 gap-y-2 text-xs sm:grid-cols-2';

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
          'flex items-start gap-1 break-all text-gray-900 dark:text-gray-100',
          mono && 'font-mono tabular-nums'
        )}
      >
        <span className="min-w-0 flex-1">{value}</span>
        {canCopy ? (
          <CopyIconButton value={copyValue} ariaLabel={`Copy ${label}`} alwaysVisible />
        ) : null}
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

export type ExecutionDetailMetadataProps = {
  detail: ObservabilityExecutionDetail;
  animated?: boolean;
  onOpenThread?: (threadId: string) => void;
};

export default function ExecutionDetailMetadata({
  detail,
  animated = false,
  onOpenThread,
}: ExecutionDetailMetadataProps) {
  const traceSummary = getTraceSummary(detail);

  return (
    <div className={executionDetailSectionStackClassName}>
      <CollapsibleSection title="Overview" defaultOpen animated={animated}>
        <ExecutionDetailOverview detail={detail} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Trace & correlation"
        defaultOpen={false}
        summary={traceSummary}
        animated={animated}
      >
        <DetailGrid
          fields={[
            { label: 'id', value: detail.id, copyValue: detail.id },
            { label: 'requestId', value: detail.requestId ?? '—', copyValue: detail.requestId },
            {
              label: 'providerRequestId',
              value: detail.providerRequestId ?? '—',
              copyValue: detail.providerRequestId,
            },
            {
              label: 'threadId',
              value: (
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="min-w-0 break-all">{detail.threadId ?? '—'}</span>
                  {detail.threadId && onOpenThread ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => onOpenThread(detail.threadId!)}
                    >
                      Open thread
                    </Button>
                  ) : null}
                </span>
              ),
              copyValue: detail.threadId,
            },
            { label: 'runId', value: detail.runId ?? '—', copyValue: detail.runId },
          ]}
        />
      </CollapsibleSection>
    </div>
  );
}
