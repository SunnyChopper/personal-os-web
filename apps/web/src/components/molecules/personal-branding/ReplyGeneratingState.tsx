import LinearProgressBar from '@/components/atoms/LinearProgressBar';
import {
  replyAgentProgress,
  replyGenerationStartedAtMs,
  resolveReplySkeletonCount,
} from '@/lib/personal-branding/reply-generation-progress';
import { cn } from '@/lib/utils';
import type {
  ReplyGenerationMode,
  ReplyRun,
  ReplyRunStatus,
} from '@/types/api/personal-branding.dto';
import ReplySuggestionCardSkeleton from './ReplySuggestionCardSkeleton';

export type ReplyGeneratingSubmittedDraft = {
  suggestionCount: number;
  mode: ReplyGenerationMode;
  researchEnabled: boolean;
  vaultGroundingEnabled: boolean;
  submittedAtMs: number;
};

export interface ReplyGeneratingStateProps {
  run?: ReplyRun | null;
  submittedDraft?: ReplyGeneratingSubmittedDraft | null;
  isPending?: boolean;
  nowMs?: number;
  className?: string;
}

function resolveGeneratingContext(
  run: ReplyRun | null | undefined,
  submittedDraft: ReplyGeneratingSubmittedDraft | null | undefined
): {
  suggestionCount: number;
  mode: ReplyGenerationMode;
  researchEnabled: boolean;
  vaultGroundingEnabled: boolean;
  status: ReplyRunStatus | 'PENDING';
  startedAtMs: number;
} {
  return {
    suggestionCount: resolveReplySkeletonCount(run, submittedDraft?.suggestionCount),
    mode: run?.mode ?? submittedDraft?.mode ?? 'SIMPLE',
    researchEnabled: run?.researchEnabled ?? submittedDraft?.researchEnabled ?? false,
    vaultGroundingEnabled:
      run?.vaultGroundingEnabled ?? submittedDraft?.vaultGroundingEnabled ?? false,
    status: isPendingStatus(run, submittedDraft),
    startedAtMs: replyGenerationStartedAtMs(run, submittedDraft?.submittedAtMs),
  };
}

function isPendingStatus(
  run: ReplyRun | null | undefined,
  submittedDraft: ReplyGeneratingSubmittedDraft | null | undefined
): ReplyRunStatus | 'PENDING' {
  if (!run) return submittedDraft ? 'PENDING' : 'QUEUED';
  return run.status;
}

export default function ReplyGeneratingState({
  run = null,
  submittedDraft = null,
  isPending = false,
  nowMs = Date.now(),
  className,
}: ReplyGeneratingStateProps) {
  const context = resolveGeneratingContext(run, submittedDraft);
  const skeletonCount = context.suggestionCount;
  const agentProgress =
    context.mode === 'AGENT'
      ? replyAgentProgress({
          status: isPending && !run ? 'PENDING' : context.status,
          mode: context.mode,
          researchEnabled: context.researchEnabled,
          vaultGroundingEnabled: context.vaultGroundingEnabled,
          startedAtMs: context.startedAtMs,
          nowMs,
        })
      : null;

  return (
    <div
      className={cn('space-y-3', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Generating reply suggestions"
      data-testid="reply-generating-state"
    >
      {agentProgress ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800/40">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 text-sm font-medium text-gray-900 dark:text-white">
              {agentProgress.label}
            </p>
            <span className="shrink-0 text-xs tabular-nums text-gray-500 dark:text-gray-400">
              {agentProgress.percent}%
            </span>
          </div>
          <LinearProgressBar
            value={agentProgress.percent}
            max={100}
            label="Reply agent progress"
            className="mt-2.5"
          />
        </div>
      ) : null}

      <div className="space-y-3">
        {Array.from({ length: skeletonCount }, (_, index) => (
          <ReplySuggestionCardSkeleton key={`reply-suggestion-skeleton-${index}`} />
        ))}
      </div>
    </div>
  );
}
