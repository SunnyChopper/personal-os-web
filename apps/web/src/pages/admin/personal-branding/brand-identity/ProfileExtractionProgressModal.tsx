import { Loader2 } from 'lucide-react';
import Dialog from '@/components/molecules/Dialog';
import Button from '@/components/atoms/Button';
import { cn } from '@/lib/utils';
import type { ProfileExtractionJob } from '@/types/api/personal-branding.dto';
import { DialogFooter } from '../PersonalBrandingPageTemplate';
import {
  EXTRACTION_PIPELINE_STEPS,
  extractionProgressPercent,
  extractionStatusLabel,
} from './profile-extraction-progress';

interface ProfileExtractionProgressModalProps {
  isOpen: boolean;
  job: ProfileExtractionJob | undefined;
  pollTimedOut: boolean;
  onClose: () => void;
}

export default function ProfileExtractionProgressModal({
  isOpen,
  job,
  pollTimedOut,
  onClose,
}: ProfileExtractionProgressModalProps) {
  const status = job?.status;
  const isTerminal = status === 'succeeded' || status === 'failed';
  const percent = extractionProgressPercent(job);
  const currentStage = job?.stage ?? (status === 'queued' ? 'queued' : 'reading_sources');
  const currentStepIndex = EXTRACTION_PIPELINE_STEPS.findIndex((step) => step.id === currentStage);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {
        if (isTerminal) onClose();
      }}
      title="Extracting profile from sources"
      size="md"
    >
      <div className="space-y-5">
        <p className="text-sm text-gray-600 dark:text-gray-400">{extractionStatusLabel(job)}</p>

        <div className="space-y-2">
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
            aria-label="Extraction progress"
          >
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                status === 'failed' ? 'bg-red-500' : 'bg-amber-500'
              )}
              style={{ width: `${percent}%` }}
            />
          </div>
          {job?.sourceCount != null ? (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Sources processed: {job.processedSourceCount ?? 0}/{job.sourceCount}
            </p>
          ) : null}
        </div>

        <ol className="space-y-2" aria-label="Extraction pipeline steps">
          {EXTRACTION_PIPELINE_STEPS.map((step, index) => {
            const isComplete = status === 'succeeded' ? true : index < currentStepIndex;
            const isCurrent = !isTerminal && step.id === currentStage;
            const isFailed = status === 'failed' && isCurrent;

            return (
              <li
                key={step.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-3 py-2 text-sm',
                  isComplete &&
                    'border-green-200 bg-green-50 text-green-900 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-100',
                  isCurrent &&
                    !isFailed &&
                    'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100',
                  isFailed &&
                    'border-red-300 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100',
                  !isComplete &&
                    !isCurrent &&
                    'border-gray-200 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400'
                )}
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">
                  {isComplete ? (
                    '✓'
                  ) : isCurrent && !isFailed ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="font-medium">{step.label}</span>
              </li>
            );
          })}
        </ol>

        {pollTimedOut && !isTerminal ? (
          <p className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-900 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-100">
            Extraction is taking longer than expected. You can close this dialog and refresh later
            to check status.
          </p>
        ) : null}

        {status === 'failed' && job?.error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
            {job.error}
          </p>
        ) : null}

        <DialogFooter className="justify-end border-t-0 pt-0">
          {isTerminal ? (
            <Button type="button" size="sm" onClick={onClose}>
              {status === 'succeeded' ? 'View profile' : 'Close'}
            </Button>
          ) : (
            <Button type="button" size="sm" variant="secondary" onClick={onClose}>
              Run in background
            </Button>
          )}
        </DialogFooter>
      </div>
    </Dialog>
  );
}
