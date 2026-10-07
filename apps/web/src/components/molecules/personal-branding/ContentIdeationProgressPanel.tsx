import LinearProgressBar from '@/components/atoms/LinearProgressBar';
import Button from '@/components/atoms/Button';
import { cn } from '@/lib/utils';
import { SERVER_JOB_CANCELLED_LABEL } from '@/lib/personal-branding/client-job-cancel';
import {
  contentIdeationProgressPercent,
  contentIdeationStatusLabel,
  keywordResearchStageLabel,
} from '@/lib/personal-branding/content-ideation-progress';
import type { ContentIdeationJob } from '@/types/api/personal-branding.dto';

interface ContentIdeationProgressPanelProps {
  job?: ContentIdeationJob | null;
  includeReferenceSearch?: boolean;
  includeKeywordResearch?: boolean;
  className?: string;
  clientCancelled?: boolean;
  cancelledLabel?: string;
  onCancel?: () => void;
}

export default function ContentIdeationProgressPanel({
  job,
  includeReferenceSearch = false,
  includeKeywordResearch = false,
  className,
  clientCancelled = false,
  cancelledLabel = SERVER_JOB_CANCELLED_LABEL,
  onCancel,
}: ContentIdeationProgressPanelProps) {
  if (clientCancelled) {
    return (
      <div
        className={cn(
          'min-w-0 rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800/40',
          className
        )}
        role="status"
        aria-live="polite"
        aria-busy={false}
        aria-label="Content ideation progress"
      >
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Cancelled</p>
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{cancelledLabel}</p>
      </div>
    );
  }

  if (
    !job ||
    (job.status !== 'queued' &&
      job.status !== 'running' &&
      job.status !== 'cancelling' &&
      job.status !== 'failed')
  ) {
    return null;
  }

  const percent = contentIdeationProgressPercent(
    job,
    includeReferenceSearch,
    includeKeywordResearch
  );
  const isTerminalFailed = job.status === 'failed';
  const isInFlight =
    job.status === 'queued' || job.status === 'running' || job.status === 'cancelling';
  const statusLabel = contentIdeationStatusLabel(job);
  const keywordStageLabel = keywordResearchStageLabel(job.keywordResearchStage);
  const detailLine = keywordStageLabel ?? job.keywordResearchWarning ?? null;

  return (
    <div
      className={cn(
        'min-w-0 rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800/40',
        isTerminalFailed && 'border-red-200/80 dark:border-red-900/50',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy={!isTerminalFailed}
      aria-label="Content ideation progress"
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            'min-w-0 text-sm font-medium',
            isTerminalFailed ? 'text-red-800 dark:text-red-200' : 'text-gray-900 dark:text-white'
          )}
        >
          {statusLabel}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {isInFlight && onCancel ? (
            <Button type="button" size="sm" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
          <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">{percent}%</span>
        </div>
      </div>
      {detailLine ? (
        <p
          className={cn(
            'mt-1 text-xs',
            job.keywordResearchWarning
              ? 'text-amber-700 dark:text-amber-300'
              : 'text-gray-600 dark:text-gray-400'
          )}
        >
          {detailLine}
        </p>
      ) : null}
      <LinearProgressBar
        value={percent}
        max={100}
        label="Content ideation progress"
        variant={isTerminalFailed ? 'danger' : 'default'}
        className="mt-2.5"
      />
    </div>
  );
}
