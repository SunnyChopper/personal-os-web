import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  contentIdeationPipelineSteps,
  contentIdeationProgressPercent,
  contentIdeationStatusLabel,
} from '@/lib/personal-branding/content-ideation-progress';
import type { ContentIdeationJob } from '@/types/api/personal-branding.dto';

interface ContentIdeationProgressPanelProps {
  job: ContentIdeationJob | null | undefined;
  includeReferenceSearch?: boolean;
  includeKeywordResearch?: boolean;
  className?: string;
}

export default function ContentIdeationProgressPanel({
  job,
  includeReferenceSearch = false,
  includeKeywordResearch = false,
  className,
}: ContentIdeationProgressPanelProps) {
  if (!job || (job.status !== 'queued' && job.status !== 'running' && job.status !== 'failed')) {
    return null;
  }

  const steps = contentIdeationPipelineSteps(includeReferenceSearch, includeKeywordResearch);
  const percent = contentIdeationProgressPercent(
    job,
    includeReferenceSearch,
    includeKeywordResearch
  );
  const currentStage = job.stage ?? 'queued';
  const currentStepIndex = steps.findIndex((step) => step.id === currentStage);
  const isTerminalFailed = job.status === 'failed';
  const statusLabel = contentIdeationStatusLabel(job);

  return (
    <div
      className={cn(
        'rounded-lg border border-blue-200 bg-blue-50/80 p-4 dark:border-blue-900/50 dark:bg-blue-950/30',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label="Content ideation progress"
    >
      <p className="text-sm text-gray-800 dark:text-gray-200">{statusLabel}</p>
      {job.keywordResearchWarning ? (
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
          {job.keywordResearchWarning}
        </p>
      ) : null}

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-gray-600 dark:text-gray-400">
          <span>Progress</span>
          <span>{percent}%</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isTerminalFailed ? 'bg-red-500' : 'bg-blue-500'
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <ol className="mt-4 space-y-2" aria-label="Ideation pipeline steps">
        {steps.map((step, index) => {
          const isComplete =
            job.status === 'succeeded' ? true : !isTerminalFailed && index < currentStepIndex;
          const isCurrent =
            !isTerminalFailed && job.status !== 'succeeded' && step.id === currentStage;
          const isFailed = isTerminalFailed && index === currentStepIndex;

          return (
            <li
              key={step.id}
              className={cn(
                'flex items-center gap-2 text-sm',
                isComplete
                  ? 'text-gray-700 dark:text-gray-300'
                  : isCurrent
                    ? 'font-medium text-blue-800 dark:text-blue-200'
                    : isFailed
                      ? 'font-medium text-red-700 dark:text-red-300'
                      : 'text-gray-500 dark:text-gray-500'
              )}
            >
              {isComplete ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : isCurrent ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600 dark:text-blue-400" />
              ) : isFailed ? (
                <XCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 opacity-40" />
              )}
              <span>{step.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
