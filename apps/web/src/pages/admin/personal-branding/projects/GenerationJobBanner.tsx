import { X } from 'lucide-react';
import { useCallback, useState } from 'react';
import Button from '@/components/atoms/Button';
import {
  projectIdeationJobFailed,
  projectIdeationJobInFlight,
  projectIdeationJobSucceeded,
  projectIdeationStatusLine,
} from '@/lib/personal-branding/project-ideation-progress';
import type { BrandProjectJob } from '@/types/api/personal-branding.dto';
import { pbFeedbackTextClassName } from '../personal-branding-ui';

export type GenerationJobBannerProps = {
  job: BrandProjectJob | undefined;
  isSubmitting: boolean;
  replayed: boolean;
  cardCount?: number | null;
  onRetry: () => void;
  retryDisabled?: boolean;
};

export default function GenerationJobBanner({
  job,
  isSubmitting,
  replayed,
  cardCount = null,
  onRetry,
  retryDisabled = false,
}: GenerationJobBannerProps) {
  const [dismissedJobIds, setDismissedJobIds] = useState<Set<string>>(() => new Set());

  const dismiss = useCallback((jobId: string) => {
    setDismissedJobIds((prev) => {
      const next = new Set(prev);
      next.add(jobId);
      return next;
    });
  }, []);

  const statusLine = projectIdeationStatusLine({ job, isSubmitting, replayed, cardCount });
  if (!statusLine) return null;

  const jobId = job?.jobId;
  const inFlight = projectIdeationJobInFlight(job, isSubmitting);
  const isFailed = projectIdeationJobFailed(job);
  const isSucceeded = projectIdeationJobSucceeded(job);

  if (!inFlight && jobId && dismissedJobIds.has(jobId)) {
    return null;
  }

  const showDismiss = isSucceeded || isFailed;
  const tone = isFailed ? 'danger' : 'info';

  return (
    <div
      className="mb-3 flex flex-wrap items-center gap-2 text-sm"
      role={isFailed ? 'alert' : 'status'}
      aria-live={isFailed ? 'assertive' : 'polite'}
      data-testid="generation-job-banner"
    >
      <span className={pbFeedbackTextClassName(tone, '')}>{statusLine}</span>
      {isFailed ? (
        <Button type="button" variant="secondary" onClick={onRetry} disabled={retryDisabled}>
          Retry
        </Button>
      ) : null}
      {showDismiss && jobId ? (
        <button
          type="button"
          onClick={() => dismiss(jobId)}
          className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          aria-label="Dismiss generation result"
        >
          <X className="size-3.5" aria-hidden />
          Dismiss
        </button>
      ) : null}
    </div>
  );
}
