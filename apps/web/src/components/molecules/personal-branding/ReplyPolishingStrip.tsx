import LinearProgressBar from '@/components/atoms/LinearProgressBar';
import {
  replyGenerationStartedAtMs,
  replyPolishingProgress,
} from '@/lib/personal-branding/reply-generation-progress';
import { cn } from '@/lib/utils';
import type { ReplyGenerationMode, ReplyRun } from '@/types/api/personal-branding.dto';
import type { ReplyGeneratingSubmittedDraft } from './ReplyGeneratingState';

export interface ReplyPolishingStripProps {
  run?: ReplyRun | null;
  submittedDraft?: ReplyGeneratingSubmittedDraft | null;
  nowMs?: number;
  className?: string;
}

export default function ReplyPolishingStrip({
  run = null,
  submittedDraft = null,
  nowMs = Date.now(),
  className,
}: ReplyPolishingStripProps) {
  const mode: ReplyGenerationMode = run?.mode ?? submittedDraft?.mode ?? 'SIMPLE';
  const researchEnabled = run?.researchEnabled ?? submittedDraft?.researchEnabled ?? false;
  const vaultGroundingEnabled =
    run?.vaultGroundingEnabled ?? submittedDraft?.vaultGroundingEnabled ?? false;
  const startedAtMs = replyGenerationStartedAtMs(run, submittedDraft?.submittedAtMs);

  const progress = replyPolishingProgress({
    status: run?.status ?? 'RUNNING',
    mode,
    researchEnabled,
    vaultGroundingEnabled,
    startedAtMs,
    nowMs,
  });

  if (!progress) return null;

  return (
    <div
      className={cn(
        'rounded-lg border border-blue-200/80 bg-blue-50/60 px-3 py-2.5 dark:border-blue-900/50 dark:bg-blue-950/30',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Polishing reply suggestions"
      data-testid="reply-polishing-strip"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-sm font-medium text-gray-900 dark:text-white">
          {progress.label}
        </p>
        <span className="shrink-0 text-xs tabular-nums text-gray-500 dark:text-gray-400">
          {progress.percent}%
        </span>
      </div>
      <LinearProgressBar
        value={progress.percent}
        max={100}
        label="Reply polish progress"
        className="mt-2.5"
      />
    </div>
  );
}
