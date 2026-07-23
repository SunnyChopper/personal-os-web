import { Loader2 } from 'lucide-react';
import Dialog from '@/components/molecules/Dialog';
import Button from '@/components/atoms/Button';
import { cn } from '@/lib/utils';
import type {
  ProfileExtractionClientProgress,
  ProfileExtractionJob,
} from '@/types/api/personal-branding.dto';
import { DialogFooter } from '../PersonalBrandingPageTemplate';
import {
  extractionEffectiveStage,
  extractionIsTerminal,
  extractionPipelineSteps,
  extractionProgressPercent,
  extractionStatusLabel,
  extractionStepCaption,
  formatExtractionMetrics,
  isClientExtractionPhaseActive,
  resolveExtractionPipelineVariant,
  resolveExtractionSourceTypes,
} from './profile-extraction-progress';

interface ProfileExtractionProgressModalProps {
  isOpen: boolean;
  job: ProfileExtractionJob | undefined;
  clientUploadProgress?: ProfileExtractionClientProgress | null;
  onClose: () => void;
  onCancel?: () => void;
  cancelDisabled?: boolean;
  failedSourcesPage?: number;
  onFailedSourcesPageChange?: (page: number) => void;
}

function ExtractionMetricStrip({ job }: { job: ProfileExtractionJob | undefined }) {
  const metrics = formatExtractionMetrics(job);
  if (!metrics.sources) return null;

  return (
    <dl className="grid grid-cols-3 gap-3 rounded-xl border border-gray-200/80 bg-gray-50/80 px-3 py-2.5 dark:border-gray-700/60 dark:bg-gray-900/30">
      <div>
        <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Sources
        </dt>
        <dd className="mt-0.5 text-sm font-medium tabular-nums text-gray-900 dark:text-gray-100">
          {metrics.sources.processed}/{metrics.sources.total}
        </dd>
      </div>
      <div>
        <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Chunks
        </dt>
        <dd className="mt-0.5 text-sm font-medium tabular-nums text-gray-900 dark:text-gray-100">
          {metrics.chunks
            ? `${metrics.chunks.processed}/${metrics.chunks.total}`
            : metrics.chunksPendingDiscovery
              ? '…'
              : '—'}
        </dd>
      </div>
      <div>
        <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Succeeded
        </dt>
        <dd className="mt-0.5 text-sm font-medium tabular-nums text-gray-900 dark:text-gray-100">
          {metrics.sources.succeeded}
          {metrics.sources.failed > 0 ? (
            <span className="ml-1 text-xs font-normal text-red-600 dark:text-red-400">
              · {metrics.sources.failed} failed
            </span>
          ) : null}
        </dd>
      </div>
    </dl>
  );
}

export default function ProfileExtractionProgressModal({
  isOpen,
  job,
  clientUploadProgress,
  onClose,
  onCancel,
  cancelDisabled,
}: ProfileExtractionProgressModalProps) {
  const status = job?.status;
  const isTerminal =
    extractionIsTerminal(job) && !isClientExtractionPhaseActive(clientUploadProgress);
  const sourceTypes = resolveExtractionSourceTypes(job, clientUploadProgress);
  const pipelineSteps = extractionPipelineSteps(resolveExtractionPipelineVariant(sourceTypes));
  const percent = extractionProgressPercent(job, clientUploadProgress);
  const currentStage = extractionEffectiveStage(job, clientUploadProgress);
  const currentStepIndex = pipelineSteps.findIndex((step) => step.id === currentStage);

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Extracting profile from sources" size="md">
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {extractionStatusLabel(job, clientUploadProgress)}
        </p>

        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Progress
            </span>
            <span className="text-2xl font-semibold tabular-nums tracking-tight text-gray-900 dark:text-gray-100">
              {percent}%
            </span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-gray-200/90 dark:bg-gray-800"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Extraction progress"
          >
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-700 ease-out',
                status === 'failed' ? 'bg-red-500' : 'bg-amber-500'
              )}
              style={{ width: `${percent}%` }}
            />
          </div>
          <ExtractionMetricStrip job={job} />
        </div>

        <ol className="space-y-0" aria-label="Extraction pipeline steps">
          {pipelineSteps.map((step, index) => {
            const isComplete =
              status === 'succeeded' || status === 'succeeded_with_warnings'
                ? true
                : index < currentStepIndex;
            const isCurrent = !isTerminal && step.id === currentStage;
            const isFailed = status === 'failed' && isCurrent;
            const caption = extractionStepCaption(step.id, job, clientUploadProgress);
            const isLast = index === pipelineSteps.length - 1;

            return (
              <li key={step.id} className="relative flex gap-3 pb-4 last:pb-0">
                {!isLast ? (
                  <span
                    aria-hidden
                    className={cn(
                      'absolute left-[11px] top-6 bottom-0 w-px',
                      isComplete
                        ? 'bg-green-300/80 dark:bg-green-800/60'
                        : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  />
                ) : null}
                <span
                  className={cn(
                    'relative z-[1] flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                    isComplete &&
                      'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
                    isCurrent &&
                      !isFailed &&
                      'bg-amber-100 text-amber-800 ring-2 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-900/60',
                    isFailed && 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
                    !isComplete &&
                      !isCurrent &&
                      'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  )}
                >
                  {isComplete ? (
                    '✓'
                  ) : isCurrent && !isFailed ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    index + 1
                  )}
                </span>
                <div className="min-w-0 pt-0.5">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isComplete && 'text-green-900 dark:text-green-100',
                      isCurrent && !isFailed && 'text-amber-900 dark:text-amber-100',
                      isFailed && 'text-red-900 dark:text-red-100',
                      !isComplete && !isCurrent && 'text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {step.label}
                  </span>
                  {isCurrent && caption ? (
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{caption}</p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>

        {status === 'succeeded_with_warnings' ? (
          <p className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-100">
            Some files could not be analyzed. The profile was built from successful sources. Review
            failed files in the job details panel.
          </p>
        ) : null}

        {status === 'failed' && job?.error ? (
          <p className="rounded-xl border border-red-200/80 bg-red-50/80 px-3 py-2.5 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
            {job.error}
          </p>
        ) : null}

        {status === 'cancelled' ? (
          <p className="rounded-xl border border-gray-200/80 bg-gray-50/80 px-3 py-2.5 text-sm text-gray-700 dark:border-gray-700/60 dark:bg-gray-900/30 dark:text-gray-200">
            Extraction was cancelled. No new profile version was created.
          </p>
        ) : null}

        <DialogFooter className="justify-end border-t-0 pt-0">
          {isTerminal ? (
            <Button type="button" size="sm" onClick={onClose}>
              {status === 'succeeded' || status === 'succeeded_with_warnings'
                ? 'View profile'
                : 'Close'}
            </Button>
          ) : (
            <div className="flex flex-wrap justify-end gap-2">
              {onCancel ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={onCancel}
                  disabled={cancelDisabled || status === 'cancelling'}
                >
                  Cancel extraction
                </Button>
              ) : null}
              <Button type="button" size="sm" variant="secondary" onClick={onClose}>
                Run in background
              </Button>
            </div>
          )}
        </DialogFooter>
      </div>
    </Dialog>
  );
}
